import logging
from typing import Optional, List
import httpx
from datetime import datetime

from v1.models.requests import DEARequest, DEAVerificationRequest, BatchDEARequest
from v1.models.responses import (
    DEAResponse, DEAVerificationResponse, AddressOfRecord, BatchDEAResponse, ResponseStatus,
    NewDEAVerificationResponse, Practitioner, RegisteredAddress
)
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class DEAService:
    """Service for DEA (Drug Enforcement Administration) lookups"""
    
    def __init__(self):
        # Note: This is a placeholder URL - actual DEA API would require proper credentials
        self.base_url = "https://api.dea.gov/v1"
        self.timeout = 30.0
        self.api_key = None  # Would be loaded from environment variables
    
    async def lookup_dea(self, request: DEARequest) -> DEAResponse:
        """
        Lookup a single DEA registration
        
        Args:
            request: DEARequest containing the DEA number to lookup
            
        Returns:
            DEAResponse with the lookup results
            
        Raises:
            NotFoundException: If DEA number is not found
            ExternalServiceException: If external service fails
        """
        try:
            logger.info(f"Looking up DEA: {request.dea_number}")
            
            # For demonstration purposes, we'll simulate the lookup
            # In a real implementation, this would call the actual DEA API
            
            # Simulate API call delay
            await self._simulate_api_call()
            
            # Mock response based on DEA number pattern
            if request.dea_number.startswith("AB"):
                return DEAResponse(
                    status=ResponseStatus.SUCCESS,
                    message="DEA lookup successful",
                    dea_number=request.dea_number,
                    registrant_name="Dr. John Smith",
                    business_activity="Practitioner",
                    registration_date=datetime(2020, 1, 15),
                    expiration_date=datetime(2025, 1, 15),
                    address={
                        "address_1": "123 Medical Center Dr",
                        "city": "Healthcare City",
                        "state": "CA",
                        "postal_code": "90210"
                    },
                    is_active=True
                )
            else:
                logger.warning(f"DEA not found: {request.dea_number}")
                return DEAResponse(
                    status=ResponseStatus.NOT_FOUND,
                    message=f"DEA number {request.dea_number} not found",
                    dea_number=request.dea_number
                )
                
        except Exception as e:
            logger.error(f"Unexpected error during DEA lookup for {request.dea_number}: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during DEA lookup",
                service_name="DEA Registry"
            )
    
    async def verify_dea_practitioner(self, request: DEAVerificationRequest) -> NewDEAVerificationResponse:
        """
        Perform comprehensive DEA verification
        
        Args:
            request: DEAVerificationRequest containing practitioner information
            
        Returns:
            NewDEAVerificationResponse with comprehensive verification results
            
        Raises:
            ExternalServiceException: If external service fails
        """
        try:
            logger.info(f"Verifying DEA practitioner: {request.first_name} {request.last_name}, DEA: {request.dea_number}")
            
            # Validate required fields
            required_fields = [
                'first_name', 'last_name', 'date_of_birth', 'dea_number', 
                'zip_code', 'last_four_ssn', 'expiration_date'
            ]
            
            for field in required_fields:
                if not getattr(request, field, None):
                    raise ExternalServiceException(
                        detail=f"Missing required field: {field}",
                        service_name="DEA Registry"
                    )
            
            # Simulate API call delay
            await self._simulate_api_call()
            
            # Mock comprehensive verification response
            # In a real implementation, this would call the actual DEA API
            # with all the provided information
            
            return NewDEAVerificationResponse(
                status=ResponseStatus.SUCCESS,
                message="DEA verification successful",
                number=request.dea_number,
                Practitioner=Practitioner(
                    First_name=request.first_name,
                    Last_name=request.last_name,
                    Middle_name=None,  # Not provided in request
                    Title="MD"  # Default title, would be determined from actual API
                ),
                registeredAddress=RegisteredAddress(
                    street="1234 Wellness Ave., Suite 400",
                    city="Los Angeles",
                    state="CA",
                    zip=request.zip_code
                ),
                expiration=request.expiration_date,
                paid_status="PAID",
                drug_schedule_type="FULL",
                drug_schedules=["2", "2-N", "3", "3-N", "4", "5"],
                current_status="ACTIVE",
                has_restrictions="NO",
                restriction_details=[],
                business_activity_code="C"
            )
                
        except Exception as e:
            logger.error(f"Unexpected error during DEA verification for {request.dea_number}: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during DEA verification",
                service_name="DEA Registry"
            )
    
    async def batch_lookup_dea(self, request: BatchDEARequest) -> BatchDEAResponse:
        """
        Lookup multiple DEA registrations
        
        Args:
            request: BatchDEARequest containing the DEA numbers to lookup
            
        Returns:
            BatchDEAResponse with all lookup results
        """
        logger.info(f"Batch DEA lookup for {len(request.dea_numbers)} DEA numbers")
        
        results = []
        found_count = 0
        
        for dea_number in request.dea_numbers:
            try:
                dea_request = DEARequest(dea_number=dea_number)
                result = await self.lookup_dea(dea_request)
                results.append(result)
                
                if result.status == ResponseStatus.SUCCESS:
                    found_count += 1
                    
            except Exception as e:
                logger.error(f"Error in batch lookup for DEA {dea_number}: {e}")
                results.append(DEAResponse(
                    status=ResponseStatus.ERROR,
                    message=f"Error looking up DEA {dea_number}: {str(e)}",
                    dea_number=dea_number
                ))
        
        return BatchDEAResponse(
            status=ResponseStatus.SUCCESS,
            message=f"Batch lookup completed: {found_count}/{len(request.dea_numbers)} found",
            results=results,
            total_requested=len(request.dea_numbers),
            total_found=found_count,
            total_not_found=len(request.dea_numbers) - found_count
        )
    
    async def _simulate_api_call(self):
        """Simulate API call delay for demonstration"""
        import asyncio
        await asyncio.sleep(0.1)  # Simulate network delay

# Global service instance
dea_service = DEAService()
