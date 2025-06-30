import { useState, useCallback, useEffect } from 'react';
import {
  auditTrailService,
  startVerificationStep,
  completeVerificationStep,
  mapVerificationStatus,
  AuditTrailStep,
  AuditTrailSummary,
  API_ENDPOINTS
} from '@/lib/audit';

interface UseAuditTrailOptions {
  applicationId: number;
  autoSync?: boolean; // Automatically sync with backend
  pollInterval?: number; // Polling interval in ms
}

interface AuditTrailHookReturn {
  // State
  steps: Record<string, AuditTrailStep>;
  summary: AuditTrailSummary | null;
  loading: boolean;
  error: string | null;

  // Actions
  startStep: (stepName: string, options?: {
    notes?: string;
    data?: any;
    changedBy?: string;
  }) => Promise<void>;

  completeStep: (stepName: string, options: {
    status?: 'completed' | 'failed' | 'cancelled' | 'requires_review';
    notes?: string;
    data?: any;
    changedBy?: string;
  }) => Promise<void>;

  refreshSteps: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  getStepStatus: (stepName: string) => AuditTrailStep | null;

  // Utility
  isStepCompleted: (stepName: string) => boolean;
  isStepInProgress: (stepName: string) => boolean;
  canStartStep: (stepName: string, dependencies?: string[]) => boolean;
}

export function useAuditTrail({
  applicationId,
  autoSync = false,
  pollInterval = 30000 // 30 seconds default
}: UseAuditTrailOptions): AuditTrailHookReturn {
  const [steps, setSteps] = useState<Record<string, AuditTrailStep>>({});
  const [summary, setSummary] = useState<AuditTrailSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh all steps from backend
  const refreshSteps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const auditSteps = await auditTrailService.getApplicationAuditTrail(applicationId);
      
      // Convert array to record keyed by step_key
      const stepsRecord: Record<string, AuditTrailStep> = {};
      auditSteps.forEach(step => {
        stepsRecord[step.step_key] = step;
      });
      
      setSteps(stepsRecord);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audit trail steps';
      setError(errorMessage);
      console.error('Error fetching audit trail steps:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  // Refresh summary from backend
  const refreshSummary = useCallback(async () => {
    try {
      const stepStatuses = await auditTrailService.getCurrentStepStatuses(applicationId);
      const auditSteps = await auditTrailService.getApplicationAuditTrail(applicationId);
      
      // Create summary from available data
      const summaryData: AuditTrailSummary = {
        application_id: applicationId,
        total_entries: auditSteps.length,
        unique_steps: Object.keys(stepStatuses).length,
        latest_activity: auditSteps.length > 0 ? auditSteps[auditSteps.length - 1].timestamp : new Date().toISOString(),
        current_step_statuses: stepStatuses,
        overall_status: Object.values(stepStatuses).some(status => status === 'failed') ? 'failed' : 
                       Object.values(stepStatuses).every(status => status === 'completed') ? 'completed' : 'in_progress'
      };
      
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching audit trail summary:', err);
      // Don't set error for summary failures, as it's not critical
    }
  }, [applicationId]);

  // Start a verification step
  const startStep = useCallback(async (
    stepName: string,
    options: {
      notes?: string;
      data?: any;
      changedBy?: string;
    } = {}
  ) => {
    try {
      setError(null);
      
      const auditStep = await startVerificationStep(applicationId, stepName, options);
      
      // Update local state
      setSteps(prev => ({
        ...prev,
        [stepName]: auditStep
      }));

      // Refresh summary if auto-sync is enabled
      if (autoSync) {
        await refreshSummary();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start verification step';
      setError(errorMessage);
      console.error('Error starting verification step:', err);
      throw err; // Re-throw to allow component to handle
    }
  }, [applicationId, autoSync, refreshSummary]);

  // Complete a verification step
  const completeStep = useCallback(async (
    stepName: string,
    options: {
      status?: 'completed' | 'failed' | 'cancelled' | 'requires_review';
      notes?: string;
      data?: any;
      changedBy?: string;
    }
  ) => {
    try {
      setError(null);
      
      const auditStep = await completeVerificationStep(applicationId, stepName, options);
      
      // Update local state
      setSteps(prev => ({
        ...prev,
        [stepName]: auditStep
      }));

      // Refresh summary if auto-sync is enabled
      if (autoSync) {
        await refreshSummary();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete verification step';
      setError(errorMessage);
      console.error('Error completing verification step:', err);
      throw err; // Re-throw to allow component to handle
    }
  }, [applicationId, autoSync, refreshSummary]);

  // Get step status
  const getStepStatus = useCallback((stepName: string): AuditTrailStep | null => {
    return steps[stepName] || null;
  }, [steps]);

  // Utility functions
  const isStepCompleted = useCallback((stepName: string): boolean => {
    const step = steps[stepName];
    return step?.status === 'completed';
  }, [steps]);

  const isStepInProgress = useCallback((stepName: string): boolean => {
    const step = steps[stepName];
    return step?.status === 'in_progress';
  }, [steps]);

  const canStartStep = useCallback((stepName: string, dependencies?: string[]): boolean => {
    // If no dependencies, can always start
    if (!dependencies || dependencies.length === 0) {
      return true;
    }

    // Check if all dependencies are completed
    return dependencies.every(depStepName => isStepCompleted(depStepName));
  }, [isStepCompleted]);

  // Auto-sync effect
  useEffect(() => {
    if (autoSync) {
      // Initial load
      refreshSteps();
      refreshSummary();

      // Set up polling
      const interval = setInterval(() => {
        refreshSteps();
        refreshSummary();
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [autoSync, pollInterval, refreshSteps, refreshSummary]);

  return {
    // State
    steps,
    summary,
    loading,
    error,

    // Actions
    startStep,
    completeStep,
    refreshSteps,
    refreshSummary,
    getStepStatus,

    // Utility
    isStepCompleted,
    isStepInProgress,
    canStartStep,
  };
}

// Convenience hook for development/testing
export function useAuditTrailDebug() {
  return {
    currentEndpoint: API_ENDPOINTS.CURRENT,
    isDev: API_ENDPOINTS.CURRENT === API_ENDPOINTS.DEV,
    endpoints: API_ENDPOINTS,
  };
} 