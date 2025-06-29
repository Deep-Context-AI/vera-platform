"""
Audit Trail Utility Functions

This module provides simple helper functions for tracking verification steps
in the audit trail. These can be easily integrated into existing verification services.
"""

import logging
import time
from typing import Optional, Dict, Any, List
from datetime import datetime
from functools import wraps

from v1.services.audit_trail_service import audit_trail_service
from v1.models.database import AuditTrailStatus

logger = logging.getLogger(__name__)

async def track_verification_step(
    application_id: int,
    step_name: str,
    step_type: str,
    func,
    *args,
    reasoning: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = None,
    processed_by: Optional[str] = "system",
    **kwargs
):
    """
    Track a verification step with automatic start/complete handling
    
    Args:
        application_id: Application ID
        step_name: Name of the verification step
        step_type: Type of verification step
        func: Function to execute for the verification
        *args: Arguments to pass to the function
        reasoning: Reasoning for the verification
        request_data: Input data for the verification
        processed_by: Who/what is processing this step
        **kwargs: Additional keyword arguments for the function
        
    Returns:
        Result of the function execution
    """
    start_time = time.time()
    
    try:
        # Start the audit trail step
        await audit_trail_service.start_step(
            application_id=application_id,
            step_name=step_name,
            step_type=step_type,
            reasoning=reasoning,
            request_data=request_data,
            processed_by=processed_by
        )
        
        # Execute the verification function
        result = await func(*args, **kwargs) if callable(func) else func
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Determine verification result and other metrics
        verification_result = "completed"
        match_found = None
        confidence_score = None
        external_service = None
        
        # Try to extract information from the result if it's a response object
        if hasattr(result, 'status'):
            verification_result = "verified" if result.status == "success" else "error"
            
        if hasattr(result, 'message'):
            reasoning = f"{reasoning or ''} - {result.message}".strip(' -')
        
        # Complete the audit trail step
        await audit_trail_service.complete_step(
            application_id=application_id,
            step_name=step_name,
            status=AuditTrailStatus.COMPLETED,
            reasoning=reasoning,
            response_data=result.dict() if hasattr(result, 'dict') else str(result),
            verification_result=verification_result,
            match_found=match_found,
            processing_duration_ms=processing_time_ms,
            processing_method="external_api" if "external" in step_type.lower() else "database"
        )
        
        return result
        
    except Exception as e:
        # Calculate processing time even for errors
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Complete the audit trail step with error
        await audit_trail_service.complete_step(
            application_id=application_id,
            step_name=step_name,
            status=AuditTrailStatus.FAILED,
            reasoning=f"{reasoning or ''} - Error: {str(e)}".strip(' -'),
            verification_result="error",
            processing_duration_ms=processing_time_ms,
            error_message=str(e),
            error_code=type(e).__name__
        )
        
        # Re-raise the exception
        raise

