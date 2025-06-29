# Audit Trail Integration

This directory contains the frontend integration for the Vera Platform audit trail system.

## Overview

The audit trail system tracks verification steps for healthcare provider credentialing. It provides comprehensive logging of all verification activities, including who performed them, when they were done, and what the results were.

## Files

- `index.ts` - Main audit trail service and utilities
- `README.md` - This documentation file

## Key Features

- **Environment-aware API endpoints** - Automatically switches between dev and prod endpoints
- **Comprehensive error handling** - Gracefully handles foreign key constraint violations
- **User context integration** - Uses authenticated user information
- **React hook integration** - Easy-to-use React hooks for components
- **TypeScript support** - Full type safety for all API interactions

## Usage

### Basic Integration

```typescript
import { useAuditTrail } from "@/hooks/useAuditTrail";
import { useAuth } from "@/hooks/useAuth";

function VerificationComponent({ practitionerId }: { practitionerId: number }) {
  const { user } = useAuth();
  const auditTrail = useAuditTrail({
    applicationId: practitionerId,
    autoSync: false,
  });

  const startVerification = async (stepName: string) => {
    try {
      await auditTrail.startStep(stepName, {
        reasoning: "Starting verification process",
        processedBy: user?.email || "anonymous_user",
        priority: "medium",
      });
    } catch (error) {
      // Handle errors (e.g., application not found)
      console.error("Failed to start verification:", error);
    }
  };
}
```

### Error Handling

The system includes specific handling for foreign key constraint violations, which occur when trying to create audit trail entries for non-existent applications:

```typescript
// The system will automatically detect these errors and provide user-friendly messages
// without breaking the UI flow
```

## API Endpoints

The system automatically detects the environment and uses the appropriate endpoint:

- **Development**: `https://mikhailocampo--vera-platform-fastapi-app-dev.modal.run/v1/audit-trail`
- **Production**: `https://mikhailocampo--vera-platform-fastapi-app.modal.run/v1/audit-trail`

## Configuration

### Environment Detection

The system uses the following logic to determine the environment:

```typescript
const isDev =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" && window.location.hostname === "localhost");
```

### Application ID Mapping

The frontend uses the actual application ID from the applications data. The backend audit trail system expects the real application ID, not the practitioner ID:

```typescript
// Get the application ID from the fetched applications data
const applicationId = applications.length > 0 ? applications[0].id : undefined;

// Pass it to the verification component
<VerificationTabContent
  practitionerId={practitionerId}
  applicationId={applicationId}
/>;
```

## Integration with Verification Containers

The verification containers in `ProviderDetailClient.tsx` are fully integrated with the audit trail system:

1. **Start Verification**: Creates an audit trail entry when verification begins
2. **Save Verification**: Completes the audit trail entry with results
3. **Error Handling**: Shows appropriate error messages for missing applications
4. **User Tracking**: Records which user performed each verification step

## Debugging

In development mode, the system shows additional debug information:

- Current API endpoint being used
- Application ID being tracked
- Authenticated user information

## Error Recovery

When foreign key constraint violations occur (application not found), the system:

1. Shows a clear error message to the user
2. Keeps the verification button available for retry
3. Doesn't update the local verification state
4. Provides a dismiss button to clear the error

This ensures the UI remains functional even when the audit trail system can't record the activity.

### Application ID Resolution

The system follows this priority order for determining the application ID:

1. **Primary**: Uses the application ID passed as a prop (from fetched applications data)
2. **Fallback**: Uses the practitioner ID if no application ID is available
3. **Safety**: Uses a default ID (12345) if neither is available

This ensures backward compatibility while using the correct application ID when available.
