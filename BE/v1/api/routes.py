from fastapi import APIRouter, Depends, Query, Path
from typing import Optional, List

from ..models.requests import (
    NPIRequest, DEARequest, ABMSRequest, NPDBRequest, 
    SANCTIONRequest, LADMFRequest, BatchNPIRequest, BatchDEARequest
)
from ..models.responses import (
    NPIResponse, DEAResponse, ABMSResponse, NPDBResponse,
    SANCTIONResponse, LADMFResponse, BatchNPIResponse, BatchDEAResponse,
    VerificationSummaryResponse, ResponseStatus
)
from ..services.external.NPI import npi_service
from ..services.external.DEA import dea_service
from ..services.external.ABMS import abms_service
from ..services.external.NPDB import npdb_service
from ..services.external.SANCTION import sanction_service
from ..services.external.LADMF import ladmf_service

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
@router.get(
    "/npdb/disciplinary",
    response_model=NPDBResponse,
    tags=["NPDB"],
    summary="Lookup disciplinary actions",
    description="Retrieve disciplinary actions and malpractice reports from NPDB"
)
async def get_disciplinary_actions(
    practitioner_name: str = Query(..., description="Full name of the practitioner"),
    license_number: Optional[str] = Query(None, description="Professional license number (optional)"),
    state: Optional[str] = Query(None, description="State abbreviation (optional)")
) -> NPDBResponse:
    """Lookup disciplinary actions and malpractice reports"""
    request = NPDBRequest(practitioner_name=practitioner_name, license_number=license_number, state=state)
    return await npdb_service.lookup_disciplinary_actions(request)

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
@router.get(
    "/ladmf/license",
    response_model=LADMFResponse,
    tags=["LADMF"],
    summary="Lookup professional license",
    description="Retrieve professional license information and disciplinary history"
)
async def get_license_info(
    license_number: str = Query(..., description="Professional license number"),
    state: str = Query(..., description="State abbreviation"),
    license_type: Optional[str] = Query(None, description="Type of professional license (optional)")
) -> LADMFResponse:
    """Lookup professional license information"""
    request = LADMFRequest(license_number=license_number, state=state, license_type=license_type)
    return await ladmf_service.lookup_license(request)

# Comprehensive Verification Endpoint
@router.get(
    "/verification/comprehensive",
    response_model=VerificationSummaryResponse,
    tags=["Verification"],
    summary="Comprehensive practitioner verification",
    description="Perform comprehensive verification across all available services"
)
async def get_comprehensive_verification(
    practitioner_name: str = Query(..., description="Full name of the practitioner"),
    npi: Optional[str] = Query(None, description="NPI number (optional)"),
    dea_number: Optional[str] = Query(None, description="DEA number (optional)"),
    license_number: Optional[str] = Query(None, description="License number (optional)"),
    state: Optional[str] = Query(None, description="State abbreviation (optional)")
) -> VerificationSummaryResponse:
    """Perform comprehensive verification across all services"""
    
    # Initialize response
    verification_response = VerificationSummaryResponse(
        status=ResponseStatus.SUCCESS,
        message="Comprehensive verification completed",
        practitioner_name=practitioner_name,
        overall_status="Pending"
    )
    
    # Perform NPI verification if provided
    if npi:
        try:
            npi_request = NPIRequest(npi=npi)
            verification_response.npi_verification = await npi_service.lookup_npi(npi_request)
        except Exception as e:
            verification_response.npi_verification = NPIResponse(
                status=ResponseStatus.ERROR,
                message=f"NPI verification failed: {str(e)}",
                npi=npi
            )
    
    # Perform DEA verification if provided
    if dea_number:
        try:
            dea_request = DEARequest(dea_number=dea_number)
            verification_response.dea_verification = await dea_service.lookup_dea(dea_request)
        except Exception as e:
            verification_response.dea_verification = DEAResponse(
                status=ResponseStatus.ERROR,
                message=f"DEA verification failed: {str(e)}",
                dea_number=dea_number
            )
    
    # Perform board certification check
    try:
        abms_request = ABMSRequest(physician_name=practitioner_name, state=state)
        verification_response.board_certification = await abms_service.lookup_board_certification(abms_request)
    except Exception as e:
        verification_response.board_certification = ABMSResponse(
            status=ResponseStatus.ERROR,
            message=f"Board certification check failed: {str(e)}",
            physician_name=practitioner_name
        )
    
    # Perform disciplinary check
    try:
        npdb_request = NPDBRequest(practitioner_name=practitioner_name, license_number=license_number, state=state)
        verification_response.disciplinary_check = await npdb_service.lookup_disciplinary_actions(npdb_request)
    except Exception as e:
        verification_response.disciplinary_check = NPDBResponse(
            status=ResponseStatus.ERROR,
            message=f"Disciplinary check failed: {str(e)}",
            practitioner_name=practitioner_name
        )
    
    # Perform sanctions check
    try:
        # Split name for sanctions check
        name_parts = practitioner_name.split()
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[-1] if len(name_parts) > 1 else ""
        
        sanction_request = SANCTIONRequest(first_name=first_name, last_name=last_name, state=state)
        verification_response.sanctions_check = await sanction_service.lookup_sanctions(sanction_request)
    except Exception as e:
        verification_response.sanctions_check = SANCTIONResponse(
            status=ResponseStatus.ERROR,
            message=f"Sanctions check failed: {str(e)}",
            practitioner_name=practitioner_name
        )
    
    # Perform license verification if provided
    if license_number and state:
        try:
            ladmf_request = LADMFRequest(license_number=license_number, state=state)
            verification_response.license_verification = await ladmf_service.lookup_license(ladmf_request)
        except Exception as e:
            verification_response.license_verification = LADMFResponse(
                status=ResponseStatus.ERROR,
                message=f"License verification failed: {str(e)}",
                license_number=license_number
            )
    
    # Calculate overall status and risk score
    verification_response.overall_status = _calculate_overall_status(verification_response)
    verification_response.risk_score = _calculate_risk_score(verification_response)
    
    return verification_response

def _calculate_overall_status(verification: VerificationSummaryResponse) -> str:
    """Calculate overall verification status"""
    has_exclusions = (
        verification.sanctions_check and 
        verification.sanctions_check.is_excluded
    )
    
    has_disciplinary = (
        verification.disciplinary_check and 
        verification.disciplinary_check.has_reports
    ) or (
        verification.license_verification and 
        verification.license_verification.has_disciplinary_action
    )
    
    if has_exclusions:
        return "HIGH RISK - Excluded"
    elif has_disciplinary:
        return "MEDIUM RISK - Disciplinary Actions Found"
    else:
        return "LOW RISK - No Issues Found"

def _calculate_risk_score(verification: VerificationSummaryResponse) -> float:
    """Calculate risk score (0-100)"""
    score = 0.0
    
    # Sanctions check (highest weight)
    if verification.sanctions_check:
        if verification.sanctions_check.is_excluded:
            score += 50.0
    
    # Disciplinary actions
    if verification.disciplinary_check:
        if verification.disciplinary_check.has_reports:
            score += 20.0
    
    # License disciplinary actions
    if verification.license_verification:
        if verification.license_verification.has_disciplinary_action:
            score += 15.0
    
    # Missing verifications (add small risk for incomplete data)
    if not verification.npi_verification:
        score += 5.0
    if not verification.board_certification:
        score += 5.0
    if not verification.license_verification:
        score += 5.0
    
    return min(score, 100.0)  # Cap at 100
