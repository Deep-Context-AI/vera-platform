'use client';

import React from 'react';
import { 
  Shield,
  FileText,
  CheckCircle,
  Users,
  Building,
  Award,
  Database,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { VerificationStepConfig } from './VerificationStep';

// Predefined verification step configurations
export const VERIFICATION_STEPS: Record<string, VerificationStepConfig> = {
  identity_verification: {
    id: 'identity_verification',
    name: 'Identity Verification',
    description: 'Verify provider identity and basic information',
    icon: Shield,
    priority: 'high',
    estimatedDuration: '5-10 min',
    hasSpecialForm: false
  },
  
  license_verification: {
    id: 'license_verification',
    name: 'License Verification',
    description: 'Verify professional licenses and certifications',
    icon: Award,
    priority: 'high',
    estimatedDuration: '10-15 min',
    dependsOn: ['identity_verification'],
    hasSpecialForm: true,
    formType: 'licenses'
  },
  
  education_verification: {
    id: 'education_verification',
    name: 'Education Verification',
    description: 'Verify educational background and degrees',
    icon: FileText,
    priority: 'medium',
    estimatedDuration: '15-20 min',
    dependsOn: ['identity_verification']
  },
  
  employment_verification: {
    id: 'employment_verification',
    name: 'Employment History',
    description: 'Verify work history and previous employment',
    icon: Building,
    priority: 'medium',
    estimatedDuration: '10-15 min',
    dependsOn: ['identity_verification']
  },
  
  reference_verification: {
    id: 'reference_verification',
    name: 'Professional References',
    description: 'Contact and verify professional references',
    icon: Users,
    priority: 'low',
    estimatedDuration: '20-30 min',
    dependsOn: ['employment_verification']
  },
  
  background_check: {
    id: 'background_check',
    name: 'Background Check',
    description: 'Conduct criminal background and security clearance',
    icon: Database,
    priority: 'high',
    estimatedDuration: '24-48 hours',
    dependsOn: ['identity_verification']
  },
  
  contact_verification: {
    id: 'contact_verification',
    name: 'Contact Information',
    description: 'Verify phone numbers, email addresses, and addresses',
    icon: Phone,
    priority: 'medium',
    estimatedDuration: '5-10 min',
    dependsOn: ['identity_verification']
  },
  
  specialty_certification: {
    id: 'specialty_certification',
    name: 'Specialty Certifications',
    description: 'Verify specialized certifications and training',
    icon: CheckCircle,
    priority: 'medium',
    estimatedDuration: '10-15 min',
    dependsOn: ['license_verification'],
    hasSpecialForm: true,
    formType: 'certifications'
  },
  
  insurance_verification: {
    id: 'insurance_verification',
    name: 'Insurance & Malpractice',
    description: 'Verify malpractice insurance and coverage',
    icon: Shield,
    priority: 'high',
    estimatedDuration: '10-15 min',
    dependsOn: ['license_verification']
  },
  
  website_social_verification: {
    id: 'website_social_verification',
    name: 'Online Presence',
    description: 'Verify website, social media, and online profiles',
    icon: Globe,
    priority: 'low',
    estimatedDuration: '5-10 min'
  }
};

// Builder class for creating verification workflows
export class VerificationWorkflowBuilder {
  private steps: VerificationStepConfig[] = [];
  
  constructor() {
    this.steps = [];
  }
  
  // Add a step to the workflow
  addStep(stepId: keyof typeof VERIFICATION_STEPS): VerificationWorkflowBuilder {
    const step = VERIFICATION_STEPS[stepId];
    if (step && !this.steps.find(s => s.id === step.id)) {
      this.steps.push(step);
    }
    return this;
  }
  
  // Add multiple steps
  addSteps(stepIds: (keyof typeof VERIFICATION_STEPS)[]): VerificationWorkflowBuilder {
    stepIds.forEach(stepId => this.addStep(stepId));
    return this;
  }
  
  // Add a custom step
  addCustomStep(step: VerificationStepConfig): VerificationWorkflowBuilder {
    if (!this.steps.find(s => s.id === step.id)) {
      this.steps.push(step);
    }
    return this;
  }
  
  // Remove a step
  removeStep(stepId: string): VerificationWorkflowBuilder {
    this.steps = this.steps.filter(step => step.id !== stepId);
    return this;
  }
  
  // Sort steps by priority and dependencies
  private sortSteps(): VerificationStepConfig[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    // First, sort by priority
    const sorted = [...this.steps].sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Then handle dependencies using topological sort
    const result: VerificationStepConfig[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (step: VerificationStepConfig) => {
      if (visiting.has(step.id)) {
        throw new Error(`Circular dependency detected involving step: ${step.id}`);
      }
      
      if (visited.has(step.id)) {
        return;
      }
      
      visiting.add(step.id);
      
      // Visit dependencies first
      if (step.dependsOn) {
        step.dependsOn.forEach(depId => {
          const depStep = sorted.find(s => s.id === depId);
          if (depStep) {
            visit(depStep);
          }
        });
      }
      
      visiting.delete(step.id);
      visited.add(step.id);
      result.push(step);
    };
    
    sorted.forEach(step => {
      if (!visited.has(step.id)) {
        visit(step);
      }
    });
    
    return result;
  }
  
  // Get the built workflow
  build(): VerificationStepConfig[] {
    return this.sortSteps();
  }
  
  // Validate that all dependencies are satisfied
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const stepIds = new Set(this.steps.map(s => s.id));
    
    this.steps.forEach(step => {
      if (step.dependsOn) {
        step.dependsOn.forEach(depId => {
          if (!stepIds.has(depId)) {
            errors.push(`Step "${step.id}" depends on "${depId}" which is not included in the workflow`);
          }
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Get estimated total duration
  getEstimatedDuration(): string {
    const durations = this.steps.map(step => {
      const match = step.estimatedDuration.match(/(\d+)(?:-(\d+))?\s*(min|hours?|days?)/);
      if (!match) return 0;
      
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      const unit = match[3];
      
      // Convert to minutes
      let avgMinutes = (min + max) / 2;
      if (unit.startsWith('hour')) {
        avgMinutes *= 60;
      } else if (unit.startsWith('day')) {
        avgMinutes *= 60 * 24;
      }
      
      return avgMinutes;
    });
    
    const totalMinutes = durations.reduce((sum, duration) => sum + duration, 0);
    
    if (totalMinutes < 60) {
      return `${Math.round(totalMinutes)} min`;
    } else if (totalMinutes < 60 * 24) {
      const hours = Math.round(totalMinutes / 60 * 10) / 10;
      return `${hours} hours`;
    } else {
      const days = Math.round(totalMinutes / (60 * 24) * 10) / 10;
      return `${days} days`;
    }
  }
}

// Predefined workflow templates
export const WORKFLOW_TEMPLATES = {
  // Basic verification for simple providers
  basic: () => new VerificationWorkflowBuilder()
    .addSteps([
      'identity_verification',
      'contact_verification',
      'license_verification'
    ]),
  
  // Standard verification for most healthcare providers
  standard: () => new VerificationWorkflowBuilder()
    .addSteps([
      'identity_verification',
      'contact_verification',
      'license_verification',
      'education_verification',
      'employment_verification',
      'insurance_verification'
    ]),
  
  // Comprehensive verification for high-risk or specialized providers
  comprehensive: () => new VerificationWorkflowBuilder()
    .addSteps([
      'identity_verification',
      'contact_verification',
      'license_verification',
      'education_verification',
      'employment_verification',
      'reference_verification',
      'background_check',
      'specialty_certification',
      'insurance_verification',
      'website_social_verification'
    ]),
  
  // Quick verification for emergency or temporary credentialing
  express: () => new VerificationWorkflowBuilder()
    .addSteps([
      'identity_verification',
      'license_verification',
      'contact_verification'
    ])
};

// Utility functions
export const getStepById = (stepId: string): VerificationStepConfig | undefined => {
  return VERIFICATION_STEPS[stepId as keyof typeof VERIFICATION_STEPS];
};

export const getStepsByFormType = (formType: 'licenses' | 'certifications' | 'registrations'): VerificationStepConfig[] => {
  return Object.values(VERIFICATION_STEPS).filter(step => step.formType === formType);
};

export const canStartStep = (step: VerificationStepConfig, completedSteps: string[]): boolean => {
  if (!step.dependsOn || step.dependsOn.length === 0) {
    return true;
  }
  
  return step.dependsOn.every(depId => completedSteps.includes(depId));
};

export default VerificationWorkflowBuilder; 