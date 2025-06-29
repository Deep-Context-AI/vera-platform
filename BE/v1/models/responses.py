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
    license_type_name: Optional[str] = Field(None, description="License type name/description")
    license_type_rank: str = Field(..., description="License type rank")
    license_type_rank_description: Optional[str] = Field(None, description="License type rank description")
    primary_status_code: str = Field(..., description="Primary status code")
    primary_status_description: Optional[str] = Field(None, description="Primary status description")
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

class AudioFileInfo(BaseModel):
    """Audio file information model"""
    filename: str = Field(..., description="Generated audio filename")
    format: str = Field(..., description="Audio format (e.g., mp3)")
    size_bytes: int = Field(..., description="File size in bytes")
    duration_estimate: float = Field(..., description="Estimated duration in minutes")
    audio_data: str = Field(..., description="Base64 encoded audio data or URL to cloud storage")
    generated_at: str = Field(..., description="ISO timestamp when audio was generated")

class EducationVerificationDetails(BaseModel):
    """Education verification details model"""
    first_name: str = Field(..., description="First name of the individual")
    last_name: str = Field(..., description="Last name of the individual")
    institution: str = Field(..., description="Educational institution name")
    degree_type: str = Field(..., description="Type of degree")
    graduation_year: int = Field(..., description="Year of graduation")
    verification_type: str = Field(..., description="Type of verification requested")

class EducationResponse(BaseResponse):
    """Response model for education verification with transcript generation and audio conversion"""
    job_id: str = Field(..., description="Unique job identifier for tracking")
    function_call_id: str = Field(..., description="Modal function call ID")
    verification_status: str = Field(..., description="Status of verification (processing, completed, failed)")
    first_name: str = Field(..., description="First name of the individual")
    last_name: str = Field(..., description="Last name of the individual")
    institution: str = Field(..., description="Educational institution name")
    degree_type: str = Field(..., description="Type of degree")
    graduation_year: int = Field(..., description="Year of graduation")
    
    # Optional fields populated when processing is complete
    transcript: Optional[str] = Field(None, description="Generated transcript content")
    audio_file: Optional[AudioFileInfo] = Field(None, description="Generated audio file information")
    processed_at: Optional[str] = Field(None, description="ISO timestamp when processing completed")
    verification_details: Optional[EducationVerificationDetails] = Field(None, description="Detailed verification information")
    error_message: Optional[str] = Field(None, description="Error message if processing failed")

class HospitalPrivilegesVerificationDetails(BaseModel):
    """Hospital privileges verification details model"""
    first_name: str = Field(..., description="First name of the practitioner")
    last_name: str = Field(..., description="Last name of the practitioner")
    npi_number: str = Field(..., description="National Provider Identifier")
    hospital_name: str = Field(..., description="Hospital name where privileges are being verified")
    specialty: str = Field(..., description="Medical specialty for privileges")
    verification_type: str = Field(..., description="Type of verification requested")

class HospitalPrivilegesResponse(BaseResponse):
    """Response model for hospital privileges verification with transcript generation and audio conversion"""
    job_id: str = Field(..., description="Unique job identifier for tracking")
    function_call_id: str = Field(..., description="Modal function call ID")
    verification_status: str = Field(..., description="Status of verification (processing, completed, failed)")
    first_name: str = Field(..., description="First name of the practitioner")
    last_name: str = Field(..., description="Last name of the practitioner")
    npi_number: str = Field(..., description="National Provider Identifier")
    hospital_name: str = Field(..., description="Hospital name where privileges are being verified")
    specialty: str = Field(..., description="Medical specialty for privileges")
    
    # Optional fields populated when processing is complete
    transcript: Optional[str] = Field(None, description="Generated transcript content")
    audio_file: Optional[AudioFileInfo] = Field(None, description="Generated audio file information")
    processed_at: Optional[str] = Field(None, description="ISO timestamp when processing completed")
    verification_details: Optional[HospitalPrivilegesVerificationDetails] = Field(None, description="Detailed verification information")
    error_message: Optional[str] = Field(None, description="Error message if processing failed")

class InboxEmailAttachment(BaseModel):
    """Inbox email attachment model"""
    filename: str = Field(..., description="Attachment filename")
    content_type: str = Field(..., description="MIME content type")
    size_bytes: int = Field(..., description="File size in bytes")
    attachment_id: Optional[str] = Field(None, description="Unique attachment identifier")
    storage_path: Optional[str] = Field(None, description="Path to stored attachment file")

