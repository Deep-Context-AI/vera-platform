from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import date, datetime
from enum import Enum


class BaseDBModel(BaseModel):
    """Base database model with common configuration"""
    class Config:
        from_attributes = True
        validate_assignment = True
        use_enum_values = True

class ABMSModel(BaseDBModel):
    """Pydantic model for the ABMS table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    specialty: str = Field(..., description="Medical specialty")
    board_cert_status: Optional[str] = Field(None, description="Board certification status")
    board_name: Optional[str] = Field(None, description="Name of the medical board")
    issued: Optional[date] = Field(None, description="Date when certification was issued")
    expiration: Optional[date] = Field(None, description="Expiration date of certification")
    effective_date: Optional[date] = Field(None, description="Effective date of certification")
    expiration_date: Optional[date] = Field(None, description="Alternative expiration date field")
    status: Optional[str] = Field(None, description="Current status of certification")
    practitioner_id: Optional[int] = Field(None, description="Foreign key to practitioners table")


class ApplicationsModel(BaseDBModel):
    """Pydantic model for the Applications table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    provider_id: Optional[int] = Field(None, description="Foreign key to practitioners table")
    npi_number: Optional[str] = Field(None, description="National Provider Identifier")
    medicare_id: Optional[int] = Field(None, description="Foreign key to medicare table")
    medicaid_id: Optional[int] = Field(None, description="Foreign key to medical table")
    ecfmg: Optional[Dict[str, Any]] = Field(None, description="ECFMG data as JSON")
    license_number: Optional[str] = Field(None, description="License number")
    dea_number: Optional[str] = Field(None, description="DEA registration number")
    work_history: Optional[Dict[str, Any]] = Field(None, description="Work history data as JSON")
    hospital_privileges_id: Optional[int] = Field(None, description="Foreign key to hospital_privileges table")
    malpractice_insurance: Optional[Dict[str, Any]] = Field(None, description="Malpractice insurance data as JSON")
    attestation_id: Optional[int] = Field(None, description="Foreign key to attestations table")
    previous_approval_date: Optional[datetime] = Field(None, description="Previous approval date")
    status: Optional[str] = Field(None, description="Application status")

class CaliforniaBoardModel(BaseDBModel):
    """Pydantic model for the California Board table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    practitioner_id: int = Field(..., description="Foreign key to practitioners table")
    license_type: Optional[str] = Field(None, description="Type of license")
    license_number: Optional[str] = Field(None, description="License number (unique)")
    issue_date: Optional[date] = Field(None, description="Date when license was issued")
    expiration_date: Optional[date] = Field(None, description="License expiration date")
    school_name: Optional[str] = Field(None, description="Name of the school")
    graduation_year: Optional[str] = Field(None, description="Year of graduation")
    primary_status: Optional[str] = Field(None, description="Primary status of the license")
    has_805_reports: Optional[bool] = Field(None, description="Whether there are 805 reports")
    has_public_record_actions: Optional[bool] = Field(None, description="Whether there are public record actions")
    # New fields for DCA integration
    board_code: Optional[str] = Field(None, description="DCA board code (e.g., '800' for Medical Board)")
    license_type_rank: Optional[str] = Field(None, description="License type rank (e.g., 'A', 'G', 'C')")
    secondary_status_code: Optional[List[str]] = Field(None, description="Secondary status codes for disciplinary actions")

class DEAModel(BaseDBModel):
    """Pydantic model for the DEA table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    number: Optional[str] = Field(None, description="DEA registration number (unique)")
    business_activity_code: Optional[str] = Field(None, description="Business activity code")
    registration_status: Optional[str] = Field(None, description="Registration status")
    authorized_schedules: Optional[Dict[str, Any]] = Field(None, description="Authorized schedules as JSON")
    issue_date: Optional[date] = Field(None, description="Date when DEA was issued")
    expiration: Optional[date] = Field(None, description="DEA expiration date")
    state: Optional[str] = Field(None, description="State of registration")
    paid_status: Optional[str] = Field(None, description="Payment status")
    has_restrictions: Optional[bool] = Field(None, description="Whether there are restrictions")
    restriction_details: Optional[Dict[str, Any]] = Field(None, description="Restriction details as JSON")
    practitioner_id: Optional[int] = Field(None, description="Foreign key to practitioners table")

