import { 
  AuditLogEntry, 
  EmailMessage, 
  PracticeLocation, 
  LicenseInfo, 
  IncidentClaim, 
  Provider,
} from '@/types/platform';

export interface ProviderType {
  title: string;
  specialties: string[];
}

export const providerTypes: Record<string, ProviderType> = {
  physician: {
    title: 'MD',
    specialties: [
      'Cardiology', 'Emergency Medicine', 'Internal Medicine', 'Surgery', 'Pediatrics',
      'Orthopedics', 'Radiology', 'Anesthesiology', 'Pathology', 'Psychiatry',
      'Dermatology', 'Neurology', 'Oncology', 'Ophthalmology', 'ENT',
      'Family Medicine', 'Gastroenterology', 'Pulmonology', 'Endocrinology', 'Nephrology'
    ]
  },
  nursePractitioner: {
    title: 'NP',
    specialties: [
      'Family Practice NP', 'Adult-Gerontology NP', 'Pediatric NP', 'Women\'s Health NP',
      'Psychiatric Mental Health NP', 'Acute Care NP', 'Emergency NP', 'Oncology NP',
      'Cardiology NP', 'Orthopedic NP', 'Dermatology NP', 'Pain Management NP'
    ]
  },
  physicianAssistant: {
    title: 'PA-C',
    specialties: [
      'Emergency Medicine PA', 'Surgery PA', 'Family Medicine PA', 'Internal Medicine PA',
      'Orthopedics PA', 'Cardiology PA', 'Dermatology PA', 'Psychiatry PA',
      'Pediatrics PA', 'Urgent Care PA', 'Critical Care PA', 'Neurosurgery PA'
    ]
  },
  chiropractor: {
    title: 'DC',
    specialties: [
      'General Chiropractic', 'Sports Chiropractic', 'Pediatric Chiropractic',
      'Geriatric Chiropractic', 'Neurology Chiropractic', 'Rehabilitation Chiropractic',
      'Occupational Health Chiropractic', 'Wellness & Nutrition Chiropractic'
    ]
  }
};
export const generateMockProviders = (): Provider[] => {
  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
  
  // Combine all specialties from all provider types
  // const allSpecialties = Object.values(providerTypes).flatMap(type => type.specialties);
  const providerTypeKeys = Object.keys(providerTypes);

  const statuses: Provider['status'][] = [
    'pending', 'in-review', 'verification-complete', 'approved', 'rejected', 'on-hold'
  ];

  const priorities: Provider['priority'][] = ['high', 'medium', 'low'];

  const reviewers = [
    'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Thompson',
    'Lisa Park', 'James Wilson', 'Maria Garcia', 'Robert Davis'
  ];

  const firstNames = [
    // More diverse names
    'John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'James', 'Maria',
    'Robert', 'Jennifer', 'William', 'Jessica', 'Christopher', 'Amanda', 'Daniel',
    'Ashley', 'Matthew', 'Stephanie', 'Anthony', 'Melissa', 'Mark', 'Nicole',
    'Steven', 'Elizabeth', 'Paul', 'Helen', 'Andrew', 'Sharon', 'Joshua', 'Donna',
    'Carlos', 'Ana', 'Wei', 'Priya', 'Omar', 'Fatima', 'Yuki', 'Pierre', 'Olivia',
    'Hassan', 'Elena', 'Raj', 'Amara', 'Chen', 'Aaliyah', 'Diego', 'Zara', 'Kai',
    'Sophia', 'Arjun', 'Isabella', 'Mohammed', 'Grace', 'Luca', 'Naia', 'Andre'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Chen', 'Patel', 'Kumar', 'Singh', 'Ahmed', 'Ali', 'Hassan', 'Kim', 'Park',
    'Nguyen', 'Tran', 'Yamamoto', 'Tanaka', 'Müller', 'Schmidt', 'Andersson', 'Silva',
    'Santos', 'Rossi', 'Ferrari', 'Kowalski', 'Novak', 'Petrov', 'Okafor', 'Adebayo'
  ];

  const getRandomDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString().split('T')[0];
  };

  const getRandomTime = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysFromNow));
    return date.toISOString().split('T')[0];
  };

  const getDueDate = (status: Provider['status']) => {
    const date = new Date();
    if (status === 'approved' || status === 'rejected') {
      // Past due date for completed items
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    } else {
      // Future due date for pending items (1-30 days from now)
      date.setDate(date.getDate() + Math.floor(Math.random() * 30) + 1);
    }
    return date.toISOString().split('T')[0];
  };

