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