class HospitalPrivilegesModel(BaseDBModel):
    """Pydantic model for the Hospital Privileges table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    practitioner_id: int = Field(..., description="Foreign key to practitioners table")
    npi_number: Optional[str] = Field(None, description="National Provider Identifier")
    status: Optional[str] = Field(None, description="Status of hospital privileges")
    issued: Optional[date] = Field(None, description="Date when privileges were issued")
    expired: Optional[date] = Field(None, description="Date when privileges expired")
    hospital: Optional[str] = Field(None, description="Hospital name")
    specialty: Optional[str] = Field(None, description="Medical specialty")

class MedicalModel(BaseDBModel):
    """Pydantic model for the Medical table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    npi_number: Optional[str] = Field(None, description="National Provider Identifier")
    practitioner_id: Optional[int] = Field(None, description="Foreign key to practitioners table")
    managed_care: Optional[Dict[str, Any]] = Field(None, description="Managed care data as JSON")
    orp: Optional[Dict[str, Any]] = Field(None, description="ORP (Other Recognized Provider) data as JSON")
    notes: Optional[str] = Field(None, description="Additional notes")

class MedicareModel(BaseDBModel):
    """Pydantic model for the Medicare table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    practitioner_id: int = Field(..., description="Foreign key to practitioners table")
    npi_number: Optional[str] = Field(None, description="National Provider Identifier")
    ffs_provider_enrollment: Optional[Dict[str, Any]] = Field(None, description="FFS Provider Enrollment data as JSON")
    ordering_referring_provider: Optional[Dict[str, Any]] = Field(None, description="Ordering/Referring Provider data as JSON")

class NPDBModel(BaseDBModel):
    """Pydantic model for the NPDB table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    practitioner_id: int = Field(..., description="Foreign key to practitioners table")
    npi_number: Optional[str] = Field(None, description="National Provider Identifier")
    license_number: Optional[str] = Field(None, description="License number")
    upin: Optional[str] = Field(None, description="UPIN number")
    malpractice: Optional[Dict[str, Any]] = Field(None, description="Malpractice data as JSON")
    state_licensure_action: Optional[Dict[str, Any]] = Field(None, description="State licensure action data as JSON")
    exclusion_debarment: Optional[Dict[str, Any]] = Field(None, description="Exclusion/debarment data as JSON")
    government_admin_action: Optional[Dict[str, Any]] = Field(None, description="Government administrative action data as JSON")
    clinical_privileges_action: Optional[Dict[str, Any]] = Field(None, description="Clinical privileges action data as JSON")
    health_plan_action: Optional[Dict[str, Any]] = Field(None, description="Health plan action data as JSON")
    professional_society_action: Optional[Dict[str, Any]] = Field(None, description="Professional society action data as JSON")
    dea_or_federal_licensure_action: Optional[Dict[str, Any]] = Field(None, description="DEA or federal licensure action data as JSON")
    judgment_or_conviction: Optional[Dict[str, Any]] = Field(None, description="Judgment or conviction data as JSON")
    peer_review_organization_action: Optional[Dict[str, Any]] = Field(None, description="Peer review organization action data as JSON")

