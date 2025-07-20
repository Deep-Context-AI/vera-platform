import logging
from typing import Optional, Dict, Any
from datetime import datetime

from v1.models.requests import HospitalPrivilegesRequest
from v1.models.responses import HospitalPrivilegesResponse, ResponseStatus, HospitalPrivilegesVerificationDetails
from v1.models.database import PractitionerEnhanced, HospitalPrivilegesModel
from v1.exceptions.api import ExternalServiceException, NotFoundException
from v1.services.database import get_supabase_client
from v1.services.pdf_service import pdf_service

logger = logging.getLogger(__name__)

class HospitalPrivilegesService:
    """Service for hospital privileges verification with database lookup"""
    
    def __init__(self):
        self.timeout = 30.0
        
    async def lookup_hospital_privileges_from_db(self, request: HospitalPrivilegesRequest) -> HospitalPrivilegesResponse:
        """
        Lookup hospital privileges verification from database
        
        Args:
            request: HospitalPrivilegesRequest containing practitioner and hospital information
            
        Returns:
            HospitalPrivilegesResponse with verification results
            
        Raises:
            NotFoundException: If practitioner is not found
            ExternalServiceException: If database query fails
        """
        try:
            logger.info(f"Looking up hospital privileges verification for: {request.first_name} {request.last_name}")
            
            # Query practitioners table by name and NPI
            supabase = get_supabase_client()
            response = supabase.schema('vera').table('practitioners').select('*').eq('first_name', request.first_name).eq('last_name', request.last_name).execute()
            
            if not response.data:
                logger.info(f"Practitioner {request.first_name} {request.last_name} not found in database")
                return HospitalPrivilegesResponse(
                    status=ResponseStatus.NOT_FOUND,
                    message=f"Practitioner {request.first_name} {request.last_name} not found in database",
                    job_id="db_lookup",
                    function_call_id="db_lookup",
                    verification_status="not_found",
                    first_name=request.first_name,
                    last_name=request.last_name,
                    npi_number=request.npi_number,
                    hospital_name="Unknown",
                    specialty="Unknown"
                )
            
            # Get the first result (handle multiple matches by taking the first)
            practitioner_data = response.data[0]
            logger.info(f"Found practitioner {request.first_name} {request.last_name} in database")
            
            # Convert to enhanced model
            practitioner = PractitionerEnhanced(**practitioner_data)
            
            # Query hospital privileges table for this practitioner
            hospital_privileges_response = supabase.schema('vera').table('hospital_privileges').select('*').eq('practitioner_id', practitioner.id).execute()
            
            # Compare hospital privileges data
            verification_result = self._compare_hospital_privileges_data(hospital_privileges_response.data, request)
            
            # Extract hospital and specialty info from the first privileges record if available
            hospital_name = "Unknown"
            specialty = "Unknown"
            if hospital_privileges_response.data:
                first_record = hospital_privileges_response.data[0]
                hospital_name = first_record.get('hospital') or "Unknown"
                specialty = first_record.get('specialty') or "Unknown"
            
            # Create proper HospitalPrivilegesVerificationDetails object
            verification_details = HospitalPrivilegesVerificationDetails(
                first_name=request.first_name,
                last_name=request.last_name,
                npi_number=request.npi_number,
                hospital_name=hospital_name,
                specialty=specialty,
                verification_type="current_privileges"
            )
            
            return HospitalPrivilegesResponse(
                status=ResponseStatus.SUCCESS,
                message="Hospital privileges verification completed from database",
                job_id="db_lookup",
                function_call_id="db_lookup",
                verification_status="completed",
                first_name=request.first_name,
                last_name=request.last_name,
                npi_number=request.npi_number,
                hospital_name=hospital_name,
                specialty=specialty,
                verification_details=verification_details,
                database_verification_result=verification_result
            )
            
        except Exception as e:
            logger.error(f"Database error during hospital privileges lookup: {e}")
            raise ExternalServiceException(
                detail=f"Failed to lookup hospital privileges from database: {str(e)}",
                service_name="Hospital Privileges Database Lookup"
            )
    
    def _compare_hospital_privileges_data(self, db_hospital_privileges: list, request: HospitalPrivilegesRequest) -> dict:
        """
        Compare hospital privileges data from database with request
        
        Args:
            db_hospital_privileges: Hospital privileges data from database
            request: Hospital privileges request data
            
        Returns:
            Dictionary with verification results
        """
        if not db_hospital_privileges:
            return {
                "verified": False,
                "match_details": {
                    "hospital_match": False,
                    "specialty_match": False,
                    "npi_match": False,
                    "status_match": False,
                    "reason": "No hospital privileges data in database"
                },
                "database_privileges": None,
                "request_privileges": {
                    "hospital_name": "Unknown",
                    "specialty": "Unknown",
                    "npi_number": request.npi_number,
                    "verification_type": "current_privileges"
                }
            }
        
        # Find the best matching hospital privileges record
        best_match = None
        best_score = 0
        
        for privilege_record in db_hospital_privileges:
            score = 0
            
            # Since hospital_name and specialty are not in the request, we primarily score on:
            # 1. NPI match (most important)
            # 2. Active status
            
            # Score based on NPI match (highest priority)
            if self._compare_field(privilege_record.get('npi_number'), request.npi_number, "npi"):
                score += 5
            
            # Score based on active status
            if privilege_record.get('status') and privilege_record.get('status').lower() in ['active', 'current', 'valid']:
                score += 2
            
            # If we have multiple records, prefer the most recent one (if issued date is available)
            if privilege_record.get('issued'):
                score += 1
            
            if score > best_score:
                best_score = score
                best_match = privilege_record
        
        if not best_match:
            return {
                "verified": False,
                "match_details": {
                    "hospital_match": False,
                    "specialty_match": False,
                    "npi_match": False,
                    "status_match": False,
                    "reason": "No matching hospital privileges found"
                },
                "database_privileges": None,
                "request_privileges": {
                    "hospital_name": "Unknown",
                    "specialty": "Unknown",
                    "npi_number": request.npi_number,
                    "verification_type": "current_privileges"
                }
            }
        
        # Convert database privileges to dict for comparison
        db_privileges_dict = {
            "hospital_name": best_match.get('hospital'),
            "specialty": best_match.get('specialty'),
            "npi_number": best_match.get('npi_number'),
            "status": best_match.get('status'),
            "issued_date": best_match.get('issued'),
            "expiration_date": best_match.get('expired')
        }
        
        request_privileges_dict = {
            "hospital_name": "Unknown",
            "specialty": "Unknown",
            "npi_number": request.npi_number,
            "verification_type": "current_privileges"
        }
        
        # Compare each field - since hospital and specialty are not in request, we mark them as N/A
        hospital_match = True  # N/A - not comparing hospital since it's not in request
        specialty_match = True  # N/A - not comparing specialty since it's not in request
        npi_match = self._compare_field(best_match.get('npi_number'), request.npi_number, "npi")
        status_match = best_match.get('status') and best_match.get('status').lower() in ['active', 'current', 'valid']
        
        # Overall verification result - require NPI match and active status
        verified = npi_match and status_match
        
        match_details = {
            "hospital_match": hospital_match,
            "specialty_match": specialty_match,
            "npi_match": npi_match,
            "status_match": status_match,
            "overall_match": verified
        }
        
        if not verified:
            reasons = []
            if not npi_match:
                reasons.append(f"NPI mismatch: DB='{best_match.get('npi_number')}' vs Request='{request.npi_number}'")
            if not status_match:
                reasons.append(f"Status not active: DB status='{best_match.get('status')}'")
            match_details["reasons"] = reasons
        
        logger.info(f"Hospital privileges comparison result: verified={verified}, details={match_details}")
        
        return {
            "verified": verified,
            "match_details": match_details,
            "database_privileges": db_privileges_dict,
            "request_privileges": request_privileges_dict
        }
    
    def _compare_field(self, db_value, request_value, field_name: str) -> bool:
        """
        Compare individual fields with appropriate logic
        
        Args:
            db_value: Value from database
            request_value: Value from request
            field_name: Name of the field for logging
            
        Returns:
            Boolean indicating if fields match
        """
        # Handle None values
        if db_value is None and request_value is None:
            return True
        if db_value is None or request_value is None:
            return False
        
        # For strings, do case-insensitive comparison and handle common variations
        if isinstance(db_value, str) and isinstance(request_value, str):
            db_clean = db_value.strip().lower()
            request_clean = request_value.strip().lower()
            
            # Exact match
            if db_clean == request_clean:
                return True
            
            # For hospitals, check if one contains the other (handles variations like "UCLA Medical Center" vs "UCLA")
            if field_name == "hospital":
                # Remove common words for better matching
                common_words = ["hospital", "medical", "center", "health", "system", "clinic", "institute", "university", "college", "of", "the", "at"]
                
                def clean_hospital_name(name: str) -> set:
                    words = name.lower().replace(",", "").replace(".", "").split()
                    return set(word for word in words if word not in common_words and len(word) > 2)
                
                db_words = clean_hospital_name(db_value)
                request_words = clean_hospital_name(request_value)
                
                # Check if there's significant overlap
                if db_words and request_words:
                    overlap = len(db_words.intersection(request_words))
                    min_words = min(len(db_words), len(request_words))
                    return overlap / min_words >= 0.5  # At least 50% word overlap
            
            # For specialties, handle common variations
            if field_name == "specialty":
                specialty_mappings = {
                    "internal medicine": ["internal med", "im", "medicine"],
                    "family medicine": ["family med", "fm", "family practice"],
                    "emergency medicine": ["emergency med", "em", "emergency"],
                    "pediatrics": ["peds", "pediatric medicine"],
                    "surgery": ["general surgery", "surgical"],
                    "cardiology": ["cardiac medicine", "heart"],
                    "dermatology": ["derm", "skin"],
                    "radiology": ["diagnostic radiology", "rad"],
                    "anesthesiology": ["anesthesia", "anes"],
                    "psychiatry": ["mental health", "psych"]
                }
                
                for standard, variations in specialty_mappings.items():
                    if (db_clean == standard or db_clean in variations) and (request_clean == standard or request_clean in variations):
                        return True
        
        # For numbers and exact matches
        return str(db_value).strip().lower() == str(request_value).strip().lower()
    
    async def comprehensive_hospital_privileges_verification(self, request: HospitalPrivilegesRequest, prefer_database: bool = True, generate_pdf: bool = False, user_id: Optional[str] = None) -> HospitalPrivilegesResponse:
        """
        Hospital privileges verification using only database lookup and comparison
        
        Args:
            request: HospitalPrivilegesRequest containing practitioner information (first_name, last_name, npi_number)
            prefer_database: Whether to prefer database lookup (always True for this implementation)
            generate_pdf: Whether to generate a PDF document
            user_id: User ID for PDF generation (required if generate_pdf is True)
            
        Returns:
            HospitalPrivilegesResponse with verification results
            
        Raises:
            ExternalServiceException: If database lookup fails
            NotFoundException: If practitioner not found in database
        """
        try:
            # Always use database lookup only
            db_response = await self.lookup_hospital_privileges_from_db(request)
            
            if db_response.status == ResponseStatus.SUCCESS:
                logger.info(f"Hospital privileges verification completed via database for {request.first_name} {request.last_name}")
                
                # Generate PDF if requested and verification was successful
                if generate_pdf and user_id and hasattr(db_response, 'database_verification_result') and db_response.database_verification_result and db_response.database_verification_result.get("verified"):
                    try:
                        logger.info(f"Generating PDF document for hospital privileges verification: {request.first_name} {request.last_name}")
                        
                        # Convert response to dict for template
                        response_dict = db_response.model_dump()
                        
                        # Generate PDF document
                        practitioner_id = f"{request.first_name}_{request.last_name}".replace(" ", "_")
                        
                        document_url = await pdf_service.generate_pdf_document(
                            template_name="hospital_privileges_verification.html",
                            data=response_dict,
                            practitioner_id=practitioner_id,
                            user_id=user_id,
                            filename_prefix="hospital_privileges_verification"
                        )
                        
                        # Add document URL to response
                        db_response.document_url = document_url
                        db_response.document_generated_at = datetime.utcnow()
                        
                        logger.info(f"PDF document generated successfully: {document_url}")
                        
                    except Exception as e:
                        logger.error(f"Failed to generate PDF document: {e}")
                        # Don't fail the entire verification if PDF generation fails
                        pass
                
                return db_response
            
            else:
                # If not found or other error, return the response as-is
                return db_response
            
        except Exception as e:
            logger.error(f"Error during hospital privileges verification: {e}")
            raise ExternalServiceException(
                detail=f"Failed to complete hospital privileges verification: {str(e)}",
                service_name="Hospital Privileges Verification"
            )

# Global service instance
hospital_privileges_service = HospitalPrivilegesService() 