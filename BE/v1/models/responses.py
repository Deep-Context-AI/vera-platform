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
    provider_name: Optional[str] = Field(None, description="Provider name or Organization name")
    provider_type: Optional[str] = Field(None, description="Provider type (Individual/Organization)")
    
    # Taxonomy and specialty information
    primary_taxonomy: Optional[str] = Field(None, description="Primary taxonomy code")
    specialty: Optional[str] = Field(None, description="Primary specialty description")
    secondary_taxonomies: Optional[List[Dict[str, Any]]] = Field(None, description="Secondary taxonomy codes and descriptions")
    
    # License information
    license_state: Optional[str] = Field(None, description="Primary license state")
    license_number: Optional[str] = Field(None, description="Primary license number")
    
    # Address information
    practice_address: Optional[Dict[str, Any]] = Field(None, description="Practice address information")
    mailing_address: Optional[Dict[str, Any]] = Field(None, description="Mailing address information")
    
    # Contact information
    phone: Optional[str] = Field(None, description="Provider phone number")
    fax: Optional[str] = Field(None, description="Provider fax number")
    
    # Status and dates
    is_active: Optional[bool] = Field(None, description="Whether the NPI is active")
    enumeration_date: Optional[str] = Field(None, description="Date NPI was issued (YYYY-MM-DD)")
    last_update_date: Optional[str] = Field(None, description="Last update date (YYYY-MM-DD)")
    
    # Organization-specific fields
    sole_proprietor: Optional[str] = Field(None, description="Sole Proprietor (Yes/No) - for individuals")
    authorized_official: Optional[Dict[str, Any]] = Field(None, description="Authorized official information (for organizations)")
    
    # Additional fields
    gender: Optional[str] = Field(None, description="Provider gender (for individuals)")
    credential: Optional[str] = Field(None, description="Provider credential (e.g., M.D., D.O.)")
    
    # Legacy field for backward compatibility
    address: Optional[Dict[str, Any]] = Field(None, description="Provider address information (deprecated - use practice_address)")

class DEAResponse(BaseResponse):
    """Response model for DEA lookup"""
    dea_number: Optional[str] = Field(None, description="DEA registration number")
    registrant_name: Optional[str] = Field(None, description="Registrant name")
    business_activity: Optional[str] = Field(None, description="Business activity")
    registration_date: Optional[datetime] = Field(None, description="Registration date")
    expiration_date: Optional[datetime] = Field(None, description="Expiration date")
    address: Optional[Dict[str, Any]] = Field(None, description="Registrant address")
    is_active: Optional[bool] = Field(None, description="Whether the DEA registration is active")

class AddressOfRecord(BaseModel):
    """Address of record model for DEA verification"""
    line1: str = Field(..., description="Address line 1")
    line2: Optional[str] = Field(None, description="Address line 2")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State")
    zip: str = Field(..., description="ZIP code")

class DEAVerificationResponse(BaseResponse):
    """Response model for comprehensive DEA verification"""
    verification_date: str = Field(..., description="Date of verification (YYYY-MM-DD)")
    dea_number: str = Field(..., description="DEA registration number")
    practitioner_name: str = Field(..., description="Practitioner name")
    business_activity: str = Field(..., description="Business activity type")
    registration_status: str = Field(..., description="Registration status")
    authorized_schedules: List[str] = Field(..., description="Authorized controlled substance schedules")
    issue_date: str = Field(..., description="DEA issue date (YYYY-MM-DD)")
    expiration_date: str = Field(..., description="DEA expiration date (YYYY-MM-DD)")
    address_of_record: AddressOfRecord = Field(..., description="Address of record")
    state_license_number: str = Field(..., description="State license number")
    state_license_status: str = Field(..., description="State license status")
    state_verified: bool = Field(..., description="Whether state license is verified")
    match_score: int = Field(..., description="Match score (0-100)")
    notes: Optional[str] = Field(None, description="Additional notes")
    document_url: Optional[str] = Field(None, description="URL to verification document")
    verified_by: str = Field(..., description="Verification source")

