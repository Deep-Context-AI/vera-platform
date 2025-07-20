from datetime import datetime
import time

import v1.services.pseudonymization as pseudo
from v1.services.clients import call_gemini_model, GeminiModel, get_gemini_client
from v1.services.external.ABMS import abms_service
from v1.models.requests import ABMSRequest
from v1.models.responses import ABMSResponse
from v1.services.engine.verifications.models import (
    VerificationStepResponse, VerificationStepDecision, VerificationStepMetadataEnum, VerificationMetadata,
    LLMResponse, UserAgent, VerificationSteps, VerificationStepRequest
)
import os
import logging

logger = logging.getLogger(__name__)


async def verify_abms(request: VerificationStepRequest):
    """
    Verify ABMS board certification using external service and Gemini model evaluation
    
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
        pseudo_address = pseudo.pseudonymize_address(practitioner_address.to_string(), secret_seed)

        # Log pseudonymization action success using database service
        await db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="Pseudonymized NPI number for ABMS lookup",
            prevent_duplicates=True
        )

    except Exception as e:
        logger.error(f"Error pseudonymizing NPI number for ABMS lookup: {e}")
        return VerificationStepResponse.from_exception(e)
        
    
    # Record audit trail for verification start using database service
    # The requester is the user who initiated the verification thus is the actor in Audit
    # In Step_State, the decision is made by the VERA AI agent
    await request.db_service.log_event(
        application_id=request.application_context.application_id,
        actor_id=request.requester,
        action="ABMS Verification Started",
        prevent_duplicates=True
    )
    
    try:
        # Call services.external.ABMS to get the board certification status
        abms_request = ABMSRequest(
            first_name=practitioner_first_name,
            last_name=practitioner_last_name,
            npi_number=application_npi_number,
            state=practitioner_address.state[:2].upper()  # Convert to 2-letter state code
        )
        
        logger.info(f"Looking up ABMS board certification for NPI {pseudo_npi_number} using external service")
        abms_response: ABMSResponse = await abms_service.lookup_board_certification(
            request=abms_request,
            generate_pdf=True,
            user_id=request.requester,
        )
        
        # Store original response before pseudonymization for audit trail
        original_abms_response = abms_response.model_copy() if abms_response else None
        
        # Create pseudonymized versions for LLM processing
        # Use the ACTUAL response data to create pseudonyms, not the application data
        llm_abms_response = abms_response.model_copy()
        
        if abms_response.profile:
            # Pseudonymize the profile data for LLM
            # Use the same practitioner name pseudonym as the application context for consistency
            llm_abms_response.profile.name = pseudo_practitioner_name
            llm_abms_response.profile.npi = pseudo_npi_number
            
            # Pseudonymize license numbers if present
            if llm_abms_response.profile.licenses:
                for license_obj in llm_abms_response.profile.licenses:
                    if license_obj.number and license_obj.number != "Unknown":
                        license_obj.number = pseudo.pseudonymize_generic(license_obj.number, secret_seed)
        
        if not abms_response or abms_response.status != "success":
            return VerificationStepResponse.from_business_logic_exception(
                reasoning=f"ABMS board certification for NPI {application_npi_number} not found during lookup",
                metadata_status=VerificationStepMetadataEnum.NOT_FOUND
            )
        
        llm_abms_response = llm_abms_response.strip_response()
        
        # System prompt for Gemini model
        MODEL=GeminiModel.GEMINI_20_FLASH
        
        SYSTEM_PROMPT = f"""
        You are a credentialing examiner verifying the credentials of this practitioner's ABMS board certification. I want the results to be detailed

        Decision tree
        choose "approved" when ALL of the following are true:
        1. The practitioner names match between application and ABMS record (allowing for minor variations)
        2. The NPI numbers match exactly between application and ABMS record
        3. Board certification status is ACTIVE, CERTIFIED, or similar active status
        4. Board certification is not expired (expiration date is in the future or ongoing); today's date is {datetime.now().strftime("%Y-%m-%d")}
        5. The practitioner has valid board certification in their medical specialty
        6. The practitioner is in good standing with the medical board (no concerning disciplinary actions)
        7. MOC (Maintenance of Certification) participation is current where applicable
        8. License information is consistent and active

        choose "requires_review" if ANY of the following are true:
        - Names don't match sufficiently between application and ABMS record
        - NPI numbers don't match exactly
        - Board certification is expired, inactive, suspended, or revoked
        - Board certification has significant restrictions or disciplinary actions
        - Data is incomplete or inconclusive
        - No valid board certification found for the practitioner
        - MOC requirements are not being met where required

        you must respond like JSON
        decision: either "approved" or "requires_review"
        reasoning: a single paragraph explaining your decision, specifically addressing name match, NPI match, certification status, expiration, and any disciplinary issues
        """
        
        # Prepare message for Gemini with pseudonymized values
        message = f"""Please evaluate this ABMS board certification verification:

        ABMS Data:
        {llm_abms_response.model_dump()}

        Application Context:
        - Practitioner Name: {pseudo_practitioner_name}
        - NPI Number: {pseudo_npi_number}
        - Address: {pseudo_address}

        Please provide your verification analysis.
        """
        logger.info("Calling Gemini model for ABMS verification analysis")

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
        
        document_url = original_abms_response.document_url if original_abms_response and original_abms_response.document_url else None
        
        # Save invocation record using database service
        await request.db_service.save_invocation(
            application_id=request.application_context.application_id,
            step_key=VerificationSteps.ABMS.value,
            invocation_type="External API + LLM",
            status=verification_decision.value,
            created_by=request.requester,
            request_json={"abms_request": abms_request.model_dump()},
            response_json={
                "abms_response": original_abms_response.model_dump() if original_abms_response else None, 
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
        logger.error(f"Error in ABMS verification: {e}")
        
        # Log failure using database service
        await request.db_service.log_event(
            application_id=request.application_context.application_id,
            actor_id=request.requester,
            action="ABMS Verification Failed",
            notes=f"Error: {str(e)}",
        )
        
        return VerificationStepResponse.from_exception(e) 