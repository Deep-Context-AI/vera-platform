// Provider API Types - matches backend Pydantic models

export interface ProviderEducation {
  degree?: string | null;
  medical_school?: string | null;
  graduation_year?: number | null;
}

export interface ProviderAddress {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}

export interface ProviderDemographics {
  gender?: string | null;
  race?: string | null;
  ethnicity?: string | null;
  birth_date?: string | null;
}

export interface MalpracticeInsurance {
  carrier?: string | null;
  coverage_start?: string | null;
  coverage_end?: string | null;
  policy_number?: string | null;
}

export interface WorkHistoryEntry {
  organization: string;
  position: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ECFMGInfo {
  ecfmg_number?: string | null;
  ecfmg_certified?: boolean | null;
  certification_date?: string | null;
  is_international_medical_graduate?: boolean | null;
}

export interface Provider {
  id: number;
  name: string;
  first_name: string;
  last_name?: string | null;
  middle_name?: string | null;
  suffix?: string | null;
  npi?: string | null;
  license_number?: string | null;
  dea_number?: string | null;
  education?: ProviderEducation | null;
  demographics?: ProviderDemographics | null;
  home_address?: ProviderAddress | null;
  mailing_address?: ProviderAddress | null;
  languages?: string[] | null;
  ssn?: string | null;
}

export interface Application {
  status: string;
  created_at: string;
  updated_at?: string | null;
  work_history?: WorkHistoryEntry[] | null;
  malpractice_insurance?: MalpracticeInsurance | null;
  ecfmg?: ECFMGInfo | null;
  previous_approval_date?: string | null;
  notes?: string | null;
}

export interface VerificationProgress {
  completed_steps: number;
  total_steps: number;
  percentage: number;
}

export interface ProviderProfileResponse {
  application_id: number;
  provider: Provider;
  application: Application;
  verification_progress: VerificationProgress;
}

export interface VerificationStepSummary {
  step_key: string;
  step_name: string;
  status: string;
  decided_by?: string | null;
  decided_at?: string | null;
  has_documents: boolean;
  activity_count: number;
  decision_reasoning?: string | null;
}

export interface VerificationStepsResponse {
  steps: VerificationStepSummary[];
}

export interface ExecutionDetails {
  invocation_type: string;
  request_data?: any | null;
  response_data?: any | null;
  metadata?: any | null;
  created_by: string;
  created_at: string;
  document_url?: string | null;
}

export interface StepResult {
  decision?: string | null;
  reasoning?: string | null;
}

export interface ActivityLogEntry {
  id: number;
  action: string;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_email?: string | null;
  timestamp: string;
  source?: string | null;
  notes?: string | null;
}

export interface StepDetailsResponse {
  step_key: string;
  step_name: string;
  status: string;
  execution_details?: ExecutionDetails | null;
  result?: StepResult | null;
  activity_log: ActivityLogEntry[];
}

export interface Actor {
  id: string;
  name: string;
  email?: string | null;
}

export interface ActivityEntry {
  id: number;
  action: string;
  actor?: Actor | null;
  timestamp: string;
  source?: string | null;
  notes?: string | null;
}

export interface ActivityResponse {
  activities: ActivityEntry[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  step_key: string;
  url: string;
  generated_at: string;
  size_estimate: string;
  format: string;
}

export interface DocumentsResponse {
  documents: Document[];
}

export interface AvailableStep {
  step_key: string;
  name: string;
  display_name: string;
}

export interface VerificationStepsRegistryResponse {
  available_steps: AvailableStep[];
  total_steps: number;
}

// API Error types
export interface APIError {
  detail: string;
}

// Request parameter types
export interface GetDocumentsParams {
  step_key?: string;
}

// Sync verification types
export interface SyncVerificationRequest {
  application_id: number;
  step_key: string;
  requester?: string;
}

export interface VerificationStepResult {
  step_key: string;
  decision: string;
  reasoning?: string | null;
  status: string;
  metadata?: any | null;
}

export interface SyncVerificationResponse {
  application_id: number;
  status: string;
  verification_results: Record<string, VerificationStepResult>;
  summary: any;
} 