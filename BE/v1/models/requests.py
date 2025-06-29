from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List

class BaseRequest(BaseModel):
    """Base request model with common fields"""
    class Config:
        str_strip_whitespace = True
        validate_assignment = True

class NPIRequest(BaseRequest):
    """Request model for NPI (National Provider Identifier) lookup"""
    # Search criteria - at least one must be provided
    npi: Optional[str] = Field(None, description="10-digit National Provider Identifier", min_length=10, max_length=10)
    first_name: Optional[str] = Field(None, description="Provider's first name", min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, description="Provider's last name", min_length=1, max_length=50)
    organization_name: Optional[str] = Field(None, description="Organization name", min_length=2, max_length=200)
    
    # Optional address fields for more specific searches
    city: Optional[str] = Field(None, description="City", max_length=50)
    state: Optional[str] = Field(None, description="State abbreviation", min_length=2, max_length=2)
    postal_code: Optional[str] = Field(None, description="ZIP/Postal code", max_length=10)
    
    @field_validator('npi')
    def validate_npi(cls, v: str):
        if v and not v.isdigit():
            raise ValueError('NPI must contain only digits')
        return v
    
    @field_validator('state')
    def validate_state(cls, v):
        if v:
            return v.upper()
        return v
    
    @model_validator(mode='after')
    def validate_search_criteria(self):
        """Ensure at least one search criterion is provided"""
        if not any([self.npi, self.first_name, self.last_name, self.organization_name]):
            raise ValueError('At least one search criterion must be provided: npi, first_name/last_name, or organization_name')
        return self

