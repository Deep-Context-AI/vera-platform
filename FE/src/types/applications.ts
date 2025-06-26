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

export type ApplicationStatus = 
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