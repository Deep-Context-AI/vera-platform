import modal
import asyncio
import logging
from typing import Dict, List

from v1.models.requests import VeraRequest
from v1.config.modal_config import app
from v1.services.engine.registry import VerificationStep, get_verification_step, get_all_verification_steps
from v1.services.database import create_database_service, DatabaseService
from v1.services.engine.verifications.models import VerificationStepResponse, VerificationStepMetadataEnum, rebuild_verification_models, UserAgent
from v1.models.context import ApplicationContext

# Rebuild the VerificationStepRequest model now that DatabaseService is available
rebuild_verification_models()

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
    async def process_job(self, request: VeraRequest, user_id: str):
        """
        Process a verification job by running requested verification steps in parallel
        
        Args:
            request: VeraRequest containing application_id, requested_verifications, and requester_id
            user_id: User ID from the database
            
        Returns:
            Dict containing verification results for each step
        """
        # Get database session and create service
        db_service = create_database_service()
        
        application_id = request.application_id
        requested_verifications = request.requested_verifications
        
        logger.info(f"Starting verification job for application {application_id}")
        logger.info(f"Requested verifications: {requested_verifications}")
        
        # Check if verifications exist in registry
        for verification_name in requested_verifications:
            if verification_name not in get_all_verification_steps():
                raise ValueError(f"Unknown verification step: {verification_name}")
        
        # Set application status to IN_PROGRESS at the start
        await db_service.set_application_in_progress(
            application_id=application_id,
            actor_id=user_id,
            notes=f"Starting verification for steps: {', '.join(requested_verifications)}"
        )
        
        # Log the event using the database service
        await db_service.log_event(
            application_id=application_id,
            actor_id=user_id,
            action="Verification Job Started",
            prevent_duplicates=True,
        )
        
        # Get application from database
        application_context = await ApplicationContext.load_from_db(db_service, application_id)

        # Check for existing step states and separate steps that need processing vs skipping
        verification_tasks = []
        step_results: Dict[str, VerificationStepResponse] = {}
        skipped_steps = []
        
        for verification_name in requested_verifications:
            # Check if this step already exists in the database
            existing_step_state = await db_service.check_existing_step_state(
                application_id=application_id,
                step_key=verification_name
            )
            
            if existing_step_state:
                # Skip processing but reconstruct the response from database
                logger.info(f"Skipping verification step {verification_name} - already exists in database")
                reconstructed_response = db_service.reconstruct_verification_step_response(existing_step_state)
                step_results[verification_name] = reconstructed_response
                skipped_steps.append(verification_name)
            else:
                # Get verification step configuration for new processing
                step_config: VerificationStep = get_verification_step(verification_name)
                
                # Create task for this verification step
                task = _run_verification_step(
                    step_name=verification_name,
                    step_config=step_config,
                    application_context=application_context,
                    db_service=db_service,
                    requester=user_id,
                )
                verification_tasks.append((verification_name, task))
        
        # Execute all verification tasks in parallel
        if verification_tasks:
            logger.info(f"Running {len(verification_tasks)} verification steps in parallel (skipped {len(skipped_steps)} existing steps)")
            
            # Run tasks concurrently
            task_results: List[VerificationStepResponse] = await asyncio.gather(
                *[task for _, task in verification_tasks],
                return_exceptions=True
            )
            
            # Process results for newly executed tasks
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
                
                # Log the step state using the database service (only for newly processed steps)
                await db_service.log_step_state(
                    application_id=application_id,
                    step_key=step_name,
                    decision=step_results[step_name].decision.value,
                    decided_by=UserAgent.VERA_AI.value,
                )
        else:
            logger.info(f"All {len(requested_verifications)} verification steps were skipped - already exist in database")
        
        # Record Audit Trail for application status completion
        all_successful = all(
            result.metadata.status == VerificationStepMetadataEnum.COMPLETE
            for result in step_results.values()
        )
        
        # Set application status to READY_FOR_REVIEW when processing is complete
        completion_status = "completed successfully" if all_successful else "completed with some failures"
        await db_service.set_application_ready_for_review(
            application_id=application_id,
            actor_id=user_id,
            notes=f"Verification job {completion_status}. Processed {len(verification_tasks)} new steps, skipped {len(skipped_steps)} existing steps"
        )
        
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
                "failed": sum(1 for r in step_results.values() if r.metadata.status == VerificationStepMetadataEnum.FAILED),
                "skipped_existing": len(skipped_steps),
                "newly_processed": len(verification_tasks),
                "skipped_steps": skipped_steps
            }
        }

async def _run_verification_step(
    step_name: str,
    step_config: VerificationStep,
    application_context: ApplicationContext,
    db_service: DatabaseService,  # DatabaseService type
    requester: str,
) -> VerificationStepResponse:
    """
    Run a single verification step
    
    Args:
        step_name: Name of the verification step
        step_config: Configuration for the verification step
        application_context: Context about the application
        db_service: Database service for all database operations
        requester: User ID of the requester
    Returns:
        VerificationStepResponse containing the verification result
    """
    try:
        logger.info(f"Starting verification step: {step_name}")
        
        # Every step will typically have its input in ApplicationContext
        # Special cases will have their own input models that subclass VerificationStepRequest
        # SPECIAL CASES HERE; otherwise, follow general pattern
        
        # Create the request with the database service
        verification_request = step_config.request_schema(
            application_context=application_context,
            requester=requester,
            db_service=db_service,
        )
        
        # Call the verification function  
        result = await step_config.processing_function(verification_request)
        
        return result
            
    except Exception as e:
        logger.error(f"Error in verification step {step_name}: {e}")
        return VerificationStepResponse.from_exception(e)