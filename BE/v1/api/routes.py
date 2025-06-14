from fastapi import APIRouter, Depends, Query, Path
from typing import Optional, List
from datetime import datetime

from models.requests import (
    NPIRequest, DEARequest, DEAVerificationRequest, ABMSRequest, NPDBRequest, 
    SANCTIONRequest, LADMFRequest, BatchNPIRequest, BatchDEARequest
)
from models.responses import (
    NPIResponse, DEAResponse, DEAVerificationResponse, ABMSResponse, NPDBResponse,
    SANCTIONResponse, LADMFResponse, BatchNPIResponse, BatchDEAResponse,
    VerificationSummaryResponse, ResponseStatus
)
from services.external.NPI import npi_service
from services.external.DEA import dea_service
from services.external.ABMS import abms_service
from services.external.NPDB import npdb_service
from services.external.SANCTION import sanction_service
from services.external.LADMF import ladmf_service

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
    npi: str = Path(..., description="10-digit National Provider Identifier", regex=r"^\d{10}$")
) -> NPIResponse:
    """Lookup a single NPI"""
    request = NPIRequest(npi=npi)
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
@router.get(
    "/dea/{dea_number}",
    response_model=DEAResponse,
    tags=["DEA"],
    summary="Lookup DEA registration",
    description="Retrieve DEA registration information by DEA number"
)
async def get_dea(
    dea_number: str = Path(..., description="9-character DEA registration number", regex=r"^[A-Z]{2}\d{7}$")
) -> DEAResponse:
    """Lookup a single DEA registration"""
    request = DEARequest(dea_number=dea_number)
    return await dea_service.lookup_dea(request)

@router.post(
    "/dea/verify",
    response_model=DEAVerificationResponse,
    tags=["DEA"],
    summary="Comprehensive DEA verification",
    description="Perform comprehensive DEA verification with detailed practitioner information"
)
async def verify_dea_practitioner(request: DEAVerificationRequest) -> DEAVerificationResponse:
    """Verify DEA registration with comprehensive practitioner information"""
    return await dea_service.verify_dea_practitioner(request)

@router.get(
    "/dea/batch",
    response_model=BatchDEAResponse,
    tags=["DEA"],
    summary="Batch DEA lookup",
    description="Lookup multiple DEA registrations in a single request"
)
async def get_batch_dea(
    dea_numbers: List[str] = Query(..., description="List of DEA numbers to lookup (max 50)")
) -> BatchDEAResponse:
    """Batch lookup multiple DEA registrations"""
    request = BatchDEARequest(dea_numbers=dea_numbers)
    return await dea_service.batch_lookup_dea(request)

# ABMS Endpoints
@router.get(
    "/abms/certification",
    response_model=ABMSResponse,
    tags=["ABMS"],
    summary="Lookup board certification",
    description="Retrieve board certification information by physician name"
)
async def get_board_certification(
    physician_name: str = Query(..., description="Full name of the physician"),
    state: Optional[str] = Query(None, description="State abbreviation (optional)"),
    specialty: Optional[str] = Query(None, description="Medical specialty (optional)")
) -> ABMSResponse:
    """Lookup board certification information"""
    request = ABMSRequest(physician_name=physician_name, state=state, specialty=specialty)
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
@router.get(
    "/sanctions/exclusions",
    response_model=SANCTIONResponse,
    tags=["Sanctions"],
    summary="Lookup sanctions and exclusions",
    description="Check for sanctions and exclusions from federal healthcare programs"
)
async def get_sanctions(
    first_name: str = Query(..., description="First name of the practitioner"),
    last_name: str = Query(..., description="Last name of the practitioner"),
    state: Optional[str] = Query(None, description="State abbreviation (optional)")
) -> SANCTIONResponse:
    """Lookup sanctions and exclusions"""
    request = SANCTIONRequest(first_name=first_name, last_name=last_name, state=state)
    return await sanction_service.lookup_sanctions(request)

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
