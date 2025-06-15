import logging
from typing import Optional, List, Dict, Any
import httpx
from datetime import datetime

from v1.models.requests import MedicareRequest
from v1.models.responses import (
    MedicareResponse, MedicareDataSources, FFSProviderEnrollment, 
    OrderingReferringProvider, ResponseStatus
)
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class MedicareService:
    """Service for Medicare enrollment verification"""
    
    def __init__(self):
        # Note: These would be actual API endpoints in production
        self.ffs_enrollment_url = "https://api.cms.gov/ffs-enrollment/v1"
        self.ordering_referring_url = "https://api.cms.gov/ordering-referring/v1"
        self.timeout = 30.0
        self.api_key = None  # Would be loaded from environment variables
        
        # Dataset update information
        self.ffs_last_updated = "2025-04-01"  # Medicare FFS Providers List last updated
        self.orp_last_updated = "2025-06-13"  # Ordering/Referring Provider list last updated
    
    async def verify_provider(self, request: MedicareRequest) -> MedicareResponse:
        """
        Perform Medicare enrollment verification
        
        Args:
            request: MedicareRequest containing provider information
            
        Returns:
            MedicareResponse with verification results from requested sources
            
        Raises:
            ExternalServiceException: If external service fails
        """
        try:
            logger.info(f"Starting Medicare verification for NPI: {request.npi}, Provider: {request.first_name} {request.last_name}")
            
            # Initialize data sources
            data_sources = MedicareDataSources()
            
            # Perform verifications based on requested sources
            if "ffs_provider_enrollment" in request.verification_sources:
                data_sources.ffs_provider_enrollment = await self._verify_ffs_enrollment(request)
            
            if "ordering_referring_provider" in request.verification_sources:
                data_sources.ordering_referring_provider = await self._verify_ordering_referring(request)
            
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
            
            logger.info(f"Medicare verification completed for NPI: {request.npi}, Result: {verification_result}")
            return response
            
        except Exception as e:
            logger.error(f"Unexpected error during Medicare verification for NPI {request.npi}: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during Medicare verification",
                service_name="Medicare Registry"
            )
    
    async def _verify_ffs_enrollment(self, request: MedicareRequest) -> FFSProviderEnrollment:
        """
        Verify provider in Medicare FFS Provider Enrollment
        
        Args:
            request: MedicareRequest containing provider information
            
        Returns:
            FFSProviderEnrollment with FFS enrollment verification results
        """
        try:
            # Simulate API call delay
            await self._simulate_api_call()
            
            # Mock verification logic based on provider characteristics
            # In production, this would call the actual CMS FFS Enrollment API
            
            # Simulate different scenarios based on NPI patterns
            if request.npi.endswith(('0', '2', '4', '6', '8')):
                # Simulate verified provider
                return FFSProviderEnrollment(
                    found=True,
                    enrollment_status="Approved",
                    enrollment_type="Individual",
                    specialty=request.specialty or "Internal Medicine",
                    reassignment="Yes",
                    practice_location="123 Main St, Springfield, IL 62704",
                    last_updated=self.ffs_last_updated
                )
            else:
                # Simulate not found
                return FFSProviderEnrollment(
                    found=False,
                    reason="NPI not listed in current FFS enrollment data"
                )
                
        except Exception as e:
            logger.error(f"Error during FFS enrollment verification: {e}")
            return FFSProviderEnrollment(
                found=False,
                reason="Error occurred during FFS enrollment verification"
            )
    
    async def _verify_ordering_referring(self, request: MedicareRequest) -> OrderingReferringProvider:
        """
        Verify provider in Medicare Ordering/Referring Provider dataset
        
        Args:
            request: MedicareRequest containing provider information
            
        Returns:
            OrderingReferringProvider with O&R verification results
        """
        try:
            # Simulate API call delay
            await self._simulate_api_call()
            
            # Mock verification logic based on provider characteristics
            # In production, this would call the actual CMS O&R Provider API
            
            # Simulate different scenarios based on NPI patterns and specialty
            if not request.npi.endswith(('1', '3', '5', '7', '9')):
                # Simulate verified provider
                return OrderingReferringProvider(
                    found=True,
                    last_name=request.last_name,
                    first_name=request.first_name,
                    npi=request.npi,
                    specialty=request.specialty or "Internal Medicine",
                    eligible_to_order_or_refer=True,
                    last_updated=self.orp_last_updated
                )
            else:
                # Simulate not found
                return OrderingReferringProvider(
                    found=False,
                    reason="NPI not listed in ordering/referring provider list"
                )
                
        except Exception as e:
            logger.error(f"Error during Ordering/Referring verification: {e}")
            return OrderingReferringProvider(
                found=False,
                reason="Error occurred during Ordering/Referring verification"
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
    
    async def _simulate_api_call(self):
        """Simulate API call delay for demonstration"""
        import asyncio
        await asyncio.sleep(0.1)  # Simulate network delay

# Global service instance
medicare_service = MedicareService() 