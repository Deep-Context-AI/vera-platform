# Verification API Client Documentation

This module provides TypeScript helper functions for all healthcare verification endpoints provided by the Vera Platform backend API.

## Backend API Endpoints

The verification API automatically detects the environment and uses the appropriate endpoint:

- **Development**: `https://mikhailocampo--vera-platform-fastapi-app-dev.modal.run`
- **Production**: `https://mikhailocampo--vera-platform-fastapi-app.modal.run`

## Usage

### Basic Import

```typescript
import { VerificationAPI, verificationHelpers } from "@/lib/api";
```

### Available Verification Methods

#### 1. NPI (National Provider Identifier) Search

```typescript
import { VerificationAPI } from "@/lib/api";

// Search by NPI number
const npiResult = await VerificationAPI.searchNPI({
  npi: "1234567890",
});

// Search by provider name
const nameResult = await VerificationAPI.searchNPI({
  first_name: "John",
  last_name: "Doe",
  state: "CA",
});

// Quick helper for NPI lookup
const quickResult = await verificationHelpers.quickNPILookup("1234567890");
```

#### 2. DEA Verification

```typescript
const deaResult = await VerificationAPI.verifyDEA({
  first_name: "John",
  last_name: "Doe",
  dea_number: "BD1234567", // 2 letters + 7 digits
});
```

#### 3. ABMS (Board Certification) Lookup

```typescript
const abmsResult = await VerificationAPI.lookupABMSCertification({
  first_name: "John",
  last_name: "Doe",
  state: "CA",
  npi_number: "1234567890",
  specialty: "Internal Medicine", // optional
});
```

#### 4. NPDB (National Practitioner Data Bank) Verification

```typescript
const npdbResult = await VerificationAPI.verifyNPDB({
  first_name: "John",
  last_name: "Doe",
  date_of_birth: "1980-01-15",
  ssn_last4: "1234",
  address: {
    line1: "123 Main St",
    city: "Los Angeles",
    state: "CA",
    zip: "90210",
  },
  npi_number: "1234567890",
  license_number: "MD123456",
  state_of_license: "CA",
});
```

#### 5. Comprehensive Sanctions Check

```typescript
const sanctionsResult = await VerificationAPI.comprehensiveSanctionsCheck({
  first_name: "John",
  last_name: "Doe",
  date_of_birth: "1980-01-15",
  npi: "1234567890",
  license_number: "MD123456",
  license_state: "CA",
  ssn_last4: "1234",
});

// Quick helper for basic sanctions check
const quickSanctions = await verificationHelpers.basicSanctionsCheck(
  "John",
  "Doe",
  "1980-01-15",
  "1234567890",
  "MD123456",
  "CA",
  "1234"
);
```

#### 6. LADMF (Death Master File) Verification

```typescript
const ladmfResult = await VerificationAPI.verifyLADMF({
  first_name: "John",
  last_name: "Doe",
  middle_name: "Michael", // optional
  date_of_birth: "1980-01-15",
  social_security_number: "123456789", // 9 digits
});
```

#### 7. Medical (Medi-Cal + ORP) Verification

```typescript
const medicalResult = await VerificationAPI.verifyMedical({
  npi: "1234567890",
  first_name: "John",
  last_name: "Doe",
  license_type: "MD", // optional
  state: "CA", // optional
});
```

#### 8. DCA (California License) Verification

```typescript
const dcaResult = await VerificationAPI.verifyDCALicense({
  first_name: "John",
  last_name: "Doe",
  license_number: "MD123456",
});
```

#### 9. Medicare Enrollment Verification

```typescript
const medicareResult = await VerificationAPI.verifyMedicare({
  provider_verification_type: "medicare_enrollment",
  npi: "1234567890",
  first_name: "John",
  last_name: "Doe",
  verification_sources: [
    "ffs_provider_enrollment",
    "ordering_referring_provider",
  ],
});

// Quick helper for standard Medicare check
const quickMedicare = await verificationHelpers.standardMedicareCheck(
  "1234567890",
  "John",
  "Doe"
);
```

#### 10. Education Verification

```typescript
const educationResult = await VerificationAPI.verifyEducation({
  first_name: "John",
  last_name: "Doe",
  institution: "Harvard Medical School",
  degree_type: "MD",
  graduation_year: 2010,
  verification_type: "degree_verification",
});

// Quick helper for standard education verification
const quickEducation = await verificationHelpers.standardEducationVerification(
  "John",
  "Doe",
  "Harvard Medical School",
  "MD",
  2010
);
```

