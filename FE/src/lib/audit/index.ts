// Environment-based API endpoints configuration
const API_ENDPOINTS = {
  DEV: 'https://mikhailocampo--vera-platform-fastapi-app.modal.run',
  PROD: 'https://mikhailocampo--vera-platform-fastapi-app.modal.run',
  get CURRENT() {
    // Check if we're in development environment
    const isDev = process.env.NODE_ENV === 'development' || 
                  typeof window !== 'undefined' && window.location.hostname === 'localhost';
    return isDev ? this.DEV : this.PROD;
  }
};

// Valid status values for the new simplified API
export type AuditTrailStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'requires_review';

// NEW: Simplified request type for recording audit trail changes
export interface AuditTrailRecordRequest {
  application_id: number;
  step_key: string; // Changed from step_name to step_key
  status: AuditTrailStatus; // REQUIRED
  data: any; // Dynamic data structure - can be any JSON object
  changed_by?: string; // Changed from processed_by to changed_by
  notes?: string; // Simplified from reasoning/audit_notes
}

// Updated response types to match new simplified API structure
export interface AuditTrailEntry {
  application_id: number;
  step_key: string; // Changed from step_name to step_key
  status: AuditTrailStatus;
  data: any; // Dynamic data structure
  notes?: string;
  changed_by: string;
  timestamp: string;
  previous_status?: AuditTrailStatus | null;
  previous_data?: any; // Previous data state
}

export interface AuditTrailResponse {
  application_id: number;
  entries: AuditTrailEntry[];
  total_entries: number;
  unique_steps: number;
  latest_activity: string;
}

export interface AuditTrailSummary {
  application_id: number;
  total_entries: number;
  unique_steps: number;
  latest_activity: string;
  current_step_statuses: Record<string, AuditTrailStatus>;
  overall_status: string;
}

// Query parameters for enhanced endpoints
export interface AuditTrailQueryParams {
  step_key?: string; // Changed from step_name to step_key
  limit?: number;
}

