import logging
from typing import Optional, List
import httpx
from datetime import datetime

from ...models.requests import NPIRequest, BatchNPIRequest
from ...models.responses import NPIResponse, BatchNPIResponse, ResponseStatus
from ...exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class NPIService:
    """Service for NPI (National Provider Identifier) lookups"""
    
    def __init__(self):
        self.base_url = "https://npiregistry.cms.hhs.gov/api"
        self.timeout = 30.0
    
    async def lookup_npi(self, request: NPIRequest) -> NPIResponse:
        """
        Lookup a single NPI
        
        Args:
            request: NPIRequest containing the NPI to lookup
            
        Returns:
            NPIResponse with the lookup results
            
        Raises:
            NotFoundException: If NPI is not found
            ExternalServiceException: If external service fails
        """
        try:
            logger.info(f"Looking up NPI: {request.npi}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {
                    "number": request.npi,
                    "version": "2.1"
                }
                
                response = await client.get(f"{self.base_url}/", params=params)
                response.raise_for_status()
                
                data = response.json()
                
                if not data.get("results"):
                    logger.warning(f"NPI not found: {request.npi}")
                    return NPIResponse(
                        status=ResponseStatus.NOT_FOUND,
                        message=f"NPI {request.npi} not found",
                        npi=request.npi
                    )
                
                # Parse the first result
                result = data["results"][0]
                basic_info = result.get("basic", {})
                addresses = result.get("addresses", [])
                taxonomies = result.get("taxonomies", [])
                
                # Get primary address
                primary_address = None
                if addresses:
                    primary_address = {
                        "address_1": addresses[0].get("address_1"),
                        "address_2": addresses[0].get("address_2"),
                        "city": addresses[0].get("city"),
                        "state": addresses[0].get("state"),
                        "postal_code": addresses[0].get("postal_code"),
                        "country_code": addresses[0].get("country_code")
                    }
                
                # Get primary taxonomy
                primary_taxonomy = None
                primary_specialty = None
                if taxonomies:
                    primary_tax = next((t for t in taxonomies if t.get("primary")), taxonomies[0])
                    primary_taxonomy = primary_tax.get("code")
                    primary_specialty = primary_tax.get("desc")
                
                logger.info(f"Successfully found NPI: {request.npi}")
                
                return NPIResponse(
                    status=ResponseStatus.SUCCESS,
                    message="NPI lookup successful",
                    npi=request.npi,
                    provider_name=basic_info.get("name"),
                    provider_type=basic_info.get("enumeration_type"),
                    primary_taxonomy=primary_taxonomy,
                    specialty=primary_specialty,
                    address=primary_address,
                    phone=addresses[0].get("telephone_number") if addresses else None,
                    is_active=basic_info.get("status") == "A"
                )
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during NPI lookup for {request.npi}: {e}")
            raise ExternalServiceException(
                detail=f"NPI registry service returned error: {e.response.status_code}",
                service_name="NPI Registry"
            )
        except httpx.RequestError as e:
            logger.error(f"Request error during NPI lookup for {request.npi}: {e}")
            raise ExternalServiceException(
                detail="Failed to connect to NPI registry service",
                service_name="NPI Registry"
            )
        except Exception as e:
            logger.error(f"Unexpected error during NPI lookup for {request.npi}: {e}")
            raise ExternalServiceException(
                detail="Unexpected error during NPI lookup",
                service_name="NPI Registry"
            )
    
    async def batch_lookup_npi(self, request: BatchNPIRequest) -> BatchNPIResponse:
        """
        Lookup multiple NPIs
        
        Args:
            request: BatchNPIRequest containing the NPIs to lookup
            
        Returns:
            BatchNPIResponse with all lookup results
        """
        logger.info(f"Batch NPI lookup for {len(request.npis)} NPIs")
        
        results = []
        found_count = 0
        
        for npi in request.npis:
            try:
                npi_request = NPIRequest(npi=npi)
                result = await self.lookup_npi(npi_request)
                results.append(result)
                
                if result.status == ResponseStatus.SUCCESS:
                    found_count += 1
                    
            except Exception as e:
                logger.error(f"Error in batch lookup for NPI {npi}: {e}")
                results.append(NPIResponse(
                    status=ResponseStatus.ERROR,
                    message=f"Error looking up NPI {npi}: {str(e)}",
                    npi=npi
                ))
        
        return BatchNPIResponse(
            status=ResponseStatus.SUCCESS,
            message=f"Batch lookup completed: {found_count}/{len(request.npis)} found",
            results=results,
            total_requested=len(request.npis),
            total_found=found_count,
            total_not_found=len(request.npis) - found_count
        )

# Global service instance
npi_service = NPIService()
