'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAgentRunner } from '@/hooks/useAgentRunner';
import { useAuditTrailDebug } from '@/hooks/useAuditTrail';
import { useAuth } from '@/hooks/useAuth';
import { AgentOverlay } from '@/components/agent/AgentOverlay';
import { Accordion } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { auditTrailService, mapVerificationStatus, type AuditTrailEntry } from '@/lib/audit';
import VerificationStep, { 
  type VerificationStepConfig, 
  type VerificationStepState 
} from './VerificationStep';
import LicenseForm, { type License } from './forms/LicenseForm';
import { IncidentsClaimsForm, type IncidentClaim } from './forms/IncidentsClaimsForm';
import { HospitalPrivilegesForm, type HospitalPrivilege } from './forms/HospitalPrivilegesForm';
import { 
  WORKFLOW_TEMPLATES, 
  canStartStep as builderCanStartStep
} from './VerificationStepBuilder';

interface ProviderDetailClientProps {
  providerId: string;
  children: React.ReactNode;
}

export function ProviderDetailClient({ children }: Omit<ProviderDetailClientProps, 'providerId'>) {
  const agentRunner = useAgentRunner();

  // Set up event listeners for agent controls
  useEffect(() => {
    const handleAgentStop = () => {
      agentRunner.stopAgent();
    };

    const handleIdentityVerificationWorkflow = () => {
      // Get practitioner context from global window object if available
      const practitionerContext = typeof window !== 'undefined' ? (window as any).__practitionerContext : undefined;
      
      const task = 'Please execute the NPI verification workflow for the healthcare provider. Use the npi_verification_workflow tool to complete the entire process.';
      
      // Structure the context properly for the agent
      let agentContext = undefined;
      if (practitionerContext) {
        console.log('🔍 ProviderDetailClient: Raw practitioner context:', practitionerContext);
        
        agentContext = { 
          currentPage: 'provider-verification',
          isAuthenticated: true,
          practitionerData: practitionerContext // Pass the entire context object
        };
        
        console.log('🔍 ProviderDetailClient: Structured agent context:', agentContext);
      }
      
      agentRunner.executeTask(task, agentContext);
    };

    // Add event listeners
    window.addEventListener('agent-stop', handleAgentStop);
    window.addEventListener('openai-accordion-demo', handleIdentityVerificationWorkflow);
    window.addEventListener('openai-license-demo', handleIdentityVerificationWorkflow);
    window.addEventListener('openai-complete-workflow-demo', handleIdentityVerificationWorkflow);

    // Cleanup
    return () => {
      window.removeEventListener('agent-stop', handleAgentStop);
      window.removeEventListener('openai-accordion-demo', handleIdentityVerificationWorkflow);
      window.removeEventListener('openai-license-demo', handleIdentityVerificationWorkflow);
      window.removeEventListener('openai-complete-workflow-demo', handleIdentityVerificationWorkflow);
    };
  }, [agentRunner]);

  return (
    <>
      {/* Original provider detail content */}
      {children}
      
      {/* Agent overlay system - only render when needed */}
      <AgentOverlay />
    </>
  );
}

