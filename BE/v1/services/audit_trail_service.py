import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from supabase import Client

from v1.models.database import AuditTrailEntry, AuditTrailData, AuditTrailStatus, AuditTrailStepName
from v1.services.database import get_supabase_client
from v1.exceptions.api import ExternalServiceException

logger = logging.getLogger(__name__)

class AuditTrailService:
    """Service for managing audit trail entries"""
    
    def __init__(self):
        self.db: Client = get_supabase_client()
    
    async def start_step(
        self,
        application_id: int,
        step_name: str,
        step_type: str,
        reasoning: Optional[str] = None,
        request_data: Optional[Dict[str, Any]] = None,
        processed_by: Optional[str] = None,
        agent_id: Optional[str] = None,
        priority: Optional[str] = "medium",
        estimated_duration_ms: Optional[int] = None,
        depends_on_steps: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        **additional_data
    ) -> AuditTrailEntry:
        """
        Start a new audit trail step
        
        Args:
            application_id: Application ID
            step_name: Name of the verification step
            step_type: Type of verification step
            reasoning: Optional reasoning for starting this step
            request_data: Input data for the verification
            processed_by: Who/what is processing this step
            agent_id: Unique identifier for the processing agent
            priority: Priority level (low, medium, high, critical)
            estimated_duration_ms: Estimated processing duration
            depends_on_steps: List of step names this step depends on
            tags: Tags for categorization
            **additional_data: Additional step-specific data
            
        Returns:
            AuditTrailEntry object
        """
        try:
            # Create audit trail data
            audit_data = AuditTrailData(
                step_type=step_type,
                reasoning=reasoning,
                request_data=request_data,
                processed_by=processed_by or "system",
                agent_id=agent_id,
                priority=priority,
                estimated_duration_ms=estimated_duration_ms,
                depends_on_steps=depends_on_steps,
                tags=tags,
                step_specific_data=additional_data if additional_data else None
            )
            
            # Insert into database
            response = (
                self.db.schema("vera").table("audit_trail")
                .insert({
                    "application_id": application_id,
                    "step_name": step_name,
                    "status": AuditTrailStatus.IN_PROGRESS.value,
                    "data": audit_data.dict(exclude_none=True),
                    "started_at": datetime.utcnow().isoformat()
                })
                .execute()
            )
            
            if not response.data:
                raise ExternalServiceException(
                    detail="Failed to create audit trail entry",
                    service_name="Audit Trail"
                )
            
            # Return the created entry
            entry_data = response.data[0]
            return AuditTrailEntry(
                application_id=entry_data["application_id"],
                step_name=entry_data["step_name"],
                status=AuditTrailStatus(entry_data["status"]),
                data=AuditTrailData(**entry_data["data"]),
                started_at=datetime.fromisoformat(entry_data["started_at"].replace('Z', '+00:00')),
                finished_at=None
            )
            
        except Exception as e:
            logger.error(f"Error starting audit trail step {step_name} for application {application_id}: {e}")
            raise ExternalServiceException(
                detail=f"Failed to start audit trail step: {str(e)}",
                service_name="Audit Trail"
            )
    
    async def complete_step(
        self,
        application_id: int,
        step_name: str,
        status: AuditTrailStatus,
        reasoning: Optional[str] = None,
        response_data: Optional[Dict[str, Any]] = None,
        verification_result: Optional[str] = None,
        match_found: Optional[bool] = None,
        confidence_score: Optional[float] = None,
        external_service: Optional[str] = None,
        external_service_response_time_ms: Optional[int] = None,
        external_service_status: Optional[str] = None,
        data_quality_score: Optional[float] = None,
        validation_errors: Optional[List[str]] = None,
        risk_flags: Optional[List[str]] = None,
        risk_score: Optional[float] = None,
        requires_manual_review: Optional[bool] = None,
        processing_method: Optional[str] = None,
        processing_duration_ms: Optional[int] = None,
        retry_count: Optional[int] = None,
        compliance_checks: Optional[List[str]] = None,
        audit_notes: Optional[str] = None,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None,
        error_stack_trace: Optional[str] = None,
        **additional_data
    ) -> AuditTrailEntry:
        """
        Complete an audit trail step with results
        
        Args:
            application_id: Application ID
            step_name: Name of the verification step
            status: Final status of the step
            reasoning: Reasoning for the completion/decision
            response_data: Response data from the verification
            verification_result: Overall result (verified, not_verified, partial, error)
            match_found: Whether a match was found
            confidence_score: Confidence score (0-100)
            external_service: Name of external service used
            external_service_response_time_ms: External service response time
            external_service_status: External service response status
            data_quality_score: Data quality score (0-100)
            validation_errors: List of validation errors
            risk_flags: List of risk flags identified
            risk_score: Risk score (0-100)
            requires_manual_review: Whether manual review is required
            processing_method: Method used (database, external_api, ai_generated)
            processing_duration_ms: Total processing time
            retry_count: Number of retries attempted
            compliance_checks: List of compliance checks performed
            audit_notes: Additional audit notes
            error_code: Error code if step failed
            error_message: Detailed error message
            error_stack_trace: Stack trace for debugging
            **additional_data: Additional step-specific data
            
        Returns:
            Updated AuditTrailEntry object
        """
        try:
            # Get the current entry to merge data
            current_response = (
                self.db.schema("vera").table("audit_trail")
                .select("*")
                .eq("application_id", application_id)
                .eq("step_name", step_name)
                .order("started_at", desc=True)
                .limit(1)
                .execute()
            )
            
            if not current_response.data:
                raise ExternalServiceException(
                    detail=f"Audit trail entry not found for step {step_name}",
                    service_name="Audit Trail"
                )
            
            current_entry = current_response.data[0]
            current_data = current_entry["data"]
            
            # Update the data with completion information
            updated_data = {
                **current_data,
                "reasoning": reasoning or current_data.get("reasoning"),
                "response_data": response_data,
                "verification_result": verification_result,
                "match_found": match_found,
                "confidence_score": confidence_score,
                "external_service": external_service,
                "external_service_response_time_ms": external_service_response_time_ms,
                "external_service_status": external_service_status,
                "data_quality_score": data_quality_score,
                "validation_errors": validation_errors,
                "risk_flags": risk_flags,
                "risk_score": risk_score,
                "requires_manual_review": requires_manual_review,
                "processing_method": processing_method,
                "processing_duration_ms": processing_duration_ms,
                "retry_count": retry_count,
                "compliance_checks": compliance_checks,
                "audit_notes": audit_notes,
                "error_code": error_code,
                "error_message": error_message,
                "error_stack_trace": error_stack_trace,
            }
            
            # Add any additional step-specific data
            if additional_data:
                step_specific = updated_data.get("step_specific_data", {}) or {}
                step_specific.update(additional_data)
                updated_data["step_specific_data"] = step_specific
            
            # Remove None values
            updated_data = {k: v for k, v in updated_data.items() if v is not None}
            
            # Update the database entry
            response = (
                self.db.schema("vera").table("audit_trail")
                .update({
                    "status": status.value,
                    "data": updated_data,
                    "finished_at": datetime.utcnow().isoformat()
                })
                .eq("application_id", application_id)
                .eq("step_name", step_name)
                .eq("started_at", current_entry["started_at"])
                .execute()
            )
            
            if not response.data:
                raise ExternalServiceException(
                    detail="Failed to update audit trail entry",
                    service_name="Audit Trail"
                )
            
            # Return the updated entry
            entry_data = response.data[0]
            return AuditTrailEntry(
                application_id=entry_data["application_id"],
                step_name=entry_data["step_name"],
                status=AuditTrailStatus(entry_data["status"]),
                data=AuditTrailData(**entry_data["data"]),
                started_at=datetime.fromisoformat(entry_data["started_at"].replace('Z', '+00:00')),
                finished_at=datetime.fromisoformat(entry_data["finished_at"].replace('Z', '+00:00')) if entry_data["finished_at"] else None
            )
            
        except Exception as e:
            logger.error(f"Error completing audit trail step {step_name} for application {application_id}: {e}")
            raise ExternalServiceException(
                detail=f"Failed to complete audit trail step: {str(e)}",
                service_name="Audit Trail"
            )
    
    async def get_application_audit_trail(
        self,
        application_id: int,
        step_name: Optional[str] = None,
        status: Optional[AuditTrailStatus] = None
    ) -> List[AuditTrailEntry]:
        """
        Get audit trail entries for an application
        
        Args:
            application_id: Application ID
            step_name: Optional filter by step name
            status: Optional filter by status
            
        Returns:
            List of AuditTrailEntry objects
        """
        try:
            query = (
                self.db.schema("vera").table("audit_trail")
                .select("*")
                .eq("application_id", application_id)
                .order("started_at", desc=False)
            )
            
            if step_name:
                query = query.eq("step_name", step_name)
            
            if status:
                query = query.eq("status", status.value)
            
            response = query.execute()
            
            entries = []
            for entry_data in response.data:
                entries.append(AuditTrailEntry(
                    application_id=entry_data["application_id"],
                    step_name=entry_data["step_name"],
                    status=AuditTrailStatus(entry_data["status"]),
                    data=AuditTrailData(**entry_data["data"]),
                    started_at=datetime.fromisoformat(entry_data["started_at"].replace('Z', '+00:00')),
                    finished_at=datetime.fromisoformat(entry_data["finished_at"].replace('Z', '+00:00')) if entry_data["finished_at"] else None
                ))
            
            return entries
            
        except Exception as e:
            logger.error(f"Error getting audit trail for application {application_id}: {e}")
            raise ExternalServiceException(
                detail=f"Failed to get audit trail: {str(e)}",
                service_name="Audit Trail"
            )
    
    async def get_step_status(
        self,
        application_id: int,
        step_name: str
    ) -> Optional[AuditTrailEntry]:
        """
        Get the latest status of a specific step
        
        Args:
            application_id: Application ID
            step_name: Name of the verification step
            
        Returns:
            Latest AuditTrailEntry for the step or None if not found
        """
        try:
            response = (
                self.db.schema("vera").table("audit_trail")
                .select("*")
                .eq("application_id", application_id)
                .eq("step_name", step_name)
                .order("started_at", desc=True)
                .limit(1)
                .execute()
            )
            
            if not response.data:
                return None
            
            entry_data = response.data[0]
            return AuditTrailEntry(
                application_id=entry_data["application_id"],
                step_name=entry_data["step_name"],
                status=AuditTrailStatus(entry_data["status"]),
                data=AuditTrailData(**entry_data["data"]),
                started_at=datetime.fromisoformat(entry_data["started_at"].replace('Z', '+00:00')),
                finished_at=datetime.fromisoformat(entry_data["finished_at"].replace('Z', '+00:00')) if entry_data["finished_at"] else None
            )
            
        except Exception as e:
            logger.error(f"Error getting step status for {step_name} in application {application_id}: {e}")
            return None
    
    async def update_step_data(
        self,
        application_id: int,
        step_name: str,
        **update_data
    ) -> Optional[AuditTrailEntry]:
        """
        Update specific fields in a step's data
        
        Args:
            application_id: Application ID
            step_name: Name of the verification step
            **update_data: Fields to update in the step data
            
        Returns:
            Updated AuditTrailEntry or None if not found
        """
        try:
            # Get current entry
            current_response = (
                self.db.schema("vera").table("audit_trail")
                .select("*")
                .eq("application_id", application_id)
                .eq("step_name", step_name)
                .order("started_at", desc=True)
                .limit(1)
                .execute()
            )
            
            if not current_response.data:
                return None
            
            current_entry = current_response.data[0]
            current_data = current_entry["data"]
            
            # Merge update data
            updated_data = {**current_data}
            for key, value in update_data.items():
                if value is not None:
                    updated_data[key] = value
            
            # Update in database
            response = (
                self.db.schema("vera").table("audit_trail")
                .update({"data": updated_data})
                .eq("application_id", application_id)
                .eq("step_name", step_name)
                .eq("started_at", current_entry["started_at"])
                .execute()
            )
            
            if not response.data:
                return None
            
            # Return updated entry
            entry_data = response.data[0]
            return AuditTrailEntry(
                application_id=entry_data["application_id"],
                step_name=entry_data["step_name"],
                status=AuditTrailStatus(entry_data["status"]),
                data=AuditTrailData(**entry_data["data"]),
                started_at=datetime.fromisoformat(entry_data["started_at"].replace('Z', '+00:00')),
                finished_at=datetime.fromisoformat(entry_data["finished_at"].replace('Z', '+00:00')) if entry_data["finished_at"] else None
            )
            
        except Exception as e:
            logger.error(f"Error updating step data for {step_name} in application {application_id}: {e}")
            return None

# Global service instance
audit_trail_service = AuditTrailService() 