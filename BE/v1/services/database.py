import os
import logging
from typing import Generator, Optional
from supabase import create_client, Client
from functools import lru_cache
from datetime import datetime
from v1.models.responses import (
    ResponseStatus,
    InboxEmailResponse, InboxListResponse, InboxStatsResponse, EmailActionResponse
)

logger = logging.getLogger(__name__)

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
    """Service for database operations using Supabase"""
    
    def __init__(self):
        self.supabase = self._get_supabase_client()
    
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

    # Inbox Email Methods
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
