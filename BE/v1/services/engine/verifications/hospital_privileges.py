from datetime import datetime
import time

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.HOSPITAL_PRIVILEGES import hospital_privileges_service
from v1.models.requests import HospitalPrivilegesRequest
from v1.models.responses import HospitalPrivilegesResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
from v1.services.pii_detection_service import pii_detection_service
import os
import logging

logger = logging.getLogger(__name__)


async def verify_hospital_privileges(request: VerificationStepRequest):
    """
    Verify hospital privileges using external service and Gemini model evaluation
    
    Args:
        request: VerificationStepRequest containing application context, requester, and database service
        
    Returns:
        VerificationStepResponse with verification results
    """
    practitioner_first_name = request.application_context.first_name
    practitioner_last_name = request.application_context.last_name
    db_service = request.db_service
    
    # Extract basic practitioner information from application context
    npi_number = request.application_context.npi_number
    
    # Record audit trail for verification start using database service BEFORE validation
    # The requester is the user who initiated the verification thus is the actor in Audit
    # In Step_State, the decision is made by the VERA AI agent
    await request.db_service.log_event(
        application_id=request.application_context.application_id,
        actor_id=request.requester,
        action="Hospital Privileges Verification Started",
        prevent_duplicates=True
    )
    
    # Validate required fields for hospital privileges verification
    missing_fields = []
    if not npi_number:
        missing_fields.append("NPI number")
    
    if missing_fields:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning=f"Hospital privileges verification requires {', '.join(missing_fields)} - not provided in application context.",
            metadata_status=VerificationStepMetadataEnum.NOT_PROVIDED
        )
    
    # ---------------------------
    # Pseudonymize sensitive data 
    # ---------------------------
    secret_seed = os.getenv("PSEUDONYM_SECRET", "default-seed")

    try:
        # Use consistent inputs for pseudonymization to ensure the same person gets the same pseudonym
        practitioner_full_name = f"{practitioner_first_name} {practitioner_last_name}"
        
        # Pseudonymize practitioner data
        pseudo_practitioner_name = pseudo.pseudonymize_name(practitioner_full_name, secret_seed)
        pseudo_npi_number = pseudo.pseudonymize_generic(npi_number, secret_seed)

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized sensitive data for hospital privileges verification",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing data for hospital privileges verification: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    try:
        # Call services.external.HOSPITAL_PRIVILEGES to get the hospital privileges verification status
        hospital_privileges_request = HospitalPrivilegesRequest(
            first_name=practitioner_first_name,
            last_name=practitioner_last_name,
            npi_number=npi_number
        )
        
        logger.info(f"Looking up hospital privileges verification for {pseudo_practitioner_name} using external service")
        hospital_privileges_response: HospitalPrivilegesResponse = await hospital_privileges_service.comprehensive_hospital_privileges_verification(
            request=hospital_privileges_request,
            prefer_database=True,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_hospital_privileges_response = hospital_privileges_response.model_copy() if hospital_privileges_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        llm_hospital_privileges_response = hospital_privileges_response.model_copy()
        
        # Initialize fallback values for pseudonymized hospital and specialty
        pseudo_hospital_name = "Unknown"
        pseudo_specialty = "Unknown"
        
        if hospital_privileges_response:
            # Pseudonymize the response data for LLM
            # Use the same practitioner name pseudonym as the application context for consistency
            pseudo_parts = pseudo_practitioner_name.split(' ', 1)
            llm_hospital_privileges_response.first_name = pseudo_parts[0] if len(pseudo_parts) > 0 else pseudo_practitioner_name
            llm_hospital_privileges_response.last_name = pseudo_parts[1] if len(pseudo_parts) > 1 else ""
            llm_hospital_privileges_response.npi_number = pseudo.pseudonymize_generic(hospital_privileges_response.npi_number, secret_seed)
            llm_hospital_privileges_response.hospital_name = pseudo.pseudonymize_generic(hospital_privileges_response.hospital_name, secret_seed)
            llm_hospital_privileges_response.specialty = pseudo.pseudonymize_generic(hospital_privileges_response.specialty, secret_seed)
            
            # Create pseudonymized values for the context message
            pseudo_hospital_name = pseudo.pseudonymize_generic(hospital_privileges_response.hospital_name, secret_seed)
            pseudo_specialty = pseudo.pseudonymize_generic(hospital_privileges_response.specialty, secret_seed)
            
            # Pseudonymize verification_details if present
            if llm_hospital_privileges_response.verification_details:
                # Use the same consistent practitioner pseudonym for verification details
                llm_hospital_privileges_response.verification_details.first_name = pseudo_parts[0] if len(pseudo_parts) > 0 else pseudo_practitioner_name
                llm_hospital_privileges_response.verification_details.last_name = pseudo_parts[1] if len(pseudo_parts) > 1 else ""
                llm_hospital_privileges_response.verification_details.npi_number = pseudo.pseudonymize_generic(llm_hospital_privileges_response.verification_details.npi_number, secret_seed)
                llm_hospital_privileges_response.verification_details.hospital_name = pseudo.pseudonymize_generic(llm_hospital_privileges_response.verification_details.hospital_name, secret_seed)
                llm_hospital_privileges_response.verification_details.specialty = pseudo.pseudonymize_generic(llm_hospital_privileges_response.verification_details.specialty, secret_seed)
                
            # Pseudonymize database_verification_result if present
            if llm_hospital_privileges_response.database_verification_result:
                db_result = llm_hospital_privileges_response.database_verification_result
                
                # Pseudonymize database_privileges if present
                if 'database_privileges' in db_result and db_result['database_privileges']:
                    db_privileges = db_result['database_privileges']
                    if 'hospital_name' in db_privileges:
                        db_privileges['hospital_name'] = pseudo.pseudonymize_generic(db_privileges['hospital_name'], secret_seed)
                    if 'specialty' in db_privileges:
                        db_privileges['specialty'] = pseudo.pseudonymize_generic(db_privileges['specialty'], secret_seed)
                    if 'npi_number' in db_privileges:
                        db_privileges['npi_number'] = pseudo.pseudonymize_generic(db_privileges['npi_number'], secret_seed)
                
                # Pseudonymize request_privileges if present
                if 'request_privileges' in db_result and db_result['request_privileges']:
                    req_privileges = db_result['request_privileges']
                    if 'hospital_name' in req_privileges:
                        req_privileges['hospital_name'] = pseudo.pseudonymize_generic(req_privileges['hospital_name'], secret_seed)
                    if 'specialty' in req_privileges:
                        req_privileges['specialty'] = pseudo.pseudonymize_generic(req_privileges['specialty'], secret_seed)
                    if 'npi_number' in req_privileges:
                        req_privileges['npi_number'] = pseudo.pseudonymize_generic(req_privileges['npi_number'], secret_seed)
        
        # Pseudonymize database verification results if they contain text descriptions with PII
        pii_pseudonymization_results = []
        if hospital_privileges_response and hospital_privileges_response.database_verification_result:
            db_verification = llm_hospital_privileges_response.database_verification_result
            
            # Check for text fields that might contain PII in database verification results
            text_fields_to_check = []
            
            # Check match_details reasons if they exist
            if isinstance(db_verification, dict):
                match_details = db_verification.get("match_details", {})
                if isinstance(match_details, dict) and "reasons" in match_details:
                    for i, reason in enumerate(match_details["reasons"]):
                        if isinstance(reason, str):
                            text_fields_to_check.append(("match_details.reasons", i, reason))
                
                # Check for any other text descriptions
                for key, value in db_verification.items():
                    if isinstance(value, str) and len(value) > 50:  # Only check longer text that might contain narrative
                        text_fields_to_check.append((key, None, value))
            
            # Process detected text fields for PII
            for field_path, index, text_content in text_fields_to_check:
                try:
                    # Pseudonymize any detected PII in the text
                    pseudonymized_text = await pseudo.pseudonymize_text_with_pii_detection(
                        text_content, 
                        secret_seed,
                        pii_detection_service
                    )
                    
                    # Update the response with pseudonymized text
                    if field_path == "match_details.reasons" and index is not None:
                        llm_hospital_privileges_response.database_verification_result["match_details"]["reasons"][index] = pseudonymized_text
                    else:
                        llm_hospital_privileges_response.database_verification_result[field_path] = pseudonymized_text
                    
                    # Track pseudonymization results for logging
                    pii_pseudonymization_results.append({
                        "field_path": field_path,
                        "field_index": index,
                        "original_length": len(text_content),
                        "pseudonymized_length": len(pseudonymized_text),
                        "changed": text_content != pseudonymized_text
                    })
                    
                except Exception as e:
                    logger.warning(f"Failed to pseudonymize hospital privileges verification text for {field_path}: {e}")
                    # Keep original text if pseudonymization fails
                    pii_pseudonymization_results.append({
                        "field_path": field_path,
                        "field_index": index,
                        "error": str(e),
                        "changed": False
                    })
        
        # Log pseudonymization event if any text was processed
        if pii_pseudonymization_results:
            changed_fields = [r for r in pii_pseudonymization_results if r.get("changed", False)]
            if changed_fields:
                await request.db_service.log_event(
                    application_id=request.application_context.application_id,
                    actor_id=request.requester,
                    action="Hospital Privileges Verification PII Pseudonymization",
                    notes=f"Pseudonymized PII in {len(changed_fields)} text fields",
                    prevent_duplicates=True
                )
        
        # Post processing for slimming down LLM-formatted response
        if hasattr(llm_hospital_privileges_response, 'strip_response'):
            llm_hospital_privileges_response = llm_hospital_privileges_response.strip_response()
        
        if not hospital_privileges_response or hospital_privileges_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"Hospital privileges for practitioner not found during external service lookup.",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = f"""
        You are a credentialing examiner verifying the hospital privileges of this practitioner. I want the results to be detailed

        ## Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and hospital privileges record (allowing for minor variations)
        2. The hospital name matches between application and verification record (allowing for name variations)
        3. The specialty matches between application and verification record (allowing for common specialty variations)
        4. The NPI number matches exactly between application and verification record
        5. The verification status indicates successful verification (verified: true)
        6. The hospital privileges are currently active or valid
        7. No concerning discrepancies in the hospital privileges verification data

        choose "requires_review" if ANY of the following are true:
        - Names don't match sufficiently between application and hospital privileges record
        - Hospital name doesn't match between application and verification record
        - Specialty doesn't match or shows concerning discrepancies
        - NPI number doesn't match exactly
        - Verification status indicates failed verification (verified: false)
        - Hospital privileges appear to be inactive, expired, or suspended
        - Data is incomplete or inconclusive
        - Any verification details suggest potential issues with privileges

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing name match, hospital match, specialty match, NPI match, verification status, and overall privilege assessment
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this hospital privileges verification:

        Hospital Privileges Verification Data:
        {llm_hospital_privileges_response.model_dump()}

        Application Context:
         - Practitioner Name: {pseudo_practitioner_name}
         - Hospital Name: {pseudo_hospital_name}
         - Specialty: {pseudo_specialty}
         - NPI Number: {pseudo_npi_number}

        Please provide your verification analysis.
        """
        logger.info("Calling Gemini model for hospital privileges verification analysis")

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
        
        document_url = getattr(original_hospital_privileges_response, 'document_url', None) if original_hospital_privileges_response else None
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.HOSPITAL.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"hospital_privileges_request": hospital_privileges_request.model_dump()},
            response_json={
                "hospital_privileges_response": original_hospital_privileges_response.model_dump() if original_hospital_privileges_response else None, 
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
                step_key=f"{VerificationSteps.HOSPITAL.value}_pii_pseudonymization",
                invocation_type="PII Detection + Pseudonymization",
                status="completed",
                created_by=request.requester,
                request_json={
                    "pseudonymization_requests": [
                        {
                            "field_path": r["field_path"],
                            "field_index": r["field_index"],
                            "original_length": r.get("original_length", 0)
                        }
                        for r in pii_pseudonymization_results if r.get("changed", False)
                    ]
                },
                response_json={
                    "pseudonymization_results": pii_pseudonymization_results,
                    "total_fields_processed": len(pii_pseudonymization_results),
                    "fields_changed": len([r for r in pii_pseudonymization_results if r.get("changed", False)])
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
        logger.error(f"Error in hospital privileges verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Hospital Privileges Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e) 