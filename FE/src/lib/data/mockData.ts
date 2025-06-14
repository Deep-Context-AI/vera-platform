import { format, addMonths } from 'date-fns';

export interface ActivityLogEntry {
  id: string;
  date: string;
  type: 'call' | 'email' | 'document';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  details?: {
    transcript?: string;
    emailContent?: string;
    response?: string;
    attachments?: string[];
  };
}

export interface Verification {
  id: string;
  type: string;
  description: string;
  status: 'verified' | 'pending' | 'expired';
  verifiedDate?: string;
  expirationDate?: string;
  results?: string;
  documentUrl?: string;
  activityLog?: ActivityLogEntry[];
}

export interface Practitioner {
  id: string;
  name: string;
  startDate: string;
  title: string;
  specialty: string;
  image: string;
  status: 'verified' | 'pending' | 'expired';
  verifications: Verification[];
  personalInfo: {
    email: string;
    phone: string;
    address: string;
    npi: string;
    dob: string;
  };
}

// Generate dates
const today = new Date();
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
const oneYearLater = addMonths(today, 12);
const twoYearsLater = addMonths(today, 24);
const threeYearsLater = addMonths(today, 36);
const lastMonth = addMonths(today, -1);

// Sample activity logs for education verification
const generateEducationActivityLog = (school: string, completed: boolean = true): ActivityLogEntry[] => [
  {
    id: `act-call-${Math.random()}`,
    date: format(addMonths(today, -1), 'yyyy-MM-dd HH:mm:ss'),
    type: 'call' as const,
    status: 'completed' as const,
    description: `Initial call to ${school} registrar`,
    details: {
      transcript: `Examiner: Hello, I'm calling to verify a medical degree.
Registrar: Yes, I can help with that. What information do you need?
Examiner: I need to verify graduation and degree information.
Registrar: I'll be happy to help with that verification.`
    }
  },
  {
    id: `act-email-${Math.random()}`,
    date: format(addMonths(today, -1), 'yyyy-MM-dd HH:mm:ss'),
    type: 'email' as const,
    status: completed ? ('completed' as const) : ('pending' as const),
    description: 'Documentation request sent',
    details: {
      emailContent: `Following our phone conversation, I am writing to request official documentation of the medical degree from ${school}. Please provide transcripts and graduation verification.`,
      attachments: ['verification_request_form.pdf']
    }
  },
  {
    id: `act-doc-${Math.random()}`,
    date: format(addMonths(today, -0.5), 'yyyy-MM-dd HH:mm:ss'),
    type: 'document' as const,
    status: completed ? ('completed' as const) : ('pending' as const),
    description: completed ? 'Received verification documents' : 'Awaiting documentation',
    details: completed ? {
      response: `Official transcript and degree verification received from ${school}`
    } : {
      response: 'Pending response from institution'
    }
  }
];

// Verification types with descriptions
const verificationTypes = [
  {
    id: 'npdb',
    type: 'NPDB',
    description: 'National Practitioner Data Bank - malpractice & disciplinary history'
  },
  {
    id: 'medical-board',
    type: 'California Medical Board License',
    description: 'State medical license verification'
  },
  {
    id: 'dea',
    type: 'DEA Registration',
    description: 'Drug Enforcement Administration registration'
  },
  {
    id: 'npi',
    type: 'NPI (NPPES)',
    description: 'National Provider Identifier registry verification'
  },
  {
    id: 'oig',
    type: 'OIG LEIE Exclusions',
    description: 'Office of Inspector General List of Excluded Individuals/Entities'
  },
  {
    id: 'suspended',
    type: 'Suspended & Ineligible List',
    description: 'Medi-Cal Suspended & Ineligible Provider List'
  },
  {
    id: 'medicare',
    type: 'Medicare / Medicaid Enrollment',
    description: 'Verification of enrollment in Medicare and Medicaid programs'
  },
  {
    id: 'death-master',
    type: 'LADMF (SSA Death Master)',
    description: 'Limited Access Death Master File verification'
  },
  {
    id: 'board-cert',
    type: 'Board Certification / Education',
    description: 'Verification of medical education and board certifications',
    activityLog: generateEducationActivityLog('Stanford Medical School')
  },
  {
    id: 'hospital',
    type: 'Hospital Privileges',
    description: 'Verification of hospital affiliations and privileges'
  }
];

