import modal
import logging
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from supabase import Client

from v1.services.database import get_db, create_database_service
from v1.models.requests import VeraRequest
from v1.services.engine.processor import JobRunner
from v1.services.engine.registry import get_all_verification_steps

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

@router.get("/verification_steps")
async def get_available_verification_steps():
    """
    Get list of available verification steps
    
    Returns:
        List of available verification steps with descriptions
    """
    try:
        from v1.services.engine.registry import get_all_verification_steps
        
        steps = get_all_verification_steps()
        
        return {
            "available_steps": [
                {
                    "name": step.name,
                }
                for step in steps.values()
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting verification steps: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
