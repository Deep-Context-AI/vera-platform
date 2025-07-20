from datetime import datetime
import time

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.DCA import dca_service
from v1.models.requests import DCARequest
from v1.models.responses import DCAResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
import os
import logging

logger = logging.getLogger(__name__)


async def verify_dca(request: VerificationStepRequest):
    """
    Verify CA license using external service and Gemini model evaluation
    
    Args:
        request: VerificationStepRequest containing application context, requester, and database service
        
    Returns:
        VerificationStepResponse with verification results
    """
    practitioner_first_name = request.application_context.first_name
    practitioner_last_name = request.application_context.last_name
    db_service = request.db_service
    practitioner_address = request.application_context.address
    application_license_number = request.application_context.license_number
    
    if not application_license_number:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning="License number not provided in application context",
            metadata_status=VerificationStepMetadataEnum.NOT_PROVIDED
        )
    
    # ---------------------------
    # Pseudonymize sensitive data 
    # ---------------------------
    secret_seed = os.getenv("PSEUDONYM_SECRET", "default-seed")

    try:
        # Use consistent inputs for pseudonymization to ensure the same person gets the same pseudonym
        practitioner_full_name = f"{practitioner_first_name} {practitioner_last_name}"
        
        pseudo_license_number = pseudo.pseudonymize_generic(application_license_number, secret_seed)
        # Use the practitioner's name as the canonical identity for name pseudonymization
        pseudo_practitioner_name = pseudo.pseudonymize_name(practitioner_full_name, secret_seed)
        pseudo_address = pseudo.pseudonymize_address(practitioner_address.to_string(), secret_seed)

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized CA license number",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing CA license number: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    # Record audit trail for verification start using database service
    # The requester is the user who initiated the verification thus is the actor in Audit
    # In Step_State, the decision is made by the VERA AI agent
    await request.db_service.log_event(
        application_id=request.application_context.application_id,
        actor_id=request.requester,
        action="DCA Verification Started",
        prevent_duplicates=True
    )
    
    try:
        # Call services.external.DCA to get the license status
        dca_request = DCARequest(
            first_name=practitioner_first_name,
            last_name=practitioner_last_name,
            license_number=application_license_number
        )
        
        logger.info(f"Looking up CA license {pseudo_license_number} using external service")
        dca_response: DCAResponse = await dca_service.verify_license(
            request=dca_request,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_dca_response = dca_response.model_copy() if dca_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        pseudo_response_license_number = pseudo.pseudonymize_generic(str(dca_response.license_number), secret_seed)
        
        # Create a copy for LLM processing with pseudonymized values
        llm_dca_response = dca_response.model_copy()
        llm_dca_response.license_number = pseudo_response_license_number
        
        # Post processing for slimming down LLM-formatted response
        llm_dca_response = llm_dca_response.strip_response()
        
        if not dca_response or dca_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"CA license {application_license_number} not found during lookup",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = f"""
        You are a credentialing examiner verifying the credentials of this practitioner's California medical license through DCA. I want the results to be detailed

        Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and DCA record (allowing for minor variations)
        2. The license numbers match exactly between application and DCA record
        3. License status is CURRENT, ACTIVE or similar active status (primary_status_code: "20" is active)
        4. License is not expired (expiration date is in the future); today's date is {datetime.now().strftime("%Y-%m-%d")}
        5. No significant disciplinary actions that would prevent practice (has_discipline should be false)
        6. License is for California practice (board_code should be "800" for Medical Board of California)
        7. License type is appropriate for medical practice (typically "8002" for Physician's and Surgeon's)
        8. No concerning public record actions that would limit practice authority

        choose "requires_review" if ANY of the following are true:
        - Names don't match sufficiently between application and DCA record
        - License numbers don't match exactly
        - License is expired, inactive, suspended, or revoked (primary_status_code not "20")
        - License has significant disciplinary actions (has_discipline is true)
        - License has concerning public record actions
        - Data is incomplete or inconclusive
        - License is not appropriate for medical practice in California

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing name match, license number match, status, expiration, and disciplinary actions
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this California DCA license verification:

        DCA License Data:
        {llm_dca_response.model_dump()}

        Application Context:
        - Practitioner Name: {pseudo_practitioner_name}
        - License Number: {pseudo_license_number}
        - Address: {pseudo_address}

        Please provide your verification analysis.
        """
        logger.info("Calling Gemini model for DCA verification analysis")

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
        
        document_url = original_dca_response.document_url if original_dca_response and original_dca_response.document_url else None
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.DCA.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"dca_request": dca_request.model_dump()},
            response_json={
                "dca_response": original_dca_response.model_dump() if original_dca_response else None, 
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
        logger.error(f"Error in DCA verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="DCA Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e) 