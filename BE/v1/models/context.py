import logging
from typing import Optional, TYPE_CHECKING
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
    
    @classmethod
    async def load_from_db(cls, db_service: "DatabaseService", application_id: int) -> "ApplicationContext":
        """Type-safe factory method to load context from database using DatabaseService"""
        # Build the select columns for the join
        columns = [
            'id', 'created_at', 'npi_number', 'dea_number', 'license_number',
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
            print(f"Practitioner data: {practitioner_data}")
            
            return cls(
                application_id=application_id,
                first_name=practitioner_data['first_name'],
                last_name=practitioner_data['last_name'],
                ssn=practitioner_data['ssn'],
                created_at=application['created_at'],
                
                npi_number=application['npi_number'],
                dea_number=application['dea_number'],
                license_number=application['license_number'],
                
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