class InboxEmailResponse(BaseModel):
    """Response model for inbox email"""
    id: int = Field(..., description="Email ID")
    message_id: str = Field(..., description="Unique email identifier")
    thread_id: Optional[str] = Field(None, description="Email thread identifier")
    subject: str = Field(..., description="Email subject line")
    sender_email: str = Field(..., description="Sender email address")
    sender_name: str = Field(..., description="Sender display name")
    recipient_email: str = Field(..., description="Recipient email address")
    
    # Email content
    body_text: str = Field(..., description="Plain text email body")
    body_html: Optional[str] = Field(None, description="HTML formatted email body")
    
    # Verification context
    verification_type: str = Field(..., description="Type of verification")
    verification_request_id: Optional[str] = Field(None, description="ID of the original verification request")
    function_call_id: Optional[str] = Field(None, description="Modal function call ID")
    practitioner_id: Optional[int] = Field(None, description="Foreign key to practitioners table")
    
    # Education-specific fields
    institution_name: Optional[str] = Field(None, description="Educational institution name")
    degree_type: Optional[str] = Field(None, description="Type of degree")
    graduation_year: Optional[int] = Field(None, description="Year of graduation")
    student_first_name: Optional[str] = Field(None, description="Student first name")
    student_last_name: Optional[str] = Field(None, description="Student last name")
    
    # Email status and metadata
    status: str = Field(..., description="Email status")
    priority: str = Field(..., description="Email priority")
    is_verified: bool = Field(..., description="Whether this is a verified institutional response")
    
    # Attachments
    attachments: List[InboxEmailAttachment] = Field(default=[], description="List of email attachments")
    
    # Timestamps
    sent_at: datetime = Field(..., description="When the email was sent")
    received_at: datetime = Field(..., description="When the email was received")
    read_at: Optional[datetime] = Field(None, description="When the email was read")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

class InboxListResponse(BaseResponse):
    """Response model for inbox email list"""
    emails: List[InboxEmailResponse] = Field(..., description="List of emails")
    total_count: int = Field(..., description="Total number of emails")
    unread_count: int = Field(..., description="Number of unread emails")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of emails per page")
    total_pages: int = Field(..., description="Total number of pages")

class InboxStatsResponse(BaseResponse):
    """Response model for inbox statistics"""
    total_emails: int = Field(..., description="Total number of emails")
    unread_emails: int = Field(..., description="Number of unread emails")
    read_emails: int = Field(..., description="Number of read emails")
    flagged_emails: int = Field(..., description="Number of flagged emails")
    archived_emails: int = Field(..., description="Number of archived emails")
    emails_by_verification_type: Dict[str, int] = Field(..., description="Email counts by verification type")
    emails_by_priority: Dict[str, int] = Field(..., description="Email counts by priority")
    recent_activity: List[Dict[str, Any]] = Field(..., description="Recent email activity")

class EmailActionResponse(BaseResponse):
    """Response model for email actions (mark as read, archive, etc.)"""
    email_id: int = Field(..., description="Email ID")
    action: str = Field(..., description="Action performed")
    previous_status: str = Field(..., description="Previous email status")
    new_status: str = Field(..., description="New email status")
    updated_at: datetime = Field(..., description="When the action was performed")

class AuditTrailEntryResponse(BaseModel):
    """Simplified response model for audit trail entry"""
    application_id: int = Field(..., description="Application ID")
    step_key: str = Field(..., description="Step-unique-key per external service")
    status: str = Field(..., description="Status at this point in time")
    data: Dict[str, Any] = Field(..., description="What changed - dynamic dictionary")
    notes: Optional[str] = Field(None, description="Notes about this change")
    changed_by: str = Field(..., description="Who made the change")
    timestamp: datetime = Field(..., description="When this audit entry was created")
    previous_status: Optional[str] = Field(None, description="Previous status before this change")
    previous_data: Optional[Dict[str, Any]] = Field(None, description="Previous data before this change")

class AuditTrailResponse(BaseResponse):
    """Response model for audit trail operations"""
    application_id: int = Field(..., description="Application ID")
    entries: List[AuditTrailEntryResponse] = Field(..., description="List of audit trail entries")
    total_entries: int = Field(..., description="Total number of audit entries")
    unique_steps: int = Field(..., description="Number of unique steps")
    latest_activity: Optional[datetime] = Field(None, description="Timestamp of latest activity")

class AuditTrailStepResponse(BaseResponse):
    """Response model for single audit trail step or change"""
    entry: AuditTrailEntryResponse = Field(..., description="Audit trail entry")


