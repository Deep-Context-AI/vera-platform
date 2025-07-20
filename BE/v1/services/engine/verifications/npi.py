import time

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.NPI import NPIService
from v1.models.requests import NPIRequest
from v1.models.responses import NPIResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
import os
import logging

logger = logging.getLogger(__name__)


async def verify_npi(request: VerificationStepRequest):
    """
    Verify NPI number using external service and Gemini model evaluation
    
    Args:
        request: VerificationStepRequest containing application context, requester, and database service
        
    Returns:
        VerificationStepResponse with verification results
    """
    practitioner_first_name = request.application_context.first_name
    practitioner_last_name = request.application_context.last_name
    db_service = request.db_service    
    application_npi_number = request.application_context.npi_number
    
    # If the NPI number is not provided, return a business logic exception
    if not application_npi_number:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning="NPI number not provided in application context",
            metadata_status=VerificationStepMetadataEnum.NOT_PROVIDED
        )
    
    # ---------------------------
    # Pseudonymize sensitive data 
    # ---------------------------
    secret_seed = os.getenv("PSEUDONYM_SECRET", "default-seed")

    try:
        # Use consistent inputs for pseudonymization to ensure the same person gets the same pseudonym
        practitioner_full_name = f"{practitioner_first_name} {practitioner_last_name}"
        
        pseudo_npi_number = pseudo.pseudonymize_generic(application_npi_number, secret_seed)
        # Use the practitioner's name as the canonical identity for name pseudonymization
        pseudo_practitioner_name = pseudo.pseudonymize_name(practitioner_full_name, secret_seed)
        # The provider name from NPI lookup should match the practitioner name since it's the same person
        pseudo_provider_name = pseudo_practitioner_name

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized NPI number",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing NPI number: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    # Record audit trail for verification start using database service
    # The requester is the user who initiated the verification thus is the actor in Audit
    # In Step_State, the decision is made by the VERA AI agent
    await request.db_service.log_event(
        application_id=request.application_context.application_id,
        actor_id=request.requester,
        action="NPI Verification Started",
        prevent_duplicates=True
    )
    
    try:
        # Call services.external.NPI to get the NPI status
        npi_service = NPIService()
        npi_request = NPIRequest(npi=application_npi_number)
        
        logger.info(f"Looking up NPI {pseudo_npi_number} using external service")
        npi_response: NPIResponse = await npi_service.lookup_npi(
            request=npi_request,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_npi_response = npi_response.model_copy() if npi_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        pseudo_response_npi_number = pseudo.pseudonymize_generic(npi_response.npi, secret_seed)
        pseudo_response_provider_name = pseudo.pseudonymize_name(npi_response.provider_name, secret_seed)
        
        # Create a copy for LLM processing with pseudonymized values
        llm_npi_response = npi_response.model_copy()
        llm_npi_response.npi = pseudo_response_npi_number
        llm_npi_response.provider_name = pseudo_response_provider_name
        
        if not npi_response or npi_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"NPI {application_npi_number} not found during lookup",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = """
        You are a credentialing examiner verifying the credentials of this practitioner's NPI registration. I want the results to be detailed

        Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and NPI record (allowing for minor variations)
        2. The NPI numbers match exactly between application and NPI record
        3. NPI status is active or enrolled
        4. Record indicates the provider is verified and in good standing

        choose "requires_review" if ANY of the following are true:
        - Names don't match sufficiently between application and NPI record
        - NPI numbers don't match exactly
        - NPI status is inactive, deactivated, or not enrolled
        - Data is incomplete or inconclusive

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing name match, number match, and status
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this NPI verification:

        NPI Data:
        {llm_npi_response.model_dump()}

        Application Context:
        - Practitioner Name: {pseudo_practitioner_name}
        - NPI Number: {pseudo_npi_number}
        

        Please provide your verification analysis.
        """
        logger.info("Calling Gemini model for NPI verification analysis")

        client = await get_gemini_client()
        start_time = time.time()
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
        
        document_url = original_npi_response.document_url if original_npi_response and original_npi_response.document_url else None
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.NPI.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"npi_request": npi_request.model_dump()},
            response_json={
                "npi_response": original_npi_response.model_dump() if original_npi_response else None, 
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
        logger.error(f"Error in NPI verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="NPI Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e)