class ABMSEducation(BaseModel):
    """Education information for ABMS response"""
    degree: str = Field(..., description="Medical degree (e.g., MD, DO)")
    year: int = Field(..., description="Year of graduation")

class ABMSAddress(BaseModel):
    """Address information for ABMS response"""
    city: str = Field(..., description="City")
    country: str = Field(..., description="Country code (e.g., US)")
    postal_code: str = Field(..., description="Postal code")

class ABMSLicense(BaseModel):
    """License information for ABMS response"""
    state: str = Field(..., description="State abbreviation")
    number: str = Field(..., description="License number")

class ABMSCertificationOccurrence(BaseModel):
    """Certification occurrence information"""
    type: str = Field(..., description="Type of certification (e.g., Initial Certification, MOC Recertification)")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")

class ABMSCertification(BaseModel):
    """Board certification information"""
    board_name: str = Field(..., description="Name of the medical board")
    specialty: str = Field(..., description="Medical specialty")
    status: str = Field(..., description="Certification status (e.g., Certified)")
    status_duration: str = Field(..., description="Status duration description")
    occurrences: List[ABMSCertificationOccurrence] = Field(..., description="List of certification occurrences")
    moc_participation: str = Field(..., description="MOC participation status (Yes/No)")

class ABMSProfile(BaseModel):
    """Profile information for ABMS response"""
    name: str = Field(..., description="Full name of the physician")
    abms_uid: str = Field(..., description="ABMS unique identifier")
    viewed: str = Field(..., description="Date/time when profile was viewed (ISO format)")
    date_of_birth: str = Field(..., description="Date of birth (YYYY-MM-DD)")
    education: ABMSEducation = Field(..., description="Education information")
    address: ABMSAddress = Field(..., description="Address information")
    npi: str = Field(..., description="National Provider Identifier")
    licenses: List[ABMSLicense] = Field(..., description="List of medical licenses")
    certifications: List[ABMSCertification] = Field(..., description="List of board certifications")

class ABMSNotes(BaseModel):
    """Notes section for ABMS response"""
    npi_not_for_psv: bool = Field(..., description="NPI not for PSV flag")
    fsmg_license_not_for_psv: bool = Field(..., description="FSMG license not for PSV flag")
    psv_compliance: List[str] = Field(..., description="PSV compliance organizations")
    copyright: str = Field(..., description="Copyright notice")

class ABMSResponse(BaseResponse):
    """Response model for ABMS lookup"""
    profile: Optional[ABMSProfile] = Field(None, description="Physician profile information")
    notes: Optional[ABMSNotes] = Field(None, description="Additional notes and compliance information")

class NPDBAddress(BaseModel):
    """Address model for NPDB responses"""
    line1: str = Field(..., description="Address line 1")
    line2: Optional[str] = Field(None, description="Address line 2")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State")
    zip: str = Field(..., description="ZIP code")

class NPDBSubjectIdentification(BaseModel):
    """Subject identification information"""
    full_name: str = Field(..., description="Full name")
    date_of_birth: str = Field(..., description="Date of birth")
    gender: Optional[str] = Field(None, description="Gender")
    organization_name: Optional[str] = Field(None, description="Organization name")
    work_address: Optional[NPDBAddress] = Field(None, description="Work address")
    home_address: Optional[NPDBAddress] = Field(None, description="Home address")
    ssn_last4: str = Field(..., description="Last 4 digits of SSN")
    dea_number: Optional[str] = Field(None, description="DEA number")
    npi_number: str = Field(..., description="NPI number")
    upin: Optional[str] = Field(None, description="UPIN")
    license_number: str = Field(..., description="License number")
    state_of_license: str = Field(..., description="State of license")
    professional_school: Optional[str] = Field(None, description="Professional school")

