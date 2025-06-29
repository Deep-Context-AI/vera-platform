import logging
from typing import Optional, List, Dict, Any
from supabase import Client
from datetime import datetime

from v1.models.requests import NPDBRequest, NPDBAddress
from v1.models.responses import (
    NPDBResponse, NPDBSubjectIdentification, NPDBContinuousQueryInfo, 
    NPDBReportSummary, NPDBReportType, NPDBReportDetail, NPDBAddress,
    ResponseStatus, VerificationSummaryResponse
)
from v1.models.database import NPDBModelEnhanced, PractitionerEnhanced
from v1.services.database import get_supabase_client
from v1.services.practitioner_service import practitioner_service
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class NPDBService:
    """Service for NPDB (National Practitioner Data Bank) verification"""
    
    def __init__(self):
        self.db: Client = get_supabase_client()
    
    async def verify_practitioner(self, request: NPDBRequest) -> NPDBResponse:
        """
        Verify practitioner and get detailed NPDB report through database lookup
        
        Args:
            request: NPDBRequest containing the practitioner information
            
        Returns:
            NPDBResponse with the verification results
            
        Raises:
            NotFoundException: If practitioner is not found
            ExternalServiceException: If database query fails
        """
        try:
            full_name = f"{request.first_name} {request.last_name}"
            logger.info(f"Verifying NPDB for: {full_name}")
            
            # Use comprehensive verification with extracted fields
            return await self.perform_comprehensive_npdb_verification(
                practitioner_name=full_name,
                npi=request.npi_number,
                license_number=request.license_number,
                state=request.state_of_license,
                request_data=request  # Pass the full request for detailed response
            )
            
        except NotFoundException:
            # Re-raise NotFoundException as-is
            raise
        except Exception as e:
            logger.error(f"Unexpected error during NPDB verification for {request.first_name} {request.last_name}: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise ExternalServiceException(
                detail="Unexpected error during NPDB verification",
                service_name="NPDB Registry"
            )
    
    async def perform_comprehensive_npdb_verification(
        self, 
        practitioner_name: str, 
        npi: Optional[str] = None, 
        license_number: Optional[str] = None, 
        state: Optional[str] = None,
        request_data: Optional[NPDBRequest] = None
    ) -> NPDBResponse:
        """
        Perform comprehensive NPDB verification through database lookup
        
        Args:
            practitioner_name: Full name of the practitioner
            npi: NPI number (optional)
            license_number: License number (optional)
            state: State abbreviation (optional)
            request_data: Full NPDBRequest for detailed response (optional)
            
        Returns:
            NPDBResponse with the verification results
        """
        try:
            logger.info(f"Performing comprehensive NPDB verification for: {practitioner_name}")
            
            # Look up NPDB data by NPI or name
            npdb_data = await self._lookup_npdb_by_identifiers(npi, license_number, practitioner_name)
            
            if not npdb_data:
                logger.info(f"No NPDB data found for: {practitioner_name}")
                raise NotFoundException(f"Practitioner {practitioner_name} not found in NPDB")
            
            # Build response from database data
            if request_data:
                # Use detailed response with full request data
                response = self._build_detailed_response_from_db_record(npdb_data, request_data)
            else:
                # Use comprehensive response with available data
                response = self._build_comprehensive_response_from_db_record(npdb_data, practitioner_name)
            
            logger.info(f"Comprehensive NPDB verification completed for: {practitioner_name}")
            return response
            
        except NotFoundException:
            # Re-raise NotFoundException as-is
            raise
        except Exception as e:
            logger.error(f"Error during comprehensive NPDB verification for {practitioner_name}: {e}")
            raise ExternalServiceException(
                detail=f"NPDB verification failed: {str(e)}",
                service_name="NPDB Registry"
            )
    
    async def _lookup_npdb_by_identifiers(self, npi: Optional[str], license_number: Optional[str], practitioner_name: str) -> Optional[NPDBModelEnhanced]:
        """
        Lookup NPDB data by various identifiers
        
        Args:
            npi: NPI number
            license_number: License number
            practitioner_name: Practitioner name
            
        Returns:
            NPDBModelEnhanced or None if not found
        """
        try:
            # First try to find by NPI if provided
            if npi:
                npdb_response = (
                    self.db.schema("vera").table("npdb")
                    .select("*")
                    .eq("npi_number", npi)
                    .limit(1)
                    .execute()
                )
                
                if npdb_response.data:
                    return NPDBModelEnhanced(**npdb_response.data[0])
            
            # If not found by NPI, try to find by license number
            if license_number:
                npdb_response = (
                    self.db.schema("vera").table("npdb")
                    .select("*")
                    .eq("license_number", license_number)
                    .limit(1)
                    .execute()
                )
                
                if npdb_response.data:
                    return NPDBModelEnhanced(**npdb_response.data[0])
            
            # If not found by identifiers, try to find by practitioner name
            name_parts = practitioner_name.split()
            if len(name_parts) >= 2:
                first_name = name_parts[0]
                last_name = name_parts[-1]
                
                practitioners = await practitioner_service.search_practitioners(
                    first_name=first_name,
                    last_name=last_name,
                    limit=5
                )
                
                # Check if any of these practitioners have NPDB records
                for practitioner in practitioners:
                    npdb_response = (
                        self.db.schema("vera").table("npdb")
                        .select("*")
                        .eq("practitioner_id", practitioner.id)
                        .limit(1)
                        .execute()
                    )
                    
                    if npdb_response.data:
                        return NPDBModelEnhanced(**npdb_response.data[0])
            
            return None
                
        except Exception as e:
            logger.error(f"Error during NPDB lookup by identifiers: {e}")
            return None
    
    def _build_detailed_response_from_db_record(self, npdb_data: NPDBModelEnhanced, request: NPDBRequest) -> NPDBResponse:
        """
        Build detailed NPDBResponse from database record with full request data
        
        Args:
            npdb_data: NPDBModelEnhanced from database
            request: Original NPDBRequest
            
        Returns:
            NPDBResponse object
        """
        full_name = f"{request.first_name} {request.last_name}"
        process_date = datetime.now().strftime("%Y-%m-%d")
        
        # Create subject identification with full request data
        subject_id = NPDBSubjectIdentification(
            full_name=full_name,
            date_of_birth=request.date_of_birth,
            gender=None,  # Not available in database
            organization_name=getattr(request, 'organization_name', None),
            work_address=None,  # Not available in database
            home_address=NPDBAddress(
                line1=request.address.line1,
                line2=request.address.line2 or "",
                city=request.address.city,
                state=request.address.state,
                zip=request.address.zip
            ),
            ssn_last4=request.ssn_last4,
            dea_number=getattr(request, 'dea_number', None),
            npi_number=npdb_data.npi_number,
            upin=npdb_data.upin,
            license_number=npdb_data.license_number,
            state_of_license=request.state_of_license,
            professional_school=None  # Not available in database
        )
        
        return self._build_response_with_subject_id(npdb_data, full_name, process_date, subject_id)
    
    def _build_comprehensive_response_from_db_record(self, npdb_data: NPDBModelEnhanced, practitioner_name: str) -> NPDBResponse:
        """
        Build NPDBResponse from database record for comprehensive verification
        
        Args:
            npdb_data: NPDBModelEnhanced from database
            practitioner_name: Practitioner name
            
        Returns:
            NPDBResponse object
        """
        process_date = datetime.now().strftime("%Y-%m-%d")
        
        # Create subject identification with available data
        subject_id = NPDBSubjectIdentification(
            full_name=practitioner_name,
            date_of_birth=None,  # Not available in comprehensive mode
            gender=None,  # Not available in database
            organization_name=None,  # Not available in database
            work_address=None,  # Not available in database
            home_address=None,  # Not available in comprehensive mode
            ssn_last4=None,     # Not available in comprehensive mode
            dea_number=None,    # Not available in database
            npi_number=npdb_data.npi_number,
            upin=npdb_data.upin,
            license_number=npdb_data.license_number,
            state_of_license=None,  # Not available in comprehensive mode
            professional_school=None  # Not available in database
        )
        
        return self._build_response_with_subject_id(npdb_data, practitioner_name, process_date, subject_id)
    
    def _build_response_with_subject_id(self, npdb_data: NPDBModelEnhanced, practitioner_name: str, process_date: str, subject_id: NPDBSubjectIdentification) -> NPDBResponse:
        """
        Build NPDBResponse with provided subject identification
        
        Args:
            npdb_data: NPDBModelEnhanced from database
            practitioner_name: Practitioner name
            process_date: Process date string
            subject_id: Subject identification object
            
        Returns:
            NPDBResponse object
        """
        # Create continuous query info
        continuous_query = NPDBContinuousQueryInfo(
            statuses_queried=["Sanctions", "Malpractice", "Licensure"],
            query_type="One-time",
            entity_name="Vera Credentialing Services",
            authorized_submitter="System",
            customer_use="Credentialing Verification"
        )
        
        # Build report summary from database data
        report_types = self._build_report_types_from_db_data(npdb_data)
        
        report_summary = NPDBReportSummary(
            summary_date=process_date,
            report_types=report_types
        )
        
        return NPDBResponse(
            status=ResponseStatus.SUCCESS,
            message="NPDB verification completed successfully",
            name=practitioner_name,
            query_response_type="Query Response",
            process_date=process_date,
            subject_identification=subject_id,
            continuous_query_info=continuous_query,
            report_summary=report_summary
        )
    
    def _build_report_types_from_db_data(self, npdb_data: NPDBModelEnhanced) -> Dict[str, NPDBReportType]:
        """
        Build report types dictionary from database NPDB data
        
        Args:
            npdb_data: NPDBModelEnhanced from database
            
        Returns:
            Dictionary of report types
        """
        report_types = {}
        
        # Map database fields to report types
        field_mapping = {
            "malpractice": "Malpractice",
            "state_licensure_action": "State Licensure Actions",
            "exclusion_debarment": "Exclusions/Debarments",
            "government_admin_action": "Government Administrative Actions",
            "clinical_privileges_action": "Clinical Privileges Actions",
            "health_plan_action": "Health Plan Actions",
            "professional_society_action": "Professional Society Actions",
            "dea_or_federal_licensure_action": "DEA/Federal Licensure Actions",
            "judgment_or_conviction": "Judgments/Convictions",
            "peer_review_organization_action": "Peer Review Organization Actions"
        }
        
        for field_name, report_name in field_mapping.items():
            field_data = getattr(npdb_data, field_name, None)
            
            if field_data and hasattr(field_data, 'result'):
                result = field_data.result or "No"
                details = field_data.details or []
                
                # Create report details if there are any
                report_details = []
                if result == "Yes" and details:
                    for detail in details:
                        report_detail = NPDBReportDetail(
                            action_type=detail.get("type", "Unknown"),
                            action_date=detail.get("date", "Unknown"),
                            issuing_state=detail.get("state", "Unknown"),
                            description=detail.get("description", "No description available")
                        )
                        report_details.append(report_detail)
                
                report_types[field_name] = NPDBReportType(
                    result=result,
                    count=len(details) if details else 0,
                    details=report_details
                )
            else:
                # Default to "No" if no data
                report_types[field_name] = NPDBReportType(
                    result="No",
                    count=0,
                    details=[]
                )
        
        return report_types

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

# Global service instance
npdb_service = NPDBService()