class DEAVerificationRequest(BaseRequest):
    """Request model for DEA verification - first_name, last_name, and dea_number required"""
    first_name: str = Field(..., description="First name of the practitioner", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name of the practitioner", min_length=1, max_length=50)
    dea_number: str = Field(..., description="DEA registration number", min_length=9, max_length=9)
    
    @field_validator('dea_number')
    def validate_dea_number(cls, v):
        # Basic DEA number format validation (2 letters + 7 digits)
        if len(v) != 9 or not v[:2].isalpha() or not v[2:].isdigit():
            raise ValueError('DEA number must be 2 letters followed by 7 digits')
        return v.upper()

class ABMSRequest(BaseRequest):
    """Request model for ABMS (American Board of Medical Specialties) lookup"""
    first_name: str = Field(..., description="First name of the physician", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name of the physician", min_length=1, max_length=50)
    middle_name: Optional[str] = Field(None, description="Middle name of the physician (optional)", max_length=50)
    state: str = Field(..., description="State abbreviation", min_length=2, max_length=2)
    npi_number: str = Field(..., description="10-digit National Provider Identifier", min_length=10, max_length=10)
    active_state_medical_license: Optional[str] = Field(None, description="Active state medical license (DCA) number (optional)", max_length=50)
    specialty: Optional[str] = Field(None, description="Medical specialty (optional)", max_length=100)
    
    @field_validator('state')
    def validate_state(cls, v):
        if v:
            return v.upper()
        return v
    
    @field_validator('npi_number')
    def validate_npi_number(cls, v):
        if not v.isdigit():
            raise ValueError('NPI number must contain only digits')
        return v

class NPDBAddress(BaseModel):
    """Address model for NPDB requests"""
    line1: str = Field(..., description="Address line 1", max_length=100)
    line2: Optional[str] = Field("", description="Address line 2", max_length=100)
    city: str = Field(..., description="City", max_length=50)
    state: str = Field(..., description="State abbreviation", min_length=2, max_length=2)
    zip: str = Field(..., description="ZIP code", max_length=10)
    
    @field_validator('state')
    def validate_state(cls, v: str) -> str:
        # We can assume that its a string because this is mode='after' BaseModel validation
        return v.upper()

class NPDBRequest(BaseRequest):
    """Request model for NPDB (National Practitioner Data Bank) verification"""
    first_name: str = Field(..., description="First name", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name", min_length=1, max_length=50)
    date_of_birth: str = Field(..., description="Date of birth (YYYY-MM-DD)", pattern=r"^\d{4}-\d{2}-\d{2}$")
    ssn_last4: str = Field(..., description="Last 4 digits of SSN", min_length=4, max_length=4, pattern=r"^\d{4}$")
    address: NPDBAddress = Field(..., description="Address information")
    npi_number: str = Field(..., description="10-digit NPI number", min_length=10, max_length=10, pattern=r"^\d{10}$")
    license_number: str = Field(..., description="Professional license number", max_length=50)
    state_of_license: str = Field(..., description="State of license", min_length=2, max_length=2)
    upin: Optional[str] = Field(None, description="UPIN number", max_length=20)
    dea_number: Optional[str] = Field(None, description="DEA number", max_length=9)
    organization_name: Optional[str] = Field(None, description="Organization name", max_length=100)
    
    @field_validator('state_of_license')
    def validate_state_of_license(cls, v):
        return v.upper()
    
    @field_validator('dea_number')
    def validate_dea_number(cls, v):
        if v and (len(v) != 9 or not v[:2].isalpha() or not v[2:].isdigit()):
            raise ValueError('DEA number must be 2 letters followed by 7 digits')
        return v.upper() if v else v

class ComprehensiveSANCTIONRequest(BaseRequest):
    """Request model for comprehensive sanctions check"""
    first_name: str = Field(..., description="First name", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name", min_length=1, max_length=50)
    date_of_birth: str = Field(..., description="Date of birth in YYYY-MM-DD format", pattern=r"^\d{4}-\d{2}-\d{2}$")
    npi: str = Field(..., description="10-digit National Provider Identifier", min_length=10, max_length=10)
    license_number: str = Field(..., description="Professional license number", min_length=1, max_length=50)
    license_state: str = Field(..., description="State where license was issued", min_length=2, max_length=2)
    ssn_last4: str = Field(..., description="Last 4 digits of SSN", min_length=4, max_length=4)
    
    @field_validator('npi')
    def validate_npi(cls, v):
        if not v.isdigit():
            raise ValueError('NPI must contain only digits')
        return v
    
    @field_validator('license_state')
    def validate_license_state(cls, v):
        return v.upper()
    
    @field_validator('ssn_last4')
    def validate_ssn_last4(cls, v):
        if not v.isdigit():
            raise ValueError('SSN last 4 digits must contain only digits')
        return v

class LADMFRequest(BaseRequest):
    """Request model for LADMF (Limited Access Death Master File) verification"""
    first_name: str = Field(..., description="First name of the individual", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name of the individual", min_length=1, max_length=50)
    middle_name: Optional[str] = Field(None, description="Middle name or initial (for higher match rate)", max_length=50)
    date_of_birth: str = Field(..., description="Date of birth in YYYY-MM-DD format", pattern=r"^\d{4}-\d{2}-\d{2}$")
    social_security_number: str = Field(..., description="Full 9-digit SSN of the individual", min_length=9, max_length=9)
    
    @field_validator('social_security_number')
    def validate_ssn(cls, v):
        if not v.isdigit():
            raise ValueError('Social Security Number must contain only digits')
        return v

class MedicalRequest(BaseRequest):
    """Request model for Medi-Cal Managed Care + ORP verification"""
    npi: str = Field(..., description="10-digit National Provider Identifier", min_length=10, max_length=10)
    first_name: str = Field(..., description="Provider's first name", min_length=1, max_length=50)
    last_name: str = Field(..., description="Provider's last name", min_length=1, max_length=50)
    license_type: Optional[str] = Field(None, description="License type (e.g., MD, NP, DO)", max_length=10)
    taxonomy_code: Optional[str] = Field(None, description="Provider taxonomy code", max_length=20)
    provider_type: Optional[str] = Field(None, description="Provider type/specialty", max_length=100)
    city: Optional[str] = Field(None, description="Provider city", max_length=50)
    state: Optional[str] = Field(None, description="Provider state", min_length=2, max_length=2)
    zip: Optional[str] = Field(None, description="Provider ZIP code", max_length=10)
    
    @field_validator('npi')
    def validate_npi(cls, v: str):
        if not v.isdigit():
            raise ValueError('NPI must contain only digits')
        return v
    
    @field_validator('state')
    def validate_state(cls, v):
        return v.upper()

class DCARequest(BaseRequest):
    """Request model for DCA (Department of Consumer Affairs) CA license verification"""
    first_name: str = Field(..., description="Provider's first name", min_length=1, max_length=50)
    last_name: str = Field(..., description="Provider's last name", min_length=1, max_length=50)
    license_number: str = Field(..., description="License number as issued by the medical board", min_length=1, max_length=50)

class MedicareRequest(BaseRequest):
    """Request model for Medicare enrollment verification"""
    provider_verification_type: str = Field(..., description="Type of verification being performed", max_length=50)
    npi: str = Field(..., description="10-digit National Provider Identifier", min_length=10, max_length=10)
    first_name: str = Field(..., description="Provider's first name", min_length=1, max_length=50)
    last_name: str = Field(..., description="Provider's last name", min_length=1, max_length=50)
    specialty: Optional[str] = Field(None, description="Provider specialty for cross-check", max_length=100)
    verification_sources: List[str] = Field(..., description="List of verification sources to check", min_items=1)
    
    @field_validator('npi')
    def validate_npi(cls, v: str):
        if not v.isdigit():
            raise ValueError('NPI must contain only digits')
        return v
    
    @field_validator('provider_verification_type')
    def validate_verification_type(cls, v: str):
        allowed_types = ["medicare_enrollment"]
        if v not in allowed_types:
            raise ValueError(f'provider_verification_type must be one of: {", ".join(allowed_types)}')
        return v
    
    @field_validator('verification_sources')
    def validate_verification_sources(cls, v: List[str]):
        allowed_sources = ["ffs_provider_enrollment", "ordering_referring_provider"]
        for source in v:
            if source not in allowed_sources:
                raise ValueError(f'verification_sources must contain only: {", ".join(allowed_sources)}')
        return v

class EducationRequest(BaseRequest):
    """Request model for education verification with transcript generation and audio conversion"""
    first_name: str = Field(..., description="First name of the individual", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name of the individual", min_length=1, max_length=50)
    institution: str = Field(..., description="Educational institution name", min_length=2, max_length=200)
    degree_type: str = Field(..., description="Type of degree (e.g., Bachelor's, Master's, PhD, MD)", min_length=2, max_length=50)
    graduation_year: int = Field(..., description="Year of graduation", ge=1900, le=2030)
    verification_type: str = Field(..., description="Type of verification requested", max_length=50)
    
    @field_validator('verification_type')
    def validate_verification_type(cls, v: str):
        allowed_types = ["transcript_generation", "degree_verification", "enrollment_verification"]
        if v not in allowed_types:
            raise ValueError(f'verification_type must be one of: {", ".join(allowed_types)}')
        return v
    
    @field_validator('degree_type')
    def validate_degree_type(cls, v: str):
        # Common degree types - can be expanded
        allowed_degrees = [
            "Associate", "Bachelor's", "Master's", "PhD", "Doctorate", "MD", "JD", "MBA", 
            "MS", "MA", "BS", "BA", "Certificate", "Diploma"
        ]
        # Allow case-insensitive matching
        if not any(v.lower() == degree.lower() for degree in allowed_degrees):
            raise ValueError(f'degree_type must be one of: {", ".join(allowed_degrees)}')
        return v

class HospitalPrivilegesRequest(BaseRequest):
    """Request model for hospital privileges verification with transcript generation and audio conversion"""
    first_name: str = Field(..., description="First name of the practitioner", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name of the practitioner", min_length=1, max_length=50)
    npi_number: str = Field(..., description="10-digit National Provider Identifier", min_length=10, max_length=10)
    hospital_name: str = Field(..., description="Hospital name where privileges are being verified", min_length=2, max_length=200)
    specialty: str = Field(..., description="Medical specialty for privileges", min_length=2, max_length=100)
    verification_type: str = Field(..., description="Type of verification requested (e.g., 'current_privileges', 'historical_privileges')", max_length=50)
    
    @field_validator('npi_number')
    def validate_npi_number(cls, v: str):
        if not v.isdigit():
            raise ValueError('NPI number must contain only digits')
        return v
    
    @field_validator('verification_type')
    def validate_verification_type(cls, v: str):
        allowed_types = ['current_privileges', 'historical_privileges', 'privileges_status', 'general_inquiry']
        if v.lower() not in allowed_types:
            raise ValueError(f'Verification type must be one of: {", ".join(allowed_types)}')
        return v.lower()
    
    @field_validator('specialty')
    def validate_specialty(cls, v: str):
        # Common medical specialties - can be expanded
        common_specialties = [
            'internal medicine', 'family medicine', 'pediatrics', 'emergency medicine',
            'surgery', 'cardiology', 'orthopedics', 'neurology', 'psychiatry',
            'radiology', 'anesthesiology', 'pathology', 'dermatology', 'oncology'
        ]
        if v.lower() not in common_specialties:
            # Allow custom specialties but log a warning
            pass
        return v.title()  # Capitalize properly

class AuditTrailStartRequest(BaseRequest):
    """Request model for starting an audit trail step"""
    application_id: int = Field(..., description="Application ID", gt=0)
    step_name: str = Field(..., description="Name of the verification step", min_length=1, max_length=100)
    step_type: str = Field(..., description="Type of verification step", min_length=1, max_length=100)
    reasoning: Optional[str] = Field(None, description="Reasoning for starting this step", max_length=1000)
    request_data: Optional[dict] = Field(None, description="Input data for the verification")
    processed_by: Optional[str] = Field("system", description="Who/what is processing this step", max_length=100)
    agent_id: Optional[str] = Field(None, description="Unique identifier for the processing agent", max_length=100)
    priority: Optional[str] = Field("medium", description="Priority level", max_length=20)
    estimated_duration_ms: Optional[int] = Field(None, description="Estimated processing duration", gt=0)
    depends_on_steps: Optional[List[str]] = Field(None, description="List of step names this step depends on")
    tags: Optional[List[str]] = Field(None, description="Tags for categorization")
    
    @field_validator('priority')
    def validate_priority(cls, v):
        if v and v not in ['low', 'medium', 'high', 'critical']:
            raise ValueError('Priority must be one of: low, medium, high, critical')
        return v

class AuditTrailCompleteRequest(BaseRequest):
    """Request model for completing an audit trail step"""
    application_id: int = Field(..., description="Application ID", gt=0)
    step_name: str = Field(..., description="Name of the verification step", min_length=1, max_length=100)
    status: str = Field(..., description="Final status of the step", min_length=1, max_length=50)
    reasoning: Optional[str] = Field(None, description="Reasoning for the completion/decision", max_length=1000)
    response_data: Optional[dict] = Field(None, description="Response data from the verification")
    verification_result: Optional[str] = Field(None, description="Overall result", max_length=50)
    match_found: Optional[bool] = Field(None, description="Whether a match was found")
    confidence_score: Optional[float] = Field(None, description="Confidence score (0-100)", ge=0, le=100)
    external_service: Optional[str] = Field(None, description="Name of external service used", max_length=100)
    external_service_response_time_ms: Optional[int] = Field(None, description="External service response time", gt=0)
    external_service_status: Optional[str] = Field(None, description="External service response status", max_length=50)
    data_quality_score: Optional[float] = Field(None, description="Data quality score (0-100)", ge=0, le=100)
    validation_errors: Optional[List[str]] = Field(None, description="List of validation errors")
    risk_flags: Optional[List[str]] = Field(None, description="List of risk flags identified")
    risk_score: Optional[float] = Field(None, description="Risk score (0-100)", ge=0, le=100)
    requires_manual_review: Optional[bool] = Field(None, description="Whether manual review is required")
    processing_method: Optional[str] = Field(None, description="Method used", max_length=50)
    processing_duration_ms: Optional[int] = Field(None, description="Total processing time", gt=0)
    retry_count: Optional[int] = Field(None, description="Number of retries attempted", ge=0)
    compliance_checks: Optional[List[str]] = Field(None, description="List of compliance checks performed")
    audit_notes: Optional[str] = Field(None, description="Additional audit notes", max_length=2000)
    error_code: Optional[str] = Field(None, description="Error code if step failed", max_length=50)
    error_message: Optional[str] = Field(None, description="Detailed error message", max_length=1000)
    
    @field_validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'requires_review']
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v
    
    @field_validator('verification_result')
    def validate_verification_result(cls, v):
        if v and v not in ['verified', 'not_verified', 'partial', 'error']:
            raise ValueError('Verification result must be one of: verified, not_verified, partial, error')
        return v
    
    @field_validator('processing_method')
    def validate_processing_method(cls, v):
        if v and v not in ['database', 'external_api', 'ai_generated', 'manual']:
            raise ValueError('Processing method must be one of: database, external_api, ai_generated, manual')
        return v
