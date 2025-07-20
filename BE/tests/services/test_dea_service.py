import pytest
from unittest.mock import Mock, patch
from datetime import date

from v1.services.external.DEA import DEAService
from v1.models.requests import DEAVerificationRequest
from v1.models.responses import NewDEAVerificationResponse, ResponseStatus
from v1.models.database import DEAModel, PractitionerEnhanced, PractitionerEducation, PractitionerAddress
from v1.exceptions.api import NotFoundException, ExternalServiceException


class TestDEAService:
    """Test suite for DEA service"""
    
    @pytest.fixture
    def dea_service(self):
        """Create a DEA service instance for testing"""
        with patch('v1.services.external.DEA.get_supabase_client') as mock_supabase:
            mock_supabase.return_value = Mock()
            return DEAService()
    
    @pytest.fixture
    def sample_dea_request(self):
        """Sample DEA verification request"""
        return DEAVerificationRequest(
            first_name="John",
            last_name="Doe",
            dea_number="AB1234567",
            expiration_date="2025-12-31",
            zip_code="12345"
        )
    
    @pytest.fixture
    def sample_dea_model(self):
        """Sample DEA model from database"""
        return DEAModel(
            id=1,
            number="AB1234567",
            business_activity_code="C",
            registration_status="ACTIVE",
            authorized_schedules=["2", "2N", "3", "4", "5"],
            issue_date=date(2020, 1, 1),
            expiration=date(2025, 12, 31),
            state="CA",
            paid_status="PAID",
            has_restrictions=False,
            restriction_details=[],
            practitioner_id=123
        )
    
    @pytest.fixture
    def sample_practitioner(self):
        """Sample practitioner model"""
        return PractitionerEnhanced(
            id=123,
            first_name="John",
            last_name="Doe",
            middle_name="M",
            education=PractitionerEducation(degree="MD"),
            mailing_address=PractitionerAddress(
                street="123 Main St",
                city="Anytown",
                state="CA",
                zip="12345"
            )
        )
    
    def test_init(self, dea_service):
        """Test DEA service initialization"""
        assert dea_service.db is not None
    
    @pytest.mark.asyncio
    async def test_verify_dea_practitioner_success(self, dea_service, sample_dea_request, sample_dea_model):
        """Test successful DEA verification"""
        # Mock database response
        mock_db_response = Mock()
        mock_db_response.data = [sample_dea_model.dict()]
        
        dea_service.db.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_db_response
        
        # Mock practitioner service
        with patch('v1.services.external.DEA.practitioner_service') as mock_practitioner_service:
            mock_practitioner_service.get_practitioner_by_id.return_value = None
            
            result = await dea_service.verify_dea_practitioner(sample_dea_request)
            
            # Verify result
            assert isinstance(result, NewDEAVerificationResponse)
            assert result.status == ResponseStatus.SUCCESS
            assert result.number == "AB1234567"
            assert result.current_status == "ACTIVE"
    
    @pytest.mark.asyncio
    async def test_verify_dea_practitioner_not_found(self, dea_service, sample_dea_request):
        """Test DEA verification when DEA number is not found"""
        # Mock empty database response
        mock_db_response = Mock()
        mock_db_response.data = []
        
        dea_service.db.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_db_response
        
        with pytest.raises(NotFoundException, match="DEA number AB1234567 not found"):
            await dea_service.verify_dea_practitioner(sample_dea_request)
    
    @pytest.mark.asyncio
    async def test_verify_dea_practitioner_database_error(self, dea_service, sample_dea_request):
        """Test DEA verification when database query fails"""
        # Mock database error
        dea_service.db.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.side_effect = Exception("Database error")
        
        with pytest.raises(ExternalServiceException, match="Unexpected error during DEA verification"):
            await dea_service.verify_dea_practitioner(sample_dea_request)
    
    @pytest.mark.asyncio
    async def test_verify_dea_practitioner_practitioner_lookup_fails(self, dea_service, sample_dea_request, sample_dea_model):
        """Test DEA verification when practitioner lookup fails"""
        # Mock database response
        mock_db_response = Mock()
        mock_db_response.data = [sample_dea_model.dict()]
        
        dea_service.db.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_db_response
        
        # Mock practitioner service failure
        with patch('v1.services.external.DEA.practitioner_service') as mock_practitioner_service:
            mock_practitioner_service.get_practitioner_by_id.side_effect = Exception("Practitioner lookup failed")
            
            # Should not fail, just log warning and continue
            result = await dea_service.verify_dea_practitioner(sample_dea_request)
            
            assert isinstance(result, NewDEAVerificationResponse)
            assert result.status == ResponseStatus.SUCCESS

    def test_build_verification_response_with_practitioner(self, dea_service, sample_dea_request, sample_dea_model, sample_practitioner):
        """Test building verification response with practitioner data"""
        result = dea_service._build_verification_response(
            sample_dea_request, 
            sample_dea_model, 
            sample_practitioner
        )
        
        assert isinstance(result, NewDEAVerificationResponse)
        assert result.status == ResponseStatus.SUCCESS
        assert result.number == "AB1234567"
        assert result.current_status == "ACTIVE"
        assert result.practitioner_name == "John M Doe"
        assert result.practitioner_degree == "MD"
        assert result.mailing_address == "123 Main St, Anytown, CA 12345"
        assert result.authorized_schedules == ["2", "2N", "3", "4", "5"]
        assert result.has_restrictions is False
        assert result.restriction_details == []

    def test_build_verification_response_without_practitioner(self, dea_service, sample_dea_request, sample_dea_model):
        """Test building verification response without practitioner data"""
        result = dea_service._build_verification_response(
            sample_dea_request, 
            sample_dea_model, 
            None
        )
        
        assert isinstance(result, NewDEAVerificationResponse)
        assert result.status == ResponseStatus.SUCCESS
        assert result.number == "AB1234567"
        assert result.current_status == "ACTIVE"
        assert result.practitioner_name is None
        assert result.practitioner_degree is None
        assert result.mailing_address is None
        assert result.authorized_schedules == ["2", "2N", "3", "4", "5"]

    def test_build_verification_response_with_restrictions(self, dea_service, sample_dea_request):
        """Test building verification response with restrictions"""
        restricted_dea_model = DEAModel(
            id=1,
            number="AB1234567",
            business_activity_code="C",
            registration_status="ACTIVE",
            authorized_schedules=["3", "4", "5"],
            issue_date=date(2020, 1, 1),
            expiration=date(2025, 12, 31),
            state="CA",
            paid_status="PAID",
            has_restrictions=True,
            restriction_details=["Cannot prescribe Schedule II substances"],
            practitioner_id=123
        )
        
        result = dea_service._build_verification_response(
            sample_dea_request, 
            restricted_dea_model, 
            None
        )
        
        assert result.has_restrictions is True
        assert result.restriction_details == ["Cannot prescribe Schedule II substances"]

    def test_build_verification_response_missing_data(self, dea_service, sample_dea_request):
        """Test building verification response with missing data"""
        incomplete_dea_model = DEAModel(
            id=1,
            number="AB1234567",
            business_activity_code=None,
            registration_status="ACTIVE",
            authorized_schedules=None,
            issue_date=None,
            expiration=date(2025, 12, 31),
            state=None,
            paid_status=None,
            has_restrictions=False,
            restriction_details=None,
            practitioner_id=123
        )
        
        result = dea_service._build_verification_response(
            sample_dea_request, 
            incomplete_dea_model, 
            None
        )
        
        assert result.business_activity_code is None
        assert result.authorized_schedules is None
        assert result.issue_date is None
        assert result.state is None
        assert result.paid_status is None
        assert result.restriction_details is None 