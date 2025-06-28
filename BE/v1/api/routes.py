from fastapi import APIRouter, Depends, Query, Path
from fastapi.responses import FileResponse
from typing import Optional, List
from datetime import datetime

from v1.models.requests import (
    NPIRequest, DEAVerificationRequest, ABMSRequest, NPDBRequest,
    ComprehensiveSANCTIONRequest, LADMFRequest, BatchNPIRequest,
    MedicalRequest, DCARequest, MedicareRequest, EducationRequest
)
from v1.models.responses import (
    NPIResponse, ABMSResponse, NPDBResponse,
    SANCTIONResponse, ComprehensiveSANCTIONResponse, LADMFResponse, BatchNPIResponse,
    VerificationSummaryResponse, ResponseStatus, MedicalResponse, DCAResponse, MedicareResponse, EducationResponse,
    NewDEAVerificationResponse
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

# Create router
router = APIRouter()

# NPI Endpoints
@router.get(
    "/npi/{npi}",
    response_model=NPIResponse,
    tags=["NPI"],
    summary="Lookup NPI by number",
    description="Retrieve National Provider Identifier information by NPI number"
)
async def get_npi(
    npi: str = Path(..., description="10-digit National Provider Identifier", pattern=r"^\d{10}$")
) -> NPIResponse:
    """Lookup a single NPI"""
    request = NPIRequest(npi=npi)
    return await npi_service.lookup_npi(request)

@router.get(
    "/npi/search",
    response_model=NPIResponse,
    tags=["NPI"],
    summary="Search NPI by various criteria",
    description="Search for National Provider Identifier using provider name, organization name, or address"
)
async def search_npi(
    npi: Optional[str] = Query(None, description="10-digit National Provider Identifier", pattern=r"^\d{10}$"),
    first_name: Optional[str] = Query(None, description="Provider's first name"),
    last_name: Optional[str] = Query(None, description="Provider's last name"),
    organization_name: Optional[str] = Query(None, description="Organization name"),
    city: Optional[str] = Query(None, description="City"),
    state: Optional[str] = Query(None, description="State abbreviation (2 letters)", pattern=r"^[A-Z]{2}$"),
    postal_code: Optional[str] = Query(None, description="ZIP/Postal code")
) -> NPIResponse:
    """Search for NPI using various criteria"""
    request = NPIRequest(
        npi=npi,
        first_name=first_name,
        last_name=last_name,
        organization_name=organization_name,
        city=city,
        state=state,
        postal_code=postal_code
    )
    return await npi_service.lookup_npi(request)

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

@router.get(
    "/npi/batch",
    response_model=BatchNPIResponse,
    tags=["NPI"],
    summary="Batch NPI lookup",
    description="Lookup multiple NPIs in a single request"
)
async def get_batch_npi(
    npis: List[str] = Query(..., description="List of NPIs to lookup (max 100)")
) -> BatchNPIResponse:
    """Batch lookup multiple NPIs"""
    request = BatchNPIRequest(npis=npis)
    return await npi_service.batch_lookup_npi(request)

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
