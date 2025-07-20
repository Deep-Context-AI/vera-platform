import logging
from typing import Optional, TYPE_CHECKING, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Avoid circular imports
if TYPE_CHECKING:
    from v1.services.database import DatabaseService

logger = logging.getLogger(__name__)

class Address(BaseModel):
    street: str = Field(..., description="The street of the address")
    city: str = Field(..., description="The city of the address")
    state: str = Field(..., description="The state of the address in full form")
    zip: str = Field(..., description="The zip code of the address")
    
    def to_string(self):
        return f"{self.street}, {self.city}, {self.state}, {self.zip}"

class Demographics(BaseModel):
    race: Optional[str] = Field(None, description="The race of the practitioner")
    gender: Optional[str] = Field(None, description="The gender of the practitioner")
    ethnicity: Optional[str] = Field(None, description="The ethnicity of the practitioner")
    birth_date: Optional[datetime] = Field(None, description="The date of birth of the practitioner in YYYY-MM-DD format")

class ApplicationContext(BaseModel):
    """Type-safe application context for verification steps"""
    application_id: int
    created_at: datetime
    
    npi_number: Optional[str] = None
    dea_number: Optional[str] = None
    license_number: Optional[str] = None
    
    # Provider Table
    first_name: str
    last_name: str
    ssn: str
    demographics: Optional[Demographics] = None
    address: Address
    
    # NPDB-specific fields
    credential_type: Optional[str] = None  # "new" or "recredential"
    previous_approval_date: Optional[datetime] = None
    attestations: Optional[Dict[str, Any]] = None
    
    @classmethod
    async def load_from_db(cls, db_service: "DatabaseService", application_id: int) -> "ApplicationContext":
        """Type-safe factory method to load context from database using DatabaseService"""
        # Build the select columns for the join, including NPDB-specific fields
        columns = [
            'id', 'created_at', 'npi_number', 'dea_number', 'license_number', 
            'previous_approval_date', 'attestation_id',
            'practitioners!inner(first_name, last_name, home_address, ssn, demographics)'
        ]
        try:
            response = db_service.supabase.schema('vera').table('applications') \
                .select(','.join(columns)) \
                .eq('id', application_id) \
                .execute()
            
            if not response.data:
                raise ValueError(f"Application not found for ID: {application_id}")
            
            application = response.data[0]
            practitioner_data = application['practitioners']
            
            # Determine credential type based on previous_approval_date
            credential_type = "new"  # default
            previous_approval_date = None
            
            if application.get('previous_approval_date'):
                from datetime import datetime
                previous_approval_date = datetime.fromisoformat(application['previous_approval_date'].replace('Z', '+00:00'))
                current_date = datetime.now(previous_approval_date.tzinfo)
                years_since_approval = (current_date - previous_approval_date).days / 365.25
                
                if years_since_approval > 3:
                    credential_type = "recredential"
                else:
                    credential_type = "new"
            
            # Load attestations if attestation_id is present
            attestations = None
            if application.get('attestation_id'):
                attestation_response = db_service.supabase.schema('vera').table('attestations') \
                    .select('*') \
                    .eq('id', application['attestation_id']) \
                    .execute()
                
                if attestation_response.data:
                    attestations = attestation_response.data[0]
            
            return cls(
                application_id=application_id,
                first_name=practitioner_data['first_name'],
                last_name=practitioner_data['last_name'],
                ssn=practitioner_data['ssn'],
                created_at=application['created_at'],
                
                npi_number=application['npi_number'],
                dea_number=application['dea_number'],
                license_number=application['license_number'],
                
                # NPDB-specific fields
                credential_type=credential_type,
                previous_approval_date=previous_approval_date,
                attestations=attestations,
                
                address=Address(
                    street=practitioner_data['home_address']['street'],
                    city=practitioner_data['home_address']['city'],
                    state=practitioner_data['home_address']['state'],
                    zip=practitioner_data['home_address']['zip']
                ),
                demographics=Demographics(**practitioner_data['demographics']) if practitioner_data['demographics'] else None
            )
        except Exception as e:
            logger.error(f"Failed to load application context: {e}")
            raise ValueError(f"Failed to load application context: {e}")