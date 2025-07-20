import logging
from typing import Optional, List
import httpx
from datetime import datetime

from v1.models.requests import LADMFRequest
from v1.models.responses import LADMFResponse, LADMFMatchedRecord, ResponseStatus
from v1.exceptions.api import ExternalServiceException, NotFoundException, ValidationException
from v1.services.pdf_service import pdf_service

logger = logging.getLogger(__name__)

class LADMFService:
    """Service for LADMF (Limited Access Death Master File) verification"""
    
    def __init__(self):
        # Note: This would typically integrate with SSA LADMF data access pipeline
        self.base_url = "https://api.ssa.gov/ladmf/v1"
        self.timeout = 30.0
        self.api_key = None  # Would be loaded from environment variables
    
    async def verify_death_record(self, request: LADMFRequest, generate_pdf: bool = False, user_id: Optional[str] = None) -> LADMFResponse:
        """
        Verify death record in LADMF (Limited Access Death Master File)
        
        Args:
            request: LADMFRequest containing the individual's information
            generate_pdf: Whether to generate a PDF document
            user_id: User ID for PDF generation (required if generate_pdf is True)
            
        Returns:
            LADMFResponse with the verification results
            
        Raises:
            ExternalServiceException: If external service fails
        """
        try:
            # Validate required fields
            if not request.first_name or not request.first_name.strip():
                raise ValidationException("Missing required field: first_name")
            if not request.last_name or not request.last_name.strip():
                raise ValidationException("Missing required field: last_name")
            if not request.date_of_birth or not request.date_of_birth.strip():
                raise ValidationException("Missing required field: date_of_birth")
            if not request.social_security_number or not request.social_security_number.strip():
                raise ValidationException("Missing required field: social_security_number")
            
            logger.info(f"Verifying death record for: {request.first_name} {request.last_name}, DOB: {request.date_of_birth}")
            
            # For demonstration purposes, we'll simulate the LADMF lookup
            # In a real implementation, this would call the actual SSA LADMF API
            
            # Simulate API call delay
            await self._simulate_api_call()
            
            # Mock response based on SSN pattern for demonstration
            # In real implementation, this would perform fuzzy matching on name and DOB
            if request.social_security_number.endswith("0000"):
                # Match found - person is deceased
                matched_record = LADMFMatchedRecord(
                    full_name=f"{request.first_name} {request.middle_name or ''} {request.last_name}".strip(),
                    date_of_birth=request.date_of_birth,
                    date_of_death="2021-08-14",
                    social_security_number=request.social_security_number,
                    state_of_issue="CA",
                    last_known_residence="90001",
                    record_status="Confirmed"
                )
                
                response = LADMFResponse(
                    status=ResponseStatus.SUCCESS,
                    message="Death record found in LADMF",
                    match_found=True,
                    matched_record=matched_record,
                    match_confidence="high",
                    source="SSA LADMF",
                    notes="Death record confirmed in LADMF database"
                )

            else:
                # No match found
                logger.info(f"No death record found for: {request.first_name} {request.last_name}")
                response = LADMFResponse(
                    status=ResponseStatus.SUCCESS,
                    message="No death record found",
                    match_found=False,
                    matched_record=None,
                    match_confidence="none",
                    source="SSA LADMF",
                    notes="No death record found for the submitted individual."
                )
            
            # Generate PDF if requested
            if generate_pdf and user_id and response.status == ResponseStatus.SUCCESS:
                try:
                    logger.info(f"Generating PDF document for LADMF verification: {request.first_name} {request.last_name}")
                    
                    # Convert response to dict for template
                    response_dict = response.model_dump()
                    
                    # Generate PDF document
                    # Use SSN (last 4 digits) + name as practitioner_id for organizing documents
                    practitioner_id = f"{request.first_name}_{request.last_name}_{request.social_security_number[-4:]}"
                    
                    document_url = await pdf_service.generate_pdf_document(
                        template_name="ladmf_verification.html",
                        data=response_dict,
                        practitioner_id=practitioner_id,
                        user_id=user_id,
                        filename_prefix="ladmf_verification"
                    )
                    
                    # Update response with document URL and timestamp
                    response.document_url = document_url
                    response.document_generated_at = datetime.utcnow()
                    
                    logger.info(f"PDF document generated successfully: {document_url}")
                    
                except Exception as e:
                    logger.error(f"Failed to generate PDF document: {e}")
                    # Don't fail the entire verification if PDF generation fails
                    pass
            
            return response
                
        except Exception as e:
            logger.error(f"Unexpected error during LADMF verification for {request.first_name} {request.last_name}: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during LADMF verification",
                service_name="SSA LADMF"
            )
    
    async def _simulate_api_call(self):
        """Simulate API call delay for demonstration"""
        import asyncio
        await asyncio.sleep(0.1)  # Simulate network delay

# Global service instance
ladmf_service = LADMFService()
