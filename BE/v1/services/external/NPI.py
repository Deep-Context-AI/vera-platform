import httpx
import logging
from typing import Optional, Dict, Any
from datetime import datetime

from v1.models.requests import NPIRequest
from v1.models.responses import NPIResponse, ResponseStatus
from v1.exceptions.api import ExternalServiceException
from v1.services.database import get_supabase_client
from v1.services.pdf_service import pdf_service

logger = logging.getLogger(__name__)

class NPIService:
    """Service for NPI (National Provider Identifier) lookups"""
    
    def __init__(self):
        self.base_url = "https://npiregistry.cms.hhs.gov/api"
        self.timeout = 30.0
    
    async def lookup_npi_from_db(self, npi_number: str, practitioner_id: Optional[int] = None) -> Optional[NPIResponse]:
        """
        Lookup NPI from database
        
        Args:
            npi_number: NPI number to lookup
            practitioner_id: Optional practitioner ID to filter by
            
        Returns:
            NPIResponse if found, None otherwise
        """
        try:
            supabase = get_supabase_client()
            
            # Build query
            query = supabase.schema('vera').table('npi').select('*').eq('number', npi_number)
            
            if practitioner_id:
                query = query.eq('practitioner_id', practitioner_id)
            
            response = query.execute()
            
            if not response.data:
                logger.info(f"NPI {npi_number} not found in database")
                return None
            
            # Get the first result (should be unique by NPI number)
            npi_data = response.data[0]
            logger.info(f"Found NPI {npi_number} in database for practitioner {npi_data.get('practitioner_id')}")
            
            # Convert database record to NPIResponse
            return self._convert_db_to_response(npi_data)
            
        except Exception as e:
            logger.error(f"Database error during NPI lookup: {e}")
            return None
    
    def _convert_db_to_response(self, npi_data: Dict[str, Any]) -> NPIResponse:
        """
        Convert database NPI record to NPIResponse
        
        Args:
            npi_data: NPI data from database
            
        Returns:
            NPIResponse object
        """
        # Get practitioner name if available
        provider_name = f"Provider {npi_data.get('number')}"
        if npi_data.get('practitioner_id'):
            try:
                supabase = get_supabase_client()
                practitioner_response = supabase.schema('vera').table('practitioners').select('first_name, last_name').eq('id', npi_data.get('practitioner_id')).execute()
                
                if practitioner_response.data:
                    practitioner = practitioner_response.data[0]
                    first_name = practitioner.get('first_name', '')
                    last_name = practitioner.get('last_name', '')
                    if first_name or last_name:
                        provider_name = f"{first_name} {last_name}".strip()
            except Exception as e:
                logger.warning(f"Could not fetch practitioner name for ID {npi_data.get('practitioner_id')}: {e}")
        
        return NPIResponse(
            status=ResponseStatus.SUCCESS,
            message="NPI found in database",
            npi=npi_data.get('number'),
            provider_name=provider_name,
            provider_type=npi_data.get('type'),
            practitioner_id=npi_data.get('practitioner_id'),
            primary_taxonomy=npi_data.get('taxonomy_code'),
            specialty=npi_data.get('description'),
            is_active=npi_data.get('status') == 'Active',
        )
    
    async def comprehensive_npi_lookup(self, request: NPIRequest, generate_pdf: bool = False, user_id: Optional[str] = None) -> NPIResponse:
        """
        Comprehensive NPI lookup that checks database first, then external API
        
        Args:
            request: NPIRequest containing search criteria
            generate_pdf: Whether to generate a PDF document
            user_id: User ID for PDF generation (required if generate_pdf is True)
            
        Returns:
            NPIResponse with the lookup results
            
        Raises:
            NotFoundException: If NPI is not found
            ExternalServiceException: If external service fails
        """
        # First, try to get from database if we have an NPI number
        if request.npi:
            db_result = await self.lookup_npi_from_db(request.npi)
            if db_result:
                logger.info(f"NPI {request.npi} found in database")
                response = db_result
            else:
                # If not found in database, try external API
                logger.info(f"NPI {request.npi} not found in database, trying external API")
                response = await self.lookup_npi_external(request)
        else:
            # No NPI provided, use external API
            response = await self.lookup_npi_external(request)
        
        # Generate PDF if requested
        if generate_pdf and user_id and response.status == ResponseStatus.SUCCESS:
            try:
                logger.info(f"Generating PDF document for NPI verification: {response.npi}")
                
                # Convert response to dict for template
                response_dict = response.model_dump()
                
                # Generate PDF document
                # Use practitioner_id from database if available, otherwise use NPI
                practitioner_id = str(response.practitioner_id) if response.practitioner_id else (response.npi or "unknown_npi")
                
                document_url = await pdf_service.generate_pdf_document(
                    template_name="npi_verification.html",
                    data=response_dict,
                    practitioner_id=practitioner_id,
                    user_id=user_id,
                    filename_prefix="npi_verification"
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
    
    async def lookup_npi_external(self, request: NPIRequest) -> NPIResponse:
        """
        Lookup NPI using external API
        
        Args:
            request: NPIRequest containing search criteria
            
        Returns:
            NPIResponse with the lookup results
            
        Raises:
            NotFoundException: If NPI is not found
            ExternalServiceException: If external service fails
        """
        try:
            search_params = self._build_search_params(request)
            logger.info(f"Looking up NPI with params: {search_params}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/", params=search_params)
                response.raise_for_status()
                
                data = response.json()
                
                if not data.get("results"):
                    logger.warning(f"No NPI results found for search criteria")
                    return NPIResponse(
                        status=ResponseStatus.NOT_FOUND,
                        message="No NPI found matching the search criteria",
                        npi=request.npi
                    )
                
                # Parse the first result (most relevant)
                result = data["results"][0]
                parsed_response = self._parse_npi_result(result, request)
                
                logger.info(f"Successfully found NPI: {parsed_response.npi}")
                return parsed_response
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during NPI lookup: {e}")
            raise ExternalServiceException(
                detail=f"NPI registry service returned error: {e.response.status_code}",
                service_name="NPI Registry"
            )
        except httpx.RequestError as e:
            logger.error(f"Request error during NPI lookup: {e}")
            raise ExternalServiceException(
                detail="Failed to connect to NPI registry service",
                service_name="NPI Registry"
            )
        except Exception as e:
            logger.error(f"Unexpected error during NPI lookup: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during NPI lookup",
                service_name="NPI Registry"
            )
    
    # Keep the original method for backward compatibility, but make it use comprehensive lookup
    async def lookup_npi(self, request: NPIRequest, generate_pdf: bool = False, user_id: Optional[str] = None) -> NPIResponse:
        """
        Lookup NPI using comprehensive approach (database first, then external API)
        
        Args:
            request: NPIRequest containing search criteria
            generate_pdf: Whether to generate a PDF document
            user_id: User ID for PDF generation (required if generate_pdf is True)
            
        Returns:
            NPIResponse with the lookup results
            
        Raises:
            NotFoundException: If NPI is not found
            ExternalServiceException: If external service fails
        """
        return await self.comprehensive_npi_lookup(request, generate_pdf, user_id)
    
    def _build_search_params(self, request: NPIRequest) -> Dict[str, str]:
        """Build search parameters for the NPI API"""
        params = {"version": "2.1"}
        
        if request.npi:
            params["number"] = request.npi
        elif request.organization_name:
            params["organization_name"] = request.organization_name
        elif request.first_name or request.last_name:
            if request.first_name:
                params["first_name"] = request.first_name
            if request.last_name:
                params["last_name"] = request.last_name
        
        # Add optional address filters
        if request.city:
            params["city"] = request.city
        if request.state:
            params["state"] = request.state
        if request.postal_code:
            params["postal_code"] = request.postal_code
        
        # Limit results for performance
        params["limit"] = "10"
        
        return params
    
    def _parse_npi_result(self, result: Dict[str, Any], request: NPIRequest) -> NPIResponse:
        """Parse NPI API result into NPIResponse"""
        basic_info = result.get("basic", {})
        addresses = result.get("addresses", [])
        taxonomies = result.get("taxonomies", [])
        identifiers = result.get("identifiers", [])
        
        # Basic information
        npi = result.get("number")
        provider_name = basic_info.get("name")
        provider_type = "Individual" if basic_info.get("enumeration_type") == "NPI-1" else "Organization"
        
        # Parse addresses
        practice_address = None
        mailing_address = None
        phone = None
        fax = None
        
        for addr in addresses:
            address_data = {
                "address_1": addr.get("address_1"),
                "address_2": addr.get("address_2"),
                "city": addr.get("city"),
                "state": addr.get("state"),
                "postal_code": addr.get("postal_code"),
                "country_code": addr.get("country_code", "US")
            }
            
            if addr.get("address_purpose") == "LOCATION":
                practice_address = address_data
                phone = addr.get("telephone_number")
                fax = addr.get("fax_number")
            elif addr.get("address_purpose") == "MAILING":
                mailing_address = address_data
                if not phone:  # Use mailing phone if no practice phone
                    phone = addr.get("telephone_number")
                if not fax:  # Use mailing fax if no practice fax
                    fax = addr.get("fax_number")
        
        # If no specific addresses found, use the first one as practice address
        if not practice_address and addresses:
            addr = addresses[0]
            practice_address = {
                "address_1": addr.get("address_1"),
                "address_2": addr.get("address_2"),
                "city": addr.get("city"),
                "state": addr.get("state"),
                "postal_code": addr.get("postal_code"),
                "country_code": addr.get("country_code", "US")
            }
            phone = addr.get("telephone_number")
            fax = addr.get("fax_number")
        
        # Parse taxonomies
        primary_taxonomy = None
        specialty = None
        secondary_taxonomies = []
        
        for taxonomy in taxonomies:
            tax_data = {
                "code": taxonomy.get("code"),
                "description": taxonomy.get("desc"),
                "primary": taxonomy.get("primary", False),
                "state": taxonomy.get("state"),
                "license": taxonomy.get("license")
            }
            
            if taxonomy.get("primary"):
                primary_taxonomy = taxonomy.get("code")
                specialty = taxonomy.get("desc")
            else:
                secondary_taxonomies.append(tax_data)
        
        # If no primary taxonomy found, use the first one
        if not primary_taxonomy and taxonomies:
            primary_taxonomy = taxonomies[0].get("code")
            specialty = taxonomies[0].get("desc")
        
        # Parse identifiers for license information
        license_number = None
        license_state = None
        
        for identifier in identifiers:
            if identifier.get("code") == "05":  # State license number
                license_number = identifier.get("identifier")
                license_state = identifier.get("state")
                break
        
        # Parse dates
        enumeration_date = basic_info.get("enumeration_date")
        last_update_date = basic_info.get("last_updated")
        
        # Format dates if they exist
        if enumeration_date:
            try:
                enumeration_date = datetime.strptime(enumeration_date, "%Y-%m-%d").strftime("%Y-%m-%d")
            except:
                pass  # Keep original format if parsing fails
        
        if last_update_date:
            try:
                last_update_date = datetime.strptime(last_update_date, "%Y-%m-%d").strftime("%Y-%m-%d")
            except:
                pass  # Keep original format if parsing fails
        
        # Individual-specific fields
        gender = None
        credential = None
        sole_proprietor = None
        authorized_official = None
        
        if provider_type == "Individual":
            gender = basic_info.get("gender")
            credential = basic_info.get("credential")
            sole_proprietor = basic_info.get("sole_proprietor")
        else:
            # Organization-specific fields
            auth_official = basic_info.get("authorized_official")
            if auth_official:
                authorized_official = {
                    "first_name": auth_official.get("first_name"),
                    "last_name": auth_official.get("last_name"),
                    "title": auth_official.get("title_or_position"),
                    "phone": auth_official.get("telephone_number"),
                    "credential": auth_official.get("credential")
                }
        
        return NPIResponse(
            status=ResponseStatus.SUCCESS,
            message="NPI lookup successful",
            npi=npi,
            provider_name=provider_name,
            provider_type=provider_type,
            primary_taxonomy=primary_taxonomy,
            specialty=specialty,
            secondary_taxonomies=secondary_taxonomies if secondary_taxonomies else None,
            license_state=license_state,
            license_number=license_number,
            practice_address=practice_address,
            mailing_address=mailing_address,
            phone=phone,
            fax=fax,
            is_active=basic_info.get("status") == "A",
            enumeration_date=enumeration_date,
            last_update_date=last_update_date,
            sole_proprietor=sole_proprietor,
            authorized_official=authorized_official,
            gender=gender,
            credential=credential,
            # Legacy field for backward compatibility
            address=practice_address
        )

# Global service instance
npi_service = NPIService()