class NPDBContinuousQueryInfo(BaseModel):
    """Continuous query information"""
    statuses_queried: List[str] = Field(..., description="Statuses queried")
    query_type: str = Field(..., description="Query type")
    entity_name: str = Field(..., description="Entity name")
    authorized_submitter: str = Field(..., description="Authorized submitter")
    customer_use: str = Field(..., description="Customer use")

class NPDBReportDetail(BaseModel):
    """Report detail information"""
    action_type: Optional[str] = Field(None, description="Action type")
    action_date: Optional[str] = Field(None, description="Action date")
    issuing_state: Optional[str] = Field(None, description="Issuing state")
    description: Optional[str] = Field(None, description="Description")

class NPDBReportType(BaseModel):
    """Report type information"""
    result: str = Field(..., description="Result (Yes/No)")
    details: List[NPDBReportDetail] = Field(default_factory=list, description="Report details")

class NPDBReportSummary(BaseModel):
    """Report summary information"""
    summary_date: str = Field(..., description="Summary date")
    report_types: Dict[str, NPDBReportType] = Field(..., description="Report types")

class NPDBResponse(BaseResponse):
    """Response model for NPDB verification"""
    name: str = Field(..., description="Practitioner name")
    query_response_type: str = Field(..., description="Query response type")
    process_date: str = Field(..., description="Process date")
    subject_identification: NPDBSubjectIdentification = Field(..., description="Subject identification")
    continuous_query_info: NPDBContinuousQueryInfo = Field(..., description="Continuous query info")
    report_summary: NPDBReportSummary = Field(..., description="Report summary")

class SANCTIONResponse(BaseResponse):
    """Response model for sanctions lookup"""
    practitioner_name: Optional[str] = Field(None, description="Practitioner name")
    is_excluded: Optional[bool] = Field(None, description="Whether the practitioner is excluded")
    exclusion_type: Optional[str] = Field(None, description="Type of exclusion")
    exclusion_date: Optional[datetime] = Field(None, description="Exclusion date")
    reinstatement_date: Optional[datetime] = Field(None, description="Reinstatement date if applicable")
    excluding_agency: Optional[str] = Field(None, description="Agency that imposed the exclusion")
    exclusion_reason: Optional[str] = Field(None, description="Reason for exclusion")

class ProviderInfo(BaseModel):
    """Provider information model"""
    full_name: str = Field(..., description="Provider's full name")
    npi: str = Field(..., description="National Provider Identifier")
    dob: str = Field(..., description="Date of birth")
    license_number: str = Field(..., description="License number")
    state: str = Field(..., description="License state")
    ssn_last4: str = Field(..., description="Last 4 digits of SSN")

class SanctionMatch(BaseModel):
    """Individual sanction match model"""
    source: str = Field(..., description="Source of the sanction check")
    matched: bool = Field(..., description="Whether a match was found")
    status: Optional[str] = Field(None, description="Status of the sanction (Active, Resolved, etc.)")
    date: Optional[str] = Field(None, description="Date of the sanction")
    description: Optional[str] = Field(None, description="Description of the sanction")
    type: Optional[str] = Field(None, description="Type of sanction")
    source_url: Optional[str] = Field(None, description="URL to source documentation")
    document_link: Optional[str] = Field(None, description="Link to supporting documents")

class SanctionSummary(BaseModel):
    """Summary of sanctions check"""
    total_sources_checked: int = Field(..., description="Total number of sources checked")
    matches_found: int = Field(..., description="Number of matches found")
    flagged_for_review: bool = Field(..., description="Whether manual review is required")

class ComprehensiveSANCTIONResponse(BaseResponse):
    """Comprehensive response model for sanctions check"""
    provider: ProviderInfo = Field(..., description="Provider information")
    checked_on: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the check")
    sanctions: List[SanctionMatch] = Field(..., description="List of sanction matches from various sources")
    summary: SanctionSummary = Field(..., description="Summary of the sanctions check")

