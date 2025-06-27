import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText,
  Eye
} from 'lucide-react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get verification status badge color
export const getVerificationStatusColor = (status: string) => {
  switch (status) {
    case 'VERIFIED':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
    case 'NPI_MISSING':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
    case 'NPI_INACTIVE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
    case 'UNDER_REVIEW':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
  }
};

// Get verification status icon
export const getVerificationStatusIcon = (status: string) => {
  switch (status) {
    case 'VERIFIED':
      return Shield;
    case 'NPI_MISSING':
      return AlertTriangle;
    case 'NPI_INACTIVE':
      return AlertCircle;
    case 'APPROVED':
      return CheckCircle;
    case 'UNDER_REVIEW':
      return Clock;
    default:
      return FileText;
  }
};

// Get application status color (similar to verification but for general application status)
export const getApplicationStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'verified':
    case 'approved':
      return 'text-green-600 bg-green-100 border-green-200';
    case 'pending':
    case 'submitted':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'under_review':
      return 'text-blue-600 bg-blue-100 border-blue-200';
    case 'rejected':
      return 'text-red-600 bg-red-100 border-red-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

// Get application status icon
export const getApplicationStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'verified':
    case 'approved':
      return CheckCircle;
    case 'pending':
    case 'submitted':
      return Clock;
    case 'under_review':
      return Eye;
    case 'rejected':
      return AlertTriangle;
    default:
      return AlertCircle;
  }
};