#### 11. Hospital Privileges Verification

```typescript
const privilegesResult = await VerificationAPI.verifyHospitalPrivileges({
  first_name: "John",
  last_name: "Doe",
  npi_number: "1234567890",
  hospital_name: "General Hospital",
  specialty: "Internal Medicine",
  verification_type: "current_privileges",
});
```

## Error Handling

All verification methods include built-in validation and will throw descriptive errors for invalid input:

```typescript
try {
  const result = await VerificationAPI.searchNPI({
    npi: "123", // Invalid - too short
  });
} catch (error) {
  console.error("Validation error:", error.message);
  // "NPI must be exactly 10 digits"
}
```

## Response Format

All responses follow a consistent format:

```typescript
interface BaseResponse {
  status: string;
  message: string;
  data?: any; // Verification-specific data
}
```

## Convenience Helpers

The `verificationHelpers` object provides quick access to common verification patterns:

```typescript
import { verificationHelpers } from "@/lib/api";

// Quick NPI lookup
const npi = await verificationHelpers.quickNPILookup("1234567890");

// Provider search by name
const provider = await verificationHelpers.searchProviderByName(
  "John",
  "Doe",
  "CA"
);

// Standard Medicare check
const medicare = await verificationHelpers.standardMedicareCheck(
  "1234567890",
  "John",
  "Doe"
);

// Basic sanctions check
const sanctions = await verificationHelpers.basicSanctionsCheck(
  "John",
  "Doe",
  "1980-01-15",
  "1234567890",
  "MD123456",
  "CA",
  "1234"
);

// Standard education verification
const education = await verificationHelpers.standardEducationVerification(
  "John",
  "Doe",
  "Harvard Medical School",
  "MD",
  2010
);
```

## Integration with Agent Runner

The verification API is designed to work seamlessly with the Agent Runner system:

```typescript
import { VerificationAPI } from "@/lib/api";
import { auditTrailService } from "@/lib/audit";

async function performVerificationWithAudit(applicationId: number) {
  // Start audit trail
  await auditTrailService.startVerificationStep(
    applicationId,
    "npi_verification",
    {
      reasoning: "Starting NPI verification process",
    }
  );

  try {
    // Perform verification
    const result = await VerificationAPI.searchNPI({
      npi: "1234567890",
    });

    // Complete audit trail
    await auditTrailService.completeVerificationStep(
      applicationId,
      "npi_verification",
      {
        status: "completed",
        reasoning: "NPI verification completed successfully",
        response_data: result,
      }
    );

    return result;
  } catch (error) {
    // Record failure in audit trail
    await auditTrailService.completeVerificationStep(
      applicationId,
      "npi_verification",
      {
        status: "failed",
        reasoning: `NPI verification failed: ${error.message}`,
      }
    );
    throw error;
  }
}
```

## Environment Configuration

The API client automatically detects the environment:

```typescript
import { API_ENDPOINTS } from "@/lib/api";

console.log("Current endpoint:", API_ENDPOINTS.CURRENT);
console.log("Is development:", API_ENDPOINTS.CURRENT === API_ENDPOINTS.DEV);
```

## Validation Rules

### Common Validations

- **NPI Numbers**: Must be exactly 10 digits
- **DEA Numbers**: Must be 2 letters followed by 7 digits (e.g., "BD1234567")
- **Dates**: Must be in YYYY-MM-DD format
- **States**: Must be 2-letter abbreviations (automatically converted to uppercase)
- **SSN Last 4**: Must be exactly 4 digits

### Specific Validations

- **Medicare Verification Sources**: Must be one of `['ffs_provider_enrollment', 'ordering_referring_provider']`
- **Education Degree Types**: Must be one of predefined degree types (MD, PhD, Bachelor's, etc.)
- **Hospital Privileges Types**: Must be one of `['current_privileges', 'historical_privileges', 'privileges_status', 'general_inquiry']`

## Debug Mode

In development mode, the API client provides detailed logging:

```typescript
// Console output in development:
// 🔧 Verification API Call: POST https://...dev.modal.run/npi/search
// ✅ Verification API Response: { status: "success", data: {...} }
```

## Type Safety

All requests and responses are fully typed for TypeScript safety:

```typescript
import type { NPIRequest, NPIResponse } from "@/lib/api";

const request: NPIRequest = {
  npi: "1234567890",
};

const response: NPIResponse = await VerificationAPI.searchNPI(request);
```