class LADMFMatchedRecord(BaseModel):
    """Matched death record from LADMF"""
    full_name: str = Field(..., description="Name from LADMF record")
    date_of_birth: str = Field(..., description="DOB from LADMF")
    date_of_death: str = Field(..., description="DOD from LADMF")
    social_security_number: str = Field(..., description="SSN match confirmation")
    state_of_issue: str = Field(..., description="State where SSN was issued")
    last_known_residence: str = Field(..., description="ZIP Code of last known address")
    record_status: str = Field(..., description="e.g., Confirmed, Tentative")

class LADMFResponse(BaseResponse):
    """Response model for LADMF (Limited Access Death Master File) verification"""
    match_found: bool = Field(..., description="Whether a record was found in LADMF")
    matched_record: Optional[LADMFMatchedRecord] = Field(None, description="Details of the matched death record")
    match_confidence: str = Field(..., description="Match level: high, medium, low, none")
    verification_timestamp: datetime = Field(default_factory=datetime.utcnow, description="ISO date/time of verification")
    source: str = Field(default="SSA LADMF", description="Source of truth")
    notes: str = Field(..., description="Any flags or contextual remarks")

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

class Practitioner(BaseModel):
    """Practitioner information model for DEA verification"""
    First_name: str = Field(..., description="First name")
    Last_name: str = Field(..., description="Last name")
    Middle_name: Optional[str] = Field(None, description="Middle name")
    Title: str = Field(..., description="Professional title (MD, NP, DO, PA, etc.)")

class RegisteredAddress(BaseModel):
    """Registered address model for DEA verification"""
    street: str = Field(..., description="Street address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State")
    zip: str = Field(..., description="ZIP code")

class NewDEAVerificationResponse(BaseResponse):
    """New response model for DEA verification matching the updated structure"""
    number: str = Field(..., description="DEA registration number")
    practitioner: Practitioner = Field(..., description="Practitioner information")
    registeredAddress: RegisteredAddress = Field(..., description="Registered address")
    expiration: str = Field(..., description="Expiration date (YYYY-MM-DD)")
    paid_status: str = Field(..., description="Payment status (PAID, UNPAID, etc.)")
    drug_schedule_type: str = Field(..., description="Drug schedule type (FULL, LIMITED, etc.)")
    drug_schedules: List[str] = Field(..., description="Authorized drug schedules")
    current_status: str = Field(..., description="Current registration status (ACTIVE, INACTIVE, etc.)")
    has_restrictions: str = Field(..., description="Whether there are restrictions (YES, NO)")
    restriction_details: List[str] = Field(default_factory=list, description="Details of any restrictions")
    business_activity_code: str = Field(..., description="Business activity code")

class MedicalAddress(BaseModel):
    """Address model for Medical verification"""
    line1: str = Field(..., description="Address line 1")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State")
    zip: str = Field(..., description="ZIP code")

class ManagedCareVerification(BaseModel):
    """Managed Care verification details"""
    match_status: str = Field(..., description="Match status (verified, not_found)")
    plan_participation: Optional[List[str]] = Field(None, description="List of participating plans")
    effective_date: Optional[str] = Field(None, description="Effective date (YYYY-MM-DD)")
    last_updated: Optional[str] = Field(None, description="Last updated date (YYYY-MM-DD)")
    address: Optional[MedicalAddress] = Field(None, description="Provider address")
    source_file: Optional[str] = Field(None, description="Source file name")
    reason: Optional[str] = Field(None, description="Reason if not found")

class ORPVerification(BaseModel):
    """ORP (Other Recognized Provider) verification details"""
    match_status: str = Field(..., description="Match status (verified, not_found)")
    status: Optional[str] = Field(None, description="Provider status (Active, Inactive)")
    enrollment_date: Optional[str] = Field(None, description="Enrollment date (YYYY-MM-DD)")
    last_updated: Optional[str] = Field(None, description="Last updated date (YYYY-MM-DD)")
    source_file: Optional[str] = Field(None, description="Source file name")
    reason: Optional[str] = Field(None, description="Reason if not found")

