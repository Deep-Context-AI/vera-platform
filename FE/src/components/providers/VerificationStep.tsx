'use client';

import React, { useState } from 'react';
import { 
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
  X
} from 'lucide-react';

// Types
export interface VerificationStepConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  dependsOn?: string[];
  hasSpecialForm?: boolean;
  formType?: 'licenses' | 'certifications' | 'registrations' | 'incidents_claims' | 'hospital_privileges';
}

export interface VerificationStepState {
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'requires_review';
  reasoning: string;
  files: File[];
  licenses: Array<{
    id: string;
    number: string;
    state: string;
    issued: string;
    expiration: string;
  }>;
  incidents: Array<{
    id: string;
    incidentType: string;
    details: string;
    date: string;
  }>;
  hospitalPrivileges: Array<{
    id: string;
    hospitalName: string;
    address?: string;
    phone?: string;
    department: string;
    issued: string;
    expiration: string;
    status: 'Active' | 'Inactive' | 'Suspended' | 'Pending';
  }>;
  startedAt?: Date;
  completedAt?: Date;
  examiner?: string;
}

interface VerificationStepProps {
  step: VerificationStepConfig;
  stepState: VerificationStepState;
  canStart: boolean;
  isLoading: boolean;
  error?: string;
  onStart: () => void;
  onSave: () => void;
  onUpdateStatus: (status: VerificationStepState['status']) => void;
  onUpdateReasoning: (reasoning: string) => void;
  onFileUpload: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onAddLicense?: (license: Omit<VerificationStepState['licenses'][0], 'id'>) => void;
  onRemoveLicense?: (licenseId: string) => void;
  children?: React.ReactNode; // For special form components
}

// Status utility functions
const getStatusInfo = (status: VerificationStepState['status']) => {
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
        icon: AlertTriangle,
        text: 'Requires Review'
      };
  }
};

