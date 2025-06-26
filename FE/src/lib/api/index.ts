// Centralized API client - single entry point for all API operations
export { ApplicationsAPI } from './applications';

// You can add more API modules here as you create them
// export { PractitionersAPI } from './practitioners';
// export { ProvidersAPI } from './providers';
// export { CommitteeAPI } from './committee';

// Re-export types for convenience
export type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationStatus,
  WorkHistoryEntry,
  MalpracticeInsurance,
  Practitioner,
  Attestation,
  AttestationResponse,
  ApplicationWithDetails,
  ApplicationDetailsView,
  VerificationStatus
} from '@/types/applications'; 