// Enhanced verification tab content using the new modular system
export function VerificationTabContent({ 
  practitionerId, 
  applicationId: propApplicationId,
  auditSteps = [],
  onAuditStepsUpdate,
  workflowTemplate = 'standard', // New prop to select workflow template
  auditLoading = false
}: { 
  practitionerId?: number;
  applicationId?: number;
  auditSteps?: AuditTrailEntry[];
  onAuditStepsUpdate?: (steps: AuditTrailEntry[]) => void;
  workflowTemplate?: 'basic' | 'standard' | 'comprehensive' | 'express' | 'california';
  auditLoading?: boolean; // Add explicit loading prop
}) {
  const auditDebug = useAuditTrailDebug();
  const { user } = useAuth();
  const agentRunner = useAgentRunner();

  // Generate workflow using builder pattern
  const workflow = useMemo(() => {
    return WORKFLOW_TEMPLATES[workflowTemplate]().build();
  }, [workflowTemplate]);

  // State management
  const [verificationState, setVerificationState] = useState<Record<string, VerificationStepState>>({});
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set());
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Application ID fallback
  const applicationId = propApplicationId || 12345;

  // Helper function to get the current user identifier
  // Use "Vera" when agent is active, otherwise use the authenticated user
  const getCurrentUser = useCallback(() => {
    return agentRunner.isRunning ? 'Vera' : (user?.email || 'Unknown');
  }, [agentRunner.isRunning, user?.email]);

  // Initialize verification state for all workflow steps
  useEffect(() => {
    const initialState: Record<string, VerificationStepState> = {};
    
    workflow.forEach(step => {
      // Try to populate from existing audit data
      const existingAudit = auditSteps.find(audit => audit.step_key === step.id);
      const existingData = existingAudit?.data as any;
      
      initialState[step.id] = {
        status: existingAudit ? mapAuditStatusToVerification(existingAudit.status) : 'not_started',
        reasoning: existingAudit?.notes || '',
        files: [],
        documents: [],
        documentsLoading: false,
        hasExistingDocuments: false,
        licenses: existingData?.licenses || [],
        incidents: existingData?.incidents || [],
        hospitalPrivileges: existingData?.hospitalPrivileges || [],
        startedAt: existingAudit?.timestamp ? new Date(existingAudit.timestamp) : undefined,
        completedAt: existingAudit?.status === 'completed' && existingAudit.timestamp ? new Date(existingAudit.timestamp) : undefined,
        examiner: existingAudit?.changed_by || getCurrentUser()
      };
    });
    
    setVerificationState(initialState);
  }, [workflow, auditSteps, user, agentRunner.isRunning, getCurrentUser]);

  // Load existing documents for in-progress steps
  useEffect(() => {
    const loadExistingDocuments = async () => {
      if (!practitionerId) return;

      const { verificationDocumentService } = await import('@/lib/verification/documentService');
      
      // Check each step for existing documents
      for (const step of workflow) {
        const stepState = verificationState[step.id];
        if (stepState?.status === 'in_progress' && !stepState.documentsLoading) {
          try {
            const documents = await verificationDocumentService.getExisting(practitionerId, step.id, applicationId);
            
            if (documents.length > 0) {
              setVerificationState(prev => ({
                ...prev,
                [step.id]: {
                  ...prev[step.id],
                  hasExistingDocuments: true,
                  documents: documents.map(doc => ({
                    id: doc.path,
                    fileName: doc.metadata.fileName,
                    url: doc.url,
                    uploadedAt: doc.createdAt,
                    size: doc.metadata.fileSize,
                    type: doc.metadata.mimeType
                  }))
                }
              }));
            }
          } catch (error) {
            console.error(`Error loading documents for ${step.id}:`, error);
          }
        }
      }
    };

    if (Object.keys(verificationState).length > 0) {
      loadExistingDocuments();
    }
  }, [practitionerId, workflow, verificationState, applicationId]);

  // Utility function to map audit status to verification status
  const mapAuditStatusToVerification = (auditStatus: string): VerificationStepState['status'] => {
    switch (auditStatus) {
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'in_progress': return 'in_progress';
      case 'requires_review': return 'requires_review';
      default: return 'not_started';
    }
  };

  // Check if a step can be started
  const canStartStep = (step: VerificationStepConfig): boolean => {
    const completedSteps = Object.entries(verificationState)
      .filter(([, state]) => state.status === 'completed')
      .map(([stepId]) => stepId);
    
    return builderCanStartStep(step, completedSteps);
  };

  // Event handlers
  const handleStartVerification = async (stepId: string) => {
    const step = workflow.find(s => s.id === stepId);
    if (!step) return;

    setLoadingSteps(prev => new Set([...prev, stepId]));
    setStepErrors(prev => ({ ...prev, [stepId]: '' }));

    try {
      // Record in audit trail first - only update local state after success
      await auditTrailService.recordChange({
        application_id: applicationId,
        step_key: stepId,
        status: 'in_progress',
        notes: `Started ${step.name} verification`,
        changed_by: getCurrentUser(),
        data: {}
      });

      // Update local state only after successful API call
      setVerificationState(prev => ({
        ...prev,
        [stepId]: {
          ...prev[stepId],
          status: 'in_progress',
          startedAt: new Date(),
          examiner: getCurrentUser()
        }
      }));

      // Open the accordion for this step
      setOpenAccordions(prev => [...prev, stepId]);

    } catch (error) {
      console.error('Failed to start verification step:', error);
      setStepErrors(prev => ({
        ...prev,
        [stepId]: 'Failed to start verification. Please try again.'
      }));
    } finally {
      setLoadingSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  const handleSaveProgress = async (stepId: string) => {
    const step = workflow.find(s => s.id === stepId);
    const stepState = verificationState[stepId];
    if (!step || !stepState) return;

    setLoadingSteps(prev => new Set([...prev, stepId]));
    setStepErrors(prev => ({ ...prev, [stepId]: '' }));

    try {
      // Get step-specific structured data
      const structuredData = getStepSpecificData(stepId, step, stepState);

      // Update completion time if status is completed
      const updatedState = {
        ...stepState,
        completedAt: stepState.status === 'completed' ? new Date() : stepState.completedAt
      };

      // Update local state
      setVerificationState(prev => ({
        ...prev,
        [stepId]: updatedState
      }));

      // Record in audit trail
      // Only use fallback message if no reasoning provided and no existing notes
      const existingAudit = auditSteps.find(audit => audit.step_key === stepId);
      const fallbackNotes = existingAudit?.notes || `Updated ${step.name} verification`;
      
      await auditTrailService.recordChange({
        application_id: applicationId,
        step_key: stepId,
        status: mapVerificationStatus(stepState.status),
        notes: stepState.reasoning || fallbackNotes,
        changed_by: getCurrentUser(),
        data: structuredData
      });

      // Refresh audit trail
      if (onAuditStepsUpdate) {
        const updatedSteps = await auditTrailService.getApplicationAuditTrail(applicationId);
        onAuditStepsUpdate(updatedSteps);
      }

    } catch (error) {
      console.error('Failed to save verification step:', error);
      setStepErrors(prev => ({
        ...prev,
        [stepId]: 'Failed to save progress. Please try again.'
      }));
    } finally {
      setLoadingSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  // Get structured data for steps with special forms
  const getStepSpecificData = (stepId: string, step: VerificationStepConfig, stepState: VerificationStepState) => {
    if (!step.hasSpecialForm) {
      return {}; // Clean empty object for generic steps
    }

    switch (step.formType) {
      case 'licenses':
        return {
          licenses: stepState.licenses.map(license => ({
            number: license.number,
            state: license.state,
            issued: license.issued,
            expiration: license.expiration
          }))
        };
      case 'incidents_claims':
        return {
          incidents: stepState.incidents.map(incident => ({
            incidentType: incident.incidentType,
            details: incident.details,
            date: incident.date
          }))
        };
      case 'hospital_privileges':
        return {
          hospitalPrivileges: stepState.hospitalPrivileges.map(privilege => ({
            hospitalName: privilege.hospitalName,
            address: privilege.address,
            phone: privilege.phone,
            department: privilege.department,
            issued: privilege.issued,
            expiration: privilege.expiration,
            status: privilege.status
          }))
        };
      case 'certifications':
        // Future implementation for certifications
        return {};
      case 'registrations':
        // Future implementation for registrations
        return {};
      default:
        return {};
    }
  };

  // License management handlers
  const handleAddLicense = (stepId: string, license: Omit<License, 'id'>) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        licenses: [...(prev[stepId]?.licenses || []), { ...license, id: Date.now().toString() }]
      }
    }));
  };

  const handleRemoveLicense = (stepId: string, licenseId: string) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        licenses: (prev[stepId]?.licenses || []).filter(license => license.id !== licenseId)
      }
    }));
  };

  const handleUpdateLicense = (stepId: string, licenseId: string, updatedLicense: Partial<License>) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        licenses: (prev[stepId]?.licenses || []).map(license =>
          license.id === licenseId ? { ...license, ...updatedLicense } : license
        )
      }
    }));
  };

  // Incident management handlers
  const handleAddIncident = (stepId: string, incident: Omit<IncidentClaim, 'id'>) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        incidents: [...(prev[stepId]?.incidents || []), { ...incident, id: Date.now().toString() }]
      }
    }));
  };

  const handleRemoveIncident = (stepId: string, incidentId: string) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        incidents: (prev[stepId]?.incidents || []).filter(incident => incident.id !== incidentId)
      }
    }));
  };

  const handleUpdateIncident = (stepId: string, incidentId: string, updatedIncident: Partial<IncidentClaim>) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        incidents: (prev[stepId]?.incidents || []).map(incident =>
          incident.id === incidentId ? { ...incident, ...updatedIncident } : incident
        )
      }
    }));
  };

  // Hospital privilege management handlers
  const handleAddHospitalPrivilege = (stepId: string, privilege: Omit<HospitalPrivilege, 'id'>) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        hospitalPrivileges: [...(prev[stepId]?.hospitalPrivileges || []), { ...privilege, id: Date.now().toString() }]
      }
    }));
  };

  const handleRemoveHospitalPrivilege = (stepId: string, privilegeId: string) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        hospitalPrivileges: (prev[stepId]?.hospitalPrivileges || []).filter(privilege => privilege.id !== privilegeId)
      }
    }));
  };

  const handleUpdateHospitalPrivilege = (stepId: string, privilegeId: string, updatedPrivilege: Partial<HospitalPrivilege>) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        hospitalPrivileges: (prev[stepId]?.hospitalPrivileges || []).map(privilege =>
          privilege.id === privilegeId ? { ...privilege, ...updatedPrivilege } : privilege
        )
      }
    }));
  };

  // File management handlers
  const handleFileUpload = (stepId: string, files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setVerificationState(prev => ({
        ...prev,
        [stepId]: {
          ...prev[stepId],
          files: [...(prev[stepId]?.files || []), ...newFiles]
        }
      }));
    }
  };

  const handleRemoveFile = (stepId: string, fileIndex: number) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        files: (prev[stepId]?.files || []).filter((_, index) => index !== fileIndex)
      }
    }));
  };

  // Helper function to get practitioner data from global context
  const getPractitionerData = useCallback(() => {
    if (typeof window !== 'undefined') {
      const context = (window as any).__practitionerContext;
      if (context && context.practitioner) {
        const { practitioner, applications, providerData } = context;
        
        // Get additional data from applications and provider data
        const firstApp = applications?.[0];
        const demographics = practitioner.demographics || {};
        const homeAddress = practitioner.home_address || {};
        
        return {
          // Basic info
          first_name: practitioner.first_name || '',
          last_name: practitioner.last_name || '',
          middle_name: practitioner.middle_name || undefined,
          full_name: `${practitioner.first_name} ${practitioner.last_name}`.trim(),
          
          // IDs and numbers
          npi: firstApp?.npi_number || providerData?.npi_number || '',
          npi_number: firstApp?.npi_number || providerData?.npi_number || '',
          dea_number: firstApp?.dea_number || providerData?.dea_number || '',
          license_number: firstApp?.license_number || providerData?.license_number || '',
          
          // Demographics
          date_of_birth: demographics.birth_date || demographics.date_of_birth || '',
          ssn_last4: practitioner.ssn ? practitioner.ssn.slice(-4) : '',
          social_security_number: practitioner.ssn || '',
          gender: demographics.gender || '',
          
          // Address
          address: homeAddress.street ? {
            line1: homeAddress.street || '',
            line2: homeAddress.address_line_2 || '',
            city: homeAddress.city || '',
            state: homeAddress.state || '',
            zip: homeAddress.zip_code || homeAddress.postal_code || ''
          } : undefined,
          city: homeAddress.city || '',
          state: homeAddress.state || '',
          zip: homeAddress.zip_code || homeAddress.postal_code || '',
          postal_code: homeAddress.zip_code || homeAddress.postal_code || '',
          
          // License info
          state_of_license: homeAddress.state || '',
          license_state: homeAddress.state || '',
          
          // Education
          institution: practitioner.education?.medical_school || '',
          degree_type: practitioner.education?.degree || '',
          graduation_year: practitioner.education?.graduation_year || new Date().getFullYear(),
          
          // Provider info
          provider_type: 'Individual',
          license_type: 'Medical Doctor',
          taxonomy_code: firstApp?.npi_details?.taxonomy_code || '',
          
          // Medicare/Medicaid
          medicare_id: firstApp?.medicare_id || '',
          medicaid_id: firstApp?.medicaid_id || '',
          
          // Verification defaults
          provider_verification_type: 'medicare_enrollment',
          verification_sources: ['ffs_provider_enrollment', 'ordering_referring_provider'],
          verification_type: 'degree_verification',
          
          // Hospital privileges
          hospital_name: 'General Hospital', // TODO: Get from actual data
          specialty: practitioner.education?.degree || 'General Practice',
          
          // Organization
          organization_name: providerData?.organization_name || ''
        };
      }
    }
    
    // Fallback data if no context available
    return {
      first_name: 'Unknown',
      last_name: 'Provider',
      full_name: 'Unknown Provider',
      npi: '0000000000',
      npi_number: '0000000000',
      date_of_birth: '1980-01-01',
      ssn_last4: '0000',
      social_security_number: '0000',
      city: '',
      state: '',
      zip: '',
      postal_code: '',
      state_of_license: '',
      license_state: '',
      license_number: '',
      dea_number: '',
      institution: '',
      degree_type: '',
      graduation_year: new Date().getFullYear(),
      provider_type: 'Individual',
      license_type: 'Medical Doctor',
      taxonomy_code: '',
      medicare_id: '',
      medicaid_id: '',
      provider_verification_type: 'medicare_enrollment',
      verification_sources: ['ffs_provider_enrollment', 'ordering_referring_provider'],
      verification_type: 'degree_verification',
      hospital_name: 'General Hospital',
      specialty: 'General Practice',
      organization_name: '',
      gender: ''
    };
  }, []);

  // Document management handlers
  const handleRequestDocument = async (stepId: string) => {
    const step = workflow.find(s => s.id === stepId);
    if (!step || !practitionerId) return;

    setLoadingSteps(prev => new Set([...prev, stepId]));
    setStepErrors(prev => ({ ...prev, [stepId]: '' }));

    // Set documents loading state
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        documentsLoading: true
      }
    }));

    try {
      const { verificationDocumentService } = await import('@/lib/verification/documentService');
      
      // Get actual practitioner data
      const practitionerData = getPractitionerData();
      
      const result = await verificationDocumentService.handleWorkflow(
        {
          practitionerId,
          stepId,
          stepName: step.name,
          applicationId,
          requestedBy: getCurrentUser(),
          practitionerData
        },
        verificationState[stepId]?.status || 'not_started'
      );

      // Update verification state with documents
      setVerificationState(prev => ({
        ...prev,
        [stepId]: {
          ...prev[stepId],
          documentsLoading: false,
          hasExistingDocuments: result.hasExistingDocuments,
          documents: result.documents.map(doc => ({
            id: doc.path,
            fileName: doc.metadata.fileName,
            url: doc.url,
            uploadedAt: doc.createdAt,
            size: doc.metadata.fileSize,
            type: doc.metadata.mimeType
          }))
        }
      }));

      if (result.error) {
        setStepErrors(prev => ({
          ...prev,
          [stepId]: result.error || 'Failed to process document request'
        }));
      }

    } catch (error) {
      console.error('Error requesting document:', error);
      setStepErrors(prev => ({
        ...prev,
        [stepId]: 'Failed to request document. Please try again.'
      }));
      
      setVerificationState(prev => ({
        ...prev,
        [stepId]: {
          ...prev[stepId],
          documentsLoading: false
        }
      }));
    } finally {
      setLoadingSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  const handleRemoveDocument = async (stepId: string, documentId: string) => {
    const step = workflow.find(s => s.id === stepId);
    if (!step || !practitionerId) return;

    try {
      const { verificationDocumentService } = await import('@/lib/verification/documentService');
      
      await verificationDocumentService.remove(documentId, {
        practitionerId,
        stepId,
        stepName: step.name,
        applicationId,
        removedBy: getCurrentUser()
      });

      // Update local state
      setVerificationState(prev => ({
        ...prev,
        [stepId]: {
          ...prev[stepId],
          documents: prev[stepId]?.documents.filter(doc => doc.id !== documentId) || []
        }
      }));

    } catch (error) {
      console.error('Error removing document:', error);
      setStepErrors(prev => ({
        ...prev,
        [stepId]: 'Failed to remove document. Please try again.'
      }));
    }
  };

  // Update handlers
  const handleUpdateStatus = (stepId: string, status: VerificationStepState['status']) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        status
      }
    }));
  };

  const handleUpdateReasoning = (stepId: string, reasoning: string) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        reasoning
      }
    }));
  };

  // Calculate workflow statistics
  const workflowStats = useMemo(() => {
    const states = Object.values(verificationState);
    return {
      completed: states.filter(s => s?.status === 'completed').length,
      inProgress: states.filter(s => s?.status === 'in_progress').length,
      pending: states.filter(s => s?.status === 'not_started').length,
      total: workflow.length
    };
  }, [verificationState, workflow]);

  // Show warning if no application ID is available
  const showApplicationWarning = !propApplicationId && auditDebug.isDev;

  return (
    <div className="space-y-6">
      {/* Application Warning */}
      {showApplicationWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No Application Found</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                No application data available for this practitioner. Audit trail integration will use fallback ID ({applicationId}).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {workflowTemplate.charAt(0).toUpperCase() + workflowTemplate.slice(1)} Verification Workflow
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete all verification steps to approve this provider application
            </p>
            
            {/* AI Agent Demo Button */}
            <div className="mt-3">
              <button
                onClick={() => {
                  const event = new CustomEvent('openai-accordion-demo');
                  window.dispatchEvent(event);
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                Complete All Steps
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Watch Vera automatically work through verification steps
              </p>
            </div>
          </div>
          {auditLoading ? (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ) : (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  {workflowStats.completed} Completed
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  {workflowStats.inProgress} In Progress
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  {workflowStats.pending} Pending
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Steps using modular components */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {auditLoading ? (
          // Skeleton loading state
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {workflow.map((step) => (
              <div key={step.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Accordion 
            type="multiple" 
            value={openAccordions} 
            onValueChange={setOpenAccordions}
            className="w-full"
          >
            {workflow.map((step) => {
              const stepState = verificationState[step.id];
              const canStart = canStartStep(step);
              const isLoading = loadingSteps.has(step.id);
              const stepError = stepErrors[step.id];

              // Skip rendering if stepState is not initialized yet
              if (!stepState) {
                return null;
              }

              return (
                <VerificationStep
                  key={step.id}
                  step={step}
                  stepState={stepState}
                  canStart={canStart}
                  isLoading={isLoading}
                  error={stepError}
                  onStart={() => handleStartVerification(step.id)}
                  onSave={() => handleSaveProgress(step.id)}
                  onUpdateStatus={(status) => handleUpdateStatus(step.id, status)}
                  onUpdateReasoning={(reasoning) => handleUpdateReasoning(step.id, reasoning)}
                  onFileUpload={(files) => handleFileUpload(step.id, files)}
                  onRemoveFile={(index) => handleRemoveFile(step.id, index)}
                  onRequestDocument={() => handleRequestDocument(step.id)}
                  onRemoveDocument={(documentId) => handleRemoveDocument(step.id, documentId)}
                >
                  {/* Special form components rendered as children */}
                  {step.hasSpecialForm && step.formType === 'licenses' && (
                    <div className="mt-4">
                      <LicenseForm
                        licenses={stepState.licenses}
                        onAddLicense={(license) => handleAddLicense(step.id, license)}
                        onRemoveLicense={(licenseId) => handleRemoveLicense(step.id, licenseId)}
                        onUpdateLicense={(licenseId, updatedLicense) => handleUpdateLicense(step.id, licenseId, updatedLicense)}
                        isEditable={true}
                      />
                    </div>
                  )}
                  {step.hasSpecialForm && step.formType === 'incidents_claims' && (
                    <div className="mt-4">
                      <IncidentsClaimsForm
                        incidents={stepState.incidents}
                        onAddIncident={(incident) => handleAddIncident(step.id, incident)}
                        onRemoveIncident={(incidentId) => handleRemoveIncident(step.id, incidentId)}
                        onUpdateIncident={(incidentId, updatedIncident) => handleUpdateIncident(step.id, incidentId, updatedIncident)}
                        isEditable={true}
                      />
                    </div>
                  )}
                  {step.hasSpecialForm && step.formType === 'hospital_privileges' && (
                    <div className="mt-4">
                      <HospitalPrivilegesForm
                        privileges={stepState.hospitalPrivileges}
                        onAddPrivilege={(privilege) => handleAddHospitalPrivilege(step.id, privilege)}
                        onRemovePrivilege={(privilegeId) => handleRemoveHospitalPrivilege(step.id, privilegeId)}
                        onUpdatePrivilege={(privilegeId, updatedPrivilege) => handleUpdateHospitalPrivilege(step.id, privilegeId, updatedPrivilege)}
                        isEditable={true}
                      />
                    </div>
                  )}
                </VerificationStep>
              );
            })}
          </Accordion>
        )}
      </div>

    </div>
  );
} 