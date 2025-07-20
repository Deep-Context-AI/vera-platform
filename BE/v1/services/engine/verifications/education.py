import time

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.EDUCATION import education_service
from v1.models.requests import EducationRequest
from v1.models.responses import EducationResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
from v1.services.pii_detection_service import pii_detection_service
import os
import logging

logger = logging.getLogger(__name__)


async def verify_education(request: VerificationStepRequest):
    """
    Verify education credentials using external service and Gemini model evaluation
    
    Args:
        request: VerificationStepRequest containing application context, requester, and database service
        
    Returns:
        VerificationStepResponse with verification results
    """
    practitioner_first_name = request.application_context.first_name
    practitioner_last_name = request.application_context.last_name
    db_service = request.db_service
    
    # Extract education information from application context
    education_data = request.application_context.education
    education_institution = education_data.medical_school if education_data else None
    education_degree = education_data.degree if education_data else None
    education_graduation_year = education_data.graduation_year if education_data else None
    
    # Record audit trail for verification start using database service BEFORE validation
    # The requester is the user who initiated the verification thus is the actor in Audit
    # In Step_State, the decision is made by the VERA AI agent
    await request.db_service.log_event(
        application_id=request.application_context.application_id,
        actor_id=request.requester,
        action="Education Verification Started",
        prevent_duplicates=True
    )
    
    # Validate required fields for education verification
    missing_fields = []
    if not education_data:
        missing_fields.append("education data")
    else:
        if not education_institution:
            missing_fields.append("medical school")
        if not education_degree:
            missing_fields.append("degree")
        if not education_graduation_year:
            missing_fields.append("graduation year")
    
    if missing_fields:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning=f"Education verification requires {', '.join(missing_fields)} - not provided in application context.",
            metadata_status=VerificationStepMetadataEnum.NOT_PROVIDED
        )
    
    # ---------------------------
    # Pseudonymize sensitive data 
    # ---------------------------
    secret_seed = os.getenv("PSEUDONYM_SECRET", "default-seed")

    try:
        # Use consistent inputs for pseudonymization to ensure the same person gets the same pseudonym
        practitioner_full_name = f"{practitioner_first_name} {practitioner_last_name}"
        
        # Pseudonymize education data
        pseudo_practitioner_name = pseudo.pseudonymize_name(practitioner_full_name, secret_seed)
        pseudo_institution = pseudo.pseudonymize_generic(education_institution, secret_seed)
        pseudo_degree = pseudo.pseudonymize_generic(education_degree, secret_seed)
        # Keep graduation year as-is for consistency with response data
        pseudo_graduation_year = str(education_graduation_year)

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized sensitive data for education verification",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing data for education verification: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    try:
        # Call services.external.EDUCATION to get the education verification status
        education_request = EducationRequest(
            first_name=practitioner_first_name,
            last_name=practitioner_last_name,
            institution=education_institution,
            degree_type=education_degree,
            graduation_year=education_graduation_year,
            verification_type="degree_verification"
        )
        
        logger.info(f"Looking up education verification for {pseudo_practitioner_name} using external service")
        education_response: EducationResponse = await education_service.comprehensive_education_verification(
            request=education_request,
            prefer_database=True,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_education_response = education_response.model_copy() if education_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        llm_education_response = education_response.model_copy()
        
        if education_response:
            # Pseudonymize the response data for LLM
            # Use the same practitioner name pseudonym as the application context for consistency
            # Instead of pseudonymizing response names separately, use the consistent practitioner pseudonym
            pseudo_parts = pseudo_practitioner_name.split(' ', 1)
            llm_education_response.first_name = pseudo_parts[0] if len(pseudo_parts) > 0 else pseudo_practitioner_name
            llm_education_response.last_name = pseudo_parts[1] if len(pseudo_parts) > 1 else ""
            llm_education_response.institution = pseudo.pseudonymize_generic(education_response.institution, secret_seed)
            llm_education_response.degree_type = pseudo.pseudonymize_generic(education_response.degree_type, secret_seed)
            # Keep graduation year as-is to avoid conversion issues
            llm_education_response.graduation_year = education_response.graduation_year
            
            # Pseudonymize verification_details if present
            if llm_education_response.verification_details:
                # Use the same consistent practitioner pseudonym for verification details
                llm_education_response.verification_details.first_name = pseudo_parts[0] if len(pseudo_parts) > 0 else pseudo_practitioner_name
                llm_education_response.verification_details.last_name = pseudo_parts[1] if len(pseudo_parts) > 1 else ""
                llm_education_response.verification_details.institution = pseudo.pseudonymize_generic(llm_education_response.verification_details.institution, secret_seed)
                llm_education_response.verification_details.degree_type = pseudo.pseudonymize_generic(llm_education_response.verification_details.degree_type, secret_seed)
                # Keep graduation year as-is
                
            # Pseudonymize database_verification_result if present
            if llm_education_response.database_verification_result:
                db_result = llm_education_response.database_verification_result
                
                # Pseudonymize database_education if present
                if 'database_education' in db_result and db_result['database_education']:
                    db_edu = db_result['database_education']
                    if 'medical_school' in db_edu:
                        db_edu['medical_school'] = pseudo.pseudonymize_generic(db_edu['medical_school'], secret_seed)
                    if 'degree' in db_edu:
                        db_edu['degree'] = pseudo.pseudonymize_generic(db_edu['degree'], secret_seed)
                
                # Pseudonymize request_education if present
                if 'request_education' in db_result and db_result['request_education']:
                    req_edu = db_result['request_education']
                    if 'medical_school' in req_edu:
                        req_edu['medical_school'] = pseudo.pseudonymize_generic(req_edu['medical_school'], secret_seed)
                    if 'degree' in req_edu:
                        req_edu['degree'] = pseudo.pseudonymize_generic(req_edu['degree'], secret_seed)
        
        # Pseudonymize database verification results if they contain text descriptions with PII
        pii_pseudonymization_results = []
        if education_response and education_response.database_verification_result:
            db_verification = llm_education_response.database_verification_result
            
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
                        llm_education_response.database_verification_result["match_details"]["reasons"][index] = pseudonymized_text
                    else:
                        llm_education_response.database_verification_result[field_path] = pseudonymized_text
                    
                    # Track pseudonymization results for logging
                    pii_pseudonymization_results.append({
                        "field_path": field_path,
                        "field_index": index,
                        "original_length": len(text_content),
                        "pseudonymized_length": len(pseudonymized_text),
                        "changed": text_content != pseudonymized_text
                    })
                    
                except Exception as e:
                    logger.warning(f"Failed to pseudonymize education verification text for {field_path}: {e}")
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
                    action="Education Verification PII Pseudonymization",
                    notes=f"Pseudonymized PII in {len(changed_fields)} text fields",
                    prevent_duplicates=True
                )
        
        # Post processing for slimming down LLM-formatted response
        llm_education_response = llm_education_response.strip_response()
        
        if not education_response or education_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"Education credentials for practitioner not found during external service lookup.",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = f"""
        You are a credentialing examiner verifying the education credentials of this practitioner. I want the results to be detailed

        ## Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and education record (allowing for minor variations)
        2. The educational institution matches between application and verification record (allowing for name variations)
        3. The degree type matches between application and verification record (allowing for common degree variations like MD/Doctor of Medicine)
        4. The graduation year matches exactly between application and verification record
        5. The verification status indicates successful verification (verified: true)
        6. The education credentials are from an accredited institution
        7. No concerning discrepancies in the education verification data

        choose "requires_review" if ANY of the following are true:
        - Names don't match sufficiently between application and education record
        - Educational institution doesn't match between application and verification record
        - Degree type doesn't match or shows concerning discrepancies
        - Graduation year doesn't match exactly
        - Verification status indicates failed verification (verified: false)
        - Education credentials appear to be from a non-accredited or questionable institution
        - Data is incomplete or inconclusive
        - Any verification details suggest potential fraud or misrepresentation

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing name match, institution match, degree match, graduation year match, verification status, and overall credential assessment
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this education credentials verification:

        Education Verification Data:
        {llm_education_response.model_dump()}

        Application Context:
         - Practitioner Name: {pseudo_practitioner_name}
         - Medical School: {pseudo_institution}
         - Degree: {pseudo_degree}
         - Graduation Year: {pseudo_graduation_year}

        Please provide your verification analysis.
        """
        logger.info("Calling Gemini model for education verification analysis")

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
        
        document_url = getattr(original_education_response, 'document_url', None) if original_education_response else None
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.EDUCATION.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"education_request": education_request.model_dump()},
            response_json={
                "education_response": original_education_response.model_dump() if original_education_response else None, 
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
                step_key=f"{VerificationSteps.EDUCATION.value}_pii_pseudonymization",
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
        logger.error(f"Error in education verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Education Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e) 