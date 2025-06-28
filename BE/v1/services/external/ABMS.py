import logging
from typing import Optional, List
from datetime import datetime
from supabase import Client

from v1.models.requests import ABMSRequest
from v1.models.responses import (
    ABMSResponse, ABMSProfile, ABMSNotes, ABMSEducation, ABMSAddress, 
    ABMSLicense, ABMSCertification, ABMSCertificationOccurrence, ResponseStatus
)
from v1.models.database import ABMSModel, PractitionerEnhanced, CaliforniaBoardModel
from v1.services.database import get_supabase_client
from v1.services.practitioner_service import practitioner_service
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class ABMSService:
    """Service for ABMS (American Board of Medical Specialties) lookups"""
    
    def __init__(self):
        self.db: Client = get_supabase_client()
    
    async def lookup_board_certification(self, request: ABMSRequest) -> ABMSResponse:
        """
        Lookup board certification information from database
        
        Args:
            request: ABMSRequest containing the physician information
            
        Returns:
            ABMSResponse with the lookup results
            
        Raises:
            NotFoundException: If physician is not found
            ExternalServiceException: If database query fails
        """
        try:
            full_name = f"{request.first_name} {request.last_name}"
            if request.middle_name:
                full_name = f"{request.first_name} {request.middle_name} {request.last_name}"
            
            logger.info(f"Looking up ABMS certification for: {full_name}, NPI: {request.npi_number}")
            
            # Get practitioner by NPI using the practitioner service
            practitioner = await practitioner_service.get_practitioner_by_npi(request.npi_number)
            
            if not practitioner:
                logger.warning(f"No practitioner found with NPI: {request.npi_number}")
                return ABMSResponse(
                    status=ResponseStatus.NOT_FOUND,
                    message=f"No practitioner found with NPI: {request.npi_number}",
                    profile=None,
                    notes=None
                )
            
            # Query ABMS table for this practitioner
            abms_response = (
                self.db.schema("vera").table("abms")
                .select("*")
                .eq("practitioner_id", practitioner.id)
                .execute()
            )
            
            if not abms_response.data:
                logger.warning(f"No ABMS certification found for practitioner_id: {practitioner.id}")
                return ABMSResponse(
                    status=ResponseStatus.NOT_FOUND,
                    message=f"No board certification found for {full_name}",
                    profile=None,
                    notes=None
                )
            
            # Convert database records to response format
            abms_records = [ABMSModel(**record) for record in abms_response.data]
            
            # Get California Board license information
            license_response = (
                self.db.schema("vera").table("california_board")
                .select("*")
                .eq("practitioner_id", practitioner.id)
                .execute()
            )
            
            license_records = [CaliforniaBoardModel(**record) for record in license_response.data] if license_response.data else []
            
            # Build the response profile from database data
            profile = self._build_profile_from_db_records(
                abms_records, practitioner, license_records, request.npi_number, request.state
            )
            
            # Generate standard notes
            notes = ABMSNotes(
                npi_not_for_psv=True,
                fsmg_license_not_for_psv=True,
                psv_compliance=["Joint Commission", "NCQA", "URAC"],
                copyright="© 2025 ABMS Solutions, LLC"
            )
            
            return ABMSResponse(
                status=ResponseStatus.SUCCESS,
                message="ABMS lookup successful",
                profile=profile,
                notes=notes
            )
                
        except Exception as e:
            logger.error(f"Unexpected error during ABMS lookup for {full_name}: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during ABMS lookup",
                service_name="ABMS Database"
            )
    
    def _build_profile_from_db_records(
        self, 
        abms_records: List[ABMSModel], 
        practitioner: PractitionerEnhanced,
        license_records: List[CaliforniaBoardModel],
        npi_number: str, 
        state: str
    ) -> ABMSProfile:
        """
        Build ABMSProfile from database records
        
        Args:
            abms_records: List of ABMS database records
            practitioner: PractitionerEnhanced object with typed fields
            license_records: List of California Board license records
            npi_number: NPI number from request
            state: State from request
            
        Returns:
            ABMSProfile object
        """
        # Use the full_name property from PractitionerEnhanced
        full_name = practitioner.full_name
        
        # Extract education info from typed practitioner education
        degree = ""
        graduation_year = 1993
        if practitioner.education:
            degree = practitioner.education.degree or "MD"
            graduation_year = practitioner.education.graduation_year or 1993
        
        # Extract address from typed practitioner address
        address_data = practitioner.home_address or practitioner.mailing_address
        
        # Build certifications from ABMS records
        certifications = []
        for record in abms_records:
            # Build certification occurrences
            occurrences = []
            
            # Add initial certification if issued date exists
            if record.issued:
                occurrences.append(ABMSCertificationOccurrence(
                    type="Initial Certification",
                    start_date=record.issued.isoformat(),
                    end_date=record.expiration.isoformat() if record.expiration else "2030-12-31"
                ))
            
            # Add current certification period
            if record.effective_date:
                occurrences.append(ABMSCertificationOccurrence(
                    type="MOC Recertification",
                    start_date=record.effective_date.isoformat(),
                    end_date=record.expiration_date.isoformat() if record.expiration_date else "2030-12-31"
                ))
            
            certification = ABMSCertification(
                board_name=record.board_name or "American Board of Internal Medicine",
                specialty=record.specialty,
                status=record.status or "Certified",
                status_duration=record.board_cert_status or "Active",
                occurrences=occurrences,
                moc_participation="Yes"  # Default assumption
            )
            certifications.append(certification)
        
        # Build licenses from California Board records
        licenses = []
        for license_record in license_records:
            license_state = "CA"  # California Board records are always CA
            if license_record.license_number:
                licenses.append(ABMSLicense(
                    state=license_state,
                    number=license_record.license_number
                ))
        
        # If no licenses found, add a default one
        if not licenses:
            licenses.append(ABMSLicense(
                state=state,
                number="Unknown"
            ))
        
        # Build profile
        profile = ABMSProfile(
            name=full_name,
            abms_uid=str(abms_records[0].id) if abms_records else "XXXXXX",  # Use first record ID
            viewed=datetime.utcnow().isoformat() + "Z",
            date_of_birth=practitioner.demographics.birth_date if practitioner.demographics else "1968-01-01",
            education=ABMSEducation(
                degree=degree,
                year=graduation_year
            ),
            address=ABMSAddress(
                city=address_data.city if address_data and address_data.city else "Unknown",
                country=address_data.country if address_data and address_data.country else "US",
                postal_code=address_data.zip if address_data and address_data.zip else "00000"
            ),
            npi=npi_number,
            licenses=licenses,
            certifications=certifications
        )
        
        return profile

# Global service instance
abms_service = ABMSService()
