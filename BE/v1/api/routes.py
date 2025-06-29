from fastapi import APIRouter, Path, Query

from v1.models.requests import (
    NPIRequest, DEAVerificationRequest, ABMSRequest, NPDBRequest,
    ComprehensiveSANCTIONRequest, LADMFRequest,
    MedicalRequest, DCARequest, MedicareRequest, EducationRequest, HospitalPrivilegesRequest
)
from v1.models.responses import (
    NPIResponse, ABMSResponse, NPDBResponse,
    ComprehensiveSANCTIONResponse, LADMFResponse,
    MedicalResponse, DCAResponse, MedicareResponse, EducationResponse,
    NewDEAVerificationResponse, HospitalPrivilegesResponse,
    InboxListResponse, InboxEmailResponse, InboxStatsResponse, EmailActionResponse
)
from v1.services.external.NPI import npi_service
from v1.services.external.DEA import dea_service
from v1.services.external.ABMS import abms_service
from v1.services.external.NPDB import npdb_service
from v1.services.external.SANCTION import sanction_service
from v1.services.external.LADMF import ladmf_service
from v1.services.external.MEDICAL import medical_service
from v1.services.external.DCA import dca_service
from v1.services.external.MEDICARE import medicare_service
from v1.services.external.EDUCATION import education_service
from v1.services.external.HOSPITAL_PRIVILEGES import hospital_privileges_service
from v1.services.database import DatabaseService

# Create router
router = APIRouter()

# Initialize database service
db_service = DatabaseService()

# NPI Endpoints
@router.post(
    "/npi/search",
    response_model=NPIResponse,
    tags=["NPI"],
    summary="Search NPI by criteria (POST)",
    description="Search for National Provider Identifier using detailed search criteria via POST request"
)
async def search_npi_post(request: NPIRequest) -> NPIResponse:
    """Search for NPI using detailed criteria via POST"""
    return await npi_service.lookup_npi(request)

# DEA Endpoints
@router.post(
    "/dea/verify",
    response_model=NewDEAVerificationResponse,
    tags=["DEA"],
    summary="DEA verification",
    description="Verify DEA practitioner with first name, last name, and DEA number (required), other fields optional"
)
async def verify_dea_practitioner(request: DEAVerificationRequest) -> NewDEAVerificationResponse:
    """Verify DEA practitioner - requires first_name, last_name, and dea_number, other fields optional"""
    return await dea_service.verify_dea_practitioner(request)

# ABMS Endpoints
@router.post(
    "/abms/certification",
    response_model=ABMSResponse,
    tags=["ABMS"],
    summary="Lookup board certification",
    description="Retrieve board certification information by physician details"
)
async def get_board_certification(request: ABMSRequest) -> ABMSResponse:
    """Lookup board certification information"""
    return await abms_service.lookup_board_certification(request)

# NPDB Endpoints
@router.post(
    "/npdb/verify",
    response_model=NPDBResponse,
    tags=["NPDB"],
    summary="Verify practitioner in NPDB",
    description="Perform comprehensive NPDB verification with detailed practitioner information"
)
async def verify_npdb_practitioner(request: NPDBRequest) -> NPDBResponse:
    """Verify practitioner in NPDB with comprehensive information"""
    return await npdb_service.verify_practitioner(request)

# Sanctions Endpoints
@router.post(
    "/sanctioncheck",
    response_model=ComprehensiveSANCTIONResponse,
    tags=["Sanctions"],
    summary="Comprehensive sanctions check",
    description="Perform comprehensive sanctions check across multiple sources including OIG LEIE, SAM.gov, State Medicaid, and Medical Boards"
)
async def comprehensive_sanctions_check(request: ComprehensiveSANCTIONRequest) -> ComprehensiveSANCTIONResponse:
    """Perform comprehensive sanctions check with detailed practitioner information"""
    return await sanction_service.comprehensive_sanctions_check(request)

# LADMF Endpoints
@router.post(
    "/ladmf/verify",
    response_model=LADMFResponse,
    tags=["LADMF"],
    summary="Verify death record in LADMF",
    description="Verify if an individual is deceased using the Limited Access Death Master File (SSA LADMF)"
)
async def verify_death_record(request: LADMFRequest) -> LADMFResponse:
    """Verify death record in LADMF with individual's information"""
    return await ladmf_service.verify_death_record(request)

# MEDICAL Endpoints
@router.post(
    "/medical/verify",
    response_model=MedicalResponse,
    tags=["Medical"],
    summary="Medi-Cal Managed Care + ORP verification",
    description="Perform combined verification against Medi-Cal Managed Care and ORP (Other Recognized Provider) networks"
)
async def verify_medical_provider(request: MedicalRequest) -> MedicalResponse:
    """Verify provider in both Medi-Cal Managed Care and ORP systems"""
    return await medical_service.verify_provider(request)

# DCA Endpoints
@router.post(
    "/dca/verify",
    response_model=DCAResponse,
    tags=["DCA"],
    summary="DCA CA license verification",
    description="Verify California license through Department of Consumer Affairs (DCA)"
)
async def verify_dca_license(request: DCARequest) -> DCAResponse:
    """Verify CA license through DCA with provider information"""
    return await dca_service.verify_license(request)

# MEDICARE Endpoints
@router.post(
    "/medicare/verify",
    response_model=MedicareResponse,
    tags=["Medicare"],
    summary="Medicare enrollment verification",
    description="Verify if a provider is enrolled in Medicare and eligible to bill or order/refer"
)
async def verify_medicare_provider(request: MedicareRequest) -> MedicareResponse:
    """Verify provider Medicare enrollment status across FFS and O&R datasets"""
    return await medicare_service.verify_provider(request)

