export interface Provider {
  id: string;
  name: string;
  specialty: string;
  npi: string;
  email: string;
  phone: string;
  status: 'active' | 'pending' | 'suspended' | 'expired' | 'provisional';
  assignedExaminer: string;
  dueDate: string;
  createdAt: string;
  completedSteps: number;
  totalSteps: number;
}

export interface VerificationStep {
  id: string;
  providerId: string;
  stepNumber: number;
  name: string;
  status: 'not-started' | 'in-progress' | 'pending-review' | 'completed' | 'rejected' | 'overdue';
  assignedTo: string;
  dueDate: string;
  lastUpdated: string;
  documents: Document[];
  comments: Comment[];
  metadata: Record<string, any>;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  author: string;
  createdAt: string;
  resolved: boolean;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  mentions: string[];
  attachments: string[];
  resolved: boolean;
  replies: Comment[];
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  providerId?: string;
  stepId?: string;
  changes?: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'examiner' | 'manager' | 'auditor' | 'admin';
  avatar: string;
  isOnline: boolean;
}

export const VERIFICATION_STEPS = [
  'Application Review',
  'NPI',
  'NPDB',
  'CA License',
  'DEA License',
  'ABMS',
  'SanctionCheck',
  'LADMF',
  'Medical Enrollment',
  'Medicare Enrollment',
  'Hospital Privileges',
  'Final Decision'
] as const;