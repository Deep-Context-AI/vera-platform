import os
import modal
import asyncio
import logging
from typing import Dict, Any, List, Union
from google import genai
from supabase import Client

from v1.models.requests import VeraRequest
from v1.config.modal_config import app
from v1.services.engine.registry import VerificationStep, get_verification_step, get_all_verification_steps
from v1.services.database import get_supabase_client
from v1.services.audit_trail_service import audit_trail_service
from v1.models.database import AuditTrailStatus
from v1.services.engine.verifications.models import VerificationStepResponse, VerificationStepMetadataEnum
from v1.models.context import ApplicationContext

logger = logging.getLogger(__name__)

MAX_JOB_RUNNER_JOBS = 10
MAX_QUEUE_SIZE = 5

@app.cls(
    max_containers=MAX_JOB_RUNNER_JOBS // MAX_QUEUE_SIZE,
    timeout=3000,
)
@modal.concurrent(max_inputs=MAX_QUEUE_SIZE)
class JobRunner:
    queue_name: str = modal.parameter(default="main")
    
    @modal.method()
    async def process_job(self, request: VeraRequest):
        """
        Process a verification job by running requested verification steps in parallel
        
        Args:
            request: VeraRequest containing application_id, requested_verifications, and requester_id
            
        Returns:
            Dict containing verification results for each step
        """
        application_id = request.application_id
        requested_verifications = request.requested_verifications
        
        logger.info(f"Starting verification job for application {application_id}")
        logger.info(f"Requested verifications: {requested_verifications}")
        
        # Check if verifications exist in registry
        for verification_name in requested_verifications:
            if verification_name not in get_all_verification_steps():
                raise ValueError(f"Unknown verification step: {verification_name}")
        
        # Record Audit Trail for application status
        # await audit_trail_service.record_change(
        #     application_id=application_id,
        #     step_key="application_processing",
        #     status=AuditTrailStatus.IN_PROGRESS,
        #     data={
        #         "requested_verifications": requested_verifications,
        #         "processing_started": True
        #     },
        #     changed_by=UserAgent.VERA_AI,
        #     notes=f"Started processing {len(requested_verifications)} verification steps"
        # )
        
        # Initialize Gemini client
        try:
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            logger.info("Gemini client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            # await audit_trail_service.record_change(
            #     application_id=application_id,
            #     step_key="application_processing",
            #     status=AuditTrailStatus.FAILED,
            #     data={"error": "Failed to initialize Gemini client", "error_details": str(e)},
            #     changed_by=UserAgent.VERA_AI,
            #     notes="Critical error: Could not initialize AI client"
            # )
            # return {"error": "Failed to initialize AI client", "details": str(e)}
            raise e
        
        # Get database session
        db = get_supabase_client()
        
        # Get application from database
        application_context = await ApplicationContext.load_from_db(db, application_id)

        # Run each step in parallel
        verification_tasks = []
        step_results: Dict[str, VerificationStepResponse] = {}
        
        for verification_name in requested_verifications:
            # Get verification step configuration
            step_config: VerificationStep = get_verification_step(verification_name)
            logger.info(f"Preparing verification step: {verification_name}")
            
            # Create task for this verification step
            task = _run_verification_step(
                step_name=verification_name,
                step_config=step_config,
                application_context=application_context,
                db=db
            )
            verification_tasks.append((verification_name, task))
        
        # Execute all verification tasks in parallel
        if verification_tasks:
            logger.info(f"Running {len(verification_tasks)} verification steps in parallel")
            
            # Run tasks concurrently
            task_results: List[VerificationStepResponse] = await asyncio.gather(
                *[task for _, task in verification_tasks],
                return_exceptions=True
            )
            
            # Process results
            for i, (step_name, _) in enumerate(verification_tasks):
                # Contract is that ALL verification steps must return a VerificationStepResponse
                # Business-logic exceptions are treated as VerificationStepResponses
                # Infra-related exceptions are treated as Exceptions
                result = task_results[i]
                if isinstance(result, Exception):
                    logger.error(f"Verification step {step_name} failed with exception: {result}")
                    step_results[step_name] = VerificationStepResponse.from_exception(result)
                else:
                    logger.info(f"Verification step {step_name} completed successfully")
                    step_results[step_name] = result
        
        # Record Audit Trail for application status completion
        all_successful = all(
            result.metadata.status == VerificationStepMetadataEnum.COMPLETE
            for result in step_results.values()
        )
        
        final_status = AuditTrailStatus.COMPLETED if all_successful else AuditTrailStatus.FAILED
        logger.info(f"Final status: {final_status}")
        
        logger.info(f"Verification job completed for application {application_id}")
        
        # Return results
        return {
            "application_id": application_id,
            "status": "completed" if all_successful else "partial_failure",
            "verification_results": step_results,
            "summary": {
                "total_requested": len(requested_verifications),
                "completed": len(step_results),
                "successful": sum(1 for r in step_results.values() if r.metadata.status == VerificationStepMetadataEnum.COMPLETE),
                "failed": sum(1 for r in step_results.values() if r.metadata.status == VerificationStepMetadataEnum.FAILED)
            }
        }

async def _run_verification_step(
    step_name: str,
    step_config: VerificationStep,
    application_context: ApplicationContext,
    db: Client,
) -> Dict[str, Any]:
    """
    Run a single verification step
    
    Args:
        step_name: Name of the verification step
        step_config: Configuration for the verification step
        application_context: Context about the application
        db: Database session
        
    Returns:
        Dict containing the verification result
    """
    try:
        logger.info(f"Starting verification step: {step_name}")
        
        # Every step will typically have its input in ApplicationContext
        # Special cases will have their own input models that subclass VerificationStepRequest
        # SPECIAL CASES HERE; otherwise, follow general pattern
        
        # Call the verification function  
        result = await step_config.processing_function(
            request=step_config.request_schema(application_context=application_context)
        )
        
        return result
            
    except Exception as e:
        logger.error(f"Error in verification step {step_name}: {e}")
        return {
            "step_name": step_name,
            "status": "failed",
            "error": str(e)
        }