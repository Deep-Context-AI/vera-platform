import logging
from typing import Optional, List
import httpx
from datetime import datetime
from supabase import Client

from v1.models.requests import DEAVerificationRequest
from v1.models.responses import (
    ResponseStatus, NewDEAVerificationResponse, Practitioner, RegisteredAddress
)
from v1.models.database import DEAModel, PractitionerEnhanced
from v1.services.database import get_supabase_client
from v1.services.practitioner_service import practitioner_service
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class DEAService:
    """Service for DEA (Drug Enforcement Administration) lookups"""
    
    def __init__(self):
        # Database client for DEA data
        self.db: Client = get_supabase_client()
    

    
    async def verify_dea_practitioner(self, request: DEAVerificationRequest) -> NewDEAVerificationResponse:
        """
        Verify DEA practitioner using database lookup
        
        Args:
            request: DEAVerificationRequest with first_name, last_name (required) and dea_number, other fields (optional)
            
        Returns:
            NewDEAVerificationResponse with verification results
            
        Raises:
            NotFoundException: If DEA number is not found
            ExternalServiceException: If database query fails
        """
        try:
            logger.info(f"Starting DEA verification for: {request.first_name} {request.last_name}, DEA: {request.dea_number}")
            
            # Look up DEA in database
            dea_response = (
                self.db.schema("vera").table("dea")
                .select("*")
                .eq("number", request.dea_number)
                .execute()
            )
            
            if not dea_response.data:
                logger.info(f"DEA not found: {request.dea_number}")
                raise NotFoundException(
                    detail=f"DEA number {request.dea_number} not found in database"
                )
            
            dea_data = DEAModel(**dea_response.data[0])
            
            # Get practitioner information if available
            practitioner = None
            if dea_data.practitioner_id:
                try:
                    practitioner = await practitioner_service.get_practitioner_by_id(dea_data.practitioner_id)
                except Exception as e:
                    logger.warning(f"Could not fetch practitioner for DEA {request.dea_number}: {e}")
            
            # Build verification response
            response = self._build_verification_response_from_db_record(dea_data, practitioner, request)
            
            logger.info(f"DEA verification completed for: {request.dea_number}")
            return response
                
        except NotFoundException:
            # Re-raise NotFoundException as-is
            raise
        except Exception as e:
            logger.error(f"Unexpected error during DEA verification for {request.dea_number}: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during DEA verification",
                service_name="DEA Registry"
            )
    

    
    def _build_verification_response_from_db_record(self, dea_data: DEAModel, practitioner: Optional[PractitionerEnhanced], request: DEAVerificationRequest) -> NewDEAVerificationResponse:
        """
        Build comprehensive DEA verification response from database record
        
        Args:
            dea_data: DEAModel from database
            practitioner: Optional practitioner information
            request: Original verification request
            
        Returns:
            NewDEAVerificationResponse object
        """
        # Build practitioner info
        first_name = practitioner.first_name if practitioner else request.first_name
        last_name = practitioner.last_name if practitioner else request.last_name
        middle_name = practitioner.middle_name if practitioner else None
        
        # Determine title from practitioner education or default
        title = "MD"  # Default
        if practitioner and practitioner.education and practitioner.education.degree:
            title = practitioner.education.degree
        
        # Build registered address
        if practitioner and practitioner.mailing_address:
            registered_address = RegisteredAddress(
                street=practitioner.mailing_address.street or "Address Not Available",
                city=practitioner.mailing_address.city or "Unknown City",
                state=practitioner.mailing_address.state or dea_data.state or "Unknown State",
                zip=practitioner.mailing_address.zip or request.zip_code or "00000"
            )
        else:
            registered_address = RegisteredAddress(
                street="Address Not Available",
                city="Unknown City", 
                state=dea_data.state or "Unknown State",
                zip=request.zip_code or "00000"
            )
        
        # Map drug schedules
        drug_schedules = dea_data.authorized_schedules or ["2", "2N", "3", "4", "5"]
        drug_schedule_type = "FULL" if len(drug_schedules) >= 4 else "LIMITED"
        
        # Format expiration date
        expiration_date = dea_data.expiration.isoformat() if dea_data.expiration else request.expiration_date
        
        # Determine restrictions
        has_restrictions = "YES" if dea_data.has_restrictions else "NO"
        restriction_details = dea_data.restriction_details or []
        
        return NewDEAVerificationResponse(
            status=ResponseStatus.SUCCESS,
            message="DEA verification successful",
            number=dea_data.number or request.dea_number,
            practitioner=Practitioner(
                First_name=first_name,
                Last_name=last_name,
                Middle_name=middle_name,
                Title=title
            ),
            registeredAddress=registered_address,
            expiration=expiration_date,
            paid_status=dea_data.paid_status or "UNKNOWN",
            drug_schedule_type=drug_schedule_type,
            drug_schedules=drug_schedules,
            current_status=dea_data.registration_status or "UNKNOWN",
            has_restrictions=has_restrictions,
            restriction_details=restriction_details,
            business_activity_code=dea_data.business_activity_code or "C"
        )

# Global service instance
dea_service = DEAService()
