import os
import logging
import json
from typing import Generator, Optional, Union, Dict, Any
from supabase import create_client, Client
from functools import lru_cache
from datetime import datetime
from pydantic import BaseModel

from v1.models.responses import (
    ResponseStatus,
    InboxEmailResponse, InboxListResponse, InboxStatsResponse, EmailActionResponse
)

logger = logging.getLogger(__name__)

def _serialize_for_json(obj: Any) -> Any:
    """
    Recursively serialize objects for JSON storage, converting datetime objects to ISO strings.
    
    Args:
        obj: Object to serialize
        
    Returns:
        JSON-serializable object
    """
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {key: _serialize_for_json(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_serialize_for_json(item) for item in obj]
    elif isinstance(obj, BaseModel):
        return _serialize_for_json(obj.model_dump(exclude_unset=True))
    else:
        return obj

@lru_cache()
def get_supabase_client() -> Client:
    """
    Create and cache a Supabase client instance.
    
    Returns:
        Client: Configured Supabase client
        
    Raises:
        ValueError: If required environment variables are not set
    """
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY")
    
    if not url:
        raise ValueError("SUPABASE_URL environment variable is required")
    if not key:
        raise ValueError("SUPABASE_KEY environment variable is required")
    
    return create_client(url, key)

def get_db() -> Generator[Client, None, None]:
    """
    FastAPI dependency function to get database connection.
    
    This function can be used as a dependency in FastAPI route handlers
    to get access to the Supabase client.
    
    Usage:
        @app.get("/endpoint")
        async def endpoint(db: Client = Depends(get_db)):
            # Use db for database operations
            response = db.table("tablename").select("*").execute()
    
    Yields:
        Client: Supabase client instance
    """
    try:
        db = get_supabase_client()
        yield db
    finally:
        # Supabase client doesn't require explicit cleanup
        # but this structure allows for future cleanup if needed
        pass

class DatabaseService:
    """
    Comprehensive database service layer for all database operations.
    
    This service encapsulates all database interactions including:
    - Audit trail operations (events, step states, invocations)
    - User management
    - Inbox email operations
    - Any other database operations
    
    Benefits:
    - Centralized database logic
    - Easy to test and mock
    - Consistent error handling
    - Single point of database connection management
    """
    
    def __init__(self, client: Optional[Client] = None):
        """
        Initialize the database service.
        
        Args:
            client: Optional Supabase client. If not provided, will create one.
        """
        self.supabase = client or self._get_supabase_client()
    
    def _get_supabase_client(self) -> Client:
        """Initialize Supabase client"""
        try:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            
            if not url or not key:
                raise ValueError("Supabase credentials not found in environment variables")
            
            return create_client(url, key)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise

    # ==========================================
    # AUDIT TRAIL OPERATIONS
    # ==========================================
    
    async def log_event(
        self,
        application_id: int,
        actor_id: str,
        action: str,
        created_at: Optional[datetime] = None,
        source: Optional[str] = None,
        notes: Optional[str] = None,
        prevent_duplicates: bool = False,
    ) -> Dict[str, Any]:
        """
        Log an event to the audit trail.
        
        Args:
            application_id: ID of the application
            actor_id: ID of the actor performing the action
            action: Description of the action
            created_at: When the event occurred (defaults to now)
            source: Source system or component
            notes: Additional notes
            prevent_duplicates: Whether to prevent duplicates
            
        Returns:
            Dict containing the created audit trail record
            
        Raises:
            Exception: If logging fails
        """
        try:
            # Check for existing duplicate if prevention is enabled
            if prevent_duplicates:
                existing_response = self.supabase.schema('vera').table('audit_trail_v2') \
                    .select('*') \
                    .eq('application_id', application_id) \
                    .eq('actor_id', actor_id) \
                    .eq('action', action) \
                    .execute()
                
                if existing_response.data:
                    logger.info(f"Duplicate event found for {action} for application {application_id}")
                    return existing_response.data[0]
            
            # Create new event if no duplicate found or prevention is disabled
            event_data = {
                'application_id': application_id,
                'actor_id': actor_id,
                'action': action,
                'created_at': (created_at or datetime.now()).isoformat(),
                'source': source,
                'notes': notes,
            }
        
            response = self.supabase.schema('vera').table('audit_trail_v2') \
                .insert(event_data) \
                .execute()
        
            if not response.data:
                raise Exception("Failed to save audit trail event")
            
            logger.info(f"Logged event: {action} for application {application_id}")
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error saving audit trail event: {e}")
            raise e

    async def log_step_state(
        self,
        application_id: int,
        step_key: str,  # Changed from enum to string for flexibility
        decision: str,  # Changed from enum to string for flexibility
        decided_by: str,
        decided_at: Optional[datetime] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Log a step state change.
        
        Args:
            application_id: ID of the application
            step_key: Key identifying the verification step
            decision: Decision made for this step
            decided_by: Who made the decision
            decided_at: When the decision was made (defaults to now)
            notes: Additional notes
            
        Returns:
            Dict containing the created step state record
            
        Raises:
            Exception: If logging fails
        """
        try:
            step_data = {
                'application_id': application_id,
                'step_key': step_key,
                'decision': decision,
                'decided_by': decided_by,
                'decided_at': (decided_at or datetime.now()).isoformat(),
                'notes': notes,
            }
            
            response = self.supabase.schema('vera').table('step_state') \
                .insert(step_data) \
                .execute()
            
            if not response.data:
                raise Exception("Failed to save step state")
                
            logger.info(f"Logged step state: {step_key} -> {decision} for application {application_id}")
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error saving step state: {e}")
            raise e

    async def save_invocation(
        self,
        application_id: int,
        step_key: str,
        invocation_type: str,
        status: str,
        created_by: str,
        request_json: Optional[Union[Dict[str, Any], BaseModel]] = None,
        response_json: Optional[Union[Dict[str, Any], BaseModel]] = None,
        metadata: Optional[Union[Dict[str, Any], BaseModel]] = None,
        created_at: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Save an audit trail invocation.
        
        Args:
            application_id: ID of the application
            step_key: Key identifying the verification step
            invocation_type: Type of invocation (External API, LLM, Manual Upload, etc.)
            status: Status of the invocation
            created_by: Who created this invocation
            request_json: Request data (dict or Pydantic model)
            response_json: Response data (dict or Pydantic model)
            metadata: Additional metadata (dict or Pydantic model)
            created_at: When the invocation was created (defaults to now)
            
        Returns:
            Dict containing the created invocation record
            
        Raises:
            Exception: If saving fails
        """
        try:
            # Serialize all JSON data to handle datetime objects and Pydantic models
            serialized_request_json = _serialize_for_json(request_json) if request_json else None
            serialized_response_json = _serialize_for_json(response_json) if response_json else None
            serialized_metadata = _serialize_for_json(metadata) if metadata else None
            
            invocation_data = {
                'application_id': application_id,
                'step_key': step_key,
                'invocation_type': invocation_type,
                'status': status,
                'created_by': created_by,
                'created_at': (created_at or datetime.now()).isoformat(),
                'request_json': serialized_request_json,
                'response_json': serialized_response_json,
                'metadata': serialized_metadata,
            }
            
            response = self.supabase.schema('vera').table('invocations') \
                .insert(invocation_data) \
                .execute()
            
            if not response.data:
                raise Exception("Failed to save audit trail invocation")
                
            logger.info(f"Saved invocation: {invocation_type} for step {step_key} in application {application_id}")
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error saving audit trail invocation: {e}")
            raise e

    # ==========================================
    # USER MANAGEMENT OPERATIONS
    # ==========================================
    
    async def get_user_from_id_or_email(self, user_id_or_email: str) -> str:
        """
        Get a user ID from their ID or email.
        
        Args:
            user_id_or_email: User ID or email to look up
            
        Returns:
            str: User ID
            
        Raises:
            Exception: If user not found
        """
        try:
            # Check if input looks like an email (contains @ symbol)
            if '@' in user_id_or_email:
                # Try by email first
                response = self.supabase.schema('vera').table('users') \
                    .select('*') \
                    .eq('email', user_id_or_email) \
                    .execute()
                
                if response.data:
                    return response.data[0]['id']
            else:
                # Looks like a UUID, try by ID first
                try:
                    response = self.supabase.schema('vera').table('users') \
                        .select('*') \
                        .eq('id', user_id_or_email) \
                        .execute()
                    
                    if response.data:
                        return response.data[0]['id']
                except Exception as uuid_error:
                    # If UUID query fails due to type error, ignore and try email
                    logger.debug(f"UUID lookup failed, trying email: {uuid_error}")
                
                # If UUID lookup didn't work, try as email (fallback)
                response = self.supabase.schema('vera').table('users') \
                    .select('*') \
                    .eq('email', user_id_or_email) \
                    .execute()
                
                if response.data:
                    return response.data[0]['id']
            
            # If neither worked, raise an exception
            raise Exception(f"User not found - tried both ID and email lookup for: {user_id_or_email}")
            
        except Exception as e:
            logger.error(f"Error getting user from ID or email: {e}")
            raise e

    # ==========================================
    # APPLICATION STATE MANAGEMENT
    # ==========================================
    
    async def update_application_status(
        self,
        application_id: int,
        new_status: str,
        actor_id: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update the application status and log the change to audit trail.
        
        Args:
            application_id: ID of the application
            new_status: New status to set (should be a valid ApplicationStatus value)
            actor_id: ID of the actor making the change
            notes: Optional notes about the status change
            
        Returns:
            Dict containing the updated application record
            
        Raises:
            Exception: If update fails
        """
        try:
            # Get current application status for audit trail
            current_app_response = self.supabase.schema('vera').table('applications') \
                .select('status') \
                .eq('id', application_id) \
                .execute()
            
            if not current_app_response.data:
                raise Exception(f"Application {application_id} not found")
            
            current_status = current_app_response.data[0].get('status')
            
            # Update the application status
            update_data = {
                'status': new_status,
                'updated_at': datetime.now().isoformat()
            }
            
            app_response = self.supabase.schema('vera').table('applications') \
                .update(update_data) \
                .eq('id', application_id) \
                .execute()
            
            if not app_response.data:
                raise Exception("Failed to update application status")
            
            # Log the status change to audit trail
            audit_notes = notes or f"Application status changed from {current_status} to {new_status}"
            await self.log_event(
                application_id=application_id,
                actor_id=actor_id,
                action=f"Application Status Changed: {new_status.upper()}",
                notes=audit_notes,
                source="application_state_manager"
            )
            
            logger.info(f"Updated application {application_id} status: {current_status} -> {new_status}")
            return app_response.data[0]
            
        except Exception as e:
            logger.error(f"Error updating application status: {e}")
            raise e
    
    async def set_application_in_progress(
        self,
        application_id: int,
        actor_id: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Set application status to IN_PROGRESS.
        
        Args:
            application_id: ID of the application
            actor_id: ID of the actor starting the verification process
            notes: Optional notes
            
        Returns:
            Dict containing the updated application record
        """
        from v1.models.database import ApplicationStatus
        
        return await self.update_application_status(
            application_id=application_id,
            new_status=ApplicationStatus.IN_PROGRESS.value,
            actor_id=actor_id,
            notes=notes or "Verification process started"
        )
    
    async def set_application_ready_for_review(
        self,
        application_id: int,
        actor_id: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Set application status to READY_FOR_REVIEW.
        
        Args:
            application_id: ID of the application
            actor_id: ID of the actor completing the verification process
            notes: Optional notes
            
        Returns:
            Dict containing the updated application record
        """
        from v1.models.database import ApplicationStatus
        
        return await self.update_application_status(
            application_id=application_id,
            new_status=ApplicationStatus.READY_FOR_REVIEW.value,
            actor_id=actor_id,
            notes=notes or "All verification steps completed, ready for review"
        )

    # ==========================================
    # CONVENIENCE METHODS
    # ==========================================
    
    async def check_existing_step_state(
        self, 
        application_id: int, 
        step_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Check if a verification step already exists in the step_state table.
        
        Args:
            application_id: ID of the application
            step_key: Key identifying the verification step
            
        Returns:
            Dict containing the existing step state record, or None if not found
        """
        try:
            response = self.supabase.schema('vera').table('step_state') \
                .select('*') \
                .eq('application_id', application_id) \
                .eq('step_key', step_key) \
                .order('decided_at', desc=True) \
                .limit(1) \
                .execute()
            
            if response.data:
                logger.info(f"Found existing step state for {step_key} in application {application_id}")
                return response.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking existing step state: {e}")
            # Return None on error to allow processing to continue
            return None

    def reconstruct_verification_step_response(
        self, 
        step_state_record: Dict[str, Any]
    ) -> "VerificationStepResponse":
        """
        Safely reconstruct a VerificationStepResponse from a step_state database record.
        
        Args:
            step_state_record: The step_state database record
            
        Returns:
            VerificationStepResponse reconstructed from the database record
        """
        from v1.services.engine.verifications.models import (
            VerificationStepResponse, 
            VerificationStepDecision, 
            VerificationMetadata,
            VerificationStepMetadataEnum
        )
        
        try:
            # Extract decision, defaulting to requires_review if invalid
            decision_str = step_state_record.get('decision', 'requires_review')
            try:
                decision = VerificationStepDecision(decision_str)
            except ValueError:
                decision = VerificationStepDecision.REQUIRES_REVIEW
            
            # Create simple metadata indicating this was from existing data
            metadata = VerificationMetadata(
                status=VerificationStepMetadataEnum.COMPLETE,
                reasoning=f"Existing step state from {step_state_record.get('decided_at', 'unknown date')}"
            )
            
            return VerificationStepResponse(
                decision=decision,
                analysis=None,  # Analysis not stored in step_state table
                metadata=metadata
            )
            
        except Exception as e:
            logger.error(f"Error reconstructing VerificationStepResponse: {e}")
            # Fallback to safe default
            return VerificationStepResponse(
                decision=VerificationStepDecision.REQUIRES_REVIEW,
                metadata=VerificationMetadata(
                    status=VerificationStepMetadataEnum.FAILED,
                    error=f"Reconstruction failed: {str(e)}"
                )
            )
    
    async def get_application_context(self, application_id: int) -> Dict[str, Any]:
        """
        Get application context data.
        
        Args:
            application_id: ID of the application
            
        Returns:
            Dict containing application context
        """
        try:
            response = self.supabase.schema('vera').table('applications') \
                .select('*') \
                .eq('id', application_id) \
                .execute()
            
            if not response.data:
                raise Exception(f"Application {application_id} not found")
                
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error getting application context: {e}")
            raise e

    async def get_audit_trail_for_application(self, application_id: int) -> list[Dict[str, Any]]:
        """
        Get all audit trail events for an application.
        
        Args:
            application_id: ID of the application
            
        Returns:
            List of audit trail events
        """
        try:
            response = self.supabase.schema('vera').table('audit_trail_v2') \
                .select('*') \
                .eq('application_id', application_id) \
                .order('created_at', desc=True) \
                .execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"Error getting audit trail: {e}")
            raise e

    # ==========================================
    # INBOX EMAIL OPERATIONS (keeping existing)
    # ==========================================

    async def get_inbox_emails(
        self, 
        page: int = 1, 
        page_size: int = 20,
        status: Optional[str] = None,
        verification_type: Optional[str] = None,
        practitioner_id: Optional[int] = None,
        search_query: Optional[str] = None
    ) -> InboxListResponse:
        """
        Get paginated list of inbox emails with optional filtering
        
        Args:
            page: Page number (1-based)
            page_size: Number of emails per page
            status: Filter by email status
            verification_type: Filter by verification type
            practitioner_id: Filter by practitioner ID
            search_query: Search in subject, sender, or body
            
        Returns:
            InboxListResponse with paginated emails
        """
        try:
            # Build query
            query = self.supabase.table("inbox_emails").select("*")
            
            # Apply filters
            if status:
                query = query.eq("status", status)
            if verification_type:
                query = query.eq("verification_type", verification_type)
            if practitioner_id:
                query = query.eq("practitioner_id", practitioner_id)
            if search_query:
                # Search in subject, sender_name, or body_text
                query = query.or_(f"subject.ilike.%{search_query}%,sender_name.ilike.%{search_query}%,body_text.ilike.%{search_query}%")
            
            # Get total count for pagination
            count_query = self.supabase.table("inbox_emails").select("id", count="exact")
            if status:
                count_query = count_query.eq("status", status)
            if verification_type:
                count_query = count_query.eq("verification_type", verification_type)
            if practitioner_id:
                count_query = count_query.eq("practitioner_id", practitioner_id)
            if search_query:
                count_query = count_query.or_(f"subject.ilike.%{search_query}%,sender_name.ilike.%{search_query}%,body_text.ilike.%{search_query}%")
            
            count_result = count_query.execute()
            total_count = count_result.count or 0
            
            # Calculate pagination
            offset = (page - 1) * page_size
            total_pages = (total_count + page_size - 1) // page_size
            
            # Get paginated results
            result = query.order("received_at", desc=True).range(offset, offset + page_size - 1).execute()
            
            # Convert to response models
            emails = []
            for email_data in result.data:
                emails.append(InboxEmailResponse(**email_data))
            
            # Get unread count
            unread_result = self.supabase.table("inbox_emails").select("id", count="exact").eq("status", "unread").execute()
            unread_count = unread_result.count or 0
            
            return InboxListResponse(
                status=ResponseStatus.SUCCESS,
                message=f"Retrieved {len(emails)} emails",
                emails=emails,
                total_count=total_count,
                unread_count=unread_count,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
            
        except Exception as e:
            logger.error(f"Error fetching inbox emails: {e}")
            raise Exception(f"Failed to fetch inbox emails: {str(e)}")
    
    async def get_inbox_email_by_id(self, email_id: int) -> InboxEmailResponse:
        """
        Get a specific email by ID
        
        Args:
            email_id: Email ID
            
        Returns:
            InboxEmailResponse
        """
        try:
            result = self.supabase.table("inbox_emails").select("*").eq("id", email_id).execute()
            
            if not result.data:
                raise Exception(f"Email with ID {email_id} not found")
            
            email_data = result.data[0]
            return InboxEmailResponse(**email_data)
            
        except Exception as e:
            logger.error(f"Error fetching email {email_id}: {e}")
            raise Exception(f"Failed to fetch email: {str(e)}")
    
    async def mark_email_as_read(self, email_id: int) -> EmailActionResponse:
        """
        Mark an email as read
        
        Args:
            email_id: Email ID
            
        Returns:
            EmailActionResponse
        """
        try:
            # Get current email status
            current_result = self.supabase.table("inbox_emails").select("status").eq("id", email_id).execute()
            
            if not current_result.data:
                raise Exception(f"Email with ID {email_id} not found")
            
            previous_status = current_result.data[0]["status"]
            
            # Update email status
            update_data = {
                "status": "read",
                "read_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("inbox_emails").update(update_data).eq("id", email_id).execute()
            
            if not result.data:
                raise Exception("Failed to update email status")
            
            return EmailActionResponse(
                status=ResponseStatus.SUCCESS,
                message="Email marked as read",
                email_id=email_id,
                action="mark_as_read",
                previous_status=previous_status,
                new_status="read",
                updated_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error marking email {email_id} as read: {e}")
            raise Exception(f"Failed to mark email as read: {str(e)}")
    
    async def update_email_status(self, email_id: int, new_status: str) -> EmailActionResponse:
        """
        Update email status
        
        Args:
            email_id: Email ID
            new_status: New status (unread, read, archived, flagged, spam)
            
        Returns:
            EmailActionResponse
        """
        try:
            # Validate status
            valid_statuses = ["unread", "read", "archived", "flagged", "spam"]
            if new_status not in valid_statuses:
                raise Exception(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
            
            # Get current email status
            current_result = self.supabase.table("inbox_emails").select("status").eq("id", email_id).execute()
            
            if not current_result.data:
                raise Exception(f"Email with ID {email_id} not found")
            
            previous_status = current_result.data[0]["status"]
            
            # Update email status
            update_data = {
                "status": new_status,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Set read_at if marking as read
            if new_status == "read" and previous_status != "read":
                update_data["read_at"] = datetime.utcnow().isoformat()
            
            result = self.supabase.table("inbox_emails").update(update_data).eq("id", email_id).execute()
            
            if not result.data:
                raise Exception("Failed to update email status")
            
            return EmailActionResponse(
                status=ResponseStatus.SUCCESS,
                message=f"Email status updated to {new_status}",
                email_id=email_id,
                action="update_status",
                previous_status=previous_status,
                new_status=new_status,
                updated_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error updating email {email_id} status: {e}")
            raise Exception(f"Failed to update email status: {str(e)}")
    
    async def get_inbox_stats(self) -> InboxStatsResponse:
        """
        Get inbox statistics
        
        Returns:
            InboxStatsResponse with various email counts and statistics
        """
        try:
            # Get total counts by status
            total_result = self.supabase.table("inbox_emails").select("id", count="exact").execute()
            total_emails = total_result.count or 0
            
            unread_result = self.supabase.table("inbox_emails").select("id", count="exact").eq("status", "unread").execute()
            unread_emails = unread_result.count or 0
            
            read_result = self.supabase.table("inbox_emails").select("id", count="exact").eq("status", "read").execute()
            read_emails = read_result.count or 0
            
            flagged_result = self.supabase.table("inbox_emails").select("id", count="exact").eq("status", "flagged").execute()
            flagged_emails = flagged_result.count or 0
            
            archived_result = self.supabase.table("inbox_emails").select("id", count="exact").eq("status", "archived").execute()
            archived_emails = archived_result.count or 0
            
            # Get counts by verification type
            verification_types_result = self.supabase.table("inbox_emails").select("verification_type").execute()
            emails_by_verification_type = {}
            for email in verification_types_result.data:
                vtype = email["verification_type"]
                emails_by_verification_type[vtype] = emails_by_verification_type.get(vtype, 0) + 1
            
            # Get counts by priority
            priorities_result = self.supabase.table("inbox_emails").select("priority").execute()
            emails_by_priority = {}
            for email in priorities_result.data:
                priority = email["priority"]
                emails_by_priority[priority] = emails_by_priority.get(priority, 0) + 1
            
            # Get recent activity (last 10 emails)
            recent_result = self.supabase.table("inbox_emails").select(
                "id, subject, sender_name, verification_type, received_at, status"
            ).order("received_at", desc=True).limit(10).execute()
            
            recent_activity = []
            for email in recent_result.data:
                recent_activity.append({
                    "id": email["id"],
                    "subject": email["subject"],
                    "sender_name": email["sender_name"],
                    "verification_type": email["verification_type"],
                    "received_at": email["received_at"],
                    "status": email["status"]
                })
            
            return InboxStatsResponse(
                status=ResponseStatus.SUCCESS,
                message="Inbox statistics retrieved successfully",
                total_emails=total_emails,
                unread_emails=unread_emails,
                read_emails=read_emails,
                flagged_emails=flagged_emails,
                archived_emails=archived_emails,
                emails_by_verification_type=emails_by_verification_type,
                emails_by_priority=emails_by_priority,
                recent_activity=recent_activity
            )
            
        except Exception as e:
            logger.error(f"Error fetching inbox stats: {e}")
            raise Exception(f"Failed to fetch inbox statistics: {str(e)}")
    
    async def delete_email(self, email_id: int) -> EmailActionResponse:
        """
        Delete an email
        
        Args:
            email_id: Email ID
            
        Returns:
            EmailActionResponse
        """
        try:
            # Get current email status before deletion
            current_result = self.supabase.table("inbox_emails").select("status").eq("id", email_id).execute()
            
            if not current_result.data:
                raise Exception(f"Email with ID {email_id} not found")
            
            previous_status = current_result.data[0]["status"]
            
            # Delete email
            result = self.supabase.table("inbox_emails").delete().eq("id", email_id).execute()
            
            if not result.data:
                raise Exception("Failed to delete email")
            
            return EmailActionResponse(
                status=ResponseStatus.SUCCESS,
                message="Email deleted successfully",
                email_id=email_id,
                action="delete",
                previous_status=previous_status,
                new_status="deleted",
                updated_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error deleting email {email_id}: {e}")
            raise Exception(f"Failed to delete email: {str(e)}")


# ==========================================
# FACTORY FUNCTION FOR CREATING SERVICE
# ==========================================

def create_database_service(client: Optional[Client] = None) -> DatabaseService:
    """
    Factory function to create a DatabaseService instance.
    
    Args:
        client: Optional Supabase client. If not provided, will create one.
        
    Returns:
        DatabaseService: Configured database service instance
    """
    return DatabaseService(client)
