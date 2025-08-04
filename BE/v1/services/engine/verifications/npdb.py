from datetime import datetime
import time
from typing import List

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.NPDB import npdb_service
from v1.models.requests import NPDBRequest, NPDBAddress
from v1.models.responses import NPDBResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest, LLMHighlight
)
from v1.services.pii_detection_service import pii_detection_service
import os
import logging

logger = logging.getLogger(__name__)


class NPDBAnalysisResponse(LLMResponse):
    highlights: List[LLMHighlight]


async def verify_npdb(request: VerificationStepRequest):
    """
    Verify NPDB (National Practitioner Data Bank) using external service and Gemini model evaluation
    
    Args:
        request: VerificationStepRequest containing application context, requester, and database service
        
    Returns:
        VerificationStepResponse with verification results
    """
    practitioner_first_name = request.application_context.first_name
    practitioner_last_name = request.application_context.last_name
    db_service = request.db_service
    practitioner_address = request.application_context.address
    application_npi_number = request.application_context.npi_number
    application_license_number = request.application_context.license_number
    application_ssn = request.application_context.ssn
    application_dea_number = request.application_context.dea_number
    
    # NPDB-specific fields
    credential_type = request.application_context.credential_type
    attestations = request.application_context.attestations
    
    # Extract date of birth from demographics
    application_date_of_birth = None
    if request.application_context.demographics and request.application_context.demographics.birth_date:
        application_date_of_birth = request.application_context.demographics.birth_date.strftime("%Y-%m-%d")
    
    # Record audit trail for verification start using database service BEFORE validation
    # The requester is the user who initiated the verification thus is the actor in Audit
    # In Step_State, the decision is made by the VERA AI agent
    await request.db_service.log_event(
        application_id=request.application_context.application_id,
        actor_id=request.requester,
        action="NPDB Verification Started",
        prevent_duplicates=True
    )
    
    # Validate required fields for NPDB
    missing_fields = []
    if not application_npi_number:
        missing_fields.append("NPI number")
    if not application_license_number:
        missing_fields.append("license number")
    if not application_ssn:
        missing_fields.append("SSN")
    if not application_date_of_birth:
        missing_fields.append("date of birth")
    if not credential_type:
        missing_fields.append("credential type")
    
    if missing_fields:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning=f"NPDB verification requires {', '.join(missing_fields)} - not provided in application context.",
            metadata_status=VerificationStepMetadataEnum.NOT_PROVIDED
        )
    
    # ---------------------------
    # Pseudonymize sensitive data 
    # ---------------------------
    secret_seed = os.getenv("PSEUDONYM_SECRET", "default-seed")

    try:
        # Use consistent inputs for pseudonymization to ensure the same person gets the same pseudonym
        practitioner_full_name = f"{practitioner_first_name} {practitioner_last_name}"
        
        # Clean SSN by removing dashes
        clean_ssn = application_ssn.replace('-', '') if application_ssn else None
        ssn_last4 = clean_ssn[-4:] if clean_ssn and len(clean_ssn) >= 4 else None
        
        pseudo_npi_number = pseudo.pseudonymize_generic(application_npi_number, secret_seed)
        pseudo_license_number = pseudo.pseudonymize_generic(application_license_number, secret_seed)
        pseudo_ssn = pseudo.pseudonymize_generic(clean_ssn, secret_seed)
        pseudo_ssn_last4 = pseudo.pseudonymize_generic(ssn_last4, secret_seed)
        pseudo_date_of_birth = pseudo.pseudonymize_generic(application_date_of_birth, secret_seed)
        # Use the practitioner's name as the canonical identity for name pseudonymization
        pseudo_practitioner_name = pseudo.pseudonymize_name(practitioner_full_name, secret_seed)
        pseudo_address = pseudo.pseudonymize_address(practitioner_address.to_string(), secret_seed)

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized sensitive data for NPDB lookup",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing data for NPDB lookup: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    try:
        # Create NPDBAddress from practitioner address
        npdb_address = NPDBAddress(
            line1=practitioner_address.street,
            line2="",
            city=practitioner_address.city,
            state=practitioner_address.state[:2].upper(),  # Convert to 2-letter state code
            zip=practitioner_address.zip
        )
        
        # Call services.external.NPDB to get the disciplinary record status
        npdb_request = NPDBRequest(
            first_name=practitioner_first_name,
            last_name=practitioner_last_name,
            date_of_birth=application_date_of_birth,
            ssn_last4=ssn_last4,
            address=npdb_address,
            npi_number=application_npi_number,
            license_number=application_license_number,
            state_of_license=practitioner_address.state[:2].upper(),
            dea_number=application_dea_number if application_dea_number else None
        )
        
        logger.info(f"Looking up NPDB records for NPI {pseudo_npi_number} using external service")
        npdb_response: NPDBResponse = await npdb_service.verify_practitioner(
            request=npdb_request,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_npdb_response = npdb_response.model_copy() if npdb_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        llm_npdb_response = npdb_response.model_copy()
        
        if npdb_response and npdb_response.subject_identification:
            # Pseudonymize the response data for LLM
            # Use the same practitioner name pseudonym as the application context for consistency
            llm_npdb_response.name = pseudo_practitioner_name
            llm_npdb_response.subject_identification.full_name = pseudo_practitioner_name
            llm_npdb_response.subject_identification.npi_number = pseudo_npi_number
            llm_npdb_response.subject_identification.license_number = pseudo_license_number
            llm_npdb_response.subject_identification.ssn_last4 = pseudo_ssn_last4
            llm_npdb_response.subject_identification.date_of_birth = pseudo_date_of_birth
            
            # Pseudonymize address in subject identification
            if llm_npdb_response.subject_identification.home_address:
                addr_parts = pseudo_address.split(", ")
                if len(addr_parts) >= 4:
                    llm_npdb_response.subject_identification.home_address.line1 = addr_parts[0]
                    llm_npdb_response.subject_identification.home_address.city = addr_parts[1]
                    llm_npdb_response.subject_identification.home_address.state = addr_parts[2]
                    llm_npdb_response.subject_identification.home_address.zip = addr_parts[3]
        
        # Pseudonymize report descriptions to remove detected PII
        pii_pseudonymization_results = []
        if npdb_response and npdb_response.report_summary and npdb_response.report_summary.report_types:
            for report_type_key, report_type in llm_npdb_response.report_summary.report_types.items():
                if report_type.details:
                    for i, detail in enumerate(report_type.details):
                        # First, pseudonymize known structured fields
                        original_action_date = detail.action_date
                        if detail.action_date and detail.action_date not in ["Unknown", "N/A"]:
                            try:
                                detail.action_date = pseudo.pseudonymize_date(detail.action_date, secret_seed)
                            except Exception as e:
                                logger.warning(f"Failed to pseudonymize action_date: {e}")
                        
                        # Then pseudonymize the description text for detected PII
                        if detail.description:
                            original_description = detail.description
                            try:
                                # Pseudonymize any detected PII in the description
                                pseudonymized_description = await pseudo.pseudonymize_text_with_pii_detection(
                                    detail.description, 
                                    secret_seed,
                                    pii_detection_service
                                )
                                detail.description = pseudonymized_description
                                
                                # Track pseudonymization results for logging
                                pii_pseudonymization_results.append({
                                    "report_type": report_type_key,
                                    "detail_index": i,
                                    "original_length": len(original_description),
                                    "pseudonymized_length": len(pseudonymized_description),
                                    "description_changed": original_description != pseudonymized_description,
                                    "action_date_changed": original_action_date != detail.action_date,
                                    "changed": original_description != pseudonymized_description or original_action_date != detail.action_date
                                })
                                
                            except Exception as e:
                                logger.warning(f"Failed to pseudonymize report description for {report_type_key}: {e}")
                                # Keep original description if pseudonymization fails
                                pii_pseudonymization_results.append({
                                    "report_type": report_type_key,
                                    "detail_index": i,
                                    "error": str(e),
                                    "action_date_changed": original_action_date != detail.action_date,
                                    "changed": original_action_date != detail.action_date
                                })
        
        # Log pseudonymization event if any descriptions were processed
        if pii_pseudonymization_results:
            changed_reports = [r for r in pii_pseudonymization_results if r.get("changed", False)]
            if changed_reports:
                await request.db_service.log_event(
                    application_id=request.application_context.application_id,
                    actor_id=request.requester,
                    action="NPDB Report PII Pseudonymization",
                    notes=f"Pseudonymized PII in {len(changed_reports)} report descriptions",
                    prevent_duplicates=True
                )
        
        # Post processing for slimming down LLM-formatted response
        llm_npdb_response = llm_npdb_response.strip_response()
        
        if not npdb_response or npdb_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"NPDB records for practitioner not found during external service lookup.",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_25_FLASH
        
        SYSTEM_PROMPT = f"""
        You are a credentialing examiner verifying the NPDB (National Practitioner Data Bank) record of this practitioner. I want the results to be detailed

        ## Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and NPDB record (allowing for minor variations)
        2. The NPI numbers match exactly between application and NPDB record
        3. The license numbers match between application and NPDB record
        4. SSN last 4 digits match between application and NPDB record
        5. Date of birth matches between application and NPDB record
        6. ALL NPDB report types show "No" (meaning no adverse actions found):
           - Malpractice: No
           - State licensure action: No
           - Exclusion/debarment: No
           - Government administrative action: No
           - Clinical privileges action: No
           - Health plan action: No
           - Professional society action: No
           - DEA or federal licensure action: No
           - Judgment or conviction: No
           - Peer review organization action: No
        7. Credential type is properly identified as "{credential_type}" based on previous approval history
        8. For recredential cases: Previous approval date and current timing are consistent with recredentialing requirements
        
        ### Special Case: Recredentialing ONLY
        For "recredential" cases, malpractice reports are not causes for requires review necessarily. You must review the report and determine if the practitioner is still in good standing via:
            1) The action payment does not exceed the amount of $400,000
            2) The action was more than 10 years ago

        choose "requires_review" if ANY of the following are true:
        - Names don't match sufficiently between application and NPDB record
        - NPI numbers don't match exactly
        - License numbers don't match
        - SSN last 4 digits don't match
        - Date of birth doesn't match
        - ANY NPDB report type shows "Yes" (indicating adverse actions):
          - Any malpractice reports
          - Any state licensure actions
          - Any exclusions or debarments
          - Any government administrative actions
          - Any clinical privileges actions
          - Any health plan actions
          - Any professional society actions
          - Any DEA or federal licensure actions
          - Any judgments or convictions
          - Any peer review organization actions
        - Data is incomplete or inconclusive
        - Credential type classification is inconsistent with approval history

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing identity verification, adverse action findings, credential type appropriateness, and overall risk assessment
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this NPDB (National Practitioner Data Bank) verification:

        NPDB Data:
        {llm_npdb_response.model_dump()}

        Application Context:
        - Practitioner Name: {pseudo_practitioner_name}
        - NPI Number: {pseudo_npi_number}
        - License Number: {pseudo_license_number}
        - SSN Last 4: {pseudo_ssn_last4}
        - Date of Birth: {pseudo_date_of_birth}
        - Address: {pseudo_address}
        - Credential Type: {credential_type}
        - Has Attestations: {bool(attestations)}

        Please provide your verification analysis.
        
        In your response, please provide a list of highlights that you found in the NPDB record.
        Each highlight should have an id, quote, and analysis. Limit a quote to at most 2 sentences and can be sentence fragments but must ALWAYS be text from the description. A separate service will use Ctrl + F on your quote to find the exact text in the NPDB record so you must be exact.
        
            - SKIP if its a single word. It must be at least 2 words to be considered a quote.
            - Do NOT paraphrase the quote. Use the exact text from the NPDB record.
            - Do NOT highlight code, you must highlight only human-readable text.
        
        The analysis should be a short, 1-2 sentence analysis of the quote.
        The id should be a unique identifier for the highlight such as `highlight-1`, `highlight-2`, etc.
        The highlights should be in the order they were found in the NPDB record.
        
        Example Highlight:
        Input:
          "The practitioner was found to have committed malpractice in the state of California in 2024. After final judiciual ruling, the settlement amount was $100,000 where the patient was a 60 year old male with a history of hypertension. An internal investigation, initiated by the hospital's risk management department, was conducted. This included a review of the initial medical records, the ED physician's notes, and the subsequent imaging and pathology reports. Expert medical review, by a board-certified gastroenterologist, concluded that the initial presentation of the patient warranted a more thorough investigation, including more detailed imaging studies (like a CT scan)."
        Output:
        - id: highlight-1
            quote: "The practitioner was found to have committed malpractice in the state of California in 2024."
            analysis: "This is a malpractice report that occurred in California."
        - id: highlight-2
            quote: "the settlement amount was $100,000"
            analysis: "The settlement was $100,000 but this is below the threshold of $400,000 for recredentialing."
        
        
        """
        logger.info("Calling Gemini model for NPDB verification analysis")

        client = await get_gemini_client()
        start_time = time.time()
        print(message)
        gemini_response, usage_metadata = await call_gemini_model(
            model=MODEL,
            system_prompt=SYSTEM_PROMPT,
            messages=[message],
            response_mime_type="application/json",
            response_schema=NPDBAnalysisResponse,
            client=client,
        )

        # Parse response from Gemini model
        try:
            assert isinstance(gemini_response, NPDBAnalysisResponse)
            
            decision = gemini_response.decision
            
            # Map Gemini decision to our enum
            verification_decision = (
                VerificationStepDecision.APPROVED 
                if decision.value == "approved" 
                else VerificationStepDecision.REQUIRES_REVIEW
            )
            
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return VerificationStepResponse.from_exception(e)
        
        document_url = original_npdb_response.document_url if original_npdb_response and original_npdb_response.document_url else None
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.NPDB.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"npdb_request": npdb_request.model_dump()},
            response_json={
                "npdb_response": original_npdb_response.model_dump() if original_npdb_response else None, 
                "llm_analysis": gemini_response.model_dump(),
                "pii_pseudonymization": pii_pseudonymization_results if pii_pseudonymization_results else []
            },
            metadata=VerificationMetadata(
                model=MODEL.value, 
                usage_metadata=usage_metadata,
                response_time=time.time() - start_time,
                document_url=document_url
            )
        )
        
        # Save separate invocation record for PII pseudonymization if it occurred
        if pii_pseudonymization_results and any(r.get("changed", False) for r in pii_pseudonymization_results):
            await request.db_service.save_invocation(
                application_id=request.application_context.application_id,
                step_key=f"{VerificationSteps.NPDB.value}_pii_pseudonymization",
                invocation_type="PII Detection + Pseudonymization",
                status="completed",
                created_by=request.requester,
                request_json={
                    "pseudonymization_requests": [
                        {
                            "report_type": r["report_type"],
                            "detail_index": r["detail_index"],
                            "original_length": r.get("original_length", 0)
                        }
                        for r in pii_pseudonymization_results if r.get("changed", False)
                    ]
                },
                response_json={
                    "pseudonymization_results": pii_pseudonymization_results,
                    "total_reports_processed": len(pii_pseudonymization_results),
                    "reports_changed": len([r for r in pii_pseudonymization_results if r.get("changed", False)])
                },
                metadata=VerificationMetadata(
                    model="PII Detection Service",
                    response_time=0,  # This is included in the main response time
                    document_url=None
                )
            )
        
        # Return VerificationStepResponse
        # We don't log here because processor.py will log the step_state record
        return VerificationStepResponse(
            decision=verification_decision,
            analysis=gemini_response,
            metadata=VerificationMetadata(
                status=VerificationStepMetadataEnum.COMPLETE,
                usage_metadata=usage_metadata,
                model=MODEL.value,
                document_url=document_url
            ),
        )
        
    except Exception as e:
        logger.error(f"Error in NPDB verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="NPDB Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e) 