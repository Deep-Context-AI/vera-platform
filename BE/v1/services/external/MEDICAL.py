import logging
from typing import Optional, List, Dict, Any
from supabase import Client
from datetime import datetime

from v1.models.requests import MedicalRequest
from v1.models.responses import (
    MedicalResponse, MedicalVerifications, ManagedCareVerification, 
    ORPVerification, MedicalAddress, ResponseStatus
)
from v1.models.database import MedicalModelEnhanced, PractitionerEnhanced
from v1.services.database import get_supabase_client
from v1.services.practitioner_service import practitioner_service
from v1.services.pdf_service import pdf_service
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class MedicalService:
    """Service for Medi-Cal Managed Care + ORP verification"""
    
    def __init__(self):
        self.db: Client = get_supabase_client()
    
    async def verify_provider(self, request: MedicalRequest, generate_pdf: bool = False, user_id: Optional[str] = None) -> MedicalResponse:
        """
        Perform Medi-Cal Managed Care + ORP verification through database lookup
        
        Args:
            request: MedicalRequest containing provider information
            generate_pdf: Whether to generate a PDF document
            user_id: User ID for PDF generation (required if generate_pdf is True)
            
        Returns:
            MedicalResponse with verification results from both systems
            
        Raises:
            ExternalServiceException: If database query fails
            NotFoundException: If provider not found
        """
        try:
            full_name = f"{request.first_name} {request.last_name}"
            logger.info(f"Starting Medi-Cal verification for NPI: {request.npi}, Provider: {full_name}")
            
            # Look up provider in Medical database
            medical_data = await self._lookup_provider_in_db(request)
            
            if not medical_data:
                logger.info(f"Provider not found in Medical database: NPI {request.npi}")
                raise NotFoundException(
                    detail=f"Provider with NPI {request.npi} not found in Medi-Cal database"
                )
            
            # Build response from database data
            response = self._build_response_from_db_record(medical_data, request)
            
            # Generate PDF if requested
            if generate_pdf and user_id:
                try:
                    full_name = f"{request.first_name} {request.last_name}"
                    logger.info(f"Generating PDF document for Medical verification: {request.npi}")
                    
                    # Convert response to dict for template
                    response_dict = response.model_dump()
                    
                    # Generate PDF document
                    # Use practitioner_id from database if available, otherwise use NPI
                    practitioner_id = str(medical_data.practitioner_id) if medical_data.practitioner_id else request.npi

                    document_url = await pdf_service.generate_pdf_document(
                        template_name="medical_verification.html",
                        data=response_dict,
                        practitioner_id=practitioner_id,
                        user_id=user_id,
                        filename_prefix="medical_verification"
                    )
                    
                    # Update response with document URL and timestamp
                    response.document_url = document_url
                    response.document_generated_at = datetime.utcnow()
                    
                    logger.info(f"PDF document generated successfully: {document_url}")
                    
                except Exception as e:
                    logger.error(f"Failed to generate PDF document: {e}")
                    # Don't fail the entire verification if PDF generation fails
                    pass
            
            logger.info(f"Medi-Cal verification completed for NPI: {request.npi}")
            return response
            
        except NotFoundException:
            # Re-raise NotFoundException as-is
            raise
        except Exception as e:
            logger.error(f"Unexpected error during Medi-Cal verification for NPI {request.npi}: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise ExternalServiceException(
                detail="Unexpected error during Medi-Cal verification",
                service_name="Medi-Cal Registry"
            )
    
    async def _lookup_provider_in_db(self, request: MedicalRequest) -> Optional[MedicalModelEnhanced]:
        """
        Lookup provider in Medical database
        
        Args:
            request: MedicalRequest containing provider information
            
        Returns:
            MedicalModelEnhanced or None if not found
        """
        try:
            logger.info(f"Looking up NPI: {request.npi}")
            
            # First try to find by NPI directly
            medical_response = (
                self.db.schema("vera").table("medical")
                .select("*")
                .eq("npi_number", request.npi)
                .execute()
            )
            
            logger.info(f"Direct NPI lookup result: {len(medical_response.data) if medical_response.data else 0} records found")
            
            if medical_response.data:
                return MedicalModelEnhanced(**medical_response.data[0])
            
            # If not found by NPI, try to find by practitioner name
            # First get practitioners matching the name
            practitioners = await practitioner_service.search_practitioners(
                first_name=request.first_name,
                last_name=request.last_name,
                limit=5
            )
            
            # Check if any of these practitioners have medical records
            for practitioner in practitioners:
                medical_response = (
                    self.db.schema("vera").table("medical")
                    .select("*")
                    .eq("practitioner_id", practitioner.id)
                    .execute()
                )
                
                if medical_response.data:
                    # Check if any record matches the requested NPI
                    for medical_record in medical_response.data:
                        if medical_record.get("npi_number") == request.npi:
                            return MedicalModelEnhanced(**medical_record)
                    
                    # If no NPI match but practitioner found, return first record
                    return MedicalModelEnhanced(**medical_response.data[0])
            
            return None
                
        except Exception as e:
            logger.error(f"Error during medical lookup: {e}")
            return None
    
    def _build_response_from_db_record(self, medical_data: MedicalModelEnhanced, request: MedicalRequest) -> MedicalResponse:
        """
        Build MedicalResponse from database record
        
        Args:
            medical_data: MedicalModelEnhanced from database
            request: Original MedicalRequest
            
        Returns:
            MedicalResponse object
        """
        # Combine provider name
        provider_name = f"{request.first_name} {request.last_name}"
        
        # Get current date for verification
        verification_date = datetime.now().strftime("%Y-%m-%d")
        
        # Build managed care verification from database data
        managed_care_result = self._build_managed_care_verification(medical_data.managed_care)
        
        # Build ORP verification from database data
        orp_result = self._build_orp_verification(medical_data.orp)
        
        # Generate notes based on verification results and database notes
        notes = self._generate_notes(managed_care_result, orp_result, medical_data.notes)
        
        # Create combined verification response
        verifications = MedicalVerifications(
            managed_care=managed_care_result,
            orp=orp_result
        )
        
        response = MedicalResponse(
            status=ResponseStatus.SUCCESS,
            message="Medi-Cal verification completed",
            npi=request.npi,
            provider_name=provider_name,
            verification_date=verification_date,
            verifications=verifications,
            notes=notes
        )
        
        return response
    
    def _build_managed_care_verification(self, managed_care_data: Optional[Dict[str, Any]]) -> ManagedCareVerification:
        """
        Build ManagedCareVerification from database data
        
        Args:
            managed_care_data: Managed care data from database
            
        Returns:
            ManagedCareVerification object
        """
        if not managed_care_data:
            return ManagedCareVerification(
                match_status="not_found",
                reason="No managed care data found in database"
            )
        
        # Handle both dict and ManagedCareData object
        if hasattr(managed_care_data, 'dict'):
            data = managed_care_data.dict()
        else:
            data = managed_care_data
        
        # Build address if available
        address = None
        if data.get("address"):
            addr_data = data["address"]
            address = MedicalAddress(
                line1=addr_data.get("street", ""),
                city=addr_data.get("city", ""),
                state=addr_data.get("state", ""),
                zip=addr_data.get("zip", "")
            )
        
        return ManagedCareVerification(
            match_status=data.get("match_status", "not_found"),
            plan_participation=data.get("plan_participation"),
            effective_date=data.get("effective_date"),
            last_updated=data.get("last_updated"),
            address=address,
            source_file="Medi-Cal Managed Care Provider Database",
            reason=None if data.get("match_status") == "verified" else "Provider verification status from database"
        )
    
    def _build_orp_verification(self, orp_data: Optional[Dict[str, Any]]) -> ORPVerification:
        """
        Build ORPVerification from database data
        
        Args:
            orp_data: ORP data from database
            
        Returns:
            ORPVerification object
        """
        if not orp_data:
            return ORPVerification(
                match_status="not_found",
                reason="No ORP data found in database"
            )
        
        # Handle both dict and ORPData object
        if hasattr(orp_data, 'dict'):
            data = orp_data.dict()
        else:
            data = orp_data
        
        return ORPVerification(
            match_status=data.get("match_status", "not_found"),
            status=data.get("status"),
            enrollment_date=data.get("enrollment_date"),
            last_updated=data.get("last_updated"),
            source_file="Medi-Cal ORP Provider Database",
            reason=None if data.get("match_status") == "verified" else "Provider verification status from database"
        )
    
    def _generate_notes(self, managed_care: ManagedCareVerification, orp: ORPVerification, db_notes: Optional[str]) -> str:
        """
        Generate appropriate notes based on verification results and database notes
        
        Args:
            managed_care: Managed Care verification results
            orp: ORP verification results
            db_notes: Notes from database
            
        Returns:
            String with appropriate notes
        """
        # Start with database notes if available
        notes_parts = []
        if db_notes:
            notes_parts.append(db_notes)
        
        # Add verification status notes
        if managed_care.match_status == "verified" and orp.match_status == "verified":
            notes_parts.append("Provider is actively enrolled in both Managed Care and ORP provider networks under Medi-Cal.")
        elif managed_care.match_status == "not_found" and orp.match_status == "verified":
            notes_parts.append("Provider is ORP-approved but not listed as participating in a Medi-Cal Managed Care network.")
        elif managed_care.match_status == "verified" and orp.match_status == "not_found":
            notes_parts.append("Provider is listed in Managed Care network but not found in ORP system.")
        else:
            notes_parts.append("Provider not verified in either Medi-Cal network. Follow up for enrollment status.")
        
        return " ".join(notes_parts)

# Global service instance
medical_service = MedicalService() 