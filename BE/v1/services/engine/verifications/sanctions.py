from datetime import datetime
import time

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.SANCTION import sanction_service
from v1.models.requests import ComprehensiveSANCTIONRequest
from v1.models.responses import ComprehensiveSANCTIONResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
from v1.services.pii_detection_service import pii_detection_service
import os
import logging

logger = logging.getLogger(__name__)


async def verify_sanctions(request: VerificationStepRequest):
    """
    Verify sanctions and exclusions using external service and Gemini model evaluation
    
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
        action="Sanctions Verification Started",
        prevent_duplicates=True
    )
    
    # Validate required fields for sanctions check
    missing_fields = []
    if not application_npi_number:
        missing_fields.append("NPI number")
    if not application_license_number:
        missing_fields.append("license number")
    if not application_date_of_birth:
        missing_fields.append("date of birth")
    
    if missing_fields:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning=f"Sanctions verification requires {', '.join(missing_fields)} - not provided in application context.",
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
        pseudo_ssn_last4 = pseudo.pseudonymize_generic(ssn_last4, secret_seed) if ssn_last4 else None
        pseudo_date_of_birth = pseudo.pseudonymize_generic(application_date_of_birth, secret_seed)
        # Use the practitioner's name as the canonical identity for name pseudonymization
        pseudo_practitioner_name = pseudo.pseudonymize_name(practitioner_full_name, secret_seed)
        pseudo_address = pseudo.pseudonymize_address(practitioner_address.to_string(), secret_seed)

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized sensitive data for sanctions lookup",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing data for sanctions lookup: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    try:
        # Call services.external.SANCTION to get the sanctions check status
        sanctions_request = ComprehensiveSANCTIONRequest(
            first_name=practitioner_first_name,
            last_name=practitioner_last_name,
            date_of_birth=application_date_of_birth,
            npi=application_npi_number,
            license_number=application_license_number,
            license_state=practitioner_address.state[:2].upper(),  # Convert to 2-letter state code
            ssn_last4=ssn_last4 if ssn_last4 else "0000"
        )
        
        logger.info(f"Looking up sanctions for NPI {pseudo_npi_number} using external service")
        sanctions_response: ComprehensiveSANCTIONResponse = await sanction_service.comprehensive_sanctions_check(
            request=sanctions_request,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_sanctions_response = sanctions_response.model_copy() if sanctions_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        llm_sanctions_response = sanctions_response.model_copy()
        
        if sanctions_response and sanctions_response.provider:
            # Pseudonymize the provider data for LLM
            # Use the same practitioner name pseudonym as the application context for consistency
            llm_sanctions_response.provider.full_name = pseudo_practitioner_name
            llm_sanctions_response.provider.npi = pseudo_npi_number
            llm_sanctions_response.provider.license_number = pseudo_license_number
            llm_sanctions_response.provider.dob = pseudo_date_of_birth
            llm_sanctions_response.provider.ssn_last4 = pseudo_ssn_last4 if pseudo_ssn_last4 else "****"
        
        # Pseudonymize sanctions descriptions to remove detected PII
        pii_pseudonymization_results = []
        if sanctions_response and sanctions_response.sanctions:
            for i, sanction in enumerate(llm_sanctions_response.sanctions):
                # First, pseudonymize known structured fields
                original_date = sanction.date
                if sanction.date and sanction.date not in ["Unknown", "N/A", None]:
                    try:
                        sanction.date = pseudo.pseudonymize_date(sanction.date, secret_seed)
                    except Exception as e:
                        logger.warning(f"Failed to pseudonymize sanction date: {e}")
                
                # Then pseudonymize the description text for detected PII
                if sanction.description:
                    original_description = sanction.description
                    try:
                        # Pseudonymize any detected PII in the description
                        pseudonymized_description = await pseudo.pseudonymize_text_with_pii_detection(
                            sanction.description, 
                            secret_seed,
                            pii_detection_service
                        )
                        sanction.description = pseudonymized_description
                        
                        # Track pseudonymization results for logging
                        pii_pseudonymization_results.append({
                            "sanction_index": i,
                            "source": sanction.source,
                            "original_length": len(original_description),
                            "pseudonymized_length": len(pseudonymized_description),
                            "description_changed": original_description != pseudonymized_description,
                            "date_changed": original_date != sanction.date,
                            "changed": original_description != pseudonymized_description or original_date != sanction.date
                        })
                        
                    except Exception as e:
                        logger.warning(f"Failed to pseudonymize sanction description for {sanction.source}: {e}")
                        # Keep original description if pseudonymization fails
                        pii_pseudonymization_results.append({
                            "sanction_index": i,
                            "source": sanction.source,
                            "error": str(e),
                            "date_changed": original_date != sanction.date,
                            "changed": original_date != sanction.date
                        })
        
        # Log pseudonymization event if any descriptions were processed
        if pii_pseudonymization_results:
            changed_sanctions = [r for r in pii_pseudonymization_results if r.get("changed", False)]
            if changed_sanctions:
                await request.db_service.log_event(
                    application_id=request.application_context.application_id,
                    actor_id=request.requester,
                    action="Sanctions Report PII Pseudonymization",
                    notes=f"Pseudonymized PII in {len(changed_sanctions)} sanction descriptions",
                    prevent_duplicates=True
                )
        
        # Post processing for slimming down LLM-formatted response
        llm_sanctions_response = llm_sanctions_response.strip_response()
        
        if not sanctions_response or sanctions_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"Sanctions records for practitioner not found during external service lookup.",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = f"""
        You are a credentialing examiner verifying the sanctions and exclusions status of this practitioner. I want the results to be detailed

        ## Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and sanctions records (allowing for minor variations)
        2. The NPI numbers match exactly between application and sanctions records
        3. NO active exclusions or sanctions are found across all checked sources:
           - OIG LEIE: No active exclusions
           - SAM.gov: No active debarments
           - State Medicaid: No active sanctions
           - Medical Board: No active disciplinary actions
        4. All sources show "matched: false" or "status: cleared/resolved"
        5. Any historical sanctions are properly resolved with reinstatement dates
        6. License and provider information are consistent across sources

        choose "requires_review" if ANY of the following are true:
        - Names don't match sufficiently between application and sanctions records
        - NPI numbers don't match exactly
        - ANY active exclusions, sanctions, or debarments are found:
          - OIG LEIE shows active exclusion
          - SAM.gov shows active debarment
          - State Medicaid shows active sanctions
          - Medical Board shows active disciplinary actions
        - Any sanctions show "matched: true" with active status
        - Historical sanctions without proper resolution or reinstatement
        - Data is incomplete or inconclusive for any major source
        - Provider information inconsistencies that suggest identity mismatch

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing identity verification, exclusion findings across all sources, and overall risk assessment
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this sanctions and exclusions verification:

        Sanctions Data:
        {llm_sanctions_response.model_dump()}

        Application Context:
        - Practitioner Name: {pseudo_practitioner_name}
        - NPI Number: {pseudo_npi_number}
        - License Number: {pseudo_license_number}
        - SSN Last 4: {pseudo_ssn_last4}
        - Date of Birth: {pseudo_date_of_birth}
        - Address: {pseudo_address}
        - License State: {practitioner_address.state[:2].upper()}

        Please provide your verification analysis.
        """
        logger.info("Calling Gemini model for sanctions verification analysis")

        client = await get_gemini_client()
        start_time = time.time()
        print(message)
        gemini_response, usage_metadata = await call_gemini_model(
            model=MODEL,
            system_prompt=SYSTEM_PROMPT,
            messages=[message],
            response_mime_type="application/json",
            response_schema=LLMResponse,
            client=client,
        )

        # Parse response from Gemini model
        try:
            assert isinstance(gemini_response, LLMResponse)
            
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
        
        document_url = original_sanctions_response.document_url if original_sanctions_response and original_sanctions_response.document_url else None
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.SANCTIONS.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"sanctions_request": sanctions_request.model_dump()},
            response_json={
                "sanctions_response": original_sanctions_response.model_dump() if original_sanctions_response else None, 
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
                step_key=f"{VerificationSteps.SANCTIONS.value}_pii_pseudonymization",
                invocation_type="PII Detection + Pseudonymization",
                status="completed",
                created_by=request.requester,
                request_json={
                    "pseudonymization_requests": [
                        {
                            "sanction_index": r["sanction_index"],
                            "source": r["source"],
                            "original_length": r.get("original_length", 0)
                        }
                        for r in pii_pseudonymization_results if r.get("changed", False)
                    ]
                },
                response_json={
                    "pseudonymization_results": pii_pseudonymization_results,
                    "total_sanctions_processed": len(pii_pseudonymization_results),
                    "sanctions_changed": len([r for r in pii_pseudonymization_results if r.get("changed", False)])
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
        logger.error(f"Error in sanctions verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Sanctions Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e) 