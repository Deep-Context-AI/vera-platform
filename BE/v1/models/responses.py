from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ResponseStatus(str, Enum):
    """Enumeration for response status"""
    SUCCESS = "success"
    ERROR = "error"
    NOT_FOUND = "not_found"
    PARTIAL = "partial"

class BaseResponse(BaseModel):
    """Base response model with common fields"""
    status: ResponseStatus = Field(..., description="Response status")
    message: Optional[str] = Field(None, description="Response message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    class Config:
        use_enum_values = True

class NPIResponse(BaseResponse):
    """Response model for NPI lookup"""
    npi: Optional[str] = Field(None, description="National Provider Identifier")
    provider_name: Optional[str] = Field(None, description="Provider name")
    provider_type: Optional[str] = Field(None, description="Provider type (Individual/Organization)")
    primary_taxonomy: Optional[str] = Field(None, description="Primary taxonomy code")
    specialty: Optional[str] = Field(None, description="Primary specialty")
    license_state: Optional[str] = Field(None, description="Primary license state")
    license_number: Optional[str] = Field(None, description="Primary license number")
    address: Optional[Dict[str, Any]] = Field(None, description="Provider address information")
    phone: Optional[str] = Field(None, description="Provider phone number")
    is_active: Optional[bool] = Field(None, description="Whether the NPI is active")

class DEAResponse(BaseResponse):
    """Response model for DEA lookup"""
    dea_number: Optional[str] = Field(None, description="DEA registration number")
    registrant_name: Optional[str] = Field(None, description="Registrant name")
    business_activity: Optional[str] = Field(None, description="Business activity")
    registration_date: Optional[datetime] = Field(None, description="Registration date")
    expiration_date: Optional[datetime] = Field(None, description="Expiration date")
    address: Optional[Dict[str, Any]] = Field(None, description="Registrant address")
    is_active: Optional[bool] = Field(None, description="Whether the DEA registration is active")

class ABMSResponse(BaseResponse):
    """Response model for ABMS lookup"""
    physician_name: Optional[str] = Field(None, description="Physician name")
    board_certifications: Optional[List[Dict[str, Any]]] = Field(None, description="Board certifications")
    primary_specialty: Optional[str] = Field(None, description="Primary specialty")
    certification_status: Optional[str] = Field(None, description="Certification status")
    initial_certification_date: Optional[datetime] = Field(None, description="Initial certification date")
    recertification_date: Optional[datetime] = Field(None, description="Most recent recertification date")

class NPDBResponse(BaseResponse):
    """Response model for NPDB lookup"""
    practitioner_name: Optional[str] = Field(None, description="Practitioner name")
    has_reports: Optional[bool] = Field(None, description="Whether there are any reports")
    report_count: Optional[int] = Field(None, description="Number of reports")
    report_types: Optional[List[str]] = Field(None, description="Types of reports found")
    last_report_date: Optional[datetime] = Field(None, description="Date of most recent report")

class SANCTIONResponse(BaseResponse):
    """Response model for sanctions lookup"""
    practitioner_name: Optional[str] = Field(None, description="Practitioner name")
    is_excluded: Optional[bool] = Field(None, description="Whether the practitioner is excluded")
    exclusion_type: Optional[str] = Field(None, description="Type of exclusion")
    exclusion_date: Optional[datetime] = Field(None, description="Exclusion date")
    reinstatement_date: Optional[datetime] = Field(None, description="Reinstatement date if applicable")
    excluding_agency: Optional[str] = Field(None, description="Agency that imposed the exclusion")
    exclusion_reason: Optional[str] = Field(None, description="Reason for exclusion")

class LADMFResponse(BaseResponse):
    """Response model for LADMF lookup"""
    license_number: Optional[str] = Field(None, description="License number")
    licensee_name: Optional[str] = Field(None, description="Licensee name")
    license_type: Optional[str] = Field(None, description="Type of license")
    license_status: Optional[str] = Field(None, description="License status")
    issue_date: Optional[datetime] = Field(None, description="License issue date")
    expiration_date: Optional[datetime] = Field(None, description="License expiration date")
    disciplinary_actions: Optional[List[Dict[str, Any]]] = Field(None, description="Disciplinary actions")
    has_disciplinary_action: Optional[bool] = Field(None, description="Whether there are disciplinary actions")

# Batch response models
class BatchNPIResponse(BaseResponse):
    """Response model for batch NPI lookups"""
    results: List[NPIResponse] = Field(..., description="List of NPI lookup results")
    total_requested: int = Field(..., description="Total number of NPIs requested")
    total_found: int = Field(..., description="Total number of NPIs found")
    total_not_found: int = Field(..., description="Total number of NPIs not found")

class BatchDEAResponse(BaseResponse):
    """Response model for batch DEA lookups"""
    results: List[DEAResponse] = Field(..., description="List of DEA lookup results")
    total_requested: int = Field(..., description="Total number of DEA numbers requested")
    total_found: int = Field(..., description="Total number of DEA numbers found")
    total_not_found: int = Field(..., description="Total number of DEA numbers not found")

# Comprehensive verification response
class VerificationSummaryResponse(BaseResponse):
    """Comprehensive verification summary response"""
    practitioner_name: str = Field(..., description="Practitioner name")
    npi_verification: Optional[NPIResponse] = Field(None, description="NPI verification results")
    dea_verification: Optional[DEAResponse] = Field(None, description="DEA verification results")
    board_certification: Optional[ABMSResponse] = Field(None, description="Board certification results")
    disciplinary_check: Optional[NPDBResponse] = Field(None, description="NPDB disciplinary check")
    sanctions_check: Optional[SANCTIONResponse] = Field(None, description="Sanctions check")
    license_verification: Optional[LADMFResponse] = Field(None, description="License verification")
    overall_status: str = Field(..., description="Overall verification status")
    risk_score: Optional[float] = Field(None, description="Risk score (0-100)")
    verification_date: datetime = Field(default_factory=datetime.utcnow, description="Verification date")

# Error response model
class ErrorResponse(BaseResponse):
    """Error response model"""
    error_code: str = Field(..., description="Error code")
    error_details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    
    def __init__(self, **data):
        if 'status' not in data:
            data['status'] = ResponseStatus.ERROR
        super().__init__(**data)