export const VerificationStep: React.FC<VerificationStepProps> = ({
  step,
  stepState,
  canStart,
  isLoading,
  error,
  onStart,
  onSave,
  onUpdateStatus,
  onUpdateReasoning,
  onFileUpload,
  onRemoveFile,
  children
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  const statusInfo = getStatusInfo(stepState.status);
  const StatusIcon = statusInfo.icon;
  const StepIcon = step.icon;

  return (
    <AccordionItem value={step.id} className="border-b border-gray-200 dark:border-gray-700">
      <AccordionTrigger 
        className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        data-accordion-trigger={step.id}
        data-step-name={step.name}
      >
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

                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <Badge className={`${statusInfo.color} text-xs`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.text}
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-6 pb-6">
        {stepState.status === 'not_started' ? (
          <NotStartedState 
            step={step}
            canStart={canStart}
            isLoading={isLoading}
            error={error}
            onStart={onStart}
          />
        ) : (
          <ActiveState
            step={step}
            stepState={stepState}
            isLoading={isLoading}
            error={error}
            onSave={onSave}
            onUpdateStatus={onUpdateStatus}
            onUpdateReasoning={onUpdateReasoning}
            onFileUpload={onFileUpload}
            onRemoveFile={onRemoveFile}
            uploadDialogOpen={uploadDialogOpen}
            setUploadDialogOpen={setUploadDialogOpen}
          >
            {children}
          </ActiveState>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

// Not Started State Component
const NotStartedState: React.FC<{
  step: VerificationStepConfig;
  canStart: boolean;
  isLoading: boolean;
  error?: string;
  onStart: () => void;
}> = ({ step, canStart, isLoading, error, onStart }) => {
  const StepIcon = step.icon;

  return (
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
            {step.dependsOn.map(depId => (
              <Badge key={depId} className="bg-gray-100 text-gray-600">
                {depId.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <Button 
        onClick={onStart}
        disabled={!canStart || isLoading}
        className="bg-blue-600 hover:bg-blue-700"
        data-agent-action="start-verification"
        data-step-id={step.id}
        data-step-name={step.name}
      >
        <Shield className="w-4 h-4 mr-2" />
        {isLoading ? 'Starting...' : 'Start Verification'}
      </Button>
      
      {!canStart && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
          Complete required dependencies first
        </p>
      )}
      
      {error && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

// Active State Component
const ActiveState: React.FC<{
  step: VerificationStepConfig;
  stepState: VerificationStepState;
  isLoading: boolean;
  error?: string;
  onSave: () => void;
  onUpdateStatus: (status: VerificationStepState['status']) => void;
  onUpdateReasoning: (reasoning: string) => void;
  onFileUpload: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  uploadDialogOpen: boolean;
  setUploadDialogOpen: (open: boolean) => void;
  children?: React.ReactNode;
}> = ({
  step,
  stepState,
  isLoading,
  error,
  onSave,
  onUpdateStatus,
  onUpdateReasoning,
  onFileUpload,
  onRemoveFile,
  uploadDialogOpen,
  setUploadDialogOpen,
  children
}) => {
  const statusInfo = getStatusInfo(stepState.status);

  return (
    <div className="space-y-6">
      {/* Status and examiner info */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Status: {statusInfo.text}
            </p>
            {stepState.examiner && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Examiner: {stepState.examiner}
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-gray-600 dark:text-gray-400">
          {stepState.startedAt && (
            <p>Started: {stepState.startedAt.toLocaleString()}</p>
          )}
          {stepState.completedAt && (
            <p>Completed: {stepState.completedAt.toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Main content area with flex layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Default form */}
        <div className="flex-1 space-y-4">
          {/* Status selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verification Status
            </label>
            <Select 
              value={stepState.status} 
              onValueChange={(value) => onUpdateStatus(value as VerificationStepState['status'])}
            >
              <SelectTrigger 
                className="w-64"
                data-agent-field="verification-status"
                data-step-id={step.id}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress" data-agent-option="in_progress">In Progress</SelectItem>
                <SelectItem value="completed" data-agent-option="completed">Completed</SelectItem>
                <SelectItem value="failed" data-agent-option="failed">Failed</SelectItem>
                <SelectItem value="requires_review" data-agent-option="requires_review">Requires Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reasoning/Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reasoning / Notes
            </label>
            <textarea
              value={stepState.reasoning}
              onChange={(e) => onUpdateReasoning(e.target.value)}
              placeholder="Enter your reasoning, findings, or notes for this verification step..."
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              data-agent-field="reasoning-notes"
              data-step-id={step.id}
            />
          </div>

          {/* File uploads */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supporting Documents
            </label>
            
            {/* Uploaded files list */}
            {stepState.files && stepState.files.length > 0 && (
              <div className="mb-3 space-y-2">
                {stepState.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => onRemoveFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  data-agent-action="upload-documents"
                  data-step-id={step.id}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-agent-dialog="upload-documents">
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                  <DialogDescription>
                    Upload supporting documents for {step.name}. Accepted formats: PDF, DOC, DOCX, JPG, PNG.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center"
                    data-upload-zone="true"
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Drop files here or click to browse
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => onFileUpload(e.target.files)}
                      className="hidden"
                      id={`file-upload-${step.id}`}
                      data-agent-input="file-upload"
                      data-step-id={step.id}
                    />
                    <label
                      htmlFor={`file-upload-${step.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                      data-agent-action="choose-files"
                      data-step-id={step.id}
                    >
                      Choose files
                    </label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                    data-agent-action="close-upload-dialog"
                    data-step-id={step.id}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Right side - Special forms */}
        {children && (
          <div className="flex-1 lg:max-w-md" data-step-id={step.id}>
            {children}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            {error}
          </p>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          onClick={onSave}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
          data-agent-action="save-progress"
          data-step-id={step.id}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Progress'}
        </Button>
      </div>
    </div>
  );
};

export default VerificationStep; 