// Utility class for audit trail operations
export class AuditTrailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_ENDPOINTS.CURRENT}/v1/audit-trail`;
  }

  /**
   * Record a new audit trail change (simplified API)
   */
  async recordChange(request: AuditTrailRecordRequest): Promise<AuditTrailEntry> {
    const url = `${this.baseUrl}/record`;
    
    // Debug logging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Recording audit trail change:', { url, request });
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
      console.error('Audit trail record failed:', { status: response.status, statusText: response.statusText, errorText });
      throw new Error(`Failed to record audit trail change: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Debug logging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit trail change recorded successfully:', data);
    }
    
    // Backend returns wrapped response with { status, message, entry }
    return data.entry;
  }

  /**
   * Convenience method: Log step started
   */
  async logStepStarted(
    applicationId: number,
    stepKey: string,
    options: Partial<AuditTrailRecordRequest> = {}
  ): Promise<AuditTrailEntry> {
    return this.recordChange({
      application_id: applicationId,
      step_key: stepKey,
      status: 'in_progress',
      data: options.data || {},
      changed_by: options.changed_by || 'frontend_user',
      notes: options.notes || `Started ${stepKey} verification`,
      ...options
    });
  }

  /**
   * Convenience method: Log step completed
   */
  async logStepCompleted(
    applicationId: number,
    stepKey: string,
    options: Partial<AuditTrailRecordRequest> = {}
  ): Promise<AuditTrailEntry> {
    return this.recordChange({
      application_id: applicationId,
      step_key: stepKey,
      status: 'completed',
      data: options.data || {},
      changed_by: options.changed_by || 'frontend_user',
      notes: options.notes || `Completed ${stepKey} verification`,
      ...options
    });
  }

  /**
   * Convenience method: Log step failed
   */
  async logStepFailed(
    applicationId: number,
    stepKey: string,
    options: Partial<AuditTrailRecordRequest> = {}
  ): Promise<AuditTrailEntry> {
    return this.recordChange({
      application_id: applicationId,
      step_key: stepKey,
      status: 'failed',
      data: options.data || {},
      changed_by: options.changed_by || 'frontend_user',
      notes: options.notes || `Failed ${stepKey} verification`,
      ...options
    });
  }

  /**
   * Convenience method: Log step requires review
   */
  async logStepRequiresReview(
    applicationId: number,
    stepKey: string,
    options: Partial<AuditTrailRecordRequest> = {}
  ): Promise<AuditTrailEntry> {
    return this.recordChange({
      application_id: applicationId,
      step_key: stepKey,
      status: 'requires_review',
      data: options.data || {},
      changed_by: options.changed_by || 'frontend_user',
      notes: options.notes || `${stepKey} requires manual review`,
      ...options
    });
  }

  /**
   * Get all audit trail entries for an application with optional filtering
   */
  async getApplicationAuditTrail(
    applicationId: number,
    params: AuditTrailQueryParams = {}
  ): Promise<AuditTrailEntry[]> {
    const queryString = new URLSearchParams();
    if (params.step_key) queryString.append('step_key', params.step_key);
    if (params.limit) queryString.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/${applicationId}${queryString.toString() ? '?' + queryString.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch audit trail: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    // Backend returns wrapped response with { status, message, entries, ... }
    return data.entries || [];
  }

  /**
   * Get full audit trail response with metadata
   */
  async getApplicationAuditTrailWithMetadata(
    applicationId: number,
    params: AuditTrailQueryParams = {}
  ): Promise<AuditTrailResponse> {
    const queryString = new URLSearchParams();
    if (params.step_key) queryString.append('step_key', params.step_key);
    if (params.limit) queryString.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/${applicationId}${queryString.toString() ? '?' + queryString.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch audit trail: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return {
      application_id: data.application_id,
      entries: data.entries || [],
      total_entries: data.total_entries || 0,
      unique_steps: data.unique_steps || 0,
      latest_activity: data.latest_activity || new Date().toISOString()
    };
  }

  /**
   * Get step history (all changes for a specific step)
   */
  async getStepHistory(applicationId: number, stepKey: string): Promise<AuditTrailEntry[]> {
    const response = await fetch(`${this.baseUrl}/${applicationId}/step/${stepKey}`);

    if (response.status === 404) {
      return []; // Step not found, return empty array
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch step history: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    // Backend returns wrapped response with { status, message, entries }
    return data.entries || [];
  }

  /**
   * Get latest status of a specific step
   */
  async getLatestStepStatus(applicationId: number, stepKey: string): Promise<AuditTrailEntry | null> {
    const response = await fetch(`${this.baseUrl}/${applicationId}/step/${stepKey}/latest`);

    if (response.status === 404) {
      return null; // Step not found
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch latest step status: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    // Backend returns wrapped response with { status, message, entry }
    return data.entry;
  }

  /**
   * Get current status of all steps for an application
   */
  async getCurrentStepStatuses(applicationId: number): Promise<Record<string, AuditTrailStatus>> {
    const entries = await this.getApplicationAuditTrail(applicationId);
    
    // Build a map of latest status for each step
    const stepStatuses: Record<string, AuditTrailStatus> = {};
    
    // Group entries by step_key and find the latest one for each
    const stepGroups: Record<string, AuditTrailEntry[]> = {};
    entries.forEach(entry => {
      if (!stepGroups[entry.step_key]) {
        stepGroups[entry.step_key] = [];
      }
      stepGroups[entry.step_key].push(entry);
    });
    
    // Get the latest status for each step
    Object.entries(stepGroups).forEach(([stepKey, stepEntries]) => {
      // Sort by timestamp descending and take the first (latest)
      const latestEntry = stepEntries.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      stepStatuses[stepKey] = latestEntry.status;
    });
    
    return stepStatuses;
  }
}

// Convenience functions for common operations
export const auditTrailService = new AuditTrailService();

/**
 * Start a verification step with common defaults
 */
export async function startVerificationStep(
  applicationId: number,
  stepKey: string,
  options: {
    notes?: string;
    data?: any;
    changedBy?: string;
  } = {}
): Promise<AuditTrailEntry> {
  const {
    notes,
    data = {},
    changedBy = 'frontend_user'
  } = options;

  return auditTrailService.logStepStarted(applicationId, stepKey, {
    notes: notes || `Starting ${stepKey} verification process`,
    data: {
      started_at: new Date().toISOString(),
      initiated_by: changedBy,
      ...data
    },
    changed_by: changedBy
  });
}

/**
 * Complete a verification step with common defaults
 */
export async function completeVerificationStep(
  applicationId: number,
  stepKey: string,
  options: {
    status?: 'completed' | 'failed' | 'cancelled' | 'requires_review';
    notes?: string;
    data?: any;
    changedBy?: string;
  } = {}
): Promise<AuditTrailEntry> {
  const {
    status = 'completed',
    notes,
    data = {},
    changedBy = 'frontend_user'
  } = options;

  return auditTrailService.recordChange({
    application_id: applicationId,
    step_key: stepKey,
    status,
    notes: notes || `${stepKey} verification ${status}`,
    data: {
      completed_at: new Date().toISOString(),
      processed_by: changedBy,
      ...data
    },
    changed_by: changedBy
  });
}

/**
 * Map frontend verification status to audit trail status
 */
export function mapVerificationStatus(
  frontendStatus: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'requires_review'
): AuditTrailStatus {
  switch (frontendStatus) {
    case 'not_started':
      return 'pending';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'requires_review':
      return 'requires_review';
    default:
      return 'pending'; // Default fallback
  }
}

// Export API endpoints for direct use
export { API_ENDPOINTS };

// DEPRECATED TYPES - Kept for backward compatibility
/**
 * @deprecated Use AuditTrailRecordRequest instead
 */
export interface StartAuditTrailRequest {
  application_id: number;
  step_key: string;
  status: AuditTrailStatus;
  data: any;
  changed_by?: string;
  notes?: string;
}

/**
 * @deprecated Use AuditTrailRecordRequest instead
 */
export interface CompleteAuditTrailRequest {
  application_id: number;
  step_key: string;
  status: AuditTrailStatus;
  data: any;
  changed_by?: string;
  notes?: string;
}

/**
 * @deprecated Use AuditTrailEntry instead - kept for backward compatibility
 */
export interface AuditTrailStep extends AuditTrailEntry {
  step_name?: string; // For backward compatibility with old step_name field
  started_at?: string; // For backward compatibility
  finished_at?: string; // For backward compatibility
}

// Legacy data structure - kept for backward compatibility
export interface AuditTrailData {
  [key: string]: any; // Now just a generic object since data is dynamic
} 