# EDUCATION Endpoints
@router.post(
    "/education/verify",
    response_model=EducationResponse,
    tags=["Education"],
    summary="Education verification with transcript generation and audio conversion",
    description="Verify education credentials and generate transcript with audio conversion using AI services"
)
async def verify_education(request: EducationRequest) -> EducationResponse:
    """Initiate education verification process with transcript generation and audio conversion"""
    return await education_service.verify_education(request)

@router.get(
    "/education/result/{function_call_id}",
    tags=["Education"],
    summary="Get education verification result",
    description="Retrieve the result of an education verification job using the function call ID"
)
async def get_education_result(
    function_call_id: str = Path(..., description="Modal function call ID returned from the verify endpoint")
):
    """Get the result of an education verification job"""
    return await education_service.get_verification_result(function_call_id)

@router.get(
    "/education/audio/{storage_path:path}",
    tags=["Education"],
    summary="Download education verification audio file",
    description="Download the generated audio file using the storage path from the verification result"
)
async def download_education_audio(
    storage_path: str = Path(..., description="Storage path from the verification result (e.g., 2025-01-15/fc-123/audio.mp3)")
):
    """Download the generated audio file"""
    return await education_service.download_audio_file(storage_path)

# Hospital Privileges Endpoints
@router.post(
    "/hospital-privileges/verify",
    response_model=HospitalPrivilegesResponse,
    tags=["Hospital Privileges"],
    summary="Hospital privileges verification with transcript generation and audio conversion",
    description="Verify hospital privileges and generate transcript with audio conversion using AI services"
)
async def verify_hospital_privileges(request: HospitalPrivilegesRequest) -> HospitalPrivilegesResponse:
    """Initiate hospital privileges verification process with transcript generation and audio conversion"""
    return await hospital_privileges_service.verify_hospital_privileges(request)

@router.get(
    "/hospital-privileges/result/{function_call_id}",
    tags=["Hospital Privileges"],
    summary="Get hospital privileges verification result",
    description="Retrieve the result of a hospital privileges verification job using the function call ID"
)
async def get_hospital_privileges_result(
    function_call_id: str = Path(..., description="Modal function call ID returned from the verify endpoint")
):
    """Get the result of a hospital privileges verification job"""
    return await hospital_privileges_service.get_verification_result(function_call_id)

@router.get(
    "/hospital-privileges/audio/{storage_path:path}",
    tags=["Hospital Privileges"],
    summary="Download hospital privileges verification audio file",
    description="Download the generated audio file using the storage path from the verification result"
)
async def download_hospital_privileges_audio(
    storage_path: str = Path(..., description="Storage path from the verification result (e.g., 2025-01-15/fc-123/audio.mp3)")
):
    """Download the generated audio file"""
    return await hospital_privileges_service.download_audio_file(storage_path)

# Inbox Email Endpoints
@router.get(
    "/inbox/emails",
    response_model=InboxListResponse,
    tags=["Inbox"],
    summary="Get inbox emails",
    description="Retrieve paginated list of inbox emails with optional filtering and search"
)
async def get_inbox_emails(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of emails per page"),
    status: str = Query(None, description="Filter by email status (unread, read, archived, flagged, spam)"),
    verification_type: str = Query(None, description="Filter by verification type (education, hospital_privileges, etc.)"),
    practitioner_id: int = Query(None, description="Filter by practitioner ID"),
    search: str = Query(None, description="Search in subject, sender name, or email body")
) -> InboxListResponse:
    """Get paginated list of inbox emails with optional filtering"""
    return await db_service.get_inbox_emails(
        page=page,
        page_size=page_size,
        status=status,
        verification_type=verification_type,
        practitioner_id=practitioner_id,
        search_query=search
    )

@router.get(
    "/inbox/emails/{email_id}",
    response_model=InboxEmailResponse,
    tags=["Inbox"],
    summary="Get specific email",
    description="Retrieve a specific email by its ID"
)
async def get_inbox_email(
    email_id: int = Path(..., description="Email ID")
) -> InboxEmailResponse:
    """Get a specific email by ID"""
    return await db_service.get_inbox_email_by_id(email_id)

@router.post(
    "/inbox/emails/{email_id}/read",
    response_model=EmailActionResponse,
    tags=["Inbox"],
    summary="Mark email as read",
    description="Mark a specific email as read"
)
async def mark_email_as_read(
    email_id: int = Path(..., description="Email ID")
) -> EmailActionResponse:
    """Mark an email as read"""
    return await db_service.mark_email_as_read(email_id)

@router.post(
    "/inbox/emails/{email_id}/status/{new_status}",
    response_model=EmailActionResponse,
    tags=["Inbox"],
    summary="Update email status",
    description="Update the status of a specific email"
)
async def update_email_status(
    email_id: int = Path(..., description="Email ID"),
    new_status: str = Path(..., description="New status (unread, read, archived, flagged, spam)")
) -> EmailActionResponse:
    """Update email status"""
    return await db_service.update_email_status(email_id, new_status)

@router.delete(
    "/inbox/emails/{email_id}",
    response_model=EmailActionResponse,
    tags=["Inbox"],
    summary="Delete email",
    description="Delete a specific email"
)
async def delete_email(
    email_id: int = Path(..., description="Email ID")
) -> EmailActionResponse:
    """Delete an email"""
    return await db_service.delete_email(email_id)

@router.get(
    "/inbox/stats",
    response_model=InboxStatsResponse,
    tags=["Inbox"],
    summary="Get inbox statistics",
    description="Get comprehensive inbox statistics including counts by status, verification type, and recent activity"
)
async def get_inbox_stats() -> InboxStatsResponse:
    """Get inbox statistics"""
    return await db_service.get_inbox_stats()
