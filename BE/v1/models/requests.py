from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class BaseRequest(BaseModel):
    """Base request model with common fields"""
    class Config:
        str_strip_whitespace = True
        validate_assignment = True

class NPIRequest(BaseRequest):
    """Request model for NPI (National Provider Identifier) lookup"""
    npi: str = Field(..., description="10-digit National Provider Identifier", min_length=10, max_length=10)
    
    @validator('npi')
    def validate_npi(cls, v):
        if not v.isdigit():
            raise ValueError('NPI must contain only digits')
        return v

class DEARequest(BaseRequest):
    """Request model for DEA (Drug Enforcement Administration) lookup"""
    dea_number: str = Field(..., description="DEA registration number", min_length=9, max_length=9)
    
    @validator('dea_number')
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
    
    @validator('state')
    def validate_state(cls, v):
        if v:
            return v.upper()
        return v

class NPDBRequest(BaseRequest):
    """Request model for NPDB (National Practitioner Data Bank) lookup"""
    practitioner_name: str = Field(..., description="Practitioner full name", min_length=2, max_length=100)
    license_number: Optional[str] = Field(None, description="Professional license number", max_length=50)
    state: Optional[str] = Field(None, description="State abbreviation", min_length=2, max_length=2)
    
    @validator('state')
    def validate_state(cls, v):
        if v:
            return v.upper()
        return v

class SANCTIONRequest(BaseRequest):
    """Request model for sanctions/exclusions lookup"""
    first_name: str = Field(..., description="First name", min_length=1, max_length=50)
    last_name: str = Field(..., description="Last name", min_length=1, max_length=50)
    state: Optional[str] = Field(None, description="State abbreviation", min_length=2, max_length=2)
    
    @validator('state')
    def validate_state(cls, v):
        if v:
            return v.upper()
        return v

class LADMFRequest(BaseRequest):
    """Request model for LADMF (License and Disciplinary Master File) lookup"""
    license_number: str = Field(..., description="Professional license number", min_length=1, max_length=50)
    state: str = Field(..., description="State abbreviation", min_length=2, max_length=2)
    license_type: Optional[str] = Field(None, description="Type of professional license", max_length=50)
    
    @validator('state')
    def validate_state(cls, v):
        return v.upper()

# Batch request models
class BatchNPIRequest(BaseRequest):
    """Request model for batch NPI lookups"""
    npis: List[str] = Field(..., description="List of NPIs to lookup", min_items=1, max_items=100)
    
    @validator('npis')
    def validate_npis(cls, v):
        for npi in v:
            if not npi.isdigit() or len(npi) != 10:
                raise ValueError(f'Invalid NPI: {npi}. Must be 10 digits.')
        return v

class BatchDEARequest(BaseRequest):
    """Request model for batch DEA lookups"""
    dea_numbers: List[str] = Field(..., description="List of DEA numbers to lookup", min_items=1, max_items=50)
    
    @validator('dea_numbers')
    def validate_dea_numbers(cls, v):
        for dea in v:
            if len(dea) != 9 or not dea[:2].isalpha() or not dea[2:].isdigit():
                raise ValueError(f'Invalid DEA number: {dea}. Must be 2 letters followed by 7 digits.')
        return [dea.upper() for dea in v]
