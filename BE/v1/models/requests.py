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

class DEARequest(BaseRequest):
    """Request model for DEA (Drug Enforcement Administration) lookup"""
    dea_number: str = Field(..., description="DEA registration number", min_length=9, max_length=9)
    
    @field_validator('dea_number')
    def validate_dea_number(cls, v):
        # Basic DEA number format validation (2 letters + 7 digits)
        if len(v) != 9 or not v[:2].isalpha() or not v[2:].isdigit():
            raise ValueError('DEA number must be 2 letters followed by 7 digits')
        return v.upper()

class DEAVerificationRequest(BaseRequest):
    """Request model for comprehensive DEA verification"""
    first_name: str = Field(..., description="First name of the practitioner", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name of the practitioner", min_length=1, max_length=50)
    date_of_birth: str = Field(..., description="Date of birth (YYYY-MM-DD)", pattern=r"^\d{4}-\d{2}-\d{2}$")
    zip_code: str = Field(..., description="ZIP code from registered business location", min_length=5, max_length=10)
    dea_number: str = Field(..., description="Unique DEA registration number", min_length=9, max_length=9)
    last_four_ssn: str = Field(..., description="Last 4 digits of SSN", min_length=4, max_length=4, pattern=r"^\d{4}$")
    expiration_date: str = Field(..., description="DEA expiration date (YYYY-MM-DD)", pattern=r"^\d{4}-\d{2}-\d{2}$")
    
    @field_validator('dea_number')
    def validate_dea_number(cls, v):
        # Basic DEA number format validation (2 letters + 7 digits)
        if len(v) != 9 or not v[:2].isalpha() or not v[2:].isdigit():
            raise ValueError('DEA number must be 2 letters followed by 7 digits')
        return v.upper()

class ABMSRequest(BaseRequest):
    """Request model for ABMS (American Board of Medical Specialties) lookup"""
    physician_name: str = Field(..., description="Physician full name", min_length=2, max_length=100)
    state: Optional[str] = Field(None, description="State abbreviation", min_length=2, max_length=2)
    specialty: Optional[str] = Field(None, description="Medical specialty", max_length=100)
    
    @field_validator('state')
    def validate_state(cls, v):
        if v:
            return v.upper()
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

class BatchDEARequest(BaseRequest):
    """Request model for batch DEA lookups"""
    dea_numbers: List[str] = Field(..., description="List of DEA numbers to lookup", min_items=1, max_items=50)
    
    @field_validator('dea_numbers')
    def validate_dea_numbers(cls, v):
        for dea in v:
            if len(dea) != 9 or not dea[:2].isalpha() or not dea[2:].isdigit():
                raise ValueError(f'Invalid DEA number: {dea}. Must be 2 letters followed by 7 digits.')
        return [dea.upper() for dea in v]
