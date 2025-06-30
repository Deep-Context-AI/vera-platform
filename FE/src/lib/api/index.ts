// Centralized API client - single entry point for all API operations
export { ApplicationsAPI } from './applications';
export { VerificationAPI, verificationHelpers, API_ENDPOINTS } from './verification';

// Re-export types for convenience
export type {
  NPIRequest,
  DEAVerificationRequest,
  ABMSRequest,
  NPDBRequest,
  NPDBAddress,
  ComprehensiveSANCTIONRequest,
  LADMFRequest,
  MedicalRequest,
  DCARequest,
  MedicareRequest,
  EducationRequest,
  HospitalPrivilegesRequest,
  NPIResponse,
  NewDEAVerificationResponse,
  ABMSResponse,
  NPDBResponse,
  ComprehensiveSANCTIONResponse,
  LADMFResponse,
  MedicalResponse,
  DCAResponse,
  MedicareResponse,
  EducationResponse,
  HospitalPrivilegesResponse
} from './verification';


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