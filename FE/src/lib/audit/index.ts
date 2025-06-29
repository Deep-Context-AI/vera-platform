// Environment-based API endpoints configuration
const API_ENDPOINTS = {
  DEV: 'https://mikhailocampo--vera-platform-fastapi-app-dev.modal.run',
  PROD: 'https://mikhailocampo--vera-platform-fastapi-app.modal.run',
  get CURRENT() {
    // Check if we're in development environment
    const isDev = process.env.NODE_ENV === 'development' || 
                  typeof window !== 'undefined' && window.location.hostname === 'localhost';
    return isDev ? this.DEV : this.PROD;
  }
};

// Types for audit trail data based on the universal schema
export interface AuditTrailData {
  // Core fields
  step_type: string;
  reasoning?: string;

  // Request/Response data
  request_data?: object;
  response_data?: object;

  // Verification results
  verification_result?: 'verified' | 'not_verified' | 'partial' | 'error';
  match_found?: boolean;
  confidence_score?: number;

  // External service details
  external_service?: string;
  external_service_response_time_ms?: number;
  external_service_status?: string;

  // Data quality and validation
  data_quality_score?: number;
  validation_errors?: string[];
  data_completeness?: number;

  // Risk assessment
  risk_flags?: string[];
  risk_score?: number;
  requires_manual_review?: boolean;

  // Processing details
  processing_method?: 'database' | 'external_api' | 'ai_generated' | 'manual';
  processing_duration_ms?: number;
  retry_count?: number;

  // Agent information
  processed_by?: string;
  agent_id?: string;
  agent_version?: string;

  // Compliance and audit
  compliance_checks?: string[];
  audit_notes?: string;

  // Error handling
  error_code?: string;
  error_message?: string;
  error_stack_trace?: string;

  // Dependencies
  depends_on_steps?: string[];
  blocking_steps?: string[];

  // Metadata
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration_ms?: number;

  // Step-specific data
  step_specific_data?: object;
}

// Request types for API calls
export interface StartAuditTrailRequest {
  application_id: number;
  step_name: string;
  step_type: string;
  reasoning?: string;
  request_data?: object;
  processed_by?: string;
  agent_id?: string;
  priority?: string;
  estimated_duration_ms?: number;
  depends_on_steps?: string[];
  tags?: string[];
  [key: string]: any; // Allow additional fields from AuditTrailData
}

export interface CompleteAuditTrailRequest {
  application_id: number;
  step_name: string;
  status: 'completed' | 'failed' | 'cancelled' | 'requires_review';
  reasoning?: string;
  response_data?: object;
  verification_result?: string;
  match_found?: boolean;
  confidence_score?: number;
  external_service?: string;
  external_service_response_time_ms?: number;
  external_service_status?: string;
  data_quality_score?: number;
  validation_errors?: string[];
  risk_flags?: string[];
  risk_score?: number;
  requires_manual_review?: boolean;
  processing_method?: string;
  processing_duration_ms?: number;
  retry_count?: number;
  compliance_checks?: string[];
  audit_notes?: string;
  error_code?: string;
  error_message?: string;
  [key: string]: any; // Allow additional fields from AuditTrailData
}

// Response types
export interface AuditTrailStep {
  application_id: number;
  step_name: string;
  status: string;
  data: AuditTrailData;
  started_at: string;
  finished_at?: string;
}

export interface AuditTrailSummary {
  application_id: number;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  in_progress_steps: number;
  pending_steps: number;
  overall_status: string;
  last_updated: string;
}

