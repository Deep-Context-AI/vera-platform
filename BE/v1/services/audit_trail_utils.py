"""
Audit Trail Utility Functions

This module provides simple helper functions for tracking verification steps
in the audit trail. These can be easily integrated into existing verification services.
"""

import logging
import time
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime
from functools import wraps

from v1.services.audit_trail_service import audit_trail_service
from v1.models.database import AuditTrailStatus

logger = logging.getLogger(__name__)

class VerificationSteps:
    """Predefined verification step names and types"""
    
    # Step names (matching AuditTrailStepName enum)
    NPI_VERIFICATION = "npi_verification"
    DEA_VERIFICATION = "dea_verification"
    ABMS_CERTIFICATION = "abms_certification"
    DCA_LICENSE = "dca_license"
    MEDICARE_ENROLLMENT = "medicare_enrollment"
    NPDB_CHECK = "npdb_check"
    SANCTIONS_CHECK = "sanctions_check"
    LADMF_CHECK = "ladmf_check"
    MEDICAL_VERIFICATION = "medical_verification"
    EDUCATION_VERIFICATION = "education_verification"
    HOSPITAL_PRIVILEGES = "hospital_privileges"
    FINAL_REVIEW = "final_review"
    APPLICATION_SUBMITTED = "application_submitted"
    APPLICATION_APPROVED = "application_approved"
    APPLICATION_REJECTED = "application_rejected"
    
    # Step types (for categorization)
    TYPES = {
        NPI_VERIFICATION: "external_database_lookup",
        DEA_VERIFICATION: "external_database_lookup", 
        ABMS_CERTIFICATION: "external_database_lookup",
        DCA_LICENSE: "external_database_lookup",
        MEDICARE_ENROLLMENT: "external_database_lookup",
        NPDB_CHECK: "external_database_lookup",
        SANCTIONS_CHECK: "external_database_lookup",
        LADMF_CHECK: "external_database_lookup",
        MEDICAL_VERIFICATION: "external_database_lookup",
        EDUCATION_VERIFICATION: "ai_generated_verification",
        HOSPITAL_PRIVILEGES: "ai_generated_verification",
        FINAL_REVIEW: "manual_review",
        APPLICATION_SUBMITTED: "workflow_step",
        APPLICATION_APPROVED: "workflow_step",
        APPLICATION_REJECTED: "workflow_step"
    }
    
    @classmethod
    def get_step_type(cls, step_name: str) -> str:
        """Get the step type for a given step name"""
        return cls.TYPES.get(step_name, "unknown")

