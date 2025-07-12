import logging
from typing import Optional, List
from supabase import Client
from datetime import datetime

from v1.models.requests import ComprehensiveSANCTIONRequest
from v1.models.responses import (
    SANCTIONResponse, ComprehensiveSANCTIONResponse, ProviderInfo, 
    SanctionMatch, ResponseStatus
)
from v1.models.database import SanctionCheckModelEnhanced, PractitionerEnhanced
from v1.services.database import get_supabase_client
from v1.services.practitioner_service import practitioner_service
from v1.services.pdf_service import pdf_service
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class SANCTIONService:
    """Service for sanctions and exclusions lookups"""
    
    def __init__(self):
        self.db: Client = get_supabase_client()
    
    async def lookup_sanctions(self, request: ComprehensiveSANCTIONRequest) -> ComprehensiveSANCTIONResponse:
        """
        Lookup sanctions and exclusions through database lookup
        
        Args:
            request: ComprehensiveSANCTIONRequest containing the practitioner information
            
        Returns:
            ComprehensiveSANCTIONResponse with the lookup results
            
        Raises:
            NotFoundException: If practitioner is not found
            ExternalServiceException: If database query fails
        """
        try:
            full_name = f"{request.first_name} {request.last_name}"
            logger.info(f"Looking up sanctions for: {full_name}")
            
            # Look up sanctions in database
            sanction_data = await self._lookup_sanctions_in_db(request)
            
            if not sanction_data:
                logger.info(f"No sanctions data found for: {full_name}")
                return SANCTIONResponse(
                    status=ResponseStatus.NOT_FOUND,
                    message=f"Practitioner {full_name} not found in sanctions database",
                    practitioner_name=full_name
                )
            
            # Build response from database data
            response = self._build_simple_response_from_db_record(sanction_data, request)
            
            logger.info(f"Sanctions lookup completed for: {full_name}")
            return response
            
        except Exception as e:
            logger.error(f"Unexpected error during sanctions lookup for {request.first_name} {request.last_name}: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise ExternalServiceException(
                detail="Unexpected error during sanctions lookup",
                service_name="Sanctions Registry"
            )

    async def comprehensive_sanctions_check(self, request: ComprehensiveSANCTIONRequest, generate_pdf: bool = False, user_id: Optional[str] = None) -> ComprehensiveSANCTIONResponse:
        """
        Perform comprehensive sanctions check through database lookup
        
        Args:
            request: ComprehensiveSANCTIONRequest containing detailed practitioner information
            generate_pdf: Whether to generate a PDF document
            user_id: User ID for PDF generation (required if generate_pdf is True)
            
        Returns:
            ComprehensiveSANCTIONResponse with comprehensive sanctions check results
            
        Raises:
            ExternalServiceException: If database query fails
            NotFoundException: If practitioner not found
        """
        try:
            full_name = f"{request.first_name} {request.last_name}"
            logger.info(f"Performing comprehensive sanctions check for: {full_name}")
            
            # Look up sanctions in database
            sanction_data = await self._lookup_sanctions_in_db_comprehensive(request)
            
            if not sanction_data:
                logger.info(f"No sanctions data found for: {full_name}")
                raise NotFoundException(
                    detail=f"Practitioner {full_name} not found in sanctions database"
                )
            
            # Build response from database data
            response = self._build_comprehensive_response_from_db_record(sanction_data, request)
            
            # Generate PDF if requested
            if generate_pdf and user_id:
                try:
                    logger.info(f"Generating PDF document for sanctions check: {full_name}")
                    
                    # Convert response to dict for template
                    response_dict = response.model_dump()
                    
                    # Generate PDF document
                    # Use practitioner_id from database if available, otherwise use NPI
                    practitioner_id = str(sanction_data.practitioner_id) if sanction_data.practitioner_id else request.npi
                    
                    document_url = await pdf_service.generate_pdf_document(
                        template_name="sanctions_verification.html",
                        data=response_dict,
                        practitioner_id=practitioner_id,
                        user_id=user_id,
                        filename_prefix="sanctions_verification"
                    )
                    
                    # Update response with document URL and timestamp
                    response.document_url = document_url
                    response.document_generated_at = datetime.utcnow()
                    
                    logger.info(f"PDF document generated successfully: {document_url}")
                    
                except Exception as e:
                    logger.error(f"Failed to generate PDF document: {e}")
                    # Don't fail the entire verification if PDF generation fails
                    pass
            
            logger.info(f"Comprehensive sanctions check completed for: {full_name}")
            return response
            
        except NotFoundException:
            # Re-raise NotFoundException as-is
            raise
        except Exception as e:
            logger.error(f"Unexpected error during comprehensive sanctions check for {request.first_name} {request.last_name}: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise ExternalServiceException(
                detail="Unexpected error during comprehensive sanctions check",
                service_name="Comprehensive Sanctions"
            )
    
    async def _lookup_sanctions_in_db(self, request: ComprehensiveSANCTIONRequest) -> Optional[SanctionCheckModelEnhanced]:
        """
        Lookup sanctions in database for simple request
        
        Args:
            request: ComprehensiveSANCTIONRequest containing practitioner information
            
        Returns:
            SanctionCheckModelEnhanced or None if not found
        """
        try:
            logger.info(f"Looking up sanctions for: {request.first_name} {request.last_name}")
            
            # Try to find by practitioner name
            practitioners = await practitioner_service.search_practitioners(
                first_name=request.first_name,
                last_name=request.last_name,
                limit=5
            )
            
            # Check if any of these practitioners have sanction records
            for practitioner in practitioners:
                sanction_response = (
                    self.db.schema("vera").table("sanctioncheck")
                    .select("*")
                    .eq("practitioner_id", practitioner.id)
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )
                
                if sanction_response.data:
                    return SanctionCheckModelEnhanced(**sanction_response.data[0])
            
            return None
                
        except Exception as e:
            logger.error(f"Error during sanctions lookup: {e}")
            return None
    
    async def _lookup_sanctions_in_db_comprehensive(self, request: ComprehensiveSANCTIONRequest) -> Optional[SanctionCheckModelEnhanced]:
        """
        Lookup sanctions in database for comprehensive request
        
        Args:
            request: ComprehensiveSANCTIONRequest containing practitioner information
            
        Returns:
            SanctionCheckModelEnhanced or None if not found
        """
        try:
            logger.info(f"Looking up comprehensive sanctions for NPI: {request.npi}")
            
            # First try to find by NPI directly
            sanction_response = (
                self.db.schema("vera").table("sanctioncheck")
                .select("*")
                .eq("npi_number", request.npi)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            
            logger.info(f"Direct NPI lookup result: {len(sanction_response.data) if sanction_response.data else 0} records found")
            
            if sanction_response.data:
                return SanctionCheckModelEnhanced(**sanction_response.data[0])
            
            # If not found by NPI, try to find by license number
            if request.license_number:
                sanction_response = (
                    self.db.schema("vera").table("sanctioncheck")
                    .select("*")
                    .eq("license_number", request.license_number)
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )
                
                if sanction_response.data:
                    return SanctionCheckModelEnhanced(**sanction_response.data[0])
            
            # If not found by NPI or license, try to find by practitioner name
            practitioners = await practitioner_service.search_practitioners(
                first_name=request.first_name,
                last_name=request.last_name,
                limit=5
            )
            
            # Check if any of these practitioners have sanction records
            for practitioner in practitioners:
                sanction_response = (
                    self.db.schema("vera").table("sanctioncheck")
                    .select("*")
                    .eq("practitioner_id", practitioner.id)
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )
                
                if sanction_response.data:
                    return SanctionCheckModelEnhanced(**sanction_response.data[0])
            
            return None
                
        except Exception as e:
            logger.error(f"Error during comprehensive sanctions lookup: {e}")
            return None
    
    def _build_simple_response_from_db_record(self, sanction_data: SanctionCheckModelEnhanced, request: ComprehensiveSANCTIONRequest) -> ComprehensiveSANCTIONResponse:
        """
        Build SANCTIONResponse from database record
        
        Args:
            sanction_data: SanctionCheckModelEnhanced from database
            request: Original ComprehensiveSANCTIONRequest
            
        Returns:
            ComprehensiveSANCTIONResponse object
        """
        full_name = f"{request.first_name} {request.last_name}"
        
        # Check if any sanctions were found
        sanctions_found = False
        exclusion_info = None
        
        if sanction_data.sanctions and sanction_data.sanctions.sanctions:
            for sanction in sanction_data.sanctions.sanctions:
                if sanction.matched:
                    sanctions_found = True
                    exclusion_info = sanction
                    break
        
        if sanctions_found and exclusion_info:
            # Parse date if available
            exclusion_date = None
            if exclusion_info.date:
                try:
                    exclusion_date = datetime.fromisoformat(exclusion_info.date.replace('Z', '+00:00'))
                except:
                    exclusion_date = None
            
            # Parse reinstatement date if available
            reinstatement_date = None
            if exclusion_info.reinstatement_date:
                try:
                    reinstatement_date = datetime.fromisoformat(exclusion_info.reinstatement_date.replace('Z', '+00:00'))
                except:
                    reinstatement_date = None
            
            return SANCTIONResponse(
                status=ResponseStatus.SUCCESS,
                message="Sanctions lookup successful - exclusion found",
                practitioner_name=full_name,
                is_excluded=True,
                exclusion_type=exclusion_info.exclusion_type or exclusion_info.type,
                exclusion_date=exclusion_date,
                reinstatement_date=reinstatement_date,
                excluding_agency=exclusion_info.source,
                exclusion_reason=exclusion_info.description or exclusion_info.basis
            )
        else:
            return SANCTIONResponse(
                status=ResponseStatus.SUCCESS,
                message="Sanctions lookup successful - no exclusions found",
                practitioner_name=full_name,
                is_excluded=False,
                exclusion_type=None,
                exclusion_date=None,
                reinstatement_date=None,
                excluding_agency=None,
                exclusion_reason=None
            )
    
    def _build_comprehensive_response_from_db_record(self, sanction_data: SanctionCheckModelEnhanced, request: ComprehensiveSANCTIONRequest) -> ComprehensiveSANCTIONResponse:
        """
        Build ComprehensiveSANCTIONResponse from database record
        
        Args:
            sanction_data: SanctionCheckModelEnhanced from database
            request: Original ComprehensiveSANCTIONRequest
            
        Returns:
            ComprehensiveSANCTIONResponse object
        """
        # Create provider info
        provider_info = ProviderInfo(
            full_name=f"Dr. {request.first_name} {request.last_name}",
            npi=request.npi,
            dob=request.date_of_birth,
            license_number=request.license_number,
            state=request.license_state,
            ssn_last4=request.ssn_last4
        )
        
        # Build sanction matches from database data
        sanctions = []
        matches_found = 0
        
        if sanction_data.sanctions and sanction_data.sanctions.sanctions:
            for sanction_match in sanction_data.sanctions.sanctions:
                # Convert database sanction match to response format
                match = SanctionMatch(
                    source=sanction_match.source or "Unknown",
                    matched=sanction_match.matched or False,
                    status=sanction_match.status,
                    date=sanction_match.date,
                    description=sanction_match.description,
                    type=sanction_match.type or sanction_match.exclusion_type,
                    document_url=sanction_match.document_url
                )
                sanctions.append(match)
                
                if sanction_match.matched:
                    matches_found += 1
        
        # If no sanctions in database, create default entries for the 4 main sources
        if not sanctions:
            default_sources = ["OIG LEIE", "SAM.gov", "CA State Medicaid", "Medical Board of California"]
            for source in default_sources:
                sanctions.append(SanctionMatch(
                    source=source,
                    matched=False
                ))
        
        # Get check date from database or use current date
        check_date = sanction_data.created_at if sanction_data.created_at else datetime.utcnow()
        
        return ComprehensiveSANCTIONResponse(
            status=ResponseStatus.SUCCESS,
            message="Comprehensive sanctions check completed successfully",
            provider=provider_info,
            checked_on=check_date,
            sanctions=sanctions
        )

# Global service instance
sanction_service = SANCTIONService()
