from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from google import genai

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.NPI import NPIService
from v1.models.requests import NPIRequest
from v1.models.responses import NPIResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
from v1.services.audit_trail_utils import (
    log_verification_started,
    log_verification_completed,
    log_verification_failed,
    log_pseudonymization_action,
)
import os
import logging

logger = logging.getLogger(__name__)


async def verify_npi(request: VerificationStepRequest):
    """
    Verify NPI number using external service and Gemini model evaluation
    
    Args:
        npi_number: The NPI number to verify
        application_context: Context about the application (contains application_id, practitioner info)
        db: Database session
        client: Gemini client for AI evaluation
        
    Returns:
        NPIResponse with verification results
    """
    practitioner_first_name = request.application_context.first_name
    practitioner_last_name = request.application_context.last_name
    
    application_npi_number = request.application_context.npi_number
    
    # ---------------------------
    # Pseudonymize sensitive data 
    # ---------------------------
    secret_seed = os.getenv("PSEUDONYM_SECRET", "default-seed")
    if not secret_seed:
        raise RuntimeError("PSEUDONYM_SECRET environment variable is not set")

    try:
        pseudo_npi_number = pseudo.pseudonymize_generic(application_npi_number, secret_seed)
        pseudo_provider_name = pseudo.pseudonymize_name(application_npi_number, secret_seed)
        pseudo_practitioner_name = pseudo.pseudonymize_name(
            f"{practitioner_first_name} {practitioner_last_name}", secret_seed
        )

        # Log pseudonymization action success
        # await log_pseudonymization_action(
        #     application_id=application_id,
        #     step_name=VerificationSteps.NPI,
        #     fields_pseudonymized=[
        #         "npi_number",
        #         "provider_name",
        #         "practitioner_name",
        #     ],
        #     processed_by=UserAgent.VERA_AI,
        #     success=True,
        # )

    except Exception as e:
        # Log failure and abort further processing
        # await log_pseudonymization_action(
        #     application_id=application_id,
        #     step_name=VerificationSteps.NPI,
        #     fields_pseudonymized=["npi_number", "provider_name", "practitioner_name"],
        #     processed_by=UserAgent.VERA_AI,
        #     success=False,
        #     error_message=str(e),
        # )
        logger.error(f"Error pseudonymizing NPI number: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    # Record audit trail for verification start
    # await log_verification_started(
    #     application_id=application_id,
    #     step_name=VerificationSteps.NPI,
    #     reasoning=f"Starting NPI verification for {npi_number}",
    #     request_data={"npi_number": pseudo_npi_number, "practitioner_name": pseudo_practitioner_name},
    #     processed_by=UserAgent.VERA_AI,
    # )
    
    try:
        # Call services.external.NPI to get the NPI status
        npi_service = NPIService()
        npi_request = NPIRequest(npi=application_npi_number)
        
        logger.info(f"Looking up NPI {pseudo_npi_number} using external service")
        npi_response: NPIResponse = await npi_service.lookup_npi(npi_request)
        print(npi_response)
        
        # Augment the npi_response with the pseudonymized values
        npi_response.npi = pseudo_npi_number
        npi_response.provider_name = pseudo_provider_name
        
        if not npi_response or npi_response.status != "success":
            # await log_verification_failed(
            #     application_id=application_id,
            #     step_name=VerificationSteps.NPI,
            #     error_code="NPI_NOT_FOUND",
            #     error_message=f"NPI {pseudo_npi_number} not found in external service",
            #     reasoning="NPI lookup failed"
            # )
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"NPI {application_npi_number} not found during lookup",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = """
        You are a credentialing examiner verifying the credentials of this practitioner's medical verification. I want the results to be detailed

        Decision tree
        choose "enrolled" when:
        1. Name should match
        2. NPI number should match
        3. status is active
        4. match- status: verified

        If no results found, choose "not enrolled"

        you must respond like JSON
        status
        reasoning: a single paragraph explaining your decision
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this NPI verification:

        NPI Data:
        {npi_response.model_dump()}

        Application Context:
        - Practitioner Name: {pseudo_practitioner_name}
        - NPI Number: {pseudo_npi_number}
        

        Please provide your verification analysis.
        """
        
        logger.info("Calling Gemini model for NPI verification analysis")
        client = await get_gemini_client()
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
        
        # Record successful completion
        # await log_verification_completed(
        #     application_id=application_id,
        #     step_name=VerificationSteps.NPI,
        #     verification_result=verification_decision.value,
        #     reasoning=reasoning,
        #     response_data={
        #         "npi_data": npi_data,
        #         "gemini_analysis": gemini_response.model_dump()
        #     },
        # )
        
        # Return NPIResponse
        return VerificationStepResponse(
            decision=verification_decision,
            analysis=gemini_response,
            metadata=VerificationMetadata(
                status=VerificationStepMetadataEnum.COMPLETE,
                usage_metadata=usage_metadata,
                model=MODEL.value,
                document_url=npi_response.document_url if npi_response.document_url else None
            ),
        )
        
    except Exception as e:
        logger.error(f"Error in NPI verification: {e}")
        # await log_verification_failed(
        #     application_id=application_id,
        #     step_name=VerificationSteps.NPI,
        #     error_code=type(e).__name__,
        #     error_message=str(e),
        #     reasoning=f"NPI verification failed due to error: {str(e)}"
        # )
        
        return VerificationStepResponse.from_exception(e)