from datetime import datetime
import time

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.DEA import dea_service
from v1.models.requests import DEAVerificationRequest
from v1.models.responses import NewDEAVerificationResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
import os
import logging

logger = logging.getLogger(__name__)


async def verify_dea(request: VerificationStepRequest):
    """
    Verify DEA number using external service and Gemini model evaluation
    
    Args:
        request: VerificationStepRequest containing application context, requester, and database service
        
    Returns:
        VerificationStepResponse with verification results
    """
    practitioner_first_name = request.application_context.first_name
    practitioner_last_name = request.application_context.last_name
    db_service = request.db_service
    practitioner_address = request.application_context.address
    application_dea_number = request.application_context.dea_number
    
    if not application_dea_number:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning="DEA number not provided in application context",
            metadata_status=VerificationStepMetadataEnum.NOT_FOUND
        )
    
    # ---------------------------
    # Pseudonymize sensitive data 
    # ---------------------------
    secret_seed = os.getenv("PSEUDONYM_SECRET", "default-seed")

    try:
        # Use consistent inputs for pseudonymization to ensure the same person gets the same pseudonym
        practitioner_full_name = f"{practitioner_first_name} {practitioner_last_name}"
        
        pseudo_dea_number = pseudo.pseudonymize_generic(application_dea_number, secret_seed)
        # Use the practitioner's name as the canonical identity for name pseudonymization
        pseudo_practitioner_name = pseudo.pseudonymize_name(practitioner_full_name, secret_seed)
        pseudo_address = pseudo.pseudonymize_address(practitioner_address.to_string(), secret_seed)

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized DEA number",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing DEA number: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    # Record audit trail for verification start using database service
    # The requester is the user who initiated the verification thus is the actor in Audit
    # In Step_State, the decision is made by the VERA AI agent
    await request.db_service.log_event(
        application_id=request.application_context.application_id,
        actor_id=request.requester,
        action="DEA Verification Started",
        prevent_duplicates=True
    )
    
    try:
        # Call services.external.DEA to get the DEA status
        dea_request = DEAVerificationRequest(
            first_name=practitioner_first_name,
            last_name=practitioner_last_name,
            dea_number=application_dea_number
        )
        
        logger.info(f"Looking up DEA {pseudo_dea_number} using external service")
        dea_response: NewDEAVerificationResponse = await dea_service.verify_dea_practitioner(
            request=dea_request,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_dea_response = dea_response.model_copy() if dea_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        response_practitioner_full_name = f"{dea_response.practitioner.First_name} {dea_response.practitioner.Last_name}"
        pseudo_response_dea_number = pseudo.pseudonymize_generic(dea_response.number, secret_seed)
        pseudo_response_practitioner_name = pseudo.pseudonymize_name(response_practitioner_full_name, secret_seed)
        pseudo_response_address = pseudo.pseudonymize_address(dea_response.registeredAddress.to_string(), secret_seed)
        
        # Create a copy for LLM processing with pseudonymized values
        llm_dea_response = dea_response.model_copy()
        llm_dea_response.number = pseudo_response_dea_number
        llm_dea_response.practitioner.First_name = pseudo_response_practitioner_name.split()[0]
        llm_dea_response.practitioner.Last_name = pseudo_response_practitioner_name.split()[-1]
        llm_dea_response.registeredAddress = pseudo_response_address
        
        # Post processing for slimming down LLM-formatted response
        llm_dea_response = llm_dea_response.strip_response()
        
        if not dea_response or dea_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"DEA {application_dea_number} not found during lookup",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = f"""
        You are a credentialing examiner verifying the credentials of this practitioner's DEA registration. I want the results to be detailed

        Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and DEA record (allowing for minor variations)
        2. The DEA numbers match exactly between application and DEA record
        3. Registration status is ACTIVE or similar active status
        4. Registration is not expired (expiration date is in the future); today's date is {datetime.now().strftime("%Y-%m-%d")}
        5. No concerning restrictions that would prevent controlled substance prescribing
        6. Business/ practice address is california (From DEA response, this is `state` as a two-letter code)
        7. has complete drug schedules ( 2, 2N, 3, 4, 5)
        8. business activity code "C"
        9. registration status as active
        10. issue date

        choose "requires_review" if ANY of the following are true:
        - Names don't match sufficiently between application and DEA record
        - DEA numbers don't match exactly
        - Registration is expired, inactive, suspended, or revoked
        - Registration has significant restrictions that limit prescribing authority
        - Data is incomplete or inconclusive

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing name match, number match, status, and expiration
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this DEA verification:

        DEA Data:
        {llm_dea_response.model_dump()}

        Application Context:
        - Practitioner Name: {pseudo_practitioner_name}
        - DEA Number: {pseudo_dea_number}
        - Address: {pseudo_address}

        Please provide your verification analysis.
        """
        logger.info("Calling Gemini model for DEA verification analysis")

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
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.DEA.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"dea_request": dea_request.model_dump()},
            response_json={
                "dea_response": original_dea_response.model_dump() if original_dea_response else None, 
                "llm_analysis": gemini_response.model_dump()
            },
            metadata=VerificationMetadata(
                model=MODEL.value, 
                usage_metadata=usage_metadata,
                response_time=time.time() - start_time,
                document_url=original_dea_response.document_url if original_dea_response and original_dea_response.document_url else None
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
                document_url=original_dea_response.document_url if original_dea_response and original_dea_response.document_url else None
            ),
        )
        
    except Exception as e:
        logger.error(f"Error in DEA verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="DEA Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e) 