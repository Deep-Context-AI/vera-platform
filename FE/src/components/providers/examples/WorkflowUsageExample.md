# Verification Workflow System Usage Examples

This document demonstrates how to use the new modular verification system with different workflow templates and custom configurations.

## Basic Usage

### Using Predefined Workflow Templates

```tsx
import { VerificationTabContent } from '@/components/providers/ProviderDetailClient';

// Basic workflow (3 steps)
<VerificationTabContent
  practitionerId={123}
  applicationId={456}
  workflowTemplate="basic"
  auditSteps={auditSteps}
  onAuditStepsUpdate={handleAuditUpdate}
/>

// Standard workflow (6 steps) - Default
<VerificationTabContent
  practitionerId={123}
  applicationId={456}
  workflowTemplate="standard"
  auditSteps={auditSteps}
  onAuditStepsUpdate={handleAuditUpdate}
/>

// Comprehensive workflow (10 steps)
<VerificationTabContent
  practitionerId={123}
  applicationId={456}
  workflowTemplate="comprehensive"
  auditSteps={auditSteps}
  onAuditStepsUpdate={handleAuditUpdate}
/>

// Express workflow (3 steps, minimal)
<VerificationTabContent
  practitionerId={123}
  applicationId={456}
  workflowTemplate="express"
  auditSteps={auditSteps}
  onAuditStepsUpdate={handleAuditUpdate}
/>
```

## Custom Workflow Creation

### Building Custom Workflows

```tsx
import {
  VerificationWorkflowBuilder,
  VERIFICATION_STEPS,
} from "@/components/providers/VerificationStepBuilder";

// Create a custom workflow for emergency credentialing
const emergencyWorkflow = new VerificationWorkflowBuilder()
  .addSteps([
    "identity_verification",
    "license_verification",
    "background_check",
  ])
  .build();

// Create a workflow for telemedicine providers
const telemedicineWorkflow = new VerificationWorkflowBuilder()
  .addSteps([
    "identity_verification",
    "license_verification",
    "specialty_certification",
    "insurance_verification",
    "website_social_verification",
  ])
  .build();

// Custom step example
const customStep = {
  id: "custom_telemedicine_check",
  name: "Telemedicine Platform Verification",
  description: "Verify telemedicine platform certifications and compliance",
  icon: Globe,
  priority: "medium" as const,
  estimatedDuration: "15-20 min",
  dependsOn: ["license_verification"],
};

const customWorkflow = new VerificationWorkflowBuilder()
  .addStep("identity_verification")
  .addStep("license_verification")
  .addCustomStep(customStep)
  .build();
```

## Special Form Integration

### License Management Example

The system automatically handles special forms based on step configuration:

```tsx
// Steps with hasSpecialForm: true and formType: 'licenses' will automatically
// render the LicenseForm component as a child

const licenseStep = {
  id: "state_license_verification",
  name: "State License Verification",
  description: "Verify state medical licenses",
  icon: Award,
  priority: "high" as const,
  estimatedDuration: "10-15 min",
  hasSpecialForm: true,
  formType: "licenses" as const,
};
```

### Creating Custom Form Components

```tsx
// For certifications
export const CertificationForm: React.FC<CertificationFormProps> = ({
  certifications,
  onAddCertification,
  onRemoveCertification,
  onUpdateCertification,
  isEditable = true,
}) => {
  // Implementation similar to LicenseForm
  return <div className="space-y-4">{/* Certification management UI */}</div>;
};

// Usage in VerificationStep
{
  step.hasSpecialForm && step.formType === "certifications" && (
    <div className="mt-4">
      <CertificationForm
        certifications={stepState.certifications}
        onAddCertification={(cert) => handleAddCertification(step.id, cert)}
        onRemoveCertification={(certId) =>
          handleRemoveCertification(step.id, certId)
        }
        onUpdateCertification={(certId, updatedCert) =>
          handleUpdateCertification(step.id, certId, updatedCert)
        }
        isEditable={true}
      />
    </div>
  );
}
```

## Data Synchronization

### Audit Trail Integration

The system automatically:

- Populates verification state from existing audit trail data
- Saves structured data to the audit trail based on special forms
- Retrieves the latest data per step on initialization

```tsx
// The system maps audit trail data to verification state
const mapAuditStatusToVerification = (
  auditStatus: string
): VerificationStepState["status"] => {
  switch (auditStatus) {
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "in_progress":
      return "in_progress";
    case "requires_review":
      return "requires_review";
    default:
      return "not_started";
  }
};

// Structured data is saved for special forms
const getStepSpecificData = (
  stepId: string,
  step: VerificationStepConfig,
  stepState: VerificationStepState
) => {
  if (!step.hasSpecialForm) {
    return {}; // Clean empty object for generic steps
  }

  switch (step.formType) {
    case "licenses":
      return {
        licenses: stepState.licenses.map((license) => ({
          number: license.number,
          state: license.state,
          issued: license.issued,
          expiration: license.expiration,
        })),
      };
    // Add more form types as needed
  }
};
```

## Workflow Templates Available

### Basic Template

- Identity Verification
- Contact Verification
- License Verification

### Standard Template (Default)

- Identity Verification
- Contact Verification
- License Verification
- Education Verification
- Employment Verification
- Insurance Verification

### Comprehensive Template

- Identity Verification
- Contact Verification
- License Verification
- Education Verification
- Employment Verification
- Reference Verification
- Background Check
- Specialty Certification
- Insurance Verification
- Online Presence Verification

### Express Template

- Identity Verification
- License Verification
- Contact Verification

## Extensibility Features

### Adding New Form Types

1. **Define the form component** (similar to LicenseForm)
2. **Update VerificationStepBuilder** with new formType
3. **Add handling in VerificationStep** children render
4. **Update getStepSpecificData** function

### Adding New Workflow Templates

```tsx
// In VerificationStepBuilder.tsx
export const WORKFLOW_TEMPLATES = {
  // ... existing templates

  // New custom template
  specialty: () =>
    new VerificationWorkflowBuilder().addSteps([
      "identity_verification",
      "license_verification",
      "specialty_certification",
      "insurance_verification",
    ]),

  international: () =>
    new VerificationWorkflowBuilder().addSteps([
      "identity_verification",
      "license_verification",
      "education_verification",
      "credential_verification",
      "language_certification",
    ]),
};
```

## Best Practices

1. **Use predefined templates** when possible for consistency
2. **Create custom workflows** for specific use cases
3. **Implement special forms** for structured data collection
4. **Handle dependencies** properly in custom steps
5. **Test workflow validation** before deployment
6. **Document custom steps** and their requirements

## Migration Guide

To migrate from the old system to the new modular system:

1. Replace direct imports of old verification components
2. Use VerificationTabContent with appropriate workflowTemplate
3. Update any custom step definitions to match new interfaces
4. Test data synchronization with existing audit trails
5. Update any custom form handling to use the new pattern
