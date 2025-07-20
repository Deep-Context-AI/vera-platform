import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from v1.services.engine.processor import JobRunner
from v1.services.database import DatabaseService
from v1.models.requests import VeraRequest
from v1.services.engine.verifications.models import (
    VerificationStepResponse, 
    VerificationStepDecision, 
    VerificationMetadata,
    VerificationStepMetadataEnum
)


class TestProcessorSkipFunctionality:
    """Test suite for processor skip functionality"""
    
    @pytest.fixture
    def mock_db_service(self):
        """Mock database service"""
        service = Mock(spec=DatabaseService)
        service.check_existing_step_state = AsyncMock()
        service.reconstruct_verification_step_response = Mock()
        service.log_event = AsyncMock()
        service.log_step_state = AsyncMock()
        service.set_application_in_progress = AsyncMock()
        service.set_application_ready_for_review = AsyncMock()
        return service
    
    @pytest.fixture
    def sample_request(self):
        """Sample verification request"""
        return VeraRequest(
            application_id=123,
            requested_verifications=["npi", "dea"],
            requester="test@example.com"
        )
    
    @pytest.fixture
    def existing_step_state(self):
        """Sample existing step state from database"""
        return {
            'id': 1,
            'application_id': 123,
            'step_key': 'npi',
            'decision': 'approved',
            'decided_by': 'vera_ai',
            'decided_at': '2024-01-01T12:00:00Z',
            'notes': 'Previously processed'
        }
    
    @pytest.fixture
    def reconstructed_response(self):
        """Sample reconstructed verification response"""
        return VerificationStepResponse(
            decision=VerificationStepDecision.APPROVED,
            metadata=VerificationMetadata(
                status=VerificationStepMetadataEnum.COMPLETE,
                reasoning="Reconstructed from existing step_state record"
            )
        )
    
    @pytest.mark.asyncio
    async def test_skip_existing_verification_step(
        self, 
        mock_db_service, 
        sample_request, 
        existing_step_state, 
        reconstructed_response
    ):
        """Test that existing verification steps are skipped and reconstructed"""
        
        # Mock the database service methods
        mock_db_service.check_existing_step_state.side_effect = [
            existing_step_state,  # NPI exists
            None  # DEA doesn't exist
        ]
        mock_db_service.reconstruct_verification_step_response.return_value = reconstructed_response
        
        # Mock ApplicationContext loading
        with patch('v1.services.engine.processor.ApplicationContext.load_from_db') as mock_load_context:
            mock_context = Mock()
            mock_context.application_id = 123
            mock_load_context.return_value = mock_context
            
            # Mock the verification registry
            with patch('v1.services.engine.processor.get_verification_step') as mock_get_step:
                mock_step_config = Mock()
                mock_get_step.return_value = mock_step_config
                
                # Mock the verification function
                with patch('v1.services.engine.processor._run_verification_step') as mock_run_step:
                    new_response = VerificationStepResponse(
                        decision=VerificationStepDecision.APPROVED,
                        metadata=VerificationMetadata(status=VerificationStepMetadataEnum.COMPLETE)
                    )
                    mock_run_step.return_value = new_response
                    
                    # Mock the database service creation
                    with patch('v1.services.engine.processor.create_database_service') as mock_create_db:
                        mock_create_db.return_value = mock_db_service
                        
                        # Create JobRunner and process the job
                        runner = JobRunner()
                        result = await runner.process_job(sample_request, "test_user_id")
        
        # Verify the results
        assert result["application_id"] == 123
        assert result["status"] == "completed"
        assert len(result["verification_results"]) == 2
        
        # Verify NPI was skipped and reconstructed
        assert "npi" in result["verification_results"]
        assert result["verification_results"]["npi"] == reconstructed_response
        
        # Verify DEA was processed normally
        assert "dea" in result["verification_results"]
        assert result["verification_results"]["dea"] == new_response
        
        # Verify summary includes skip information
        summary = result["summary"]
        assert summary["total_requested"] == 2
        assert summary["skipped_existing"] == 1
        assert summary["newly_processed"] == 1
        assert summary["skipped_steps"] == ["npi"]
        
        # Verify database methods were called correctly
        mock_db_service.check_existing_step_state.assert_any_call(123, "npi")
        mock_db_service.check_existing_step_state.assert_any_call(123, "dea")
        mock_db_service.reconstruct_verification_step_response.assert_called_once_with(existing_step_state)
        
        # Verify step state was only logged for the newly processed step (DEA)
        mock_db_service.log_step_state.assert_called_once()
        
        # Verify application status was managed correctly
        mock_db_service.set_application_in_progress.assert_called_once_with(
            application_id=123,
            actor_id="test_user_id",
            notes="Starting verification for steps: npi, dea"
        )
        mock_db_service.set_application_ready_for_review.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_all_steps_skipped(
        self, 
        mock_db_service, 
        sample_request, 
        existing_step_state, 
        reconstructed_response
    ):
        """Test when all verification steps already exist and are skipped"""
        
        # Mock all steps as existing
        mock_db_service.check_existing_step_state.return_value = existing_step_state
        mock_db_service.reconstruct_verification_step_response.return_value = reconstructed_response
        
        # Mock ApplicationContext loading
        with patch('v1.services.engine.processor.ApplicationContext.load_from_db') as mock_load_context:
            mock_context = Mock()
            mock_context.application_id = 123
            mock_load_context.return_value = mock_context
            
            # Mock the database service creation
            with patch('v1.services.engine.processor.create_database_service') as mock_create_db:
                mock_create_db.return_value = mock_db_service
                
                # Create JobRunner and process the job
                runner = JobRunner()
                result = await runner.process_job(sample_request, "test_user_id")
        
        # Verify all steps were skipped
        summary = result["summary"]
        assert summary["total_requested"] == 2
        assert summary["skipped_existing"] == 2
        assert summary["newly_processed"] == 0
        assert summary["skipped_steps"] == ["npi", "dea"]
        
        # Verify no step states were logged (since all were skipped)
        mock_db_service.log_step_state.assert_not_called()
        
        # Verify application status was still managed
        mock_db_service.set_application_in_progress.assert_called_once()
        mock_db_service.set_application_ready_for_review.assert_called_once()


if __name__ == "__main__":
    # Simple manual test
    print("Testing processor skip functionality...")
    
    # This would normally be run with pytest, but including a simple check
    print("Test file created successfully. Run with: pytest tests/services/test_processor_skip_functionality.py") 