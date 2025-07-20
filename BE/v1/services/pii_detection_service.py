import logging
import os
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
import json

logger = logging.getLogger(__name__)

class PIIDetectionService:
    """Service for detecting PII in text using custom microservice"""
    
    def __init__(self):
        # Use the custom endpoint for PII detection
        self.base_url = "https://mikhailocampo--pii-llm-api-serve.modal.run/v1"
        self.client = AsyncOpenAI(
            base_url=self.base_url,
            api_key="dummy-key"  # The endpoint doesn't require a real API key
        )
        
        # System prompt for PII detection
        self.system_prompt = """
        ### Instruction: 
        Identify and extract the following PII entities from the text, if present: 
        
        firstname, lastname, middlename
        street address, city, county, precinct, ZIP code
        birthdate, admission date, discharge date, death date, age
        telephone_number, fax_number
        vehicle_identifiers
        device_identifiers, mac_address
        email_address
        urls
        social_security_number
        internet_protocol_address
        medical_record_number
        health_plan_number
        account_number
        certificate_number, license_number
        
        Return the output in JSON format. Please see examples below:
        ### Input:
        "John Doe is a 30-year-old male who lives at 123 Main St, Anytown, 12345. He was born on January 1, 1990. His telephone number is 123-456-7890 and fax number is 123-456-7890. He has a vehicle identifier of 1234567890 and a device identifier of 1234567890. He has an email address of john.doe@example.com and a URL of https://www.example.com. He has a social security number of 123-45-6789 and a medical record number of 1234567890. He has a health plan number of 1234567890 and an account number of 1234567890. He has a certificate number of 1234567890 and a license number of 1234567890."
        
        ### Output:
        {
            "firstname": ["John"],
            "lastname": ["Doe"],
            "street_address": ["123 Main St"],
            "city": ["Anytown"],
            "zipcode": ["12345"],
            "birthdate": ["1990-01-01"],
            "telephone_number": ["123-456-7890"],
            "fax_number": ["123-456-7890"],
            "vehicle_identifiers": ["1234567890"],
            "device_identifiers": ["1234567890"],
            "email_address": ["john.doe@example.com"],
            "urls": ["https://www.example.com"],
        }
        
        ### Input:
        """
    
    async def detect_pii_in_text(self, text: str) -> Dict[str, List[str]]:
        """
        Detect PII entities in the given text
        
        Args:
            text: The text to analyze for PII
            
        Returns:
            Dictionary with PII entity types as keys and lists of detected values as values
            
        Raises:
            Exception: If PII detection fails
        """
        try:
            logger.info("Detecting PII in text using microservice")
            
            # Call the PII detection microservice
            response = await self.client.chat.completions.create(
                model="llm",
                messages=[
                    {
                        "role": "system",
                        "content": self.system_prompt
                    },
                    {
                        "role": "user", 
                        "content": text
                    }
                ]
            )
            
            # Extract the content from the response
            content = response.choices[0].message.content.strip()
            logger.info(f"PII detection response: {content}")
            
            # Parse the JSON response
            try:
                pii_data = json.loads(content)
                logger.info(f"Successfully detected PII entities: {list(pii_data.keys())}")
                return pii_data
            except json.JSONDecodeError:
                # Try to extract JSON from the content if it's wrapped in other text
                try:
                    # Look for JSON-like content - handle the "### Output:" prefix
                    json_start = content.find('{')
                    json_end = content.rfind('}') + 1
                    
                    if json_start >= 0 and json_end > json_start:
                        json_content = content[json_start:json_end]
                        pii_data = json.loads(json_content)
                        logger.info(f"Successfully extracted and parsed PII entities: {list(pii_data.keys())}")
                        return pii_data
                    
                    # Try to find Python dict-like structure and convert to JSON
                    if "'" in content and "{" in content:
                        # Replace single quotes with double quotes for JSON parsing
                        try:
                            # Extract dict-like content and evaluate safely
                            dict_start = content.find('{')
                            dict_end = content.rfind('}') + 1
                            if dict_start >= 0 and dict_end > dict_start:
                                dict_content = content[dict_start:dict_end]
                                # Replace single quotes with double quotes
                                json_content = dict_content.replace("'", '"')
                                pii_data = json.loads(json_content)
                                logger.info(f"Successfully parsed dict-style PII entities: {list(pii_data.keys())}")
                                return pii_data
                        except:
                            pass
                    
                    logger.warning(f"Could not parse PII detection response as JSON: {content}")
                    return {}
                except json.JSONDecodeError:
                    logger.warning(f"Could not parse PII detection response as JSON: {content}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Error detecting PII: {e}")
            raise Exception(f"PII detection failed: {str(e)}")
    


# Global service instance
pii_detection_service = PIIDetectionService() 