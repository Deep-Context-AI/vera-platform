from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime

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

class SANCTIONRequest(BaseRequest):
    """Request model for sanctions/exclusions lookup"""
    first_name: str = Field(..., description="First name", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name", min_length=1, max_length=50)
    state: Optional[str] = Field(None, description="State abbreviation", min_length=2, max_length=2)
    
    @field_validator('state')
    def validate_state(cls, v):
        if v:
            return v.upper()
        return v

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

# Batch request models
class BatchNPIRequest(BaseRequest):
    """Request model for batch NPI lookups"""
    npis: List[str] = Field(..., description="List of NPIs to lookup", min_items=1, max_items=100)
    
    @field_validator('npis')
    def validate_npis(cls, v):
        for npi in v:
            if not npi.isdigit() or len(npi) != 10:
                raise ValueError(f'Invalid NPI: {npi}. Must be 10 digits.')
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