# Convenience functions for common verification patterns
async def log_verification_started(
    application_id: int,
    step_name: str,
    reasoning: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = None,
    processed_by: Optional[str] = None,
    agent_id: Optional[str] = None,
    **kwargs
) -> None:
    """Log that a verification step has started"""
    try:
        step_type = VerificationSteps.get_step_type(step_name)
        await audit_trail_service.log_step_started(
            application_id=application_id,
            step_name=step_name,
            step_type=step_type,
            reasoning=reasoning,
            request_data=request_data,
            processed_by=processed_by,
            agent_id=agent_id,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to log verification start for {step_name}: {e}")

async def log_verification_completed(
    application_id: int,
    step_name: str,
    verification_result: str,
    reasoning: Optional[str] = None,
    response_data: Optional[Dict[str, Any]] = None,
    match_found: Optional[bool] = None,
    confidence_score: Optional[float] = None,
    **kwargs
) -> None:
    """Log that a verification step has completed successfully"""
    try:
        step_type = VerificationSteps.get_step_type(step_name)
        await audit_trail_service.log_step_completed(
            application_id=application_id,
            step_name=step_name,
            step_type=step_type,
            verification_result=verification_result,
            reasoning=reasoning,
            response_data=response_data,
            match_found=match_found,
            confidence_score=confidence_score,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to log verification completion for {step_name}: {e}")

async def log_verification_failed(
    application_id: int,
    step_name: str,
    error_code: str,
    error_message: str,
    reasoning: Optional[str] = None,
    error_stack_trace: Optional[str] = None,
    **kwargs
) -> None:
    """Log that a verification step has failed"""
    try:
        step_type = VerificationSteps.get_step_type(step_name)
        await audit_trail_service.log_step_failed(
            application_id=application_id,
            step_name=step_name,
            step_type=step_type,
            error_code=error_code,
            error_message=error_message,
            reasoning=reasoning,
            error_stack_trace=error_stack_trace,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to log verification failure for {step_name}: {e}")

async def log_verification_updated(
    application_id: int,
    step_name: str,
    reasoning: Optional[str] = None,
    **kwargs
) -> None:
    """Log an update to a verification step"""
    try:
        step_type = VerificationSteps.get_step_type(step_name)
        await audit_trail_service.log_step_updated(
            application_id=application_id,
            step_name=step_name,
            step_type=step_type,
            reasoning=reasoning,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to log verification update for {step_name}: {e}")

async def log_verification_requires_review(
    application_id: int,
    step_name: str,
    reasoning: str,
    risk_flags: Optional[List[str]] = None,
    risk_score: Optional[float] = None,
    **kwargs
) -> None:
    """Log that a verification step requires manual review"""
    try:
        step_type = VerificationSteps.get_step_type(step_name)
        await audit_trail_service.log_step_requires_review(
            application_id=application_id,
            step_name=step_name,
            step_type=step_type,
            reasoning=reasoning,
            risk_flags=risk_flags,
            risk_score=risk_score,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to log verification review requirement for {step_name}: {e}")

# Wrapper function for automatic tracking
async def track_verification_step(
    application_id: int,
    step_name: str,
    verification_func: Callable,
    *args,
    processed_by: Optional[str] = None,
    agent_id: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Wrapper function to automatically track a verification step
    
    Args:
        application_id: Application ID
        step_name: Name of the verification step
        verification_func: Function to execute for verification
        *args: Arguments to pass to verification_func
        processed_by: Who/what is processing this step
        agent_id: Unique identifier for the processing agent
        **kwargs: Additional keyword arguments
        
    Returns:
        Result of verification_func
    """
    start_time = datetime.utcnow()
    
    # Log step started
    await log_verification_started(
        application_id=application_id,
        step_name=step_name,
        reasoning=f"Starting {step_name} verification",
        processed_by=processed_by,
        agent_id=agent_id,
        estimated_duration_ms=kwargs.get('estimated_duration_ms')
    )
    
    try:
        # Execute the verification function
        result = await verification_func(*args, **kwargs)
        
        # Calculate processing duration
        end_time = datetime.utcnow()
        processing_duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Determine verification result
        if hasattr(result, 'status') and result.status == 'success':
            verification_result = "verified"
        elif hasattr(result, 'verification_result'):
            verification_result = result.verification_result
        else:
            verification_result = "completed"
        
        # Log step completed
        await log_verification_completed(
            application_id=application_id,
            step_name=step_name,
            verification_result=verification_result,
            reasoning=f"Completed {step_name} verification successfully",
            response_data=result.__dict__ if hasattr(result, '__dict__') else {"result": str(result)},
            processing_duration_ms=processing_duration_ms,
            processed_by=processed_by,
            agent_id=agent_id
        )
        
        return result
        
    except Exception as e:
        # Calculate processing duration
        end_time = datetime.utcnow()
        processing_duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log step failed
        await log_verification_failed(
            application_id=application_id,
            step_name=step_name,
            error_code=type(e).__name__,
            error_message=str(e),
            reasoning=f"Failed {step_name} verification due to error",
            processing_duration_ms=processing_duration_ms,
            processed_by=processed_by,
            agent_id=agent_id
        )
        
        # Re-raise the exception
        raise

# Decorator for automatic tracking
def audit_trail_tracked(
    step_name: str,
    application_id_param: str = "application_id",
    processed_by: Optional[str] = None,
    agent_id: Optional[str] = None
):
    """
    Decorator to automatically track verification steps
    
    Args:
        step_name: Name of the verification step
        application_id_param: Name of the parameter that contains the application ID
        processed_by: Who/what is processing this step
        agent_id: Unique identifier for the processing agent
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract application_id from function parameters
            application_id = None
            
            # Try to get from kwargs first
            if application_id_param in kwargs:
                application_id = kwargs[application_id_param]
            else:
                # Try to get from function signature
                import inspect
                sig = inspect.signature(func)
                param_names = list(sig.parameters.keys())
                if application_id_param in param_names:
                    param_index = param_names.index(application_id_param)
                    if param_index < len(args):
                        application_id = args[param_index]
            
            if application_id is None:
                logger.warning(f"Could not find application_id parameter for audit tracking in {func.__name__}")
                return await func(*args, **kwargs)
            
            # Use the track_verification_step wrapper
            return await track_verification_step(
                application_id=application_id,
                step_name=step_name,
                verification_func=func,
                *args,
                processed_by=processed_by,
                agent_id=agent_id,
                **kwargs
            )
        
        return wrapper
    return decorator

# Helper functions for common patterns
async def record_external_service_call(
    application_id: int,
    step_name: str,
    service_name: str,
    request_data: Dict[str, Any],
    response_data: Dict[str, Any],
    response_time_ms: int,
    success: bool,
    **kwargs
) -> None:
    """Record an external service call as part of verification"""
    try:
        step_type = VerificationSteps.get_step_type(step_name)
        
        if success:
            await audit_trail_service.record_change(
                application_id=application_id,
                step_name=step_name,
                status=AuditTrailStatus.COMPLETED,
                change_type="external_service_call",
                step_type=step_type,
                reasoning=f"Successfully called {service_name}",
                request_data=request_data,
                response_data=response_data,
                external_service=service_name,
                external_service_response_time_ms=response_time_ms,
                external_service_status="success",
                processing_method="external_api",
                **kwargs
            )
        else:
            await audit_trail_service.record_change(
                application_id=application_id,
                step_name=step_name,
                status=AuditTrailStatus.FAILED,
                change_type="external_service_call",
                step_type=step_type,
                reasoning=f"Failed to call {service_name}",
                request_data=request_data,
                response_data=response_data,
                external_service=service_name,
                external_service_response_time_ms=response_time_ms,
                external_service_status="failed",
                processing_method="external_api",
                **kwargs
            )
    except Exception as e:
        logger.error(f"Failed to record external service call for {step_name}: {e}")

async def record_ai_generation(
    application_id: int,
    step_name: str,
    prompt_data: Dict[str, Any],
    generated_content: Dict[str, Any],
    model_info: Dict[str, Any],
    processing_time_ms: int,
    **kwargs
) -> None:
    """Record AI content generation as part of verification"""
    try:
        step_type = VerificationSteps.get_step_type(step_name)
        
        await audit_trail_service.record_change(
            application_id=application_id,
            step_name=step_name,
            status=AuditTrailStatus.COMPLETED,
            change_type="ai_generation",
            step_type=step_type,
            reasoning=f"Generated content using AI for {step_name}",
            request_data=prompt_data,
            response_data=generated_content,
            processing_method="ai_generated",
            processing_duration_ms=processing_time_ms,
            agent_id=model_info.get("model_name"),
            agent_version=model_info.get("model_version"),
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to record AI generation for {step_name}: {e}")

async def record_manual_review(
    application_id: int,
    step_name: str,
    reviewer_id: str,
    review_decision: str,
    review_notes: str,
    **kwargs
) -> None:
    """Record manual review as part of verification"""
    try:
        step_type = VerificationSteps.get_step_type(step_name)
        
        status = AuditTrailStatus.COMPLETED if review_decision in ["approved", "verified"] else AuditTrailStatus.FAILED
        
        await audit_trail_service.record_change(
            application_id=application_id,
            step_name=step_name,
            status=status,
            change_type="manual_review",
            step_type=step_type,
            reasoning=f"Manual review completed by {reviewer_id}",
            response_data={"review_decision": review_decision, "review_notes": review_notes},
            verification_result=review_decision,
            processing_method="manual",
            processed_by=reviewer_id,
            audit_notes=review_notes,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to record manual review for {step_name}: {e}")

# Workflow helpers
async def start_application_workflow(
    application_id: int,
    initiated_by: str,
    **kwargs
) -> None:
    """Start the application verification workflow"""
    await log_verification_started(
        application_id=application_id,
        step_name=VerificationSteps.APPLICATION_SUBMITTED,
        reasoning="Application submitted for verification",
        processed_by=initiated_by,
        **kwargs
    )

async def complete_application_workflow(
    application_id: int,
    decision: str,  # "approved" or "rejected"
    decision_reason: str,
    decided_by: str,
    **kwargs
) -> None:
    """Complete the application verification workflow"""
    step_name = VerificationSteps.APPLICATION_APPROVED if decision == "approved" else VerificationSteps.APPLICATION_REJECTED
    
    await log_verification_completed(
        application_id=application_id,
        step_name=step_name,
        verification_result=decision,
        reasoning=decision_reason,
        response_data={"decision": decision, "reason": decision_reason},
        processed_by=decided_by,
        **kwargs
    )

# Example usage functions for common verification patterns
async def track_npi_verification(application_id: int, npi_request, npi_service_func):
    """Track NPI verification step"""
    return await track_verification_step(
        application_id=application_id,
        step_name=VerificationSteps.NPI_VERIFICATION,
        step_type=VerificationSteps.EXTERNAL_API,
        func=npi_service_func,
        reasoning="Verifying National Provider Identifier",
        request_data=npi_request.dict() if hasattr(npi_request, 'dict') else str(npi_request),
        processed_by="npi_service",
        request=npi_request
    )

async def track_dea_verification(application_id: int, dea_request, dea_service_func):
    """Track DEA verification step"""
    return await track_verification_step(
        application_id=application_id,
        step_name=VerificationSteps.DEA_VERIFICATION,
        step_type=VerificationSteps.DATABASE_LOOKUP,
        func=dea_service_func,
        reasoning="Verifying DEA registration",
        request_data=dea_request.dict() if hasattr(dea_request, 'dict') else str(dea_request),
        processed_by="dea_service",
        request=dea_request
    )

async def track_education_verification(application_id: int, education_request, education_service_func):
    """Track Education verification step"""
    return await track_verification_step(
        application_id=application_id,
        step_name=VerificationSteps.EDUCATION_VERIFICATION,
        step_type=VerificationSteps.AI_GENERATED,
        func=education_service_func,
        reasoning="Verifying educational credentials with AI-generated response",
        request_data=education_request.dict() if hasattr(education_request, 'dict') else str(education_request),
        processed_by="education_service",
        request=education_request
    ) 