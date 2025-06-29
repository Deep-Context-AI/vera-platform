import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from supabase import Client

from v1.models.database import AuditTrailEntry, AuditTrailStatus
from v1.services.database import get_supabase_client
from v1.exceptions.api import ExternalServiceException

logger = logging.getLogger(__name__)

class AuditTrailService:
    """Simplified service for managing audit trail entries"""
    
    def __init__(self):
        self.db: Client = get_supabase_client()
    
    async def record_change(
        self,
        application_id: int,
        step_key: str,
        status: AuditTrailStatus,
        data: Dict[str, Any],
        changed_by: str,
        notes: Optional[str] = None
    ) -> AuditTrailEntry:
        """
        Record a state change in the audit trail
        
        Args:
            application_id: Application ID
            step_key: Step-unique-key per external service (e.g., 'dea', 'npi', 'abms')
            status: Current status of the step
            data: What changed - dynamic dictionary with any keys/values
            changed_by: Who made the change (user_id, agent_id, system)
            notes: Optional notes about this change
            
        Returns:
            AuditTrailEntry object
        """
        try:
            # Get the previous status and data for this step
            previous_entry = await self._get_latest_entry(application_id, step_key)
            previous_status = previous_entry.status if previous_entry else None
            previous_data = previous_entry.data if previous_entry else None
            
            # Insert into database
            timestamp = datetime.utcnow()
            response = (
                self.db.schema("vera").table("audit_trail")
                .insert({
                    "application_id": application_id,
                    "step_key": step_key,
                    "status": status.value,
                    "data": data,
                    "notes": notes,
                    "changed_by": changed_by,
                    "timestamp": timestamp.isoformat(),
                    "previous_status": previous_status.value if hasattr(previous_status, 'value') else previous_status,
                    "previous_data": previous_data
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
                step_key=entry_data["step_key"],
                status=entry_data["status"],  # Keep as string, don't convert to enum
                data=entry_data["data"],
                notes=entry_data.get("notes"),
                changed_by=entry_data["changed_by"],
                timestamp=datetime.fromisoformat(entry_data["timestamp"].replace('Z', '+00:00')),
                previous_status=entry_data.get("previous_status"),  # Keep as string
                previous_data=entry_data.get("previous_data")
            )
            
        except Exception as e:
            logger.error(f"Error recording audit trail change for step {step_key} on application {application_id}: {e}")
            raise ExternalServiceException(
                detail=f"Failed to record audit trail change: {str(e)}",
                service_name="Audit Trail"
            )
    
    async def _get_latest_entry(self, application_id: int, step_key: str) -> Optional[AuditTrailEntry]:
        """Get the latest entry for a step"""
        try:
            response = (
                self.db.schema("vera").table("audit_trail")
                .select("*")
                .eq("application_id", application_id)
                .eq("step_key", step_key)
                .order("timestamp", desc=True)
                .limit(1)
                .execute()
            )
            
            if response.data:
                entry_data = response.data[0]
                return AuditTrailEntry(
                    application_id=entry_data["application_id"],
                    step_key=entry_data["step_key"],
                    status=entry_data["status"],  # Keep as string
                    data=entry_data["data"],
                    notes=entry_data.get("notes"),
                    changed_by=entry_data["changed_by"],
                    timestamp=datetime.fromisoformat(entry_data["timestamp"].replace('Z', '+00:00')),
                    previous_status=entry_data.get("previous_status"),  # Keep as string
                    previous_data=entry_data.get("previous_data")
                )
            return None
        except Exception:
            return None

    async def get_application_audit_trail(
        self,
        application_id: int,
        step_key: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[AuditTrailEntry]:
        """
        Get audit trail entries for an application
        
        Args:
            application_id: Application ID
            step_key: Optional filter by step key
            limit: Optional limit on number of entries returned
            
        Returns:
            List of AuditTrailEntry objects ordered by timestamp (newest first)
        """
        try:
            query = (
                self.db.schema("vera").table("audit_trail")
                .select("*")
                .eq("application_id", application_id)
                .order("timestamp", desc=True)
            )
            
            if step_key:
                query = query.eq("step_key", step_key)
            if limit:
                query = query.limit(limit)
            
            response = query.execute()
            
            if not response.data:
                return []
            
            entries = []
            for entry_data in response.data:
                entries.append(AuditTrailEntry(
                    application_id=entry_data["application_id"],
                    step_key=entry_data["step_key"],
                    status=entry_data["status"],  # Keep as string
                    data=entry_data["data"],
                    notes=entry_data.get("notes"),
                    changed_by=entry_data["changed_by"],
                    timestamp=datetime.fromisoformat(entry_data["timestamp"].replace('Z', '+00:00')),
                    previous_status=entry_data.get("previous_status"),  # Keep as string
                    previous_data=entry_data.get("previous_data")
                ))
            
            return entries
            
        except Exception as e:
            logger.error(f"Error getting audit trail for application {application_id}: {e}")
            raise ExternalServiceException(
                detail=f"Failed to get audit trail: {str(e)}",
                service_name="Audit Trail"
            )
    
    async def get_step_history(
        self,
        application_id: int,
        step_key: str
    ) -> List[AuditTrailEntry]:
        """Get the complete history of changes for a specific step"""
        return await self.get_application_audit_trail(
            application_id=application_id,
            step_key=step_key
        )
    
    async def get_latest_step_status(
        self,
        application_id: int,
        step_key: str
    ) -> Optional[AuditTrailEntry]:
        """Get the latest audit trail entry for a specific step"""
        entries = await self.get_application_audit_trail(
            application_id=application_id,
            step_key=step_key,
            limit=1
        )
        return entries[0] if entries else None
    
    async def get_current_step_statuses(
        self,
        application_id: int
    ) -> Dict[str, AuditTrailEntry]:
        """
        Get the current status of all steps for an application
        Returns a dictionary mapping step_key to the latest AuditTrailEntry
        """
        try:
            # Get all entries for the application
            all_entries = await self.get_application_audit_trail(application_id)
            
            # Group by step_key and get the latest entry for each
            latest_by_step = {}
            for entry in all_entries:
                if entry.step_key not in latest_by_step:
                    latest_by_step[entry.step_key] = entry
            
            return latest_by_step
            
        except Exception as e:
            logger.error(f"Error getting current step statuses for application {application_id}: {e}")
            raise ExternalServiceException(
                detail=f"Failed to get current step statuses: {str(e)}",
                service_name="Audit Trail"
            )

# Global service instance
audit_trail_service = AuditTrailService() 