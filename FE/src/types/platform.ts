export interface Provider {
  id: string;
  name: string;
  ssn: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  fieldOfLicense: 'Physician MD' | 'Physician Assistant PA' | 'Nurse Practitioner NP' | 'Doctor of Chiropractic DC' | 'Other';
  specialty: string;
  dueDate: string;
  npi: string;
  licenseNumber: string;
  practiceLocations: PracticeLocation[];
  allLicenseNumbers: LicenseInfo[];
  incidents: IncidentClaim[];
  appointmentType: 'initial' | 'reappointment';
  lastReappointmentDate?: string;
  nextReappointmentDue?: string;
  status: 'pending' | 'in-review' | 'verification-complete' | 'approved' | 'rejected' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
  submittedDate: string;
  lastActivity: string;
  assignedReviewer: string;
  completionPercentage: number;
  documents: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
  verificationSteps: {
    initial_review: boolean;
    primary_source: boolean;
    license_verification: boolean;
    education_verification: boolean;
    work_history: boolean;
    sanctions_check: boolean;
    malpractice_check: boolean;
    references_check: boolean;
    final_review: boolean;
    committee_approval: boolean;
  };
  estimatedCompletion: string;
  notes?: string;
  auditTrail: AuditLogEntry[];
  emailThread: EmailMessage[];
}

export interface PracticeLocation {
  id: string;
  facilityName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  department?: string;
  privilegeStatus: 'active' | 'pending' | 'suspended' | 'expired';
  privilegeStartDate: string;
  privilegeEndDate?: string;
}

export interface LicenseInfo {
  type: string;
  number: string;
  state: string;
  issueDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'suspended' | 'pending';
}

export interface IncidentClaim {
  id: string;
  type: 'malpractice' | 'disciplinary' | 'sanctions' | 'criminal' | 'other';
  description: string;
  date: string;
  status: 'resolved' | 'pending' | 'ongoing';
  amount?: string;
  documents: string[];
  explanation?: string;
}

export type NavigationTab = 'HOME' | 'PROVIDERS' | 'APPROVED' | 'COMMITTEE_REVIEW' | 'INBOX';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export interface ProviderDetails {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  address: string;
  npi: string;
  licenseNumber: string;
  dateOfBirth: string;
  status: 'pending' | 'in-review' | 'verification-complete' | 'approved' | 'rejected' | 'on-hold';
  verificationTimeline: VerificationItem[];
  verificationDetails: VerificationDetail[];
}

export interface VerificationItem {
  name: string;
  status: 'verified' | 'pending' | 'failed';
  verifiedDate?: string;
  expirationDate?: string;
  results?: string;
  documentUrl?: string;
}

export interface VerificationDetail {
  name: string;
  status: 'verified' | 'pending' | 'failed';
  details?: string;
  results?: string;
  verifiedDate?: string;
  expirationDate?: string;
  documentUrl?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  fromStatus?: string;
  toStatus?: string;
  ipAddress?: string;
  userAgent?: string;
  category?: 'verification' | 'communication' | 'document' | 'system' | 'review' | 'decision';
  subcategory?: string;
  attachments?: string[];
  followUpRequired?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  callRecording?: {
    duration: string;
    transcript: string;
    audioFile: string;
  };
}

export interface ProviderDocument {
  id: string;
  name: string;
  type: string;
  category: 'primary' | 'supporting' | 'verification';
  uploadedDate: string;
  size: string;
  format: string;
  status: 'pending' | 'reviewed' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedDate?: string;
  expirationDate?: string;
  url: string;
  description: string;
  isConfidential?: boolean;
  requiresReview?: boolean;
}

export interface EmailMessage {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  type: 'inbound' | 'outbound';
  status: 'sent' | 'received' | 'draft' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  attachments?: string[];
  responseRequired?: boolean;
  isVerificationResponse?: boolean;
  isSystemGenerated?: boolean;
}

export interface VerificationFlag {
  id: string;
  type: 'malpractice' | 'sanctions' | 'license_issue' | 'education_gap' | 'criminal_background' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  details: string;
  discoveredDate: string;
  status: 'pending' | 'under_review' | 'resolved' | 'escalated';
  assignedTo?: string;
  resolution?: string;
  resolvedDate?: string;
  requiresThreeDirectors: boolean;
}

export interface MedicalDirectorReview {
  id: string;
  directorId: string;
  directorName: string;
  reviewDate: string;
  decision: 'approve' | 'reject' | 'conditional' | 'defer';
  comments: string;
  conditions?: string[];
  signature: string;
  acknowledged: boolean;
}

export interface CommitteeCase {
  id: string;
  providerId: string;
  providerName: string;
  specialty: string;
  npi: string;
  status: 'ready_for_committee' | 'under_committee_review' | 'approved' | 'rejected' | 'conditional' | 'deferred';
  priority: 'routine' | 'expedited' | 'urgent';
  submittedToCommittee: string;
  examinerName: string; // Who completed the final review after Vera
  examinerId: string;
  assignedMedicalDirector: string;
  medicalDirectorId: string;
  hasFlags: boolean;
  flags: VerificationFlag[];
  medicalDirectorReviews: MedicalDirectorReview[];
  committeeDecision?: {
    decision: 'approve' | 'reject' | 'conditional' | 'defer';
    decisionDate: string;
    conditions?: string[];
    notes: string;
    votingMembers: string[];
    voteBreakdown: {
      approve: number;
      reject: number;
      conditional: number;
      defer: number;
    };
  };
  auditTrail: AuditLogEntry[];
  documentsReviewed: string[];
  credentialingScore: number; // 0-100
  riskAssessment: 'low' | 'medium' | 'high' | 'critical';
  nextReviewDate?: string;
  privileges: {
    requested: string[];
    recommended: string[];
    granted?: string[];
    restricted?: string[];
  };
  insurance: {
    carrier: string;
    policyNumber: string;
    expirationDate: string;
    coverageAmount: string;
  };
  contractDetails: {
    type: 'employed' | 'independent' | 'locum_tenens' | 'consulting';
    startDate: string;
    endDate?: string;
    department: string;
    supervisor: string;
  };
}