from datetime import datetime
import time

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.MEDICARE import medicare_service
from v1.models.requests import MedicareRequest
from v1.models.responses import MedicareResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
import os
import logging

logger = logging.getLogger(__name__)


async def verify_medicare(request: VerificationStepRequest):
    """
    Verify Medicare enrollment using external service and Gemini model evaluation
    
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
    
    # Record audit trail for verification start using database service BEFORE validation
    # The requester is the user who initiated the verification thus is the actor in Audit
    # In Step_State, the decision is made by the VERA AI agent
    await request.db_service.log_event(
        application_id=request.application_context.application_id,
        actor_id=request.requester,
        action="Medicare Verification Started",
        prevent_duplicates=True
    )
    
    if not application_npi_number:
        return VerificationStepResponse.from_business_logic_exception(
            reasoning="Medicare verification requires NPI number - not provided in application context.",
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
        pseudo_address = pseudo.pseudonymize_address(practitioner_address.to_string(), secret_seed)

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized NPI number for Medicare lookup",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing NPI number for Medicare lookup: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    try:
        # Call services.external.MEDICARE to get the enrollment status
        medicare_request = MedicareRequest(
            provider_verification_type="medicare_enrollment",
            npi=application_npi_number,
            first_name=practitioner_first_name,
            last_name=practitioner_last_name,
            verification_sources=["ffs_provider_enrollment", "ordering_referring_provider"]
        )
        
        logger.info(f"Looking up Medicare enrollment for NPI {pseudo_npi_number} using external service")
        medicare_response: MedicareResponse = await medicare_service.verify_provider(
            request=medicare_request,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_medicare_response = medicare_response.model_copy() if medicare_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        llm_medicare_response = medicare_response.model_copy()
        
        if medicare_response:
            # Pseudonymize the response data for LLM
            # Use the same practitioner name pseudonym as the application context for consistency
            llm_medicare_response.npi = pseudo_npi_number
            llm_medicare_response.full_name = pseudo_practitioner_name
        
        # Post processing for slimming down LLM-formatted response
        llm_medicare_response = llm_medicare_response.strip_response()
        
        if not medicare_response or medicare_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"Medicare enrollment for NPI {application_npi_number} not found during external service lookup.",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = f"""
        You are a credentialing examiner verifying the Medicare enrollment of this practitioner. I want the results to be detailed

        Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and Medicare record (allowing for minor variations)
        2. The NPI numbers match exactly between application and Medicare record
        3. Provider is found in at least one of the Medicare data sources (FFS Provider Enrollment or Ordering/Referring Provider)
        4. Enrollment status is ACTIVE, APPROVED, or similar active status
        5. Provider is eligible to order or refer Medicare services where applicable
        6. No concerning restrictions that would prevent Medicare participation
        7. Verification result is "verified" indicating successful enrollment verification

        choose "requires_review" if ANY of the following are true:
        - Names don't match sufficiently between application and Medicare record
        - NPI numbers don't match exactly
        - Provider is not found in any Medicare data sources
        - Enrollment status is inactive, suspended, revoked, or not approved
        - Provider is not eligible to order or refer Medicare services
        - Verification result is "not_verified"
        - Data is incomplete or inconclusive

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing name match, NPI match, enrollment status, and verification result
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this Medicare enrollment verification:

        Medicare Data:
        {llm_medicare_response.model_dump()}

        Application Context:
        - Practitioner Name: {pseudo_practitioner_name}
        - NPI Number: {pseudo_npi_number}
        - Address: {pseudo_address}

        Please provide your verification analysis.
        """
        logger.info("Calling Gemini model for Medicare verification analysis")

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
        
        document_url = original_medicare_response.document_url if original_medicare_response and original_medicare_response.document_url else None
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.MEDICARE.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"medicare_request": medicare_request.model_dump()},
            response_json={
                "medicare_response": original_medicare_response.model_dump() if original_medicare_response else None, 
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
        logger.error(f"Error in Medicare verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Medicare Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e) 