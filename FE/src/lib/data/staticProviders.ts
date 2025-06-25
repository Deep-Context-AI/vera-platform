import { Provider } from '@/types/platform';

// Static provider data to avoid hydration mismatches
export const staticProviders: Provider[] = [
  {
    id: 'PROV-001',
    name: 'Dr. Sarah Johnson',
    ssn: '***-**-1234',
    gender: 'Female',
    fieldOfLicense: 'Physician MD',
    specialty: 'Cardiology',
    dueDate: '2024-02-15',
    npi: '1234567890',
    licenseNumber: 'MD12345',
    practiceLocations: [
      {
        id: 'LOC-001',
        facilityName: 'St. Mary\'s Hospital',
        address: '123 Medical Center Dr',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        phone: '(617) 555-0123',
        privilegeStatus: 'active',
        privilegeStartDate: '2020-01-15'
      }
    ],
    allLicenseNumbers: [
      {
        type: 'Medical License',
        number: 'MD12345',
        state: 'MA',
        issueDate: '2018-06-15',
        expirationDate: '2025-06-15',
        status: 'active'
      }
    ],
    incidents: [],
    appointmentType: 'reappointment',
    lastReappointmentDate: '2022-01-15',
    nextReappointmentDue: '2025-01-15',
    status: 'approved',
    priority: 'low',
    submittedDate: '2024-01-10',
    lastActivity: '2024-01-20',
    assignedReviewer: 'Michael Chen',
    completionPercentage: 100,
    documents: {
      total: 12,
      pending: 0,
      verified: 12,
      rejected: 0
    },
    verificationSteps: {
      initial_review: true,
      primary_source: true,
      license_verification: true,
      education_verification: true,
      work_history: true,
      sanctions_check: true,
      malpractice_check: true,
      references_check: true,
      final_review: true,
      committee_approval: true
    },
    estimatedCompletion: '2024-02-01',
    auditTrail: [],
    emailThread: []
  },
  {
    id: 'PROV-002',
    name: 'Dr. Michael Rodriguez',
    ssn: '***-**-5678',
    gender: 'Male',
    fieldOfLicense: 'Physician MD',
    specialty: 'Emergency Medicine',
    dueDate: '2024-03-01',
    npi: '2345678901',
    licenseNumber: 'MD54321',
    practiceLocations: [
      {
        id: 'LOC-002',
        facilityName: 'General Hospital',
        address: '456 Emergency Blvd',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        phone: '(312) 555-0456',
        privilegeStatus: 'active',
        privilegeStartDate: '2019-03-01'
      }
    ],
    allLicenseNumbers: [
      {
        type: 'Medical License',
        number: 'MD54321',
        state: 'IL',
        issueDate: '2017-05-20',
        expirationDate: '2024-05-20',
        status: 'active'
      }
    ],
    incidents: [],
    appointmentType: 'initial',
    status: 'in-review',
    priority: 'medium',
    submittedDate: '2024-01-15',
    lastActivity: '2024-01-25',
    assignedReviewer: 'Sarah Johnson',
    completionPercentage: 75,
    documents: {
      total: 10,
      pending: 2,
      verified: 8,
      rejected: 0
    },
    verificationSteps: {
      initial_review: true,
      primary_source: true,
      license_verification: true,
      education_verification: true,
      work_history: true,
      sanctions_check: true,
      malpractice_check: false,
      references_check: false,
      final_review: false,
      committee_approval: false
    },
    estimatedCompletion: '2024-02-28',
    auditTrail: [],
    emailThread: []
  },
  {
    id: 'PROV-003',
    name: 'Emily Thompson, NP',
    ssn: '***-**-9012',
    gender: 'Female',
    fieldOfLicense: 'Nurse Practitioner NP',
    specialty: 'Family Practice NP',
    dueDate: '2024-01-30',
    npi: '3456789012',
    licenseNumber: 'NP98765',
    practiceLocations: [
      {
        id: 'LOC-003',
        facilityName: 'Community Health Center',
        address: '789 Wellness Way',
        city: 'Denver',
        state: 'CO',
        zipCode: '80202',
        phone: '(303) 555-0789',
        privilegeStatus: 'pending',
        privilegeStartDate: '2024-01-01'
      }
    ],
    allLicenseNumbers: [
      {
        type: 'Nurse Practitioner License',
        number: 'NP98765',
        state: 'CO',
        issueDate: '2020-08-10',
        expirationDate: '2025-08-10',
        status: 'active'
      }
    ],
    incidents: [],
    appointmentType: 'initial',
    status: 'pending',
    priority: 'high',
    submittedDate: '2024-01-05',
    lastActivity: '2024-01-22',
    assignedReviewer: 'David Thompson',
    completionPercentage: 45,
    documents: {
      total: 8,
      pending: 4,
      verified: 4,
      rejected: 0
    },
    verificationSteps: {
      initial_review: true,
      primary_source: true,
      license_verification: true,
      education_verification: false,
      work_history: false,
      sanctions_check: false,
      malpractice_check: false,
      references_check: false,
      final_review: false,
      committee_approval: false
    },
    estimatedCompletion: '2024-02-15',
    auditTrail: [],
    emailThread: []
  },
  {
    id: 'PROV-004',
    name: 'Dr. James Wilson',
    ssn: '***-**-3456',
    gender: 'Male',
    fieldOfLicense: 'Physician MD',
    specialty: 'Orthopedics',
    dueDate: '2024-01-25',
    npi: '4567890123',
    licenseNumber: 'MD11111',
    practiceLocations: [
      {
        id: 'LOC-004',
        facilityName: 'Sports Medicine Institute',
        address: '321 Athletic Dr',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        phone: '(305) 555-0321',
        privilegeStatus: 'active',
        privilegeStartDate: '2018-01-25'
      }
    ],
    allLicenseNumbers: [
      {
        type: 'Medical License',
        number: 'MD11111',
        state: 'FL',
        issueDate: '2016-04-12',
        expirationDate: '2024-04-12',
        status: 'active'
      }
    ],
    incidents: [],
    appointmentType: 'reappointment',
    lastReappointmentDate: '2021-01-25',
    nextReappointmentDue: '2024-01-25',
    status: 'on-hold',
    priority: 'high',
    submittedDate: '2023-12-20',
    lastActivity: '2024-01-18',
    assignedReviewer: 'Lisa Park',
    completionPercentage: 90,
    documents: {
      total: 15,
      pending: 1,
      verified: 13,
      rejected: 1
    },
    verificationSteps: {
      initial_review: true,
      primary_source: true,
      license_verification: true,
      education_verification: true,
      work_history: true,
      sanctions_check: true,
      malpractice_check: true,
      references_check: true,
      final_review: true,
      committee_approval: false
    },
    estimatedCompletion: '2024-02-05',
    notes: 'Pending additional documentation for malpractice claim',
    auditTrail: [],
    emailThread: []
  },
  {
    id: 'PROV-005',
    name: 'Dr. Maria Garcia',
    ssn: '***-**-7890',
    gender: 'Female',
    fieldOfLicense: 'Physician MD',
    specialty: 'Pediatrics',
    dueDate: '2024-03-10',
    npi: '5678901234',
    licenseNumber: 'MD22222',
    practiceLocations: [
      {
        id: 'LOC-005',
        facilityName: 'Children\'s Medical Center',
        address: '654 Pediatric Plaza',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        phone: '(206) 555-0654',
        privilegeStatus: 'active',
        privilegeStartDate: '2019-03-10'
      }
    ],
    allLicenseNumbers: [
      {
        type: 'Medical License',
        number: 'MD22222',
        state: 'WA',
        issueDate: '2017-09-15',
        expirationDate: '2025-09-15',
        status: 'active'
      }
    ],
    incidents: [],
    appointmentType: 'initial',
    status: 'verification-complete',
    priority: 'medium',
    submittedDate: '2024-01-20',
    lastActivity: '2024-01-28',
    assignedReviewer: 'Robert Davis',
    completionPercentage: 95,
    documents: {
      total: 11,
      pending: 1,
      verified: 10,
      rejected: 0
    },
    verificationSteps: {
      initial_review: true,
      primary_source: true,
      license_verification: true,
      education_verification: true,
      work_history: true,
      sanctions_check: true,
      malpractice_check: true,
      references_check: true,
      final_review: true,
      committee_approval: false
    },
    estimatedCompletion: '2024-02-10',
    auditTrail: [],
    emailThread: []
  }
]; 