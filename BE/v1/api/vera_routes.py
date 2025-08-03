import modal
import logging
import os
import io
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
from supabase import Client

from v1.services.database import get_db, create_database_service
from v1.models.requests import VeraRequest
from v1.services.engine.processor import JobRunner
from v1.services.engine.registry import get_all_verification_steps
from v1.api.models.provider_models import (
    ProviderProfileResponse, VerificationStepsResponse, StepDetailsResponse,
    ActivityResponse, DocumentsResponse, VerificationStepsRegistryResponse,
    SyncVerificationRequest, SyncVerificationResponse, VerificationStepResult
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Vera"])

@router.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "vera-verification-engine"}

@router.post("/verify_application")
async def verify_application(request: VeraRequest, db: Client = Depends(get_db)):
    """
    Verify an application by running requested verification steps
    
    Args:
        request: VeraRequest containing application_id, requested_verifications
        
    Returns:
        Formatted verification results
    """
    try:
        logger.info(f"Received verification request for application {request.application_id}")
        logger.info(f"Requested verifications: {request.requested_verifications}")
        
        # Validate request
        if not request.requested_verifications:
            raise HTTPException(
                status_code=400,
                detail="At least one verification step must be requested"
            )
        
        # Get the requesting user from the database using DatabaseService
        try:
            db_service = create_database_service(db)
            user_id = await db_service.get_user_from_id_or_email(request.requester)
        except Exception as e:
            logger.error(f"Error getting user from ID or email: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid requester ID or email: {request.requester}"
            )
        
        # Compare requested_verifications to available_steps
        available_steps = get_all_verification_steps()
        for step in request.requested_verifications:
            if step not in available_steps:
                logger.error(f"Verification step {step} is not available")
                raise HTTPException(
                    status_code=400,
                    detail=f"One or more requested verifications are not available. Please check the available steps and try again."
                )
        
        # Get the Modal function reference
        runner = JobRunner()
        
        # Execute the verification job
        logger.info("Executing verification job via Modal")
        call: modal.FunctionCall = await runner.process_job.spawn.aio(request, user_id)
        
        # Log completion
        logger.info(f"Verification request completed for application {request.application_id}")
        
        return call.object_id
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Error processing verification request: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/verify_step_sync", response_model=SyncVerificationResponse)
async def verify_step_sync(request: SyncVerificationRequest, db: Client = Depends(get_db)):
    """
    Synchronously verify a single verification step and return results immediately
    
    Args:
        request: SyncVerificationRequest containing application_id, step_key, and requester
        
    Returns:
        SyncVerificationResponse with verification results
    """
    try:
        logger.info(f"Received sync verification request for application {request.application_id}, step {request.step_key}")
        
        # Validate the step exists
        available_steps = get_all_verification_steps()
        if request.step_key not in available_steps:
            raise HTTPException(
                status_code=400,
                detail=f"Verification step {request.step_key} is not available"
            )
        
        # Get the requesting user from the database
        try:
            db_service = create_database_service(db)
            user_id = await db_service.get_user_from_id_or_email(request.requester)
        except Exception as e:
            logger.error(f"Error getting user from ID or email: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid requester ID or email: {request.requester}"
            )
        
        # Create VeraRequest for the single step
        vera_request = VeraRequest(
            application_id=request.application_id,
            requested_verifications=[request.step_key],
            requester=request.requester
        )
        
        # Get the Modal function reference
        runner = JobRunner()
        
        # Execute the verification job synchronously and wait for results
        logger.info(f"Executing sync verification for step {request.step_key}")
        results = await runner.process_job.remote.aio(vera_request, user_id)
        
        # Transform results to the expected format
        verification_results = {}
        for step_key, step_result in results["verification_results"].items():
            verification_results[step_key] = VerificationStepResult(
                step_key=step_key,
                decision=step_result.decision.value if hasattr(step_result.decision, 'value') else str(step_result.decision),
                reasoning=step_result.metadata.reasoning if step_result.metadata and hasattr(step_result.metadata, 'reasoning') else None,
                status=step_result.metadata.status.value if step_result.metadata and hasattr(step_result.metadata.status, 'value') else "unknown",
                metadata=step_result.metadata.dict() if step_result.metadata else None
            )
        
        response = SyncVerificationResponse(
            application_id=request.application_id,
            status=results["status"],
            verification_results=verification_results,
            summary=results["summary"]
        )
        
        logger.info(f"Sync verification completed for application {request.application_id}, step {request.step_key}")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Error processing sync verification request: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/verify_application/{application_id}/status")
