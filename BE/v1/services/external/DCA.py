import logging
from typing import Optional, List, Dict, Any
from supabase import Client
from datetime import datetime

from v1.models.requests import DCARequest
from v1.models.responses import DCAResponse, ResponseStatus
from v1.models.database import CaliforniaBoardModel, PractitionerEnhanced
from v1.models.dca_reference import DCAReference
from v1.services.database import get_supabase_client
from v1.services.practitioner_service import practitioner_service
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class DCAService:
    """Service for DCA (Department of Consumer Affairs) CA license verification"""
    
    def __init__(self):
        self.db: Client = get_supabase_client()
        self.dca_reference = DCAReference()
    
    async def verify_license(self, request: DCARequest) -> DCAResponse:
        """
        Verify CA license through DCA database lookup
        
        Args:
            request: DCARequest containing provider information
            
        Returns:
            DCAResponse with license verification results
            
        Raises:
            ExternalServiceException: If database query fails
            NotFoundException: If license not found
        """
        try:
            full_name = f"{request.first_name} {request.last_name}"
            logger.info(f"Starting DCA license verification for: {full_name}, License: {request.license_number}")
            
            # Look up license in California Board database
            license_data = await self._lookup_license_in_db(request)
            
            if not license_data:
                logger.info(f"License not found: {request.license_number}")
                raise NotFoundException(
                    detail=f"License number {request.license_number} not found in DCA database"
                )
            
            # Build response from database data
            response = self._build_response_from_db_record(license_data, request)
            
            logger.info(f"DCA license verification completed for license: {request.license_number}")
            return response
            
        except NotFoundException:
            # Re-raise NotFoundException as-is
            raise
        except Exception as e:
            logger.error(f"Unexpected error during DCA license verification for {request.license_number}: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise ExternalServiceException(
                detail="Unexpected error during DCA license verification",
                service_name="DCA License Registry"
            )
    
    async def _lookup_license_in_db(self, request: DCARequest) -> Optional[CaliforniaBoardModel]:
        """
        Lookup license in California Board database
        
        Args:
            request: DCARequest containing provider information
            
        Returns:
            CaliforniaBoardModel or None if not found
        """
        try:
            logger.info(f"Looking up license number: {request.license_number}")
            
            # First try to find by license number directly
            license_response = (
                self.db.schema("vera").table("california_board")
                .select("*")
                .eq("license_number", request.license_number)
                .execute()
            )
            
            logger.info(f"Direct license lookup result: {len(license_response.data) if license_response.data else 0} records found")
            
            if license_response.data:
                return CaliforniaBoardModel(**license_response.data[0])
            
            # If not found by license number, try to find by practitioner name
            # First get practitioners matching the name
            practitioners = await practitioner_service.search_practitioners(
                first_name=request.first_name,
                last_name=request.last_name,
                limit=5
            )
            
            # Check if any of these practitioners have licenses
            for practitioner in practitioners:
                license_response = (
                    self.db.schema("vera").table("california_board")
                    .select("*")
                    .eq("practitioner_id", practitioner.id)
                    .execute()
                )
                
                if license_response.data:
                    # Check if any license matches the requested license number
                    for license_record in license_response.data:
                        if license_record.get("license_number") == request.license_number:
                            return CaliforniaBoardModel(**license_record)
            
            return None
                
        except Exception as e:
            logger.error(f"Error during license lookup: {e}")
            return None
    
    def _build_response_from_db_record(self, license_data: CaliforniaBoardModel, request: DCARequest) -> DCAResponse:
        """
        Build DCAResponse from database record using DCA reference data
        
        Args:
            license_data: CaliforniaBoardModel from database
            request: Original DCARequest
            
        Returns:
            DCAResponse object
        """
        # Use actual values from database or defaults
        board_code = getattr(license_data, 'board_code', None) or "800"
        license_type = license_data.license_type or "8002"
        license_type_rank = getattr(license_data, 'license_type_rank', None) or "A"
        
        # Get enriched information from DCA reference data
        board_name = self.dca_reference.get_board_name(board_code)
        license_type_name = self.dca_reference.get_license_type_name(license_type)
        rank_description = self.dca_reference.get_rank_description(license_type, license_type_rank)
        
        # Map primary status
        primary_status_code = self._map_status_to_code(license_data.primary_status)
        
        # Build secondary status codes
        secondary_status_code = getattr(license_data, 'secondary_status_code', None) or []
        if not secondary_status_code and license_data.has_805_reports:
            secondary_status_code = ["53"]  # PROBATION code for disciplinary action
        
        # Check for disciplinary actions using DCA reference
        has_discipline = license_data.has_805_reports or False
        if not has_discipline:
            has_discipline = self.dca_reference.has_disciplinary_action(secondary_status_code)
        
        # Get status information
        status_info = self.dca_reference.get_status_info(board_code, primary_status_code)
        primary_status_description = status_info.translated_description if status_info else f"Status {primary_status_code}"
        
        # Format issue and expiration dates
        issue_date = license_data.issue_date.isoformat() if license_data.issue_date else "2010-01-01"
        expiration_date = license_data.expiration_date.isoformat() if license_data.expiration_date else "2025-12-31"
        
        # Convert license_number to int (DCAResponse expects int)
        try:
            license_number_int = int(license_data.license_number) if license_data.license_number else 0
        except (ValueError, TypeError):
            # If conversion fails, extract numeric part or use default
            numeric_part = ''.join(filter(str.isdigit, str(license_data.license_number or "0")))
            license_number_int = int(numeric_part) if numeric_part else 0
        
        return DCAResponse(
            status=ResponseStatus.SUCCESS,
            message="DCA license verification completed successfully",
            board_name=board_name,
            board_code=board_code,
            license_number=license_number_int,
            license_type=license_type,
            license_type_name=license_type_name,
            license_type_rank=license_type_rank,
            license_type_rank_description=rank_description,
            primary_status_code=primary_status_code,
            primary_status_description=primary_status_description,
            secondary_status_code=secondary_status_code,
            issue_date=issue_date,
            expiration_date=expiration_date,
            has_discipline=has_discipline,
            has_public_record_actions=license_data.has_public_record_actions or False
        )
    
    def _map_status_to_code(self, status: Optional[str]) -> str:
        """
        Map database status to DCA status code
        
        Args:
            status: Status from database
            
        Returns:
            Status code string
        """
        if not status:
            return "20"  # Default to Active
        
        status_lower = status.lower()
        
        # Map common status values to codes
        status_mapping = {
            "active": "20",
            "current": "20",
            "valid": "20",
            "expired": "40",
            "inactive": "50",
            "suspended": "30",
            "revoked": "60",
            "cancelled": "70",
            "probation": "35"
        }
        
        for key, code in status_mapping.items():
            if key in status_lower:
                return code
        
        # Default to active if no match
        return "20"

# Global service instance
dca_service = DCAService() 