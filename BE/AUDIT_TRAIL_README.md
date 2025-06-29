# Audit Trail System

## Overview

The Audit Trail System provides comprehensive tracking of application verification steps, allowing you to monitor the progress, status, and results of each verification step in real-time. This system is designed to support both frontend and backend tracking of application verification processes.

## Features

- **Universal Schema**: Flexible JSONB data structure that accommodates all verification types
- **Real-time Tracking**: Track verification steps as they start, progress, and complete
- **Rich Metadata**: Capture reasoning, performance metrics, risk scores, and compliance information
- **Error Handling**: Comprehensive error tracking with stack traces and retry counts
- **API Endpoints**: RESTful APIs for starting, completing, and querying audit trail data
- **Utility Functions**: Easy-to-use helper functions and decorators for integration

## Database Schema

The audit trail uses the existing `vera.audit_trail` table:

```sql
create table vera.audit_trail (
  application_id bigint not null,
  step_name text not null,
  status text not null,
  data jsonb not null,
  started_at timestamp with time zone not null default now(),
  finished_at timestamp with time zone null,
  constraint steps_pkey primary key (application_id, step_name, started_at),
  constraint steps_application_id_fkey foreign KEY (application_id) references vera.applications (id)
);
```

## Universal Data Schema

The `data` JSONB column follows this universal structure:

```typescript
interface AuditTrailData {
  // Core fields
  step_type: string; // Type of verification step
  reasoning?: string; // AI agent or human reasoning

  // Request/Response data
  request_data?: object; // Input data for verification
  response_data?: object; // Response data from verification

  // Verification results
  verification_result?: string; // "verified" | "not_verified" | "partial" | "error"
  match_found?: boolean; // Whether a match was found
  confidence_score?: number; // Confidence score (0-100)

  // External service details
  external_service?: string; // Name of external service used
  external_service_response_time_ms?: number;
  external_service_status?: string;

  // Data quality and validation
  data_quality_score?: number; // Data quality score (0-100)
  validation_errors?: string[]; // List of validation errors
  data_completeness?: number; // Data completeness percentage

  // Risk assessment
  risk_flags?: string[]; // List of risk flags identified
  risk_score?: number; // Risk score (0-100)
  requires_manual_review?: boolean; // Whether manual review is required

  // Processing details
  processing_method?: string; // "database" | "external_api" | "ai_generated" | "manual"
  processing_duration_ms?: number; // Total processing time
  retry_count?: number; // Number of retries attempted

  // Agent information
  processed_by?: string; // Who/what processed this step
  agent_id?: string; // Unique identifier for processing agent
  agent_version?: string; // Version of processing agent

  // Compliance and audit
  compliance_checks?: string[]; // List of compliance checks performed
  audit_notes?: string; // Additional audit notes

  // Error handling
  error_code?: string; // Error code if step failed
  error_message?: string; // Detailed error message
  error_stack_trace?: string; // Stack trace for debugging

  // Dependencies
  depends_on_steps?: string[]; // List of step names this step depends on
  blocking_steps?: string[]; // List of step names blocked by this step

  // Metadata
  tags?: string[]; // Tags for categorization
  priority?: string; // "low" | "medium" | "high" | "critical"
  estimated_duration_ms?: number; // Estimated processing duration

  // Step-specific data
  step_specific_data?: object; // Additional data specific to verification type
}
```

## API Endpoints

### Start Audit Trail Step

```http
POST /api/v1/audit-trail/start
```

**Request Body:**

```json
{
  "application_id": 12345,
  "step_name": "npi_verification",
  "step_type": "external_api",
  "reasoning": "Verifying National Provider Identifier",
  "request_data": {
    "npi": "1234567890",
    "provider_name": "Dr. John Doe"
  },
  "processed_by": "npi_service",
  "priority": "medium"
}
```

### Complete Audit Trail Step

```http
POST /api/v1/audit-trail/complete
```

**Request Body:**

```json
{
  "application_id": 12345,
  "step_name": "npi_verification",
  "status": "completed",
  "reasoning": "NPI verification completed successfully",
  "response_data": {
    "npi": "1234567890",
    "provider_name": "Dr. John Doe",
    "is_active": true
  },
  "verification_result": "verified",
  "confidence_score": 95.0,
  "processing_duration_ms": 1500
}
```

### Get Application Audit Trail

```http
GET /api/v1/audit-trail/{application_id}
```

### Get Audit Trail Summary

```http
GET /api/v1/audit-trail/{application_id}/summary
```

### Get Specific Step Status

```http
GET /api/v1/audit-trail/{application_id}/step/{step_name}
```

## Usage Examples

### 1. Using the Decorator Approach

```python
from v1.services.audit_trail_utils import audit_trail_tracked, VerificationSteps

@audit_trail_tracked(
    step_name=VerificationSteps.NPI_VERIFICATION,
    step_type=VerificationSteps.EXTERNAL_API,
    reasoning="Automated NPI verification using external registry"
)
async def verify_npi(application_id: int, npi_request: NPIRequest):
    # Your verification logic here
    result = await npi_service.lookup_npi(npi_request)
    return result
```

### 2. Using the Wrapper Function

```python
from v1.services.audit_trail_utils import track_verification_step

async def verify_dea(application_id: int, dea_request: DEARequest):
    return await track_verification_step(
        application_id=application_id,
        step_name=VerificationSteps.DEA_VERIFICATION,
        step_type=VerificationSteps.DATABASE_LOOKUP,
        func=dea_service.verify_dea_practitioner,
        reasoning="Verifying DEA registration",
        request_data=dea_request.dict(),
        processed_by="dea_service",
        request=dea_request
    )
```

