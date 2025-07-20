import pytest
from unittest.mock import Mock, AsyncMock
from datetime import datetime

from v1.services.database import DatabaseService
from v1.models.database import ApplicationStatus


class TestApplicationStatusManagement:
    """Test suite for application status management functionality"""
    
    @pytest.fixture
    def mock_supabase_client(self):
        """Mock Supabase client"""
        client = Mock()
        client.schema.return_value = client
        client.table.return_value = client
        client.select.return_value = client
        client.update.return_value = client
        client.eq.return_value = client
        client.execute.return_value = Mock(data=[{'id': 123, 'status': 'ready_for_review'}])
        return client
    
    @pytest.fixture
    def db_service(self, mock_supabase_client):
        """Database service with mocked client"""
        service = DatabaseService(mock_supabase_client)
        service.log_event = AsyncMock()
        return service
    
    @pytest.mark.asyncio
    async def test_update_application_status(self, db_service, mock_supabase_client):
        """Test updating application status with audit logging"""
        
        # Mock current status lookup
        mock_supabase_client.execute.return_value = Mock(data=[{'status': 'draft'}])
        
        # Test the status update
        result = await db_service.update_application_status(
            application_id=123,
            new_status=ApplicationStatus.IN_PROGRESS.value,
            actor_id="user123",
            notes="Starting verification process"
        )
        
        # Verify the result
        assert result['id'] == 123
        
        # Verify audit event was logged
        db_service.log_event.assert_called_once()
        call_args = db_service.log_event.call_args
        assert call_args[1]['application_id'] == 123
        assert call_args[1]['actor_id'] == "user123"
        assert "IN_PROGRESS" in call_args[1]['action']
        assert call_args[1]['source'] == "application_state_manager"
    
    @pytest.mark.asyncio
    async def test_set_application_in_progress(self, db_service, mock_supabase_client):
        """Test setting application to IN_PROGRESS status"""
        
        # Mock current status lookup  
        mock_supabase_client.execute.return_value = Mock(data=[{'status': 'draft'}])
        
        result = await db_service.set_application_in_progress(
            application_id=123,
            actor_id="user123"
        )
        
        # Verify the call was made correctly
        assert result['id'] == 123
        db_service.log_event.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_set_application_ready_for_review(self, db_service, mock_supabase_client):
        """Test setting application to READY_FOR_REVIEW status"""
        
        # Mock current status lookup
        mock_supabase_client.execute.return_value = Mock(data=[{'status': 'in_progress'}])
        
        result = await db_service.set_application_ready_for_review(
            application_id=123,
            actor_id="user123",
            notes="All verification steps completed successfully"
        )
        
        # Verify the call was made correctly
        assert result['id'] == 123
        db_service.log_event.assert_called_once()
        
        # Check that the audit log contains the right information
        call_args = db_service.log_event.call_args
        assert "All verification steps completed successfully" in call_args[1]['notes']
    
    @pytest.mark.asyncio
    async def test_application_not_found_error(self, db_service, mock_supabase_client):
        """Test error handling when application is not found"""
        
        # Mock empty response (application not found)
        mock_supabase_client.execute.return_value = Mock(data=[])
        
        with pytest.raises(Exception) as exc_info:
            await db_service.update_application_status(
                application_id=999,
                new_status=ApplicationStatus.IN_PROGRESS.value,
                actor_id="user123"
            )
        
        assert "Application 999 not found" in str(exc_info.value)

    def test_application_status_enum_values(self):
        """Test that ApplicationStatus enum has expected values"""
        expected_statuses = {
            "draft", "in_progress", "ready_for_review", 
            "approved", "rejected", "on_hold"
        }
        
        actual_statuses = {status.value for status in ApplicationStatus}
        assert actual_statuses == expected_statuses


if __name__ == "__main__":
    print("Testing application status management functionality...")
    print("Run with: pytest tests/services/test_application_status_management.py") 