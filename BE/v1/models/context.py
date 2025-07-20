import logging
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from supabase import Client

logger = logging.getLogger(__name__)

class Address(BaseModel):
    street: str = Field(..., description="The street of the address")
    city: str = Field(..., description="The city of the address")
    state: str = Field(..., description="The state of the address in full form")
    zip: str = Field(..., description="The zip code of the address")

class ApplicationContext(BaseModel):
    """Type-safe application context for verification steps"""
    application_id: int
    created_at: datetime
    
    npi_number: Optional[str] = None
    
    # Provider Table
    first_name: str
    last_name: str
    address: Address
    
    @classmethod
    async def load_from_db(cls, db: Client, application_id: int) -> "ApplicationContext":
        """Type-safe factory method to load context from database"""
        # Build the select columns for the join
        columns = [
            'id', 'created_at', 'npi_number',
            'practitioners!inner(first_name, last_name, home_address)'
        ]
        try:
            response = db.schema('vera').table('applications') \
                .select(','.join(columns)) \
                .eq('id', application_id) \
                .execute()
            
            if not response.data:
                raise ValueError(f"Application not found for ID: {application_id}")
            
            application = response.data[0]
            practitioner_data = application['practitioners']
            
            return cls(
                application_id=application_id,
                first_name=practitioner_data['first_name'],
                last_name=practitioner_data['last_name'],
                created_at=application['created_at'],
                
                npi_number=application['npi_number'],
                
                address=Address(
                    street=practitioner_data['home_address']['street'],
                    city=practitioner_data['home_address']['city'],
                    state=practitioner_data['home_address']['state'],
                    zip=practitioner_data['home_address']['zip']
                )
            )
        except Exception as e:
            logger.error(f"Failed to load application context: {e}")
            raise ValueError(f"Failed to load application context: {e}")