### 3. Using Manual Logging Functions

```python
from v1.services.audit_trail_utils import (
    log_verification_start,
    log_verification_complete,
    log_verification_error
)

async def verify_education(application_id: int, education_request: EducationRequest):
    step_name = VerificationSteps.EDUCATION_VERIFICATION
    start_time = time.time()

    try:
        # Start tracking
        await log_verification_start(
            application_id=application_id,
            step_name=step_name,
            step_type=VerificationSteps.AI_GENERATED,
            reasoning="Verifying educational credentials with AI-generated response",
            request_data=education_request.dict()
        )

        # Perform verification
        result = await education_service.verify_education(education_request)

        # Complete tracking
        processing_time = int((time.time() - start_time) * 1000)
        await log_verification_complete(
            application_id=application_id,
            step_name=step_name,
            status="completed",
            reasoning="Education verification completed successfully",
            response_data=result.dict(),
            verification_result="verified",
            processing_duration_ms=processing_time
        )

        return result

    except Exception as e:
        # Log error
        processing_time = int((time.time() - start_time) * 1000)
        await log_verification_error(
            application_id=application_id,
            step_name=step_name,
            error=e,
            processing_duration_ms=processing_time
        )
        raise
```

### 4. Using the Service Directly

```python
from v1.services.audit_trail_service import audit_trail_service
from v1.models.database import AuditTrailStatus

# Start a step
entry = await audit_trail_service.start_step(
    application_id=12345,
    step_name="custom_verification",
    step_type="manual_review",
    reasoning="Custom verification step",
    processed_by="human_agent"
)

# Complete the step
completed_entry = await audit_trail_service.complete_step(
    application_id=12345,
    step_name="custom_verification",
    status=AuditTrailStatus.COMPLETED,
    reasoning="Verification completed successfully",
    verification_result="verified"
)
```

## Verification Steps

### Pre-defined Step Names

- `npi_verification` - National Provider Identifier verification
- `dea_verification` - DEA registration verification
- `abms_certification` - Board certification verification
- `dca_license` - California license verification
- `medicare_enrollment` - Medicare enrollment verification
- `npdb_check` - National Practitioner Data Bank check
- `sanctions_check` - Sanctions and exclusions check
- `ladmf_check` - Death master file check
- `medical_verification` - Medical network verification
- `education_verification` - Educational credentials verification
- `hospital_privileges` - Hospital privileges verification
- `final_review` - Final application review

### Step Types

- `external_api` - External API calls
- `database_lookup` - Database queries
- `ai_generated` - AI-generated responses
- `manual_review` - Human review process
- `compliance_check` - Compliance verification

### Status Values

- `pending` - Step is waiting to be processed
- `in_progress` - Step is currently being processed
- `completed` - Step completed successfully
- `failed` - Step failed with errors
- `cancelled` - Step was cancelled
- `requires_review` - Step requires manual review

## Integration Guidelines

### For Frontend Applications

1. **Start tracking** when a verification process begins
2. **Poll for updates** using the step status endpoint
3. **Display progress** using the audit trail summary
4. **Show details** using the full audit trail endpoint

### For Backend Services

1. **Import utilities** from `v1.services.audit_trail_utils`
2. **Choose an approach**: decorator, wrapper, or manual logging
3. **Add reasoning** for AI agents and human decisions
4. **Include metrics** like processing time and confidence scores
5. **Handle errors** with proper error logging

### Best Practices

1. **Always provide reasoning** for verification decisions
2. **Include request/response data** for debugging
3. **Set appropriate risk scores** for compliance
4. **Use consistent step names** across services
5. **Handle retries** with proper retry count tracking
6. **Log processing times** for performance monitoring
7. **Add compliance checks** for regulatory requirements

## Error Handling

The audit trail system includes comprehensive error handling:

- **Automatic error logging** when verification steps fail
- **Stack trace capture** for debugging
- **Retry count tracking** for resilience monitoring
- **Error code classification** for categorization

## Performance Considerations

- **Asynchronous operations** for non-blocking execution
- **Efficient database queries** with proper indexing
- **Minimal overhead** for high-throughput verification
- **Optional tracking** that can be disabled if needed

## Security and Compliance

- **Sensitive data handling** with appropriate masking
- **Audit trail immutability** through database constraints
- **Access control** through API authentication
- **Compliance tracking** with built-in compliance checks

## Monitoring and Analytics

The audit trail system provides rich data for:

- **Performance monitoring** - processing times and success rates
- **Risk assessment** - risk scores and flags
- **Compliance reporting** - audit trails for regulatory requirements
- **Quality metrics** - data quality and confidence scores
- **Operational insights** - bottlenecks and failure patterns

## Example Integration

See `example_audit_trail_usage.py` for comprehensive examples of how to integrate the audit trail system into your verification services.

## Files Created/Modified

### New Files

- `v1/services/audit_trail_service.py` - Core audit trail service
- `v1/services/audit_trail_utils.py` - Utility functions and decorators
- `example_audit_trail_usage.py` - Usage examples
- `AUDIT_TRAIL_README.md` - This documentation

### Modified Files

- `v1/models/database.py` - Added audit trail data models
- `v1/models/requests.py` - Added audit trail request models
- `v1/models/responses.py` - Added audit trail response models
- `v1/api/routes.py` - Added audit trail API endpoints

The audit trail system is now ready for use and can be easily integrated into existing verification services with minimal code changes.