async def get_verification_status(
    application_id: int,
    include_details: Optional[bool] = Query(False, description="Include detailed verification information")
):
    """
    Get the status of a verification application
    
    Args:
        application_id: ID of the application to check
        include_details: Whether to include detailed verification information
        
    Returns:
        Current verification status
    """
    try:
        logger.info(f"Getting verification status for application {application_id}")
        
        # TODO: Implement status checking from audit trail using DatabaseService
        # For now, return a placeholder response
        return {
            "application_id": application_id,
            "status": "not_implemented",
            "message": "Status checking not yet implemented"
        }
        
    except Exception as e:
        logger.error(f"Error getting verification status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/verification_steps", response_model=VerificationStepsRegistryResponse)
async def get_available_verification_steps():
    """
    Get list of available verification steps
    
    Returns:
        List of available verification steps with descriptions
    """
    try:
        from v1.services.engine.registry import get_all_verification_steps
        
        from v1.api.models.provider_models import AvailableStep
        
        steps = get_all_verification_steps()
        
        available_steps = [
            AvailableStep(
                step_key=step_key,
                name=step.name.value,
                display_name=_format_step_name(step_key)
            )
            for step_key, step in steps.items()
        ]
        
        return VerificationStepsRegistryResponse(
            available_steps=available_steps,
            total_steps=len(steps)
        )
        
    except Exception as e:
        logger.error(f"Error getting verification steps: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/providers/{application_id}", response_model=ProviderProfileResponse)
async def get_provider_profile(application_id: int, db: Client = Depends(get_db)):
    """
    Get complete provider profile with application data and verification progress.
    
    Args:
        application_id: Application ID to fetch
        
    Returns:
        Complete provider profile data
    """
    try:
        logger.info(f"Getting provider profile for application {application_id}")
        
        from v1.services.engine.provider_service import ProviderService
        provider_service = ProviderService(db)
        
        profile = await provider_service.get_provider_profile(application_id)
        
        logger.info(f"Successfully retrieved provider profile for application {application_id}")
        return profile
        
    except Exception as e:
        logger.error(f"Error getting provider profile: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/providers/{application_id}/verification-steps", response_model=VerificationStepsResponse)
async def get_provider_verification_steps(application_id: int, db: Client = Depends(get_db)):
    """
    Get summary of all verification steps with status and basic info.
    
    Args:
        application_id: Application ID
        
    Returns:
        Dict containing steps summary
    """
    try:
        logger.info(f"Getting verification steps for application {application_id}")
        
        from v1.services.engine.provider_service import ProviderService
        provider_service = ProviderService(db)
        
        steps = await provider_service.get_verification_steps_summary(application_id)
        
        logger.info(f"Successfully retrieved verification steps for application {application_id}")
        return steps
        
    except Exception as e:
        logger.error(f"Error getting verification steps: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/providers/{application_id}/verification-steps/{step_key}", response_model=StepDetailsResponse)
async def get_provider_step_details(application_id: int, step_key: str, db: Client = Depends(get_db)):
    """
    Get detailed information for a specific verification step.
    
    Args:
        application_id: Application ID
        step_key: Verification step key
        
    Returns:
        Dict containing step details
    """
    try:
        logger.info(f"Getting step details for application {application_id}, step {step_key}")
        
        from v1.services.engine.provider_service import ProviderService
        provider_service = ProviderService(db)
        
        details = await provider_service.get_step_details(application_id, step_key)
        
        logger.info(f"Successfully retrieved step details for application {application_id}, step {step_key}")
        return details
        
    except Exception as e:
        logger.error(f"Error getting step details: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/providers/{application_id}/activity", response_model=ActivityResponse)
