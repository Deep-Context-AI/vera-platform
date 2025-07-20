from datetime import datetime
import time

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.LADMF import ladmf_service
from v1.models.requests import LADMFRequest
from v1.models.responses import LADMFResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
import os
import logging

logger = logging.getLogger(__name__)


async def verify_ladmf(request: VerificationStepRequest):
    """
    Verify LADMF (Limited Access Death Master File) using external service and Gemini model evaluation
    
    Args:
        request: VerificationStepRequest containing application context, requester, and database service
        
    Returns:
        VerificationStepResponse with verification results
    """
    practitioner_first_name = request.application_context.first_name
    practitioner_last_name = request.application_context.last_name
    db_service = request.db_service
    practitioner_address = request.application_context.address
    
    # Extract required fields for LADMF verification
    application_ssn = request.application_context.ssn.replace('-', '') if request.application_context.ssn else None
    application_date_of_birth = None
    
    if request.application_context.demographics and request.application_context.demographics.birth_date:
        # Convert datetime to string format required by LADMF service
        application_date_of_birth = request.application_context.demographics.birth_date.strftime("%Y-%m-%d")
    
    # The requester is the user who initiated the verification thus is the actor in Audit
    # In Step_State, the decision is made by the VERA AI agent
    await request.db_service.log_event(
        application_id=request.application_context.application_id,
        actor_id=request.requester,
        action="LADMF Verification Started",
        prevent_duplicates=True
    )
    
    if not application_ssn:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning="LADMF verification requires SSN - not provided in application context.",
            metadata_status=VerificationStepMetadataEnum.NOT_PROVIDED
        )
    
    if not application_date_of_birth:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning="LADMF verification requires date of birth - not provided in demographics.",
            metadata_status=VerificationStepMetadataEnum.NOT_PROVIDED
        )
    
    # ---------------------------
    # Pseudonymize sensitive data 
    # ---------------------------
    secret_seed = os.getenv("PSEUDONYM_SECRET", "default-seed")

    try:
        # Use consistent inputs for pseudonymization to ensure the same person gets the same pseudonym
        practitioner_full_name = f"{practitioner_first_name} {practitioner_last_name}"
        
        pseudo_ssn = pseudo.pseudonymize_generic(application_ssn, secret_seed)
        pseudo_date_of_birth = pseudo.pseudonymize_generic(application_date_of_birth, secret_seed)
        # Use the practitioner's name as the canonical identity for name pseudonymization
        pseudo_practitioner_name = pseudo.pseudonymize_name(practitioner_full_name, secret_seed)
        pseudo_address = pseudo.pseudonymize_address(practitioner_address.to_string(), secret_seed)

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized SSN and DOB for LADMF lookup",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing data for LADMF lookup: {e}")
        return VerificationStepResponse.from_exception(e)
    
    try:
        # Call services.external.LADMF to get the death record status
        ladmf_request = LADMFRequest(
            first_name=practitioner_first_name,
            last_name=practitioner_last_name,
            date_of_birth=application_date_of_birth,
            social_security_number=application_ssn
        )
        
        logger.info(f"Looking up LADMF death record for SSN {pseudo_ssn} using external service")
        ladmf_response: LADMFResponse = await ladmf_service.verify_death_record(
            request=ladmf_request,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_ladmf_response = ladmf_response.model_copy() if ladmf_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        llm_ladmf_response = ladmf_response.model_copy()
        
        if ladmf_response.matched_record:
            # Pseudonymize the matched record data for LLM
            # Use the same practitioner name pseudonym as the application context for consistency
            llm_ladmf_response.matched_record.full_name = pseudo_practitioner_name
            llm_ladmf_response.matched_record.date_of_birth = pseudo_date_of_birth
            llm_ladmf_response.matched_record.social_security_number = pseudo_ssn
            
            # Pseudonymize other sensitive fields
            if llm_ladmf_response.matched_record.date_of_death:
                llm_ladmf_response.matched_record.date_of_death = pseudo.pseudonymize_generic(
                    llm_ladmf_response.matched_record.date_of_death, secret_seed
                )
        
        # Post processing for slimming down LLM-formatted response
        llm_ladmf_response = llm_ladmf_response.strip_response()
        
        if not ladmf_response or ladmf_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"LADMF death record lookup failed during external service call. External service called but returned failure status, no LLM analysis performed, invocation record created with failure status.",
                metadata_status=VerificationStepMetadataEnum.FAILED
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = f"""
        You are a credentialing examiner verifying the death status of this practitioner through LADMF (Limited Access Death Master File). I want the results to be detailed

        Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and LADMF record (allowing for minor variations) 
        2. The date of birth matches between application and LADMF record
        3. The SSN matches between application and LADMF record
        4. NO death record is found (match_found is false) - this indicates the practitioner is alive
        5. The verification completed successfully with high confidence

        choose "requires_review" if ANY of the following are true:
        - A death record IS found (match_found is true) - this indicates the practitioner may be deceased
        - Names don't match sufficiently between application and any death records
        - Date of birth doesn't match between application and any death records
        - SSN doesn't match between application and any death records
        - Data is incomplete or inconclusive
        - The verification failed or returned unexpected results
        - Match confidence is low or uncertain

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing whether a death record was found, name match, DOB match, SSN match, and the implications for credentialing
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this LADMF (Limited Access Death Master File) verification:

        LADMF Data:
        {llm_ladmf_response.model_dump()}

        Application Context:
        - Practitioner Name: {pseudo_practitioner_name}
        - Date of Birth: {pseudo_date_of_birth}
        - SSN: {pseudo_ssn}
        - Address: {pseudo_address}

        Please provide your verification analysis.
        """
        logger.info("Calling Gemini model for LADMF verification analysis")

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
        
        document_url = original_ladmf_response.document_url if original_ladmf_response and original_ladmf_response.document_url else None
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.LADMF.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"ladmf_request": ladmf_request.model_dump()},
            response_json={
                "ladmf_response": original_ladmf_response.model_dump() if original_ladmf_response else None, 
                "llm_analysis": gemini_response.model_dump()
            },
            metadata=VerificationMetadata(
                model=MODEL.value, 
                usage_metadata=usage_metadata,
                response_time=time.time() - start_time,
                document_url=document_url
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
        logger.error(f"Error in LADMF verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="LADMF Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e) 