import logging
from typing import Optional, List, Dict, Any
from supabase import Client

from v1.models.database import PractitionerEnhanced, PractitionerEducation, PractitionerAddress, PractitionerDemographics
from v1.services.database import get_supabase_client
from v1.exceptions.api import ExternalServiceException, NotFoundException

logger = logging.getLogger(__name__)

class PractitionerService:
    """Service for practitioner data operations and common joins"""
    
    def __init__(self):
        self.db: Client = get_supabase_client()
    
    async def get_practitioner_by_id(self, practitioner_id: int) -> Optional[PractitionerEnhanced]:
        """
        Get practitioner by ID with typed JSONB fields
        
        Args:
            practitioner_id: The practitioner ID
            
        Returns:
            PractitionerEnhanced object or None if not found
            
        Raises:
            ExternalServiceException: If database query fails
        """
        try:
            response = (
                self.db.schema("vera").table("practitioners")
                .select("*")
                .eq("id", practitioner_id)
                .execute()
            )
            
            if not response.data:
                return None
            
            return self._parse_practitioner(response.data[0])
            
        except Exception as e:
            logger.error(f"Error fetching practitioner {practitioner_id}: {e}")
            raise ExternalServiceException(
                detail="Error fetching practitioner data",
                service_name="Practitioner Database"
            )
    
    async def get_practitioner_by_npi(self, npi_number: str) -> Optional[PractitionerEnhanced]:
        """
        Get practitioner by NPI number
        
        Args:
            npi_number: The NPI number
            
        Returns:
            PractitionerEnhanced object or None if not found
            
        Raises:
            ExternalServiceException: If database query fails
        """
        try:
            # First get practitioner_id from NPI table
            npi_response = (
                self.db.schema("vera").table("npi")
                .select("practitioner_id")
                .eq("number", npi_number)
                .execute()
            )
            
            if not npi_response.data:
                return None
            
            practitioner_id = npi_response.data[0]["practitioner_id"]
            return await self.get_practitioner_by_id(practitioner_id)
            
        except Exception as e:
            logger.error(f"Error fetching practitioner by NPI {npi_number}: {e}")
            raise ExternalServiceException(
                detail="Error fetching practitioner data by NPI",
                service_name="Practitioner Database"
            )
    
    async def search_practitioners(
        self, 
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        limit: int = 10
    ) -> List[PractitionerEnhanced]:
        """
        Search practitioners by name
        
        Args:
            first_name: First name to search for
            last_name: Last name to search for
            limit: Maximum number of results
            
        Returns:
            List of PractitionerEnhanced objects
            
        Raises:
            ExternalServiceException: If database query fails
        """
        try:
            query = self.db.schema("vera").table("practitioners").select("*")
            
            if first_name:
                query = query.ilike("first_name", f"%{first_name}%")
            if last_name:
                query = query.ilike("last_name", f"%{last_name}%")
            
            response = query.limit(limit).execute()
            
            return [self._parse_practitioner(record) for record in response.data]
            
        except Exception as e:
            logger.error(f"Error searching practitioners: {e}")
            raise ExternalServiceException(
                detail="Error searching practitioners",
                service_name="Practitioner Database"
            )
    
    def _parse_practitioner(self, raw_data: Dict[str, Any]) -> PractitionerEnhanced:
        """
        Parse raw database data into PractitionerEnhanced with typed JSONB fields
        
        Args:
            raw_data: Raw database record
            
        Returns:
            PractitionerEnhanced object
        """
        # Parse education JSONB
        education = None
        if raw_data.get("education"):
            education = PractitionerEducation(**raw_data["education"])
        
        # Parse home address JSONB
        home_address = None
        if raw_data.get("home_address"):
            home_address = PractitionerAddress(**raw_data["home_address"])
        
        # Parse mailing address JSONB
        mailing_address = None
        if raw_data.get("mailing_address"):
            mailing_address = PractitionerAddress(**raw_data["mailing_address"])
        
        # Parse demographics JSONB
        demographics = None
        if raw_data.get("demographics"):
            demographics = PractitionerDemographics(**raw_data["demographics"])
        
        # Parse languages (should be a list)
        languages = raw_data.get("languages")
        if isinstance(languages, dict):
            # If it's stored as a dict, try to extract the list
            languages = languages.get("languages", [])
        elif not isinstance(languages, list):
            languages = []
        
        return PractitionerEnhanced(
            id=raw_data.get("id"),
            first_name=raw_data["first_name"],
            last_name=raw_data.get("last_name"),
            middle_name=raw_data.get("middle_name"),
            suffix=raw_data.get("suffix"),
            education=education,
            other_names=raw_data.get("other_names"),
            home_address=home_address,
            mailing_address=mailing_address,
            ssn=raw_data.get("ssn"),
            demographics=demographics,
            languages=languages
        )

# Global service instance
practitioner_service = PractitionerService() 