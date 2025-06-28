from typing import List, Optional
from pydantic import BaseModel

# Board Models
class DCABoard(BaseModel):
    """DCA Board information"""
    client_code: str
    board_name: str
    board_code: str
    website_url: Optional[str] = None

# License Type Models
class DCALicenseType(BaseModel):
    """DCA License Type information"""
    client_code: str
    license_long_name: str
    client_name: str
    public_name_desc: str
    client_code_filter_id: str
    parent_client_code: str

# Rank Models
class DCARank(BaseModel):
    """DCA License Rank information"""
    client_code: str
    modifier_code: str
    modifier_description: str
    modifier_long_description: str
    decode_description: str

# Status Models
class DCAStatus(BaseModel):
    """DCA License Status information"""
    client_code: str
    status_code: str
    status_description: str
    translated_description: str
    license_status_hint: Optional[str] = None
    override_status_description: Optional[str] = None
    status_decode_text: str
    status_code_filter_id: str
    status_code_key_id: str

# Modifier Models
class DCAModifier(BaseModel):
    """DCA License Modifier information"""
    client_code: str
    modifier_type_code: str
    modifier_type_description: str
    modifier_type_translation: str
    modifier_code: str
    modifier_description: str
    modifier_long_description: str
    modifier_translation: str
    modifier_hint: Optional[str] = None

# Service class for DCA reference data
class DCAReference:
    """Service to provide DCA reference data lookups"""
    
    def __init__(self):
        # In a real implementation, these would be loaded from the API
        # For now, we'll implement key lookups for Medical Board of California
        self.boards = {
            "800": DCABoard(
                client_code="800",
                board_name="Medical Board of California",
                board_code="800",
                website_url="https://www.mbc.ca.gov/"
            )
        }
        
        self.license_types = {
            "8002": DCALicenseType(
                client_code="8002",
                license_long_name="Physician's and Surgeon's",
                client_name="Physician's and Surgeon's",
                public_name_desc="Physician's and Surgeon's",
                client_code_filter_id="289",
                parent_client_code="800"
            )
        }
        
        self.ranks = {
            "8002": {
                "A": DCARank(
                    client_code="8002",
                    modifier_code="A",
                    modifier_description="P & S A",
                    modifier_long_description="Physician and Surgeon A",
                    decode_description="Physician and Surgeon A"
                ),
                "G": DCARank(
                    client_code="8002",
                    modifier_code="G", 
                    modifier_description="P & S G",
                    modifier_long_description="Physician and Surgeon G",
                    decode_description="Physician and Surgeon G"
                ),
                "C": DCARank(
                    client_code="8002",
                    modifier_code="C",
                    modifier_description="P & S C", 
                    modifier_long_description="Physician and Surgeon C",
                    decode_description="Physician and Surgeon C"
                )
            }
        }
        
        self.statuses = {
            "800": {
                "20": DCAStatus(
                    client_code="800",
                    status_code="20",
                    status_description="Current",
                    translated_description="License Renewed & Current",
                    license_status_hint="Licensee meets requirements for the practice of medicine in California.",
                    status_decode_text="Active",
                    status_code_filter_id="1",
                    status_code_key_id="1"
                ),
                "21": DCAStatus(
                    client_code="800",
                    status_code="21",
                    status_description="Current - Inactive",
                    translated_description="Current - Inactive",
                    status_decode_text="Inactive",
                    status_code_filter_id="4",
                    status_code_key_id="2"
                ),
                "65": DCAStatus(
                    client_code="800",
                    status_code="65",
                    status_description="Revoked",
                    translated_description="License Revoked",
                    license_status_hint="License has been revoked as a result of disciplinary action rendered by the Board. No practice is permitted.",
                    status_decode_text="Revoked",
                    status_code_filter_id="20",
                    status_code_key_id="23"
                )
            }
        }

    def get_board_name(self, board_code: str) -> str:
        """Get board name by code"""
        board = self.boards.get(board_code)
        return board.board_name if board else f"Board {board_code}"
    
    def get_license_type_name(self, license_type_code: str) -> str:
        """Get license type name by code"""
        license_type = self.license_types.get(license_type_code)
        return license_type.license_long_name if license_type else f"License Type {license_type_code}"
    
    def get_rank_description(self, license_type_code: str, rank_code: str) -> str:
        """Get rank description by license type and rank code"""
        ranks = self.ranks.get(license_type_code, {})
        rank = ranks.get(rank_code)
        return rank.decode_description if rank else f"Rank {rank_code}"
    
    def get_status_info(self, board_code: str, status_code: str) -> Optional[DCAStatus]:
        """Get status information by board and status code"""
        statuses = self.statuses.get(board_code, {})
        return statuses.get(status_code)
    
    def is_active_status(self, board_code: str, status_code: str) -> bool:
        """Check if status indicates active license"""
        status = self.get_status_info(board_code, status_code)
        if not status:
            return False
        return status.status_decode_text.lower() in ["active", "current"]
    
    def has_disciplinary_action(self, modifiers: List[str]) -> bool:
        """Check if any modifiers indicate disciplinary action"""
        disciplinary_codes = [
            "48",  # PUBLIC REPRIMAND
            "49",  # CITATION
            "50",  # ACCUSATION
            "53",  # PROBATION
            "54",  # SUSPENDED
            "65",  # REVOKED
            "77",  # FELONY CONVICT
            "78",  # ACTN ST/FED GOV
        ]
        return any(mod in disciplinary_codes for mod in modifiers) 