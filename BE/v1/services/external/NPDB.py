import logging
from typing import Optional, List
import httpx
from datetime import datetime

from ...models.requests import NPDBRequest, NPDBAddress
from ...models.responses import (
    NPDBResponse, NPDBSubjectIdentification, NPDBContinuousQueryInfo, 
    NPDBReportSummary, NPDBReportType, NPDBReportDetail, NPDBAddress,
    ResponseStatus, VerificationSummaryResponse
)
from ...exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class NPDBService:
    """Service for NPDB (National Practitioner Data Bank) verification"""
    
    def __init__(self):
        # Note: This is a placeholder URL - actual NPDB API would require proper credentials
        self.base_url = "https://api.npdb.hrsa.gov/v1"
        self.timeout = 30.0
        self.api_key = None  # Would be loaded from environment variables
    
    async def verify_practitioner(self, request: NPDBRequest) -> NPDBResponse:
        """
        Verify practitioner and get detailed NPDB report
        
        Args:
            request: NPDBRequest containing the practitioner information
            
        Returns:
            NPDBResponse with the verification results
            
        Raises:
            NotFoundException: If practitioner is not found
            ExternalServiceException: If external service fails
        """
        try:
            logger.info(f"Verifying NPDB for: {request.first_name} {request.last_name}")
            
            # For demonstration purposes, we'll simulate the lookup
            # In a real implementation, this would call the actual NPDB API
            
            # Simulate API call delay
            await self._simulate_api_call()
            
            # Mock response based on last name pattern
            if request.last_name.lower() == "johnson":
                return self._create_response_with_reports(request)
            elif request.last_name.lower() in ["smith", "doe"]:
                return self._create_clean_response(request)
            else:
                logger.warning(f"NPDB practitioner not found: {request.first_name} {request.last_name}")
                raise NotFoundException(f"Practitioner {request.first_name} {request.last_name} not found in NPDB")
                
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during NPDB verification for {request.first_name} {request.last_name}: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during NPDB verification",
                service_name="NPDB Registry"
            )
    
    async def perform_comprehensive_npdb_verification(
        self, 
        practitioner_name: str, 
        npi: Optional[str] = None, 
        license_number: Optional[str] = None, 
        state: Optional[str] = None
    ) -> NPDBResponse:
        """
        Perform NPDB verification for comprehensive verification
        
        Args:
            practitioner_name: Full name of the practitioner
            npi: NPI number (optional)
            license_number: License number (optional)
            state: State abbreviation (optional)
            
        Returns:
            NPDBResponse with the verification results
        """
        if npi and license_number and state:
            try:
                # Create a mock NPDB request with minimal required data
                npdb_request = NPDBRequest(
                    first_name=practitioner_name.split()[0] if practitioner_name.split() else "Unknown",
                    last_name=practitioner_name.split()[-1] if len(practitioner_name.split()) > 1 else "Unknown",
                    date_of_birth="1980-01-01",  # Mock data - would need to be provided
                    ssn_last4="0000",  # Mock data - would need to be provided
                    address=NPDBAddress(
                        line1="123 Main St",
                        city="Unknown",
                        state=state or "CA",
                        zip="00000"
                    ),
                    npi_number=npi,
                    license_number=license_number,
                    state_of_license=state or "CA"
                )
                return await self.verify_practitioner(npdb_request)
            except Exception as e:
                return NPDBResponse(
                    status=ResponseStatus.ERROR,
                    message=f"NPDB verification failed: {str(e)} - Full NPDB verification requires additional data",
                    name=practitioner_name,
                    query_response_type="Error",
                    process_date=datetime.now().strftime("%Y-%m-%d"),
                    subject_identification=None,
                    continuous_query_info=None,
                    report_summary=None
                )
        else:
            return NPDBResponse(
                status=ResponseStatus.ERROR,
                message="NPDB verification skipped - requires NPI, license number, and state",
                name=practitioner_name,
                query_response_type="Skipped",
                process_date=datetime.now().strftime("%Y-%m-%d"),
                subject_identification=None,
                continuous_query_info=None,
                report_summary=None
            )
    
    def calculate_overall_status(self, verification: VerificationSummaryResponse) -> str:
        """Calculate overall verification status"""
        has_exclusions = (
            verification.sanctions_check and 
            verification.sanctions_check.is_excluded
        )
        
        has_disciplinary = False
        
        # Check NPDB reports
        if (verification.disciplinary_check and 
            verification.disciplinary_check.report_summary and
            verification.disciplinary_check.status == ResponseStatus.SUCCESS):
            for report_type, report_data in verification.disciplinary_check.report_summary.report_types.items():
                if report_data.result == "Yes":
                    has_disciplinary = True
                    break
        
        # Check license disciplinary actions
        if (verification.license_verification and 
            verification.license_verification.has_disciplinary_action):
            has_disciplinary = True
        
        if has_exclusions:
            return "HIGH RISK - Excluded"
        elif has_disciplinary:
            return "MEDIUM RISK - Disciplinary Actions Found"
        else:
            return "LOW RISK - No Issues Found"

    def calculate_risk_score(self, verification: VerificationSummaryResponse) -> float:
        """Calculate risk score (0-100)"""
        score = 0.0
        
        # Sanctions check (highest weight)
        if verification.sanctions_check:
            if verification.sanctions_check.is_excluded:
                score += 50.0
        
        # NPDB disciplinary actions
        if (verification.disciplinary_check and 
            verification.disciplinary_check.report_summary and
            verification.disciplinary_check.status == ResponseStatus.SUCCESS):
            adverse_reports = 0
            for report_type, report_data in verification.disciplinary_check.report_summary.report_types.items():
                if report_data.result == "Yes":
                    adverse_reports += 1
            
            # Weight based on number and type of adverse reports
            if adverse_reports > 0:
                score += min(adverse_reports * 10.0, 30.0)  # Cap NPDB contribution at 30
        
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

    def _create_clean_response(self, request: NPDBRequest) -> NPDBResponse:
        """Create a response with no adverse reports"""
        full_name = f"{request.first_name} {request.last_name}"
        process_date = datetime.now().strftime("%Y-%m-%d")
        
        # Create subject identification
        subject_id = NPDBSubjectIdentification(
            full_name=full_name,
            date_of_birth=request.date_of_birth,
            gender="Male",  # Mock data
            organization_name=request.organization_name,
            work_address=NPDBAddress(
                line1="123 Medical Plaza",
                city=request.address.city,
                state=request.address.state,
                zip=request.address.zip
            ) if request.organization_name else None,
            home_address=NPDBAddress(
                line1=request.address.line1,
                line2=request.address.line2,
                city=request.address.city,
                state=request.address.state,
                zip=request.address.zip
            ),
            ssn_last4=request.ssn_last4,
            dea_number=request.dea_number,
            npi_number=request.npi_number,
            upin=request.upin,
            license_number=request.license_number,
            state_of_license=request.state_of_license,
            professional_school="Stanford University School of Medicine"  # Mock data
        )
        
        # Create continuous query info
        query_info = NPDBContinuousQueryInfo(
            statuses_queried=["Sanctions", "Malpractice", "Licensure"],
            query_type="One-time",
            entity_name="Vera Credentialing Services",
            authorized_submitter="Annie Nguyen",
            customer_use="Initial Credentialing Verification"
        )
        
        # Create clean report summary
        report_summary = NPDBReportSummary(
            summary_date=process_date,
            report_types={
                "medical_malpractice_payment": NPDBReportType(result="No", details=[]),
                "state_licensure_action": NPDBReportType(result="No", details=[]),
                "exclusion_debarment": NPDBReportType(result="No", details=[]),
                "government_admin_action": NPDBReportType(result="No", details=[]),
                "clinical_privileges_action": NPDBReportType(result="No", details=[]),
                "health_plan_action": NPDBReportType(result="No", details=[]),
                "professional_society_action": NPDBReportType(result="No", details=[]),
                "dea_or_federal_licensure_action": NPDBReportType(result="No", details=[]),
                "judgment_or_conviction": NPDBReportType(result="No", details=[]),
                "peer_review_organization_action": NPDBReportType(result="No", details=[])
            }
        )
        
        return NPDBResponse(
            status=ResponseStatus.SUCCESS,
            message="NPDB verification successful - no adverse reports found",
            name=full_name,
            query_response_type="One-time query",
            process_date=process_date,
            subject_identification=subject_id,
            continuous_query_info=query_info,
            report_summary=report_summary
        )
    
    def _create_response_with_reports(self, request: NPDBRequest) -> NPDBResponse:
        """Create a response with adverse reports"""
        full_name = f"{request.first_name} {request.last_name}"
        process_date = datetime.now().strftime("%Y-%m-%d")
        
        # Create subject identification
        subject_id = NPDBSubjectIdentification(
            full_name=full_name,
            date_of_birth=request.date_of_birth,
            gender="Male",  # Mock data
            organization_name=request.organization_name,
            work_address=NPDBAddress(
                line1="123 Medical Plaza",
                city=request.address.city,
                state=request.address.state,
                zip=request.address.zip
            ) if request.organization_name else None,
            home_address=NPDBAddress(
                line1=request.address.line1,
                line2=request.address.line2,
                city=request.address.city,
                state=request.address.state,
                zip=request.address.zip
            ),
            ssn_last4=request.ssn_last4,
            dea_number=request.dea_number,
            npi_number=request.npi_number,
            upin=request.upin,
            license_number=request.license_number,
            state_of_license=request.state_of_license,
            professional_school="Harvard Medical School"  # Mock data
        )
        
        # Create continuous query info
        query_info = NPDBContinuousQueryInfo(
            statuses_queried=["Sanctions", "Malpractice", "Licensure"],
            query_type="One-time",
            entity_name="Vera Credentialing Services",
            authorized_submitter="Annie Nguyen",
            customer_use="Initial Credentialing Verification"
        )
        
        # Create report summary with adverse action
        report_summary = NPDBReportSummary(
            summary_date=process_date,
            report_types={
                "medical_malpractice_payment": NPDBReportType(result="No", details=[]),
                "state_licensure_action": NPDBReportType(
                    result="Yes", 
                    details=[
                        NPDBReportDetail(
                            action_type="Suspension",
                            action_date="2022-01-15",
                            issuing_state=request.state_of_license,
                            description="Suspension due to non-compliance with CME requirements."
                        )
                    ]
                ),
                "exclusion_debarment": NPDBReportType(result="No", details=[]),
                "government_admin_action": NPDBReportType(result="No", details=[]),
                "clinical_privileges_action": NPDBReportType(result="No", details=[]),
                "health_plan_action": NPDBReportType(result="No", details=[]),
                "professional_society_action": NPDBReportType(result="No", details=[]),
                "dea_or_federal_licensure_action": NPDBReportType(result="No", details=[]),
                "judgment_or_conviction": NPDBReportType(result="No", details=[]),
                "peer_review_organization_action": NPDBReportType(result="No", details=[])
            }
        )
        
        return NPDBResponse(
            status=ResponseStatus.SUCCESS,
            message="NPDB verification successful - adverse reports found",
            name=full_name,
            query_response_type="One-time query",
            process_date=process_date,
            subject_identification=subject_id,
            continuous_query_info=query_info,
            report_summary=report_summary
        )
    
    async def _simulate_api_call(self):
        """Simulate API call delay for demonstration"""
        import asyncio
        await asyncio.sleep(0.1)  # Simulate network delay

# Global service instance
npdb_service = NPDBService()
