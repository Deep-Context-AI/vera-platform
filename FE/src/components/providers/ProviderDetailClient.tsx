'use client';

import React, { useEffect, useState } from 'react';
import { useAgentRunner } from '@/hooks/useAgentRunner';
import { AgentOverlay } from '@/components/agent/AgentOverlay';
import { VerificationDemoContainers } from '@/components/agent/VerificationDemoContainers';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Upload, 
  FileText, 
  X,
  User,
  Building,
  GraduationCap,
  CreditCard,
  UserCheck,
  AlertCircle,
  FileCheck,
  Eye
} from 'lucide-react';

interface ProviderDetailClientProps {
  providerId: string;
  children: React.ReactNode;
}

export function ProviderDetailClient({ providerId: _providerId, children }: ProviderDetailClientProps) {
  const agentRunner = useAgentRunner();

  // Set up event listeners for agent demo controls
  useEffect(() => {
    const handleAgentDemo = (event: CustomEvent) => {
      const { action } = event.detail;
      
      switch (action) {
        case 'demo':
          agentRunner.runDemo();
          break;
        case 'verification':
          agentRunner.runVerificationDemo();
          break;
        default:
          console.warn('Unknown agent demo action:', action);
      }
    };

    const handleAgentStop = () => {
      agentRunner.stopAgent();
    };

    // Add event listeners
    window.addEventListener('agent-demo', handleAgentDemo as EventListener);
    window.addEventListener('agent-stop', handleAgentStop);

    // Cleanup
    return () => {
      window.removeEventListener('agent-demo', handleAgentDemo as EventListener);
      window.removeEventListener('agent-stop', handleAgentStop);
    };
  }, []); // Empty dependency array to prevent re-running

  return (
    <>
      {/* Original provider detail content */}
      {children}
      
      {/* Agent overlay system - only render when needed */}
      <AgentOverlay />
    </>
  );
}

// Types for verification steps
interface VerificationStep {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  dependsOn?: string[];
}

interface VerificationState {
  [stepId: string]: {
    status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'requires_review';
    reasoning: string;
    files: File[];
    startedAt?: Date;
    completedAt?: Date;
    examiner?: string;
  };
}

// Verification steps configuration
const VERIFICATION_STEPS: VerificationStep[] = [
  {
    id: 'npi_verification',
    name: 'NPI Verification',
    description: 'National Provider Identifier verification through NPPES registry',
    icon: UserCheck,
    priority: 'high',
    estimatedDuration: '2-5 minutes',
  },
  {
    id: 'dea_verification',
    name: 'DEA Verification',
    description: 'Drug Enforcement Administration registration verification',
    icon: Shield,
    priority: 'high',
    estimatedDuration: '3-7 minutes',
    dependsOn: ['npi_verification'],
  },
  {
    id: 'abms_certification',
    name: 'Board Certification',
    description: 'American Board of Medical Specialties certification verification',
    icon: GraduationCap,
    priority: 'medium',
    estimatedDuration: '5-10 minutes',
  },
  {
    id: 'dca_license',
    name: 'California License',
    description: 'California Department of Consumer Affairs medical license verification',
    icon: FileCheck,
    priority: 'high',
    estimatedDuration: '3-5 minutes',
  },
  {
    id: 'medicare_enrollment',
    name: 'Medicare Enrollment',
    description: 'Medicare provider enrollment and participation verification',
    icon: CreditCard,
    priority: 'medium',
    estimatedDuration: '5-8 minutes',
  },
  {
    id: 'npdb_check',
    name: 'NPDB Check',
    description: 'National Practitioner Data Bank malpractice and disciplinary history check',
    icon: AlertTriangle,
    priority: 'high',
    estimatedDuration: '10-15 minutes',
  },
  {
    id: 'sanctions_check',
    name: 'Sanctions Check',
    description: 'OIG exclusions and sanctions list verification',
    icon: AlertCircle,
    priority: 'high',
    estimatedDuration: '3-5 minutes',
  },
  {
    id: 'ladmf_check',
    name: 'Death Master File',
    description: 'Social Security Death Master File verification',
    icon: User,
    priority: 'medium',
    estimatedDuration: '1-2 minutes',
  },
  {
    id: 'medical_verification',
    name: 'Medical Network',
    description: 'Medical network and hospital affiliations verification',
    icon: Building,
    priority: 'medium',
    estimatedDuration: '5-10 minutes',
  },
  {
    id: 'education_verification',
    name: 'Education Verification',
    description: 'Medical school and residency program verification',
    icon: GraduationCap,
    priority: 'medium',
    estimatedDuration: '10-15 minutes',
  },
  {
    id: 'hospital_privileges',
    name: 'Hospital Privileges',
    description: 'Current hospital privileges and admitting rights verification',
    icon: Building,
    priority: 'low',
    estimatedDuration: '5-8 minutes',
  },
  {
    id: 'final_review',
    name: 'Final Review',
    description: 'Comprehensive review of all verification results',
    icon: Eye,
    priority: 'high',
    estimatedDuration: '15-30 minutes',
    dependsOn: ['npi_verification', 'dea_verification', 'dca_license', 'npdb_check', 'sanctions_check'],
  },
];

