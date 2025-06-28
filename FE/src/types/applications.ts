// Application-related types based on the vera.applications table schema

export interface WorkHistoryEntry {
  end_date: string | null;
  position: string;
  start_date: string;
  organization: string;
}

export interface MalpracticeInsurance {
  carrier: string;
  coverage_end: string;
  policy_number: string;
  coverage_start: string;
}

// Structured interfaces for JSON fields
export interface PractitionerEducation {
  degree: string;
  medical_school: string;
  graduation_year: number;
}

export interface Address {
  zip: string;
  city: string;
  state: string;
  street: string;
}

export interface PractitionerDemographics {
  race: string;
  gender: string;
  ethnicity: string;
  birth_date: string;
}

// Attestation response structure
export interface AttestationResponse {
  response: boolean;
  explanation: string;
  explanation_required_on: string;
}

// Attestation interface based on the vera.attestations table schema
export interface Attestation {
  id: number;
  practitioner_id: number;
  license_certification_active_unrestricted_license: AttestationResponse | null;
  license_certification_license_ever_suspended_revoked: AttestationResponse | null;
  license_certification_license_investigation_pending: AttestationResponse | null;
  license_certification_license_voluntarily_surrendered: AttestationResponse | null;
  hospital_privileges_privileges_ever_denied_or_revoked: AttestationResponse | null;
  hospital_privileges_hospital_under_investigation: AttestationResponse | null;
  hospital_privileges_resigned_to_avoid_investigation: AttestationResponse | null;
  malpractice_liability_malpractice_claims_filed: AttestationResponse | null;
  malpractice_liability_malpractice_settlements_or_judgments: AttestationResponse | null;
  malpractice_liability_reported_to_npdb: AttestationResponse | null;
  malpractice_liability_malpractice_insurance_cancelled_or_denied: AttestationResponse | null;
  criminal_background_convicted_of_crime: AttestationResponse | null;
  criminal_background_pending_criminal_charges: AttestationResponse | null;
  criminal_background_fraud_or_civil_judgment: AttestationResponse | null;
  medicare_medicaid_excluded_from_federal_healthcare_programs: AttestationResponse | null;
  medicare_medicaid_government_investigation_for_fraud: AttestationResponse | null;
  substance_use_currently_using_impairing_substances: AttestationResponse | null;
  substance_use_treated_for_substance_abuse: AttestationResponse | null;
  substance_use_under_monitoring_for_substance_disorder: AttestationResponse | null;
  physical_mental_health_impairing_health_conditions: AttestationResponse | null;
  physical_mental_health_restricted_due_to_health: AttestationResponse | null;
  board_certification_education_board_certified: AttestationResponse | null;
  board_certification_education_board_certification_revoked_or_de: AttestationResponse | null;
  board_certification_education_misrepresented_education: AttestationResponse | null;
  billing_practice_history_disciplined_by_insurer_or_payer: AttestationResponse | null;
  billing_practice_history_terminated_by_health_plan_for_cause: AttestationResponse | null;
  billing_practice_history_billing_privileges_revoked_or_repaid: AttestationResponse | null;
  ethical_conduct_ethics_complaint_filed: AttestationResponse | null;
  ethical_conduct_sanctioned_by_peer_review: AttestationResponse | null;
  ethical_conduct_application_falsification: AttestationResponse | null;
  affirmation_authorization_information_accurate_and_true: AttestationResponse | null;
  affirmation_authorization_authorize_background_verification: AttestationResponse | null;
  affirmation_authorization_understand_false_statement_consequenc: AttestationResponse | null;
  affirmation_authorization_board_certification_denied_or_revoked: AttestationResponse | null;
  affirmation_authorization_profile_current_and_attested: AttestationResponse | null;
  affirmation_authorization_recent_medical_or_disability_leave: AttestationResponse | null;
  affirmation_authorization_disclosed_all_affiliations: AttestationResponse | null;
  affirmation_authorization_application_complete_and_truthful: AttestationResponse | null;
  affirmation_authorization_authorize_optum_verification: AttestationResponse | null;
  created_at: string | null;
  updated_at: string | null;
}

// Practitioner interface based on the vera.practitioners table schema
export interface Practitioner {
  id: number;
  first_name: string;
  last_name: string | null;
  middle_name: string | null;
  suffix: string | null;
  education: any | null;
  other_names: string | null;
  home_address: any | null;
  mailing_address: any | null;
  ssn: string | null;
  demographics: any | null;
  languages: any | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Application {
  id: number;
  created_at: string;
  provider_id: number | null;
  npi_number: string | null;
  medicare_id: number | null;
  medicaid_id: number | null;
  ecfmg: any | null; // JSONB field - can be more specific based on actual structure
  license_number: string | null;
  dea_number: string | null;
  work_history: WorkHistoryEntry[] | null;
  hospital_privileges_id: number | null;
  malpractice_insurance: MalpracticeInsurance | null;
  attestation_id: number | null;
  previous_approval_date: string | null;
  status: string | null;
}

// Enhanced Application interface with joined data from practitioners and NPI tables
export interface ApplicationWithDetails extends Application {
  practitioner?: {
    id: number;
    first_name: string;
    last_name: string | null;
    middle_name: string | null;
    suffix: string | null;
    education: any | null;
    other_names: string | null;
    home_address: any | null;
    mailing_address: any | null;
    demographics: any | null;
    languages: any | null;
  };
  npi_details?: {
    id: number;
    number: string | null;
    type: string | null;
    status: string | null;
    taxonomy_code: string | null;
    description: string | null;
  };
}

// Interface for the application_details database view
export interface ApplicationDetailsView {
  // Application fields
  id: number;
  created_at: string;
  provider_id: number | null;
  npi_number: string | null;
  medicare_id: number | null;
  medicaid_id: number | null;
  ecfmg: any | null;
  license_number: string | null;
  dea_number: string | null;
  work_history: WorkHistoryEntry[] | null;
  hospital_privileges_id: number | null;
  malpractice_insurance: MalpracticeInsurance | null;
  attestation_id: number | null;
  previous_approval_date: string | null;
  status: string | null;
  
  // Practitioner fields
  practitioner_first_name: string | null;
  practitioner_last_name: string | null;
  practitioner_middle_name: string | null;
  practitioner_suffix: string | null;
  practitioner_education: PractitionerEducation | null;
  practitioner_other_names: string | null;
  practitioner_home_address: Address | null;
  practitioner_mailing_address: Address | null;
  practitioner_ssn: string | null;
  practitioner_demographics: PractitionerDemographics | null;
  practitioner_languages: string[] | null;
  
  // Computed fields
  full_name: string | null;
  verification_status: string;
  primary_address: Address | null;
}

export type ApplicationStatus = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING';

export type VerificationStatus = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING'
  | 'UNKNOWN';

export interface CreateApplicationRequest {
  provider_id?: number;
  npi_number?: string;
  medicare_id?: number;
  medicaid_id?: number;
  ecfmg?: any;
  license_number?: string;
  dea_number?: string;
  work_history?: WorkHistoryEntry[];
  hospital_privileges_id?: number;
  malpractice_insurance?: MalpracticeInsurance;
  attestation_id?: number;
  previous_approval_date?: string;
  status?: string;
}

export interface UpdateApplicationRequest extends Partial<CreateApplicationRequest> {
  id: number;
} 