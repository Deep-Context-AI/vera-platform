from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProviderEducation(BaseModel):
    """Provider education information"""
    degree: Optional[str] = None
    medical_school: Optional[str] = None
    graduation_year: Optional[int] = None


class ProviderAddress(BaseModel):
    """Provider address information"""
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    country: Optional[str] = None


class ProviderDemographics(BaseModel):
    """Provider demographics information"""
    gender: Optional[str] = None
    race: Optional[str] = None
    ethnicity: Optional[str] = None
    birth_date: Optional[str] = None


class MalpracticeInsurance(BaseModel):
    """Malpractice insurance information"""
    carrier: Optional[str] = None
    coverage_start: Optional[str] = None
    coverage_end: Optional[str] = None
    policy_number: Optional[str] = None


class WorkHistoryEntry(BaseModel):
    """Work history entry"""
    organization: str
    position: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ECFMGInfo(BaseModel):
    """ECFMG information"""
    ecfmg_number: Optional[str] = None
    ecfmg_certified: Optional[bool] = None
    certification_date: Optional[str] = None
    is_international_medical_graduate: Optional[bool] = None


class Provider(BaseModel):
    """Provider information"""
    id: int
    name: str
    first_name: str
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    suffix: Optional[str] = None
    npi: Optional[str] = None
    license_number: Optional[str] = None
    dea_number: Optional[str] = None
    education: Optional[ProviderEducation] = None
    demographics: Optional[ProviderDemographics] = None
    home_address: Optional[ProviderAddress] = None
    mailing_address: Optional[ProviderAddress] = None
    languages: Optional[List[str]] = None
    ssn: Optional[str] = None


class Application(BaseModel):
    """Application information"""
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    work_history: Optional[List[WorkHistoryEntry]] = None
    malpractice_insurance: Optional[MalpracticeInsurance] = None
    ecfmg: Optional[ECFMGInfo] = None
    previous_approval_date: Optional[datetime] = None
    notes: Optional[str] = None


class VerificationProgress(BaseModel):
    """Verification progress metrics"""
    completed_steps: int = Field(..., description="Number of completed verification steps")
    total_steps: int = Field(..., description="Total number of verification steps")
    percentage: float = Field(..., description="Completion percentage")


class ProviderProfileResponse(BaseModel):
    """Complete provider profile response"""
    application_id: int
    provider: Provider
    application: Application
    verification_progress: VerificationProgress


class VerificationStepSummary(BaseModel):
    """Summary of a verification step"""
    step_key: str
    step_name: str
    status: str
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    has_documents: bool = False
    activity_count: int = 0
    decision_reasoning: Optional[str] = None


class VerificationStepsResponse(BaseModel):
    """Response containing verification steps summary"""
    steps: List[VerificationStepSummary]


class ExecutionDetails(BaseModel):
    """Execution details for a verification step"""
    invocation_type: str
    request_data: Optional[Dict[str, Any]] = None
    response_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_by: str
    created_at: datetime
    document_url: Optional[str] = None


class StepResult(BaseModel):
    """Result of a verification step analysis"""
    decision: Optional[str] = None
    reasoning: Optional[str] = None


class ActivityLogEntry(BaseModel):
    """Activity log entry"""
    id: int
    action: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    timestamp: datetime
    source: Optional[str] = None
    notes: Optional[str] = None


class StepDetailsResponse(BaseModel):
    """Detailed information for a verification step"""
    step_key: str
    step_name: str
    status: str
    execution_details: Optional[ExecutionDetails] = None
    result: Optional[StepResult] = None
    activity_log: List[ActivityLogEntry] = []


class Actor(BaseModel):
    """Actor information"""
    id: str
    name: str
    email: Optional[str] = None


class ActivityEntry(BaseModel):
    """Activity timeline entry"""
    id: int
    action: str
    actor: Optional[Actor] = None
    timestamp: datetime
    source: Optional[str] = None
    notes: Optional[str] = None


class ActivityResponse(BaseModel):
    """Response containing activity history"""
    activities: List[ActivityEntry]


class Document(BaseModel):
    """Document information"""
    id: str
    name: str
    type: str
    category: str
    step_key: str
    url: str
    generated_at: datetime
    size_estimate: str
    format: str


class DocumentsResponse(BaseModel):
    """Response containing documents list"""
    documents: List[Document]


class AvailableStep(BaseModel):
    """Available verification step"""
    step_key: str
    name: str
    display_name: str


class VerificationStepsRegistryResponse(BaseModel):
    """Response containing available verification steps"""
    available_steps: List[AvailableStep]
    total_steps: int


class VerificationStepResult(BaseModel):
    """Individual verification step result"""
    step_key: str
    decision: str
    reasoning: Optional[str] = None
    status: str
    metadata: Optional[Dict[str, Any]] = None


class SyncVerificationResponse(BaseModel):
    """Response from synchronous verification endpoint"""
    application_id: int
    status: str
    verification_results: Dict[str, VerificationStepResult]
    summary: Dict[str, Any]


class SyncVerificationRequest(BaseModel):
    """Request for synchronous verification"""
    application_id: int
    step_key: str
    requester: str = "annie.nguyen1128@gmail.com" 