// Enhanced verification tab content with comprehensive verification system
export function VerificationTabContent() {
  const [verificationState, setVerificationState] = useState<VerificationState>({});
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<string | null>(null);

  // Initialize verification state
  useEffect(() => {
    const initialState: VerificationState = {};
    VERIFICATION_STEPS.forEach(step => {
      initialState[step.id] = {
        status: 'not_started',
        reasoning: '',
        files: [],
      };
    });
    setVerificationState(initialState);
  }, []);

  // Get status color and icon
  const getStatusInfo = (status: VerificationState[string]['status']) => {
    switch (status) {
      case 'not_started':
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
          icon: Clock,
          text: 'Not Started'
        };
      case 'in_progress':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
          icon: Clock,
          text: 'In Progress'
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
          icon: CheckCircle,
          text: 'Completed'
        };
      case 'failed':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
          icon: AlertTriangle,
          text: 'Failed'
        };
      case 'requires_review':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
          icon: AlertCircle,
          text: 'Requires Review'
        };
    }
  };

  // Start verification
  const startVerification = (stepId: string) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        status: 'in_progress',
        startedAt: new Date(),
        examiner: 'Current User', // TODO: Get from auth context
      }
    }));
  };

  // Update verification status
  const updateVerificationStatus = (stepId: string, status: VerificationState[string]['status']) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
      }
    }));
  };

  // Update reasoning
  const updateReasoning = (stepId: string, reasoning: string) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        reasoning,
      }
    }));
  };

  // Handle file upload
  const handleFileUpload = (stepId: string, files: FileList | null) => {
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setVerificationState(prev => ({
        ...prev,
        [stepId]: {
          ...prev[stepId],
          files: [...prev[stepId].files, ...newFiles],
        }
      }));
    }
  };

  // Remove file
  const removeFile = (stepId: string, fileIndex: number) => {
    setVerificationState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        files: prev[stepId].files.filter((_, index) => index !== fileIndex),
      }
    }));
  };

  // Save verification step
  const saveVerificationStep = (stepId: string) => {
    const stepData = verificationState[stepId];
    
    // TODO: Call API to save verification step to audit_trail table
    console.log('Saving verification step:', {
      stepId,
      ...stepData,
    });

    // For now, just mark as completed if status was in_progress
    if (stepData.status === 'in_progress') {
      updateVerificationStatus(stepId, 'completed');
    }
  };

  // Check if step can be started (dependencies met)
  const canStartStep = (step: VerificationStep) => {
    if (!step.dependsOn) return true;
    
    return step.dependsOn.every(depId => {
      const depState = verificationState[depId];
      return depState?.status === 'completed';
    });
  };

  return (
    <div className="space-y-6">
      {/* Verification Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Credentialing Verification Steps
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete all verification steps to approve this provider application
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
                         <div className="flex items-center space-x-2">
               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
               <span className="text-gray-600 dark:text-gray-400">
                 {Object.values(verificationState).filter(s => s?.status === 'completed').length} Completed
               </span>
             </div>
             <div className="flex items-center space-x-2">
               <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
               <span className="text-gray-600 dark:text-gray-400">
                 {Object.values(verificationState).filter(s => s?.status === 'in_progress').length} In Progress
               </span>
             </div>
             <div className="flex items-center space-x-2">
               <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
               <span className="text-gray-600 dark:text-gray-400">
                 {Object.values(verificationState).filter(s => s?.status === 'not_started').length} Pending
               </span>
             </div>
          </div>
        </div>
      </div>

      {/* Verification Steps Accordion */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Accordion 
          type="multiple" 
          value={openAccordions} 
          onValueChange={setOpenAccordions}
          className="w-full"
        >
          {VERIFICATION_STEPS.map((step) => {
            const stepState = verificationState[step.id];
            const statusInfo = getStatusInfo(stepState?.status || 'not_started');
            const StatusIcon = statusInfo.icon;
            const StepIcon = step.icon;
            const canStart = canStartStep(step);

            // Skip rendering if stepState is not initialized yet
            if (!stepState) {
              return null;
            }

            return (
              <AccordionItem key={step.id} value={step.id} className="border-b border-gray-200 dark:border-gray-700">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <StepIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {step.name}
                            </h4>
                            <Badge className={`${statusInfo.color} text-xs`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.text}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Est. {step.estimatedDuration}</span>
                      <Badge variant={step.priority === 'high' ? 'destructive' : step.priority === 'medium' ? 'secondary' : 'outline'}>
                        {step.priority}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6">
                  {stepState.status === 'not_started' ? (
                    // Null state - Start verification
                    <div className="text-center py-8">
                      <StepIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Ready to Start Verification
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Click below to begin the {step.name.toLowerCase()} process
                      </p>
                      {step.dependsOn && step.dependsOn.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Requires completion of:
                          </p>
                                                     <div className="flex flex-wrap gap-2 justify-center">
                             {step.dependsOn.map(depId => {
                               const depStep = VERIFICATION_STEPS.find(s => s.id === depId);
                               const depState = verificationState[depId];
                               const depStatus = depState?.status || 'not_started';
                               return (
                                 <Badge 
                                   key={depId}
                                   className={depStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                                 >
                                   {depStep?.name}
                                   {depStatus === 'completed' && <CheckCircle className="w-3 h-3 ml-1" />}
                                 </Badge>
                               );
                             })}
                           </div>
                        </div>
                      )}
                      <Button 
                        onClick={() => startVerification(step.id)}
                        disabled={!canStart}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Start Verification
                      </Button>
                      {!canStart && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                          Complete required dependencies first
                        </p>
                      )}
                    </div>
                  ) : (
                    // Active verification state
                    <div className="space-y-6">
                      {/* Status and examiner info */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                 <div className="flex items-center space-x-4">
                           <div>
                             <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                               Status: {statusInfo.text}
                             </p>
                             {stepState?.examiner && (
                               <p className="text-sm text-gray-600 dark:text-gray-400">
                                 Examiner: {stepState.examiner}
                               </p>
                             )}
                           </div>
                         </div>
                         <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                           {stepState?.startedAt && (
                             <p>Started: {stepState.startedAt.toLocaleString()}</p>
                           )}
                           {stepState?.completedAt && (
                             <p>Completed: {stepState.completedAt.toLocaleString()}</p>
                           )}
                         </div>
                      </div>

                      {/* Status selection */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Verification Status
                          </label>
                                                     <Select 
                             value={stepState?.status || 'not_started'} 
                             onValueChange={(value) => updateVerificationStatus(step.id, value as any)}
                           >
                             <SelectTrigger className="w-64">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="in_progress">In Progress</SelectItem>
                               <SelectItem value="completed">Completed</SelectItem>
                               <SelectItem value="failed">Failed</SelectItem>
                               <SelectItem value="requires_review">Requires Review</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                         {/* Reasoning/Notes */}
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             Reasoning / Notes
                           </label>
                           <textarea
                             value={stepState?.reasoning || ''}
                             onChange={(e) => updateReasoning(step.id, e.target.value)}
                             placeholder="Enter your reasoning, findings, or notes for this verification step..."
                             className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                           />
                         </div>

                         {/* File uploads */}
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             Supporting Documents
                           </label>
                           
                           {/* Uploaded files list */}
                           {stepState?.files && stepState.files.length > 0 && (
                                                         <div className="mb-3 space-y-2">
                               {stepState?.files?.map((file, index) => (
                                 <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                                   <div className="flex items-center space-x-2">
                                     <FileText className="w-4 h-4 text-gray-500" />
                                     <span className="text-sm text-gray-900 dark:text-gray-100">{file.name}</span>
                                     <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                   </div>
                                   <button
                                     onClick={() => removeFile(step.id, index)}
                                     className="text-red-600 hover:text-red-700"
                                   >
                                     <X className="w-4 h-4" />
                                   </button>
                                 </div>
                               )) || []}
                             </div>
                          )}

                          {/* Upload dialog */}
                          <Dialog open={uploadDialogOpen === step.id} onOpenChange={(open) => setUploadDialogOpen(open ? step.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Documents
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Upload Documents</DialogTitle>
                                <DialogDescription>
                                  Upload supporting documents for {step.name}. Accepted formats: PDF, DOC, DOCX, JPG, PNG.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Drop files here or click to browse
                                  </p>
                                  <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileUpload(step.id, e.target.files)}
                                    className="hidden"
                                    id={`file-upload-${step.id}`}
                                  />
                                  <label
                                    htmlFor={`file-upload-${step.id}`}
                                    className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                                  >
                                    Choose files
                                  </label>
                                </div>
                              </div>

                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setUploadDialogOpen(null)}
                                >
                                  Done
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {/* Save button */}
                        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                          <Button 
                            onClick={() => saveVerificationStep(step.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Save Verification
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Agent demo containers - for development/testing */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <VerificationDemoContainers />
      </div>
    </div>
  );
} 