def audit_trail_tracked(
    step_name: str,
    step_type: str,
    application_id_param: str = "application_id",
    reasoning: Optional[str] = None,
    processed_by: Optional[str] = "system"
):
    """
    Decorator to automatically track verification steps in audit trail
    
    Args:
        step_name: Name of the verification step
        step_type: Type of verification step
        application_id_param: Name of the parameter containing application_id
        reasoning: Reasoning for the verification
        processed_by: Who/what is processing this step
        
    Example:
        @audit_trail_tracked("npi_verification", "external_api")
        async def verify_npi(application_id: int, npi_request: NPIRequest):
            # Your verification logic here
            return npi_response
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract application_id from function parameters
            application_id = None
            
            # Try to get application_id from kwargs first
            if application_id_param in kwargs:
                application_id = kwargs[application_id_param]
            else:
                # Try to get from function signature inspection
                import inspect
                sig = inspect.signature(func)
                param_names = list(sig.parameters.keys())
                
                if application_id_param in param_names:
                    param_index = param_names.index(application_id_param)
                    if param_index < len(args):
                        application_id = args[param_index]
            
            if application_id is None:
                logger.warning(f"Could not find application_id parameter for audit trail tracking in {func.__name__}")
                # Execute without tracking if we can't find application_id
                return await func(*args, **kwargs)
            
            # Extract request data for audit trail
            request_data = {}
            if args:
                request_data["args"] = [str(arg) for arg in args]
            if kwargs:
                request_data["kwargs"] = {k: str(v) for k, v in kwargs.items()}
            
            return await track_verification_step(
                application_id=application_id,
                step_name=step_name,
                step_type=step_type,
                func=func,
                *args,
                reasoning=reasoning,
                request_data=request_data,
                processed_by=processed_by,
                **kwargs
            )
        
        return wrapper
    return decorator

async def log_verification_start(
    application_id: int,
    step_name: str,
    step_type: str,
    reasoning: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = None,
    **additional_data
):
    """
    Simple function to log the start of a verification step
    
    Args:
        application_id: Application ID
        step_name: Name of the verification step
        step_type: Type of verification step
        reasoning: Reasoning for starting this step
        request_data: Input data for the verification
        **additional_data: Additional step-specific data
    """
    try:
        await audit_trail_service.start_step(
            application_id=application_id,
            step_name=step_name,
            step_type=step_type,
            reasoning=reasoning,
            request_data=request_data,
            **additional_data
        )
    except Exception as e:
        logger.error(f"Failed to log verification start for {step_name}: {e}")

async def log_verification_complete(
    application_id: int,
    step_name: str,
    status: str = "completed",
    reasoning: Optional[str] = None,
    response_data: Optional[Dict[str, Any]] = None,
    verification_result: Optional[str] = None,
    processing_duration_ms: Optional[int] = None,
    **additional_data
):
    """
    Simple function to log the completion of a verification step
    
    Args:
        application_id: Application ID
        step_name: Name of the verification step
        status: Final status of the step
        reasoning: Reasoning for the completion
        response_data: Response data from the verification
        verification_result: Overall result (verified, not_verified, partial, error)
        processing_duration_ms: Total processing time
        **additional_data: Additional step-specific data
    """
    try:
        await audit_trail_service.complete_step(
            application_id=application_id,
            step_name=step_name,
            status=AuditTrailStatus(status),
            reasoning=reasoning,
            response_data=response_data,
            verification_result=verification_result,
            processing_duration_ms=processing_duration_ms,
            **additional_data
        )
    except Exception as e:
        logger.error(f"Failed to log verification completion for {step_name}: {e}")

async def log_verification_error(
    application_id: int,
    step_name: str,
    error: Exception,
    reasoning: Optional[str] = None,
    processing_duration_ms: Optional[int] = None,
    **additional_data
):
    """
    Simple function to log a verification step error
    
    Args:
        application_id: Application ID
        step_name: Name of the verification step
        error: Exception that occurred
        reasoning: Reasoning for the error
        processing_duration_ms: Total processing time before error
        **additional_data: Additional step-specific data
    """
    try:
        await audit_trail_service.complete_step(
            application_id=application_id,
            step_name=step_name,
            status=AuditTrailStatus.FAILED,
            reasoning=f"{reasoning or ''} - Error: {str(error)}".strip(' -'),
            verification_result="error",
            processing_duration_ms=processing_duration_ms,
            error_message=str(error),
            error_code=type(error).__name__,
            **additional_data
        )
    except Exception as e:
        logger.error(f"Failed to log verification error for {step_name}: {e}")

# Pre-defined step types for common verification steps
class VerificationSteps:
    """Pre-defined verification step names and types"""
    
    # Step names
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
    
    # Step types
    EXTERNAL_API = "external_api"
    DATABASE_LOOKUP = "database_lookup"
    AI_GENERATED = "ai_generated"
    MANUAL_REVIEW = "manual_review"
    COMPLIANCE_CHECK = "compliance_check"

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