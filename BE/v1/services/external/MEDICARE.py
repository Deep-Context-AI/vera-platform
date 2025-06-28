import logging
from typing import Optional, List, Dict, Any
from supabase import Client
from datetime import datetime

from v1.models.requests import MedicareRequest
from v1.models.responses import (
    MedicareResponse, MedicareDataSources, FFSProviderEnrollment, 
    OrderingReferringProvider, ResponseStatus
)
from v1.models.database import MedicareModelEnhanced, PractitionerEnhanced
from v1.services.database import get_supabase_client
from v1.services.practitioner_service import practitioner_service
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class MedicareService:
    """Service for Medicare enrollment verification"""
    
    def __init__(self):
        self.db: Client = get_supabase_client()
    
    async def verify_provider(self, request: MedicareRequest) -> MedicareResponse:
        """
        Perform Medicare enrollment verification through database lookup
        
        Args:
            request: MedicareRequest containing provider information
            
        Returns:
            MedicareResponse with verification results from requested sources
            
        Raises:
            ExternalServiceException: If database query fails
            NotFoundException: If provider not found
        """
        try:
            full_name = f"{request.first_name} {request.last_name}"
            logger.info(f"Starting Medicare verification for NPI: {request.npi}, Provider: {full_name}")
            
            # Look up provider in Medicare database
            medicare_data = await self._lookup_provider_in_db(request)
            
            if not medicare_data:
                logger.info(f"Provider not found in Medicare database: NPI {request.npi}")
                raise NotFoundException(
                    detail=f"Provider with NPI {request.npi} not found in Medicare database"
                )
            
            # Build response from database data
            response = self._build_response_from_db_record(medicare_data, request)
            
            logger.info(f"Medicare verification completed for NPI: {request.npi}")
            return response
            
        except NotFoundException:
            # Re-raise NotFoundException as-is
            raise
        except Exception as e:
            logger.error(f"Unexpected error during Medicare verification for NPI {request.npi}: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise ExternalServiceException(
                detail="Unexpected error during Medicare verification",
                service_name="Medicare Registry"
            )
    
    async def _lookup_provider_in_db(self, request: MedicareRequest) -> Optional[MedicareModelEnhanced]:
        """
        Lookup provider in Medicare database
        
        Args:
            request: MedicareRequest containing provider information
            
        Returns:
            MedicareModelEnhanced or None if not found
        """
        try:
            logger.info(f"Looking up NPI: {request.npi}")
            
            # First try to find by NPI directly
            medicare_response = (
                self.db.schema("vera").table("medicare")
                .select("*")
                .eq("npi_number", request.npi)
                .execute()
            )
            
            logger.info(f"Direct NPI lookup result: {len(medicare_response.data) if medicare_response.data else 0} records found")
            
            if medicare_response.data:
                return MedicareModelEnhanced(**medicare_response.data[0])
            
            # If not found by NPI, try to find by practitioner name
            # First get practitioners matching the name
            practitioners = await practitioner_service.search_practitioners(
                first_name=request.first_name,
                last_name=request.last_name,
                limit=5
            )
            
            # Check if any of these practitioners have medicare records
            for practitioner in practitioners:
                medicare_response = (
                    self.db.schema("vera").table("medicare")
                    .select("*")
                    .eq("practitioner_id", practitioner.id)
                    .execute()
                )
                
                if medicare_response.data:
                    # Check if any record matches the requested NPI
                    for medicare_record in medicare_response.data:
                        if medicare_record.get("npi_number") == request.npi:
                            return MedicareModelEnhanced(**medicare_record)
                    
                    # If no NPI match but practitioner found, return first record
                    return MedicareModelEnhanced(**medicare_response.data[0])
            
            return None
                
        except Exception as e:
            logger.error(f"Error during medicare lookup: {e}")
            return None
    
    def _build_response_from_db_record(self, medicare_data: MedicareModelEnhanced, request: MedicareRequest) -> MedicareResponse:
        """
        Build MedicareResponse from database record
        
        Args:
            medicare_data: MedicareModelEnhanced from database
            request: Original MedicareRequest
            
        Returns:
            MedicareResponse object
        """
        # Initialize data sources
        data_sources = MedicareDataSources()
        
        # Build data sources based on requested sources and available data
        if "ffs_provider_enrollment" in request.verification_sources:
            data_sources.ffs_provider_enrollment = self._build_ffs_enrollment(medicare_data.ffs_provider_enrollment)
        
        if "ordering_referring_provider" in request.verification_sources:
            data_sources.ordering_referring_provider = self._build_ordering_referring(medicare_data.ordering_referring_provider)
        
        # Determine overall verification result
        verification_result = self._determine_verification_result(data_sources, request.verification_sources)
        
        # Combine provider name
        full_name = f"{request.first_name} {request.last_name}"
        
        response = MedicareResponse(
            status=ResponseStatus.SUCCESS,
            message="Medicare verification completed",
            verification_result=verification_result,
            npi=request.npi,
            full_name=full_name,
            data_sources=data_sources
        )
        
        return response
    
    def _build_ffs_enrollment(self, ffs_data: Optional[Dict[str, Any]]) -> FFSProviderEnrollment:
        """
        Build FFSProviderEnrollment from database data
        
        Args:
            ffs_data: FFS Provider Enrollment data from database
            
        Returns:
            FFSProviderEnrollment object
        """
        if not ffs_data:
            return FFSProviderEnrollment(
                found=False,
                reason="No FFS Provider Enrollment data found in database"
            )
        
        # Handle both dict and FFSProviderEnrollmentData object
        if hasattr(ffs_data, 'dict'):
            data = ffs_data.dict()
        else:
            data = ffs_data
        
        # Check if enrollment status indicates the provider is found/active
        enrollment_status = data.get("enrollment_status", "").lower()
        found = enrollment_status in ["approved", "active"]
        
        if found:
            return FFSProviderEnrollment(
                found=True,
                enrollment_status=data.get("enrollment_status"),
                enrollment_type=data.get("enrollment_type"),
                specialty=data.get("specialty"),
                reassignment=data.get("reassignment"),
                practice_location=data.get("practice_location"),
                last_updated=data.get("last_updated")
            )
        else:
            return FFSProviderEnrollment(
                found=False,
                reason=f"Provider enrollment status: {data.get('enrollment_status', 'Unknown')}"
            )
    
    def _build_ordering_referring(self, orp_data: Optional[Dict[str, Any]]) -> OrderingReferringProvider:
        """
        Build OrderingReferringProvider from database data
        
        Args:
            orp_data: Ordering/Referring Provider data from database
            
        Returns:
            OrderingReferringProvider object
        """
        if not orp_data:
            return OrderingReferringProvider(
                found=False,
                reason="No Ordering/Referring Provider data found in database"
            )
        
        # Handle both dict and OrderingReferringProviderData object
        if hasattr(orp_data, 'dict'):
            data = orp_data.dict()
        else:
            data = orp_data
        
        found = data.get("found", False)
        
        if found:
            return OrderingReferringProvider(
                found=True,
                last_name=None,  # Not stored in current schema
                first_name=None,  # Not stored in current schema
                npi=data.get("npi_number"),
                specialty=None,  # Not stored in current schema
                eligible_to_order_or_refer=data.get("eligible_to_order_or_refer"),
                last_updated=data.get("last_updated")
            )
        else:
            return OrderingReferringProvider(
                found=False,
                reason="Provider not found in Ordering/Referring Provider dataset"
            )
    
    def _determine_verification_result(self, data_sources: MedicareDataSources, requested_sources: List[str]) -> str:
        """
        Determine overall verification result based on data source results
        
        Args:
            data_sources: MedicareDataSources with verification results
            requested_sources: List of requested verification sources
            
        Returns:
            String indicating overall verification result
        """
        verified_sources = 0
        total_sources = len(requested_sources)
        
        if "ffs_provider_enrollment" in requested_sources and data_sources.ffs_provider_enrollment:
            if data_sources.ffs_provider_enrollment.found:
                verified_sources += 1
        
        if "ordering_referring_provider" in requested_sources and data_sources.ordering_referring_provider:
            if data_sources.ordering_referring_provider.found:
                verified_sources += 1
        
        # Provider is verified if found in at least one requested source
        return "verified" if verified_sources > 0 else "not_verified"

# Global service instance
medicare_service = MedicareService() 