class MedicalVerifications(BaseModel):
    """Combined verification results"""
    managed_care: ManagedCareVerification = Field(..., description="Managed Care verification results")
    orp: ORPVerification = Field(..., description="ORP verification results")

class MedicalResponse(BaseResponse):
    """Response model for Medi-Cal Managed Care + ORP verification"""
    response_id: str = Field(..., description="Unique response identifier")
    npi: str = Field(..., description="National Provider Identifier")
    provider_name: str = Field(..., description="Provider name")
    verification_date: str = Field(..., description="Verification date (YYYY-MM-DD)")
    verifications: MedicalVerifications = Field(..., description="Verification results")
    notes: str = Field(..., description="Additional notes about the verification")

class DCAResponse(BaseResponse):
    """Response model for DCA (Department of Consumer Affairs) CA license verification"""
    board_name: str = Field(..., description="Name of the medical board")
    board_code: str = Field(..., description="Board code identifier")
    license_number: int = Field(..., description="License number")
    license_type: str = Field(..., description="License type code")
    license_type_rank: str = Field(..., description="License type rank")
    primary_status_code: str = Field(..., description="Primary status code")
    secondary_status_code: List[str] = Field(default_factory=list, description="Secondary status codes")
    expiration_date: str = Field(..., description="License expiration date (YYYY-MM-DD)")
    has_discipline: bool = Field(..., description="Whether the license has disciplinary actions")
    has_public_record_actions: bool = Field(..., description="Whether there are public record actions")

class FFSProviderEnrollment(BaseModel):
    """FFS Provider Enrollment verification details"""
    found: bool = Field(..., description="Whether provider was found in FFS enrollment data")
    enrollment_status: Optional[str] = Field(None, description="Enrollment status (e.g., Approved)")
    enrollment_type: Optional[str] = Field(None, description="Enrollment type (e.g., Individual)")
    specialty: Optional[str] = Field(None, description="Provider specialty")
    reassignment: Optional[str] = Field(None, description="Reassignment status (Yes/No)")
    practice_location: Optional[str] = Field(None, description="Practice location address")
    last_updated: Optional[str] = Field(None, description="Last updated date (YYYY-MM-DD)")
    reason: Optional[str] = Field(None, description="Reason if not found")

class OrderingReferringProvider(BaseModel):
    """Ordering/Referring Provider verification details"""
    found: bool = Field(..., description="Whether provider was found in O&R dataset")
    last_name: Optional[str] = Field(None, description="Last name from dataset")
    first_name: Optional[str] = Field(None, description="First name from dataset")
    npi: Optional[str] = Field(None, description="NPI from dataset")
    specialty: Optional[str] = Field(None, description="Specialty from dataset")
    eligible_to_order_or_refer: Optional[bool] = Field(None, description="Whether eligible to order or refer")
    last_updated: Optional[str] = Field(None, description="Last updated date (YYYY-MM-DD)")
    reason: Optional[str] = Field(None, description="Reason if not found")

class MedicareDataSources(BaseModel):
    """Medicare data sources verification results"""
    ffs_provider_enrollment: Optional[FFSProviderEnrollment] = Field(None, description="FFS Provider Enrollment results")
    ordering_referring_provider: Optional[OrderingReferringProvider] = Field(None, description="Ordering/Referring Provider results")

class MedicareResponse(BaseResponse):
    """Response model for Medicare enrollment verification"""
    verification_result: str = Field(..., description="Overall verification result (verified, not_verified)")
    npi: str = Field(..., description="National Provider Identifier")
    full_name: Optional[str] = Field(None, description="Provider full name")
    data_sources: MedicareDataSources = Field(..., description="Data sources verification results")
