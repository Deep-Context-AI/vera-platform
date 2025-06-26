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
  practitioner_education: any | null;
  practitioner_other_names: string | null;
  practitioner_home_address: any | null;
  practitioner_mailing_address: any | null;
  practitioner_ssn: string | null;
  practitioner_demographics: any | null;
  practitioner_languages: any | null;
  
  // NPI fields
  npi_id: number | null;
  npi_number_verified: string | null;
  npi_type: string | null;
  npi_status: string | null;
  npi_taxonomy_code: string | null;
  npi_description: string | null;
  
  // Computed fields
  full_name: string | null;
  verification_status: 'VERIFIED' | 'NPI_MISSING' | 'NPI_INACTIVE' | string;
  npi_number_matches: boolean;
  primary_address: any | null;
}

export type ApplicationStatus = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING';

export type VerificationStatus = 
  | 'VERIFIED'
  | 'NPI_MISSING'
  | 'NPI_INACTIVE'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING';

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