const generatePhoneCallAudit = (providerId: string, institution: string): AuditLogEntry => {
  const callTranscripts = [
    "Hello, this is Vera calling from Healthcare Verification Services. I'm following up on our verification request for Dr. [Provider Name]. Could you please confirm the status of our request? ... Yes, I understand you need additional documentation. Could you specify what exactly is needed? ... Perfect, I'll have that sent over within the next hour. Thank you for your assistance.",
    "Good morning, I'm calling to verify the education credentials for one of our providers. We submitted a request last week but haven't received a response yet. ... I see, the system was down. When do you expect to have the verification completed? ... Excellent, I'll make a note that we should expect the response by Friday. Is there anything else you need from us?",
    "Hi, this is Vera with Healthcare Verification. I'm calling about the hospital privileges verification for Dr. [Provider Name]. We received your email but some of the attachments were corrupted. ... Yes, I can confirm our email address is vera@healthcareverification.com. Would you be able to resend those documents? ... Great, I'll watch for them this afternoon."
  ];
  
  return {
    id: `${providerId}-call-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'VERA-AI',
    userName: 'Vera AI System',
    action: `Phone Call to ${institution}`,
    details: `Outbound verification call to follow up on pending verification request. Call duration: ${Math.floor(Math.random() * 8) + 3} minutes.`,
    category: 'communication',
    subcategory: 'phone_call',
    callRecording: {
      duration: `${Math.floor(Math.random() * 8) + 3}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      transcript: callTranscripts[Math.floor(Math.random() * callTranscripts.length)],
      audioFile: `call_recording_${providerId}_${Date.now()}.mp3`
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Vera AI v2.1'
  };
};

