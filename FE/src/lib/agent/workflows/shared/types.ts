export interface BaseVerificationDecision {
  decision: 'completed' | 'in_progress' | 'failed' | 'requires_review';
  reasoning: string;
  issues_found?: string[];
  recommendations?: string[];
}

export interface NPIVerificationDecision extends BaseVerificationDecision {}

export interface CALicenseVerificationDecision extends BaseVerificationDecision {
  license_details?: {
    number?: string;
    state?: string;
    issued_date?: string;
    expiration_date?: string;
    status?: string;
  };
}

export interface ABMSVerificationDecision extends BaseVerificationDecision {}

export interface DEAVerificationDecision extends BaseVerificationDecision {
  dea_details?: {
    number?: string;
    status?: string;
    expiration_date?: string;
    registrant_name?: string;
    business_activity?: string;
  };
}

export interface MedicareVerificationDecision extends BaseVerificationDecision {
  medicare_details?: {
    npi?: string;
    enrollment_status?: string;
    enrollment_date?: string;
    provider_type?: string;
    specialty?: string;
    reassignment_eligible?: boolean;
  };
}

export interface MedicalVerificationDecision extends BaseVerificationDecision {
  medical_details?: {
    npi?: string;
    enrollment_status?: string;
    provider_type?: string;
    license_type?: string;
    taxonomy_code?: string;
    managed_care_enrollment?: boolean;
    orp_enrollment?: boolean;
  };
}

export interface NPDBVerificationDecision extends BaseVerificationDecision {
  incidents_found?: Array<{
    incident_type: string;
    date?: string;
    details: string;
    severity?: 'high' | 'medium' | 'low';
  }>;
  summary?: string;
}

export interface SanctionCheckVerificationDecision extends BaseVerificationDecision {
  sanctions_found?: Array<{
    sanction_type: string;
    date?: string;
    details: string;
    severity?: 'high' | 'medium' | 'low';
    source?: string; // OIG, GSA, etc.
  }>;
  summary?: string;
}