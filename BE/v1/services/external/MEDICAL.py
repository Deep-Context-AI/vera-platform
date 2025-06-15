import logging
from typing import Optional, List, Dict, Any
import httpx
from datetime import datetime

from v1.models.requests import MedicalRequest
from v1.models.responses import (
    MedicalResponse, MedicalVerifications, ManagedCareVerification, 
    ORPVerification, MedicalAddress, ResponseStatus
)
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class MedicalService:
    """Service for Medi-Cal Managed Care + ORP verification"""
    
    def __init__(self):
        # Note: These would be actual API endpoints in production
        self.managed_care_url = "https://api.medi-cal.ca.gov/managed-care/v1"
        self.orp_url = "https://api.medi-cal.ca.gov/orp/v1"
        self.timeout = 30.0
        self.api_key = None  # Would be loaded from environment variables
    
    async def verify_provider(self, request: MedicalRequest) -> MedicalResponse:
        """
        Perform combined Medi-Cal Managed Care + ORP verification
        
        Args:
            request: MedicalRequest containing provider information
            
        Returns:
            MedicalResponse with verification results from both systems
            
        Raises:
            ExternalServiceException: If external service fails
        """
        try:
            logger.info(f"Starting Medi-Cal verification for NPI: {request.npi}, Provider: {request.first_name} {request.last_name}")
            
            # Perform both verifications concurrently
            managed_care_result = await self._verify_managed_care(request)
            orp_result = await self._verify_orp(request)
            
            # Generate response ID based on request ID
            response_id = request.request_id.replace("verif-", "res-")
            
            # Combine provider name
            provider_name = f"{request.first_name} {request.last_name}"
            
            # Get current date for verification
            verification_date = datetime.now().strftime("%Y-%m-%d")
            
            # Generate notes based on verification results
            notes = self._generate_notes(managed_care_result, orp_result)
            
            # Create combined verification response
            verifications = MedicalVerifications(
                managed_care=managed_care_result,
                orp=orp_result
            )
            
            response = MedicalResponse(
                status=ResponseStatus.SUCCESS,
                message="Medi-Cal verification completed",
                response_id=response_id,
                npi=request.npi,
                provider_name=provider_name,
                verification_date=verification_date,
                verifications=verifications,
                notes=notes
            )
            
            logger.info(f"Medi-Cal verification completed for NPI: {request.npi}")
            return response
            
        except Exception as e:
            logger.error(f"Unexpected error during Medi-Cal verification for NPI {request.npi}: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during Medi-Cal verification",
                service_name="Medi-Cal Registry"
            )
    
    async def _verify_managed_care(self, request: MedicalRequest) -> ManagedCareVerification:
        """
        Verify provider in Medi-Cal Managed Care network
        
        Args:
            request: MedicalRequest containing provider information
            
        Returns:
            ManagedCareVerification with managed care verification results
        """
        try:
            # Simulate API call delay
            await self._simulate_api_call()
            
            # Mock verification logic based on provider characteristics
            # In production, this would call the actual Medi-Cal Managed Care API
            
            # Simulate different scenarios based on NPI patterns
            if request.npi.endswith(('0', '2', '4', '6', '8')):
                # Simulate verified provider
                return ManagedCareVerification(
                    match_status="verified",
                    plan_participation=["Anthem Blue Cross", "Santa Clara Family Health Plan"],
                    effective_date="2021-01-10",
                    last_updated="2025-04-30",
                    address=MedicalAddress(
                        line1="101 Health Way",
                        city=request.city,
                        state=request.state,
                        zip=request.zip
                    ),
                    source_file="Medi-Cal Managed Care Provider Network - April 2025"
                )
            else:
                # Simulate not found
                return ManagedCareVerification(
                    match_status="not_found",
                    reason="Provider not found in the April 2025 Medi-Cal Managed Care file."
                )
                
        except Exception as e:
            logger.error(f"Error during Managed Care verification: {e}")
            return ManagedCareVerification(
                match_status="not_found",
                reason="Error occurred during Managed Care verification"
            )
    
    async def _verify_orp(self, request: MedicalRequest) -> ORPVerification:
        """
        Verify provider in Medi-Cal ORP (Other Recognized Provider) system
        
        Args:
            request: MedicalRequest containing provider information
            
        Returns:
            ORPVerification with ORP verification results
        """
        try:
            # Simulate API call delay
            await self._simulate_api_call()
            
            # Mock verification logic based on provider characteristics
            # In production, this would call the actual Medi-Cal ORP API
            
            # Simulate different scenarios based on license type and NPI patterns
            if request.license_type in ['MD', 'DO', 'NP', 'PA'] and not request.npi.endswith(('1', '3')):
                # Simulate verified provider
                return ORPVerification(
                    match_status="verified",
                    status="Active",
                    enrollment_date="2020-05-20",
                    last_updated="2025-04-30",
                    source_file="Medi-Cal ORP Provider File - April 2025"
                )
            else:
                # Simulate not found
                return ORPVerification(
                    match_status="not_found",
                    reason="No record found in April 2025 Medi-Cal ORP file."
                )
                
        except Exception as e:
            logger.error(f"Error during ORP verification: {e}")
            return ORPVerification(
                match_status="not_found",
                reason="Error occurred during ORP verification"
            )
    
    def _generate_notes(self, managed_care: ManagedCareVerification, orp: ORPVerification) -> str:
        """
        Generate appropriate notes based on verification results
        
        Args:
            managed_care: Managed Care verification results
            orp: ORP verification results
            
        Returns:
            String with appropriate notes
        """
        if managed_care.match_status == "verified" and orp.match_status == "verified":
            return "Provider is actively enrolled in both Managed Care and ORP provider networks under Medi-Cal."
        elif managed_care.match_status == "not_found" and orp.match_status == "verified":
            return "Provider is ORP-approved but not listed as participating in a Medi-Cal Managed Care network."
        elif managed_care.match_status == "verified" and orp.match_status == "not_found":
            return "Provider is listed in Managed Care network but not found in ORP system."
        else:
            return "Provider not verified in either Medi-Cal network. Follow up for enrollment status."
    
    async def _simulate_api_call(self):
        """Simulate API call delay for demonstration"""
        import asyncio
        await asyncio.sleep(0.1)  # Simulate network delay

# Global service instance
medical_service = MedicalService() 