// Create mock practitioners
export const practitioners: Practitioner[] = [
  {
    id: '1',
    name: 'Dr. Olivia Bennett',
    title: 'MD',
    startDate: '2023-01-15',
    specialty: 'Internal Medicine',
    image: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    status: 'verified',
    personalInfo: {
      email: 'olivia.bennett@example.com',
      phone: '(555) 123-4567',
      address: '123 Medical Center Dr, San Francisco, CA 94143',
      npi: '1234567890',
      dob: '1980-05-15'
    },
    verifications: verificationTypes.map(vt => ({
      id: `${vt.id}-1`,
      type: vt.type,
      description: vt.description,
      status: 'verified',
      verifiedDate: formatDate(today),
      expirationDate: formatDate(twoYearsLater),
      results: 'No adverse findings',
      documentUrl: `/documents/${vt.id}-verification.pdf`,
      activityLog: vt.id === 'board-cert' ? generateEducationActivityLog('Stanford Medical School') : undefined
    }))
  },
  {
    id: '2',
    name: 'Dr. James Rodriguez',
    title: 'MD',
    startDate: '2023-03-22',
    specialty: 'Cardiology',
    image: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    status: 'pending',
    personalInfo: {
      email: 'james.rodriguez@example.com',
      phone: '(555) 234-5678',
      address: '456 Cardiology Blvd, San Francisco, CA 94107',
      npi: '2345678901',
      dob: '1975-08-23'
    },
    verifications: verificationTypes.map((vt, index) => ({
      id: `${vt.id}-2`,
      type: vt.type,
      description: vt.description,
      status: index < 6 ? 'verified' : 'pending',
      verifiedDate: index < 6 ? formatDate(today) : undefined,
      expirationDate: index < 6 ? formatDate(twoYearsLater) : undefined,
      results: index < 6 ? 'No adverse findings' : undefined,
      documentUrl: index < 6 ? `/documents/${vt.id}-verification.pdf` : undefined,
      activityLog: vt.id === 'board-cert' ? generateEducationActivityLog('Harvard Medical School', false) : undefined
    }))
  },
  {
    id: '3',
    name: 'Dr. Sarah Johnson',
    title: 'MD',
    startDate: '2023-06-10',
    specialty: 'Pediatrics',
    image: 'https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    status: 'expired',
    personalInfo: {
      email: 'sarah.johnson@example.com',
      phone: '(555) 345-6789',
      address: "789 Children's Way, San Francisco, CA 94158",
      npi: '3456789012',
      dob: '1982-03-10'
    },
    verifications: verificationTypes.map((vt, index) => ({
      id: `${vt.id}-3`,
      type: vt.type,
      description: vt.description,
      status: index === 1 ? 'expired' : 'verified',
      verifiedDate: formatDate(index === 1 ? lastMonth : today),
      expirationDate: formatDate(index === 1 ? lastMonth : threeYearsLater),
      results: 'No adverse findings',
      documentUrl: `/documents/${vt.id}-verification.pdf`,
      activityLog: vt.id === 'board-cert' ? generateEducationActivityLog('Johns Hopkins School of Medicine') : undefined
    }))
  },
  {
    id: '4',
    name: 'Dr. Michael Chen',
    title: 'MD',
    startDate: '2023-08-05',
    specialty: 'Neurology',
    image: 'https://images.pexels.com/photos/6749773/pexels-photo-6749773.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    status: 'verified',
    personalInfo: {
      email: 'michael.chen@example.com',
      phone: '(555) 456-7890',
      address: '101 Brain Science Ave, San Francisco, CA 94115',
      npi: '4567890123',
      dob: '1977-11-30'
    },
    verifications: verificationTypes.map(vt => ({
      id: `${vt.id}-4`,
      type: vt.type,
      description: vt.description,
      status: 'verified',
      verifiedDate: formatDate(today),
      expirationDate: formatDate(oneYearLater),
      results: 'No adverse findings',
      documentUrl: `/documents/${vt.id}-verification.pdf`,
      activityLog: vt.id === 'board-cert' ? generateEducationActivityLog('Yale School of Medicine') : undefined
    }))
  },
  {
    id: '5',
    name: 'Dr. Emma Patel',
    title: 'MD',
    startDate: '2023-11-30',
    specialty: 'Dermatology',
    image: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    status: 'pending',
    personalInfo: {
      email: 'emma.patel@example.com',
      phone: '(555) 567-8901',
      address: '202 Skin Health Road, San Francisco, CA 94118',
      npi: '5678901234',
      dob: '1983-07-19'
    },
    verifications: verificationTypes.map((vt, index) => ({
      id: `${vt.id}-5`,
      type: vt.type,
      description: vt.description,
      status: index < 3 ? 'verified' : 'pending',
      verifiedDate: index < 3 ? formatDate(today) : undefined,
      expirationDate: index < 3 ? formatDate(threeYearsLater) : undefined,
      results: index < 3 ? 'No adverse findings' : undefined,
      documentUrl: index < 3 ? `/documents/${vt.id}-verification.pdf` : undefined,
      activityLog: vt.id === 'board-cert' ? generateEducationActivityLog('UCSF School of Medicine', false) : undefined
    }))
  },
];

export const getPractitionerById = (id: string): Practitioner | undefined => {
  return practitioners.find(p => p.id === id);
};