// Utility class for audit trail operations
export class AuditTrailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_ENDPOINTS.CURRENT}/v1/audit-trail`;
  }

  /**
   * Start a new audit trail step
   */
  async startStep(request: StartAuditTrailRequest): Promise<AuditTrailStep> {
    const url = `${this.baseUrl}/start`;
    
    // Debug logging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting audit trail step:', { url, request });
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Audit trail start failed:', { status: response.status, statusText: response.statusText, errorText });
      throw new Error(`Failed to start audit trail step: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Debug logging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit trail step started successfully:', data);
    }
    
    // Backend returns wrapped response with { status, message, entry }
    return data.entry;
  }

  /**
   * Complete an audit trail step
   */
  async completeStep(request: CompleteAuditTrailRequest): Promise<AuditTrailStep> {
    const response = await fetch(`${this.baseUrl}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to complete audit trail step: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    // Backend returns wrapped response with { status, message, entry }
    return data.entry;
  }

  /**
   * Get all audit trail steps for an application
   */
  async getApplicationAuditTrail(applicationId: number): Promise<AuditTrailStep[]> {
    const response = await fetch(`${this.baseUrl}/${applicationId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch audit trail: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    // Backend returns wrapped response with { status, message, entries, ... }
    return data.entries || [];
  }

  /**
   * Get audit trail summary for an application
   */
  async getAuditTrailSummary(applicationId: number): Promise<AuditTrailSummary> {
    const response = await fetch(`${this.baseUrl}/${applicationId}/summary`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch audit trail summary: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    // Backend returns wrapped response, extract the summary data
    return {
      application_id: data.application_id,
      total_steps: data.total_steps,
      completed_steps: data.completed_steps,
      failed_steps: data.failed_steps,
      in_progress_steps: data.in_progress_steps,
      pending_steps: data.pending_steps,
      overall_status: data.overall_progress > 90 ? 'completed' : 
                     data.failed_steps > 0 ? 'failed' : 'in_progress',
      last_updated: data.last_activity || new Date().toISOString()
    };
  }

  /**
   * Get specific step status
   */
  async getStepStatus(applicationId: number, stepName: string): Promise<AuditTrailStep | null> {
    const response = await fetch(`${this.baseUrl}/${applicationId}/step/${stepName}`);

    if (response.status === 404) {
      return null; // Step not found
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch step status: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    // Backend returns wrapped response with { status, message, entry }
    return data.entry;
  }
}

// Convenience functions for common operations
export const auditTrailService = new AuditTrailService();

/**
 * Start a verification step with common defaults
 */
export async function startVerificationStep(
  applicationId: number,
  stepName: string,
  options: {
    reasoning?: string;
    requestData?: object;
    processedBy?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    stepType?: string;
  } = {}
): Promise<AuditTrailStep> {
  const {
    reasoning,
    requestData,
    processedBy = 'frontend_user',
    priority = 'medium',
    stepType = 'manual_review'
  } = options;

  return auditTrailService.startStep({
    application_id: applicationId,
    step_name: stepName,
    step_type: stepType,
    reasoning,
    request_data: requestData,
    processed_by: processedBy,
    agent_id: 'frontend-agent-001',
    priority,
    estimated_duration_ms: 300000, // 5 minutes default
    tags: [stepName, 'frontend', 'verification']
  });
}

/**
 * Complete a verification step with common defaults
 */
export async function completeVerificationStep(
  applicationId: number,
  stepName: string,
  options: {
    status: 'completed' | 'failed' | 'cancelled' | 'requires_review';
    reasoning?: string;
    responseData?: object;
    verificationResult?: 'verified' | 'not_verified' | 'partial' | 'error';
    confidenceScore?: number;
    processingDurationMs?: number;
    riskFlags?: string[];
    complianceChecks?: string[];
  }
): Promise<AuditTrailStep> {
  const {
    status,
    reasoning,
    responseData,
    verificationResult,
    confidenceScore,
    processingDurationMs,
    riskFlags,
    complianceChecks
  } = options;

  return auditTrailService.completeStep({
    application_id: applicationId,
    step_name: stepName,
    status,
    reasoning,
    response_data: responseData,
    verification_result: verificationResult,
    match_found: verificationResult === 'verified',
    confidence_score: confidenceScore,
    processing_method: 'manual',
    processing_duration_ms: processingDurationMs,
    risk_flags: riskFlags,
    compliance_checks: complianceChecks,
    audit_notes: reasoning
  });
}

/**
 * Map frontend verification status to audit trail status
 */
export function mapVerificationStatus(
  frontendStatus: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'requires_review'
): 'completed' | 'failed' | 'cancelled' | 'requires_review' {
  switch (frontendStatus) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'requires_review':
      return 'requires_review';
    default:
      return 'completed'; // Default fallback
  }
}

// Export API endpoints for direct use
export { API_ENDPOINTS }; 