async def get_provider_activity(application_id: int, db: Client = Depends(get_db)):
    """
    Get complete activity timeline for a provider.
    
    Args:
        application_id: Application ID
        
    Returns:
        Dict containing activity history
    """
    try:
        logger.info(f"Getting activity history for application {application_id}")
        
        from v1.services.engine.provider_service import ProviderService
        provider_service = ProviderService(db)
        
        activity = await provider_service.get_provider_activity(application_id)
        
        logger.info(f"Successfully retrieved activity history for application {application_id}")
        return activity
        
    except Exception as e:
        logger.error(f"Error getting activity history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/providers/{application_id}/documents", response_model=DocumentsResponse)
async def get_provider_documents(
    application_id: int, 
    step_key: Optional[str] = Query(None, description="Optional step key to filter documents"),
    db: Client = Depends(get_db)
):
    """
    Get all documents for a provider, optionally filtered by step.
    
    Args:
        application_id: Application ID
        step_key: Optional step key to filter by
        
    Returns:
        Dict containing documents list
    """
    try:
        logger.info(f"Getting documents for application {application_id}, step_key: {step_key}")
        
        from v1.services.engine.provider_service import ProviderService
        provider_service = ProviderService(db)
        
        documents = await provider_service.get_provider_documents(application_id, step_key)
        
        logger.info(f"Successfully retrieved documents for application {application_id}")
        return documents
        
    except Exception as e:
        logger.error(f"Error getting documents: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Modal function to serve audio files from volume
try:
    from v1.config.modal_config import app
    MODAL_AVAILABLE = True
    # Reference the same volume used for other audio files
    audio_volume = modal.Volume.from_name("voice-debug-audio", create_if_missing=True)
    
    @app.function(
        timeout=60,
        volumes={"/audio_storage": audio_volume}
    )
    def _get_audio_file_from_volume(file_path: str) -> bytes:
        """Modal function to read audio file from volume"""
        full_path = f"/audio_storage/{file_path}"
        
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        if not full_path.endswith('.mp3'):
            raise ValueError("Only MP3 files are supported")
        
        with open(full_path, 'rb') as f:
            return f.read()
    
except ImportError:
    MODAL_AVAILABLE = False
    audio_volume = None

@router.get("/audio/{file_path:path}")
async def get_audio_file(file_path: str):
    """
    Serve MP3 files from Modal Volume
    
    Args:
        file_path: Path to the MP3 file in the volume (e.g., voice_debug/2025-08-03/session-id/file.mp3)
        
    Returns:
        MP3 file with appropriate headers for audio playback
    """
    try:
        if not MODAL_AVAILABLE:
            raise HTTPException(
                status_code=503,
                detail="Modal service is not available"
            )
        
        logger.info(f"Serving audio file: {file_path}")
        
        # Validate file path to prevent directory traversal
        if '..' in file_path or file_path.startswith('/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file path"
            )
        
        if not file_path.endswith('.mp3'):
            raise HTTPException(
                status_code=400,
                detail="Only MP3 files are supported"
            )
        
        # Get file data from Modal Volume
        try:
            file_data = await _get_audio_file_from_volume.remote.aio(file_path)
        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f"Audio file not found: {file_path}"
            )
        except Exception as e:
            logger.error(f"Error reading audio file from volume: {e}")
            raise HTTPException(
                status_code=500,
                detail="Error reading audio file"
            )
        
        # Extract filename for Content-Disposition header
        filename = os.path.basename(file_path)
        
        # Create a BytesIO object to stream the data
        file_stream = io.BytesIO(file_data)
        
        def generate():
            while True:
                chunk = file_stream.read(8192)  # Read in 8KB chunks
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            generate(),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
                "Content-Length": str(len(file_data)),
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*"
            }
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error serving audio file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

def _format_step_name(step_key: str) -> str:
    """Format step key into human readable name"""
    step_names = {
        "npi": "NPI Verification",
        "dea": "DEA Verification", 
        "dca": "DCA License Verification",
        "abms": "ABMS Board Certification",
        "ladmf": "LADMF Verification",
        "medicare": "Medicare Verification",
        "medical": "Medical License Verification",
        "npdb": "NPDB Check",
        "sanctions": "Sanctions Check",
        "education": "Education Verification",
        "hospital": "Hospital Privileges"
    }
    return step_names.get(step_key, step_key.upper())