const generateAuditTrail = (providerId: string, status: Provider['status'], submittedDate: string, appointmentType: 'initial' | 'reappointment'): AuditLogEntry[] => {
  const entries: AuditLogEntry[] = [];
  const baseDate = new Date(submittedDate);
  let currentDate = new Date(baseDate);

  // Application received
  entries.push({
    id: `${providerId}-audit-001`,
    timestamp: currentDate.toISOString(),
    userId: 'SYSTEM',
    userName: 'Application Portal',
    action: appointmentType === 'initial' ? 'Initial Application Received' : 'Reappointment Application Received',
    details: appointmentType === 'initial' 
      ? 'Initial provider application submitted through online portal. Initial completeness check passed.'
      : 'Reappointment application submitted for existing provider. Previous appointment expires in 90 days.',
    category: 'system',
    subcategory: 'application_submission',
    ipAddress: '203.0.113.45',
    userAgent: 'Portal System v3.2'
  });

  // Vera takes over
  currentDate = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
  entries.push({
    id: `${providerId}-audit-002`,
    timestamp: currentDate.toISOString(),
    userId: 'VERA-AI',
    userName: 'Vera AI System',
    action: 'Case Assignment',
    details: 'Provider application assigned to Vera AI for automated verification processing. Initial document scan completed.',
    category: 'system',
    subcategory: 'case_assignment',
    ipAddress: '192.168.1.100',
    userAgent: 'Vera AI v2.1'
  });

  // Document analysis
  currentDate = new Date(currentDate.getTime() + 30 * 60 * 1000); // 30 minutes later
  entries.push({
    id: `${providerId}-audit-003`,
    timestamp: currentDate.toISOString(),
    userId: 'VERA-AI',
    userName: 'Vera AI System',
    action: 'Document Analysis Complete',
    details: 'OCR processing and data extraction completed. 12 documents processed, 11 successfully parsed, 1 requiring manual review.',
    category: 'document',
    subcategory: 'analysis',
    attachments: ['document_analysis_report.pdf'],
    ipAddress: '192.168.1.100',
    userAgent: 'Vera AI v2.1'
  });

  // Primary source verifications start
  const verificationSteps = [
    { name: 'NPDB Verification', delay: 1, duration: 2 },
    { name: 'Medical License Verification', delay: 1, duration: 3 },
    { name: 'DEA Registration Check', delay: 2, duration: 1 },
    { name: 'Education Verification', delay: 24, duration: 72 }, // 1-3 days
    { name: 'Hospital Privileges Verification', delay: 48, duration: 24 },
    { name: 'Malpractice Insurance Verification', delay: 2, duration: 4 }
  ];

  let entryId = 4;
  verificationSteps.forEach(step => {
    // Start verification
    currentDate = new Date(currentDate.getTime() + step.delay * 60 * 60 * 1000);
    entries.push({
      id: `${providerId}-audit-${String(entryId).padStart(3, '0')}`,
      timestamp: currentDate.toISOString(),
      userId: 'VERA-AI',
      userName: 'Vera AI System',
      action: `${step.name} Initiated`,
      details: `Automated verification request sent to primary source. Request ID: ${Math.random().toString(36).substr(2, 9)}`,
      category: 'verification',
      subcategory: step.name.toLowerCase().replace(/\s+/g, '_'),
      ipAddress: '192.168.1.100',
      userAgent: 'Vera AI v2.1'
    });
    entryId++;

    // Add communication details for education verification
    if (step.name === 'Education Verification') {
      currentDate = new Date(currentDate.getTime() + 30 * 60 * 1000);
      entries.push({
        id: `${providerId}-audit-${String(entryId).padStart(3, '0')}`,
        timestamp: currentDate.toISOString(),
        userId: 'VERA-AI',
        userName: 'Vera AI System',
        action: 'Education Verification Email Sent',
        details: 'Email sent to University of California Medical School Registrar. Request for degree verification and transcript validation.',
        category: 'communication',
        subcategory: 'email_outbound',
        attachments: ['education_verification_request.pdf'],
        followUpRequired: true,
        ipAddress: '192.168.1.100',
        userAgent: 'Vera AI v2.1'
      });
      entryId++;

      // Follow-up call
      currentDate = new Date(currentDate.getTime() + 48 * 60 * 60 * 1000);
      entries.push({
        id: `${providerId}-audit-${String(entryId).padStart(3, '0')}`,
        timestamp: currentDate.toISOString(),
        userId: 'VERA-AI',
        userName: 'Vera AI System',
        action: 'Follow-up Call Completed',
        details: 'Phone call to UC Medical School Registrar (555-123-4567). Spoke with Janet Smith, confirmed receipt of verification request. Expected response within 3-5 business days.',
        category: 'communication',
        subcategory: 'phone_call',
        attachments: ['call_transcript_20250115.txt'],
        ipAddress: '192.168.1.100',
        userAgent: 'Vera AI v2.1'
      });
      entryId++;
    }

    // Complete verification
    currentDate = new Date(currentDate.getTime() + step.duration * 60 * 60 * 1000);
    entries.push({
      id: `${providerId}-audit-${String(entryId).padStart(3, '0')}`,
      timestamp: currentDate.toISOString(),
      userId: 'VERA-AI',
      userName: 'Vera AI System',
      action: `${step.name} Completed`,
      details: `Verification completed successfully. Results: No adverse findings. Documentation received and validated.`,
      category: 'verification',
      subcategory: step.name.toLowerCase().replace(/\s+/g, '_'),
      attachments: [`${step.name.toLowerCase().replace(/\s+/g, '_')}_verification.pdf`],
      ipAddress: '192.168.1.100',
      userAgent: 'Vera AI v2.1'
    });
    entryId++;
  });

  // Add some phone call entries
  if (Math.random() > 0.3) {
    currentDate = new Date(currentDate.getTime() + 36 * 60 * 60 * 1000);
    entries.push(generatePhoneCallAudit(providerId, 'UC Medical School'));
    entryId++;
  }

  if (Math.random() > 0.6) {
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    entries.push(generatePhoneCallAudit(providerId, 'Stanford Medical Center'));
    entryId++;
  }

  // If status is approved or verification-complete, add final review
  if (status === 'approved' || status === 'verification-complete') {
    currentDate = new Date(currentDate.getTime() + 4 * 60 * 60 * 1000);
    entries.push({
      id: `${providerId}-audit-${String(entryId).padStart(3, '0')}`,
      timestamp: currentDate.toISOString(),
      userId: 'EX002',
      userName: 'Michael Foster',
      action: 'Final Review Completed',
      details: 'Comprehensive review of all verification results completed. All requirements met, no red flags identified.',
      category: 'review',
      subcategory: 'final_review',
      ipAddress: '10.0.0.25',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
  }

  return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

const generatePracticeLocations = (): PracticeLocation[] => {
  const facilities = [
    { name: 'Stanford Medical Center', city: 'Stanford', state: 'CA' },
    { name: 'UCSF Medical Center', city: 'San Francisco', state: 'CA' },
    { name: 'Cedars-Sinai Medical Center', city: 'Los Angeles', state: 'CA' },
    { name: 'Kaiser Permanente', city: 'Oakland', state: 'CA' },
    { name: 'Sutter Health', city: 'Sacramento', state: 'CA' },
    { name: 'UCLA Medical Center', city: 'Los Angeles', state: 'CA' }
  ];
  
  const departments = ['Emergency Medicine', 'Internal Medicine', 'Surgery', 'Cardiology', 'Orthopedics'];
  const numLocations = Math.floor(Math.random() * 3) + 1; // 1-3 locations
  
  return Array.from({ length: numLocations }, () => {
    const facility = facilities[Math.floor(Math.random() * facilities.length)];
    return {
      id: `loc-${Math.random().toString(36).substr(2, 9)}`,
      facilityName: facility.name,
      address: `${Math.floor(Math.random() * 9000) + 1000} ${['Medical Center Dr', 'Hospital Way', 'Health Plaza', 'Care Blvd'][Math.floor(Math.random() * 4)]}`,
      city: facility.city,
      state: facility.state,
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      privilegeStatus: Math.random() > 0.1 ? 'active' : 'pending',
      privilegeStartDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      privilegeEndDate: new Date(Date.now() + (365 + Math.random() * 730) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  });
};

const generateLicenseNumbers = (providerType: string): LicenseInfo[] => {
  const licenses: LicenseInfo[] = [];
  
  // Primary license
  const primaryStates = ['CA', 'NY', 'TX', 'FL', 'IL'];
  const primaryState = primaryStates[Math.floor(Math.random() * primaryStates.length)];
  
  licenses.push({
    type: providerType === 'physician' ? 'Medical License' : 
          providerType === 'nursePractitioner' ? 'Nursing License' :
          providerType === 'physicianAssistant' ? 'PA License' : 'Chiropractic License',
    number: `${primaryState}${Math.floor(Math.random() * 900000) + 100000}`,
    state: primaryState,
    issueDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + Math.random() * 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active'
  });
  
  // Additional licenses (sometimes)
  if (Math.random() > 0.6) {
    const secondaryState = primaryStates.filter(s => s !== primaryState)[Math.floor(Math.random() * 4)];
    licenses.push({
      type: providerType === 'physician' ? 'Medical License' : 
            providerType === 'nursePractitioner' ? 'Nursing License' :
            providerType === 'physicianAssistant' ? 'PA License' : 'Chiropractic License',
      number: `${secondaryState}${Math.floor(Math.random() * 900000) + 100000}`,
      state: secondaryState,
      issueDate: new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    });
  }
  
  // DEA License (if applicable)
  if (providerType === 'physician' || providerType === 'nursePractitioner') {
    licenses.push({
      type: 'DEA Registration',
      number: `${['A', 'B', 'M'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 9000000) + 1000000}`,
      state: primaryState,
      issueDate: new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + Math.random() * 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    });
  }
  
  return licenses;
};

const generateIncidents = (): IncidentClaim[] => {
  // 85% chance of no incidents
  if (Math.random() < 0.85) {
    return [];
  }
  
  const incidentTypes = [
    {
      type: 'malpractice' as const,
      descriptions: [
        'Malpractice claim regarding delayed diagnosis - case settled out of court',
        'Professional liability claim for surgical complication - resolved with no admission of fault',
        'Malpractice suit alleging medication error - case dismissed'
      ]
    },
    {
      type: 'disciplinary' as const,
      descriptions: [
        'State medical board reprimand for incomplete documentation - corrective action completed',
        'Peer review action for attendance issues - successfully completed monitoring program',
        'Hospital disciplinary action for policy violation - completed additional training'
      ]
    }
  ];
  
  const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
  const description = incidentType.descriptions[Math.floor(Math.random() * incidentType.descriptions.length)];
  
  return [{
    id: `incident-${Math.random().toString(36).substr(2, 9)}`,
    type: incidentType.type,
    description,
    date: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: Math.random() > 0.2 ? 'resolved' : 'ongoing',
    amount: incidentType.type === 'malpractice' ? `$${Math.floor(Math.random() * 500000) + 50000}` : undefined,
    documents: [
      'incident_report.pdf',
      'resolution_documentation.pdf',
      'provider_explanation.pdf'
    ],
    explanation: 'Detailed explanation and corrective measures have been documented and reviewed by the medical director.'
  }];
};



const generateEmailThread = (providerId: string): EmailMessage[] => {
  return [
    {
      id: `${providerId}-email-001`,
      timestamp: '2025-01-11T09:15:00Z',
      from: 'vera@healthcareverification.com',
      to: 'registrar@ucmedschool.edu',
      subject: 'Education Verification Request - Dr. Sarah Johnson',
      body: 'Dear Registrar,\n\nWe are requesting verification of education credentials for Dr. Sarah Johnson (DOB: 03/15/1985). Please confirm:\n\n1. Degree earned: Doctor of Medicine\n2. Graduation date: May 2018\n3. Academic standing: Good standing\n\nPlease respond within 5 business days.\n\nBest regards,\nVera AI Verification System',
      type: 'outbound',
      status: 'sent',
      priority: 'medium',
      category: 'education_verification',
      attachments: ['verification_request_form.pdf'],
      responseRequired: true
    },
    {
      id: `${providerId}-email-002`,
      timestamp: '2025-01-13T14:30:00Z',
      from: 'registrar@ucmedschool.edu',
      to: 'vera@healthcareverification.com',
      subject: 'RE: Education Verification Request - Dr. Sarah Johnson',
      body: 'Dear Vera Team,\n\nWe confirm the following for Dr. Sarah Johnson:\n\n1. Degree: Doctor of Medicine - CONFIRMED\n2. Graduation: May 15, 2018 - CONFIRMED\n3. Academic Standing: Graduated in good standing - CONFIRMED\n\nOfficial transcript attached.\n\nBest regards,\nJanet Smith\nRegistrar Office',
      type: 'inbound',
      status: 'received',
      priority: 'medium',
      category: 'education_verification',
      attachments: ['official_transcript.pdf', 'degree_verification.pdf'],
      responseRequired: false,
      isVerificationResponse: true
    },
    {
      id: `${providerId}-email-003`,
      timestamp: '2025-01-12T11:45:00Z',
      from: 'vera@healthcareverification.com',
      to: 'privileges@stanfordmed.org',
      subject: 'Hospital Privileges Verification - Dr. Sarah Johnson',
      body: 'Dear Privileges Office,\n\nPlease verify current hospital privileges for Dr. Sarah Johnson (NPI: 1234567890):\n\n1. Current privilege status\n2. Effective dates\n3. Any restrictions or limitations\n4. Department affiliation\n\nThank you for your prompt response.\n\nVera AI System',
      type: 'outbound',
      status: 'sent',
      priority: 'medium',
      category: 'privileges_verification',
      responseRequired: true
    },
    {
      id: `${providerId}-email-004`,
      timestamp: '2025-01-14T10:20:00Z',
      from: 'privileges@stanfordmed.org',
      to: 'vera@healthcareverification.com',
      subject: 'RE: Hospital Privileges Verification - Dr. Sarah Johnson',
      body: 'Dear Vera,\n\nDr. Sarah Johnson privileges verified:\n\n1. Status: Active\n2. Effective: 01/01/2023 - 12/31/2025\n3. Restrictions: None\n4. Department: Internal Medicine\n\nPrivileges in good standing.\n\nMedical Staff Office\nStanford Medical Center',
      type: 'inbound',
      status: 'received',
      priority: 'medium',
      category: 'privileges_verification',
      isVerificationResponse: true
    },
    {
      id: `${providerId}-email-005`,
      timestamp: '2025-01-15T16:00:00Z',
      from: 'alerts@medboard.ca.gov',
      to: 'vera@healthcareverification.com',
      subject: 'License Status Alert - Dr. Sarah Johnson',
      body: 'AUTOMATED ALERT: License renewal approaching for Dr. Sarah Johnson (License #MD123456). Current expiration: 06/30/2026. No action required at this time.',
      type: 'inbound',
      status: 'received',
      priority: 'low',
      category: 'license_alert',
      isSystemGenerated: true
    }
  ];
};
  return Array.from({ length: 100 }, (_, index) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    
    // Randomly select a provider type and specialty
    const providerTypeKey = providerTypeKeys[Math.floor(Math.random() * providerTypeKeys.length)];
    const providerType = providerTypes[providerTypeKey];
    const specialty = providerType.specialties[Math.floor(Math.random() * providerType.specialties.length)];
    
    // Determine appointment type (70% initial, 30% reappointment)
    const appointmentType = Math.random() < 0.7 ? 'initial' : 'reappointment';
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    // Assign to Vera for in-progress items, human reviewer for completed items
    const reviewer = (status === 'verification-complete') 
      ? reviewers[Math.floor(Math.random() * reviewers.length)]
      : 'Vera';
    
    const totalDocs = Math.floor(Math.random() * 20) + 5;
    const verifiedDocs = Math.floor(Math.random() * totalDocs);
    const rejectedDocs = Math.floor(Math.random() * (totalDocs - verifiedDocs));
    const pendingDocs = totalDocs - verifiedDocs - rejectedDocs;

    const completionPercentage = status === 'approved' ? 100 :
      status === 'rejected' ? 0 :
      Math.floor(Math.random() * 95) + 5;

    const providerId = `PRV-${String(index + 1).padStart(4, '0')}`;
    const submittedDate = getRandomDate(appointmentType === 'reappointment' ? 60 : 30);

    const verificationSteps = {
      initial_review: completionPercentage > 10,
      primary_source: completionPercentage > 20,
      license_verification: completionPercentage > 30,
      education_verification: completionPercentage > 40,
      work_history: completionPercentage > 50,
      sanctions_check: completionPercentage > 60,
      malpractice_check: completionPercentage > 70,
      references_check: completionPercentage > 80,
      final_review: completionPercentage > 90,
      committee_approval: completionPercentage > 95,
    };

    const practiceLocations = generatePracticeLocations();
    const allLicenseNumbers = generateLicenseNumbers(providerTypeKey);
    const incidents = generateIncidents();
    const auditTrail = generateAuditTrail(providerId, status, submittedDate, appointmentType);
    const emailThread = generateEmailThread(providerId);
    
    // Generate reappointment dates if applicable
    const lastReappointmentDate = appointmentType === 'reappointment' 
      ? new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;
    const nextReappointmentDue = status === 'approved'
      ? new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;

    return {
      id: providerId,
      name: `${firstName} ${lastName}, ${providerType.title}`,
      ssn: `***-**-${Math.floor(Math.random() * 9000) + 1000}`, // Masked for security
      gender: gender as Provider['gender'],
      fieldOfLicense: providerTypeKey === 'physician' ? 'Physician MD' :
                     providerTypeKey === 'nursePractitioner' ? 'Nurse Practitioner NP' :
                     providerTypeKey === 'physicianAssistant' ? 'Physician Assistant PA' :
                     'Doctor of Chiropractic DC',
      specialty,
      practiceLocations,
      allLicenseNumbers,
      incidents,
      appointmentType,
      lastReappointmentDate,
      nextReappointmentDue,
      dueDate: getDueDate(status),
      npi: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      licenseNumber: `MD${Math.floor(Math.random() * 900000) + 100000}`,
      status,
      priority,
      submittedDate,
      lastActivity: getRandomDate(7),
      assignedReviewer: reviewer,
      completionPercentage,
      documents: {
        total: totalDocs,
        pending: pendingDocs,
        verified: verifiedDocs,
        rejected: rejectedDocs,
      },
      verificationSteps,
      estimatedCompletion: getRandomTime(21),
      notes: Math.random() > 0.7 ? 'Requires additional documentation' : undefined,
      auditTrail,
      emailThread,
    };
  });
};