class NPIModel(BaseDBModel):
    """Pydantic model for the NPI table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    number: Optional[str] = Field(None, description="NPI number (unique)")
    type: Optional[str] = Field(None, description="Provider type")
    status: Optional[str] = Field(None, description="NPI status")
    taxonomy_code: Optional[str] = Field(None, description="Taxonomy code")
    description: Optional[str] = Field(None, description="Provider description")
    practitioner_id: Optional[int] = Field(None, description="Foreign key to practitioners table")

# Enhanced models for Practitioner JSONB fields
class PractitionerEducation(BaseModel):
    """Pydantic model for practitioner education JSONB field"""
    degree: Optional[str] = Field(None, description="Medical degree (MD, DO, MBBS, etc.)")
    medical_school: Optional[str] = Field(None, description="Name of medical school")
    graduation_year: Optional[int] = Field(None, description="Year of graduation")

class PractitionerAddress(BaseModel):
    """Pydantic model for practitioner address JSONB fields"""
    street: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City")
    state: Optional[str] = Field(None, description="State")
    zip: Optional[str] = Field(None, description="ZIP code")
    country: Optional[str] = Field(None, description="Country")

class PractitionerDemographics(BaseModel):
    """Pydantic model for practitioner demographics JSONB field"""
    gender: Optional[str] = Field(None, description="Gender")
    race: Optional[str] = Field(None, description="Race")
    ethnicity: Optional[str] = Field(None, description="Ethnicity")
    birth_date: Optional[str] = Field(None, description="Date of birth (YYYY-MM-DD)")

class PractitionersModel(BaseDBModel):
    """Pydantic model for the Practitioners table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    first_name: str = Field(..., description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    middle_name: Optional[str] = Field(None, description="Middle name")
    suffix: Optional[str] = Field(None, description="Name suffix")
    education: Optional[Dict[str, Any]] = Field(None, description="Education data as JSON")
    other_names: Optional[str] = Field(None, description="Other names")
    home_address: Optional[Dict[str, Any]] = Field(None, description="Home address as JSON")
    mailing_address: Optional[Dict[str, Any]] = Field(None, description="Mailing address as JSON")
    ssn: Optional[str] = Field(None, description="Social Security Number")
    demographics: Optional[Dict[str, Any]] = Field(None, description="Demographics data as JSON")
    languages: Optional[Dict[str, Any]] = Field(None, description="Languages data as JSON")

class PractitionerEnhanced(BaseDBModel):
    """Enhanced Pydantic model for the Practitioners table with typed JSONB fields"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    first_name: str = Field(..., description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    middle_name: Optional[str] = Field(None, description="Middle name")
    suffix: Optional[str] = Field(None, description="Name suffix")
    education: Optional[PractitionerEducation] = Field(None, description="Education data")
    other_names: Optional[str] = Field(None, description="Other names")
    home_address: Optional[PractitionerAddress] = Field(None, description="Home address")
    mailing_address: Optional[PractitionerAddress] = Field(None, description="Mailing address")
    ssn: Optional[str] = Field(None, description="Social Security Number")
    demographics: Optional[PractitionerDemographics] = Field(None, description="Demographics data")
    languages: Optional[List[str]] = Field(None, description="Languages spoken")
    
    @property
    def full_name(self) -> str:
        """Get the full name of the practitioner"""
        name_parts = [self.first_name]
        if self.middle_name:
            name_parts.append(self.middle_name)
        if self.last_name:
            name_parts.append(self.last_name)
        if self.suffix:
            name_parts.append(self.suffix)
        return " ".join(name_parts)

class SanctionCheckModel(BaseDBModel):
    """Pydantic model for the SanctionCheck table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    practitioner_id: int = Field(..., description="Foreign key to practitioners table")
    npi_number: Optional[str] = Field(None, description="National Provider Identifier")
    license_number: Optional[str] = Field(None, description="License number")
    sanctions: Optional[Dict[str, Any]] = Field(None, description="Sanctions data as JSON")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

class AttestationsModel(BaseDBModel):
    """Pydantic model for the Attestations table"""
    id: Optional[int] = Field(None, description="Auto-generated primary key")
    practitioner_id: int = Field(..., description="Foreign key to practitioners table")
    
    # License & Certification attestations
    license_certification_active_unrestricted_license: Optional[Dict[str, Any]] = Field(None, description="Active unrestricted license attestation")
    license_certification_license_ever_suspended_revoked: Optional[Dict[str, Any]] = Field(None, description="License suspension/revocation attestation")
    license_certification_license_investigation_pending: Optional[Dict[str, Any]] = Field(None, description="Pending license investigation attestation")
    license_certification_license_voluntarily_surrendered: Optional[Dict[str, Any]] = Field(None, description="Voluntarily surrendered license attestation")
    
    # Hospital Privileges attestations
    hospital_privileges_privileges_ever_denied_or_revoked: Optional[Dict[str, Any]] = Field(None, description="Hospital privileges denial/revocation attestation")
    hospital_privileges_hospital_under_investigation: Optional[Dict[str, Any]] = Field(None, description="Hospital investigation attestation")
    hospital_privileges_resigned_to_avoid_investigation: Optional[Dict[str, Any]] = Field(None, description="Resignation to avoid investigation attestation")
    
    # Malpractice Liability attestations
    malpractice_liability_malpractice_claims_filed: Optional[Dict[str, Any]] = Field(None, description="Malpractice claims filed attestation")
    malpractice_liability_malpractice_settlements_or_judgments: Optional[Dict[str, Any]] = Field(None, description="Malpractice settlements/judgments attestation")
    malpractice_liability_reported_to_npdb: Optional[Dict[str, Any]] = Field(None, description="NPDB reporting attestation")
    malpractice_liability_malpractice_insurance_cancelled_or_denied: Optional[Dict[str, Any]] = Field(None, description="Malpractice insurance cancellation/denial attestation")
    
    # Criminal Background attestations
    criminal_background_convicted_of_crime: Optional[Dict[str, Any]] = Field(None, description="Criminal conviction attestation")
    criminal_background_pending_criminal_charges: Optional[Dict[str, Any]] = Field(None, description="Pending criminal charges attestation")
    criminal_background_fraud_or_civil_judgment: Optional[Dict[str, Any]] = Field(None, description="Fraud or civil judgment attestation")
    
    # Medicare/Medicaid attestations
    medicare_medicaid_excluded_from_federal_healthcare_programs: Optional[Dict[str, Any]] = Field(None, description="Federal healthcare program exclusion attestation")
    medicare_medicaid_government_investigation_for_fraud: Optional[Dict[str, Any]] = Field(None, description="Government fraud investigation attestation")
    
    # Substance Use attestations
    substance_use_currently_using_impairing_substances: Optional[Dict[str, Any]] = Field(None, description="Current substance use attestation")
    substance_use_treated_for_substance_abuse: Optional[Dict[str, Any]] = Field(None, description="Substance abuse treatment attestation")
    substance_use_under_monitoring_for_substance_disorder: Optional[Dict[str, Any]] = Field(None, description="Substance disorder monitoring attestation")
    
    # Physical/Mental Health attestations
    physical_mental_health_impairing_health_conditions: Optional[Dict[str, Any]] = Field(None, description="Impairing health conditions attestation")
    physical_mental_health_restricted_due_to_health: Optional[Dict[str, Any]] = Field(None, description="Health-related restrictions attestation")
    
    # Board Certification & Education attestations
    board_certification_education_board_certified: Optional[Dict[str, Any]] = Field(None, description="Board certification attestation")
    board_certification_education_board_certification_revoked_or_de: Optional[Dict[str, Any]] = Field(None, description="Board certification revocation attestation")
    board_certification_education_misrepresented_education: Optional[Dict[str, Any]] = Field(None, description="Education misrepresentation attestation")
    
    # Billing Practice History attestations
    billing_practice_history_disciplined_by_insurer_or_payer: Optional[Dict[str, Any]] = Field(None, description="Insurer/payer discipline attestation")
    billing_practice_history_terminated_by_health_plan_for_cause: Optional[Dict[str, Any]] = Field(None, description="Health plan termination attestation")
    billing_practice_history_billing_privileges_revoked_or_repaid: Optional[Dict[str, Any]] = Field(None, description="Billing privileges revocation/repayment attestation")
    
    # Ethical Conduct attestations
    ethical_conduct_ethics_complaint_filed: Optional[Dict[str, Any]] = Field(None, description="Ethics complaint attestation")
    ethical_conduct_sanctioned_by_peer_review: Optional[Dict[str, Any]] = Field(None, description="Peer review sanction attestation")
    ethical_conduct_application_falsification: Optional[Dict[str, Any]] = Field(None, description="Application falsification attestation")
    
    # Affirmation & Authorization attestations
    affirmation_authorization_information_accurate_and_true: Optional[Dict[str, Any]] = Field(None, description="Information accuracy attestation")
    affirmation_authorization_authorize_background_verification: Optional[Dict[str, Any]] = Field(None, description="Background verification authorization")
    affirmation_authorization_understand_false_statement_consequenc: Optional[Dict[str, Any]] = Field(None, description="False statement consequences understanding")
    affirmation_authorization_board_certification_denied_or_revoked: Optional[Dict[str, Any]] = Field(None, description="Board certification denial/revocation attestation")
    affirmation_authorization_profile_current_and_attested: Optional[Dict[str, Any]] = Field(None, description="Profile currency attestation")
    affirmation_authorization_recent_medical_or_disability_leave: Optional[Dict[str, Any]] = Field(None, description="Medical/disability leave attestation")
    affirmation_authorization_disclosed_all_affiliations: Optional[Dict[str, Any]] = Field(None, description="Affiliation disclosure attestation")
    affirmation_authorization_application_complete_and_truthful: Optional[Dict[str, Any]] = Field(None, description="Application completeness/truthfulness attestation")
    affirmation_authorization_authorize_optum_verification: Optional[Dict[str, Any]] = Field(None, description="Optum verification authorization")
    
    # Timestamps
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
