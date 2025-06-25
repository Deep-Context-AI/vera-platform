import { CommitteeCase, VerificationFlag, MedicalDirectorReview, AuditLogEntry } from '@/types/platform';

const medicalDirectors = [
  { id: 'MD001', name: 'Dr. Patricia Williams' },
  { id: 'MD002', name: 'Dr. Robert Chen' },
  { id: 'MD003', name: 'Dr. Maria Gonzalez' },
  { id: 'MD004', name: 'Dr. James Thompson' },
  { id: 'MD005', name: 'Dr. Sarah Kim' },
  { id: 'MD006', name: 'Dr. Michael Rodriguez' },
];

const examiners = [
  { id: 'EX001', name: 'Jennifer Adams' },
  { id: 'EX002', name: 'Michael Foster' },
  { id: 'EX003', name: 'Lisa Zhang' },
  { id: 'EX004', name: 'David Martinez' },
  { id: 'EX005', name: 'Anna Patel' },
];

const generateAuditTrail = (caseId: string): AuditLogEntry[] => {
  const entries: AuditLogEntry[] = [];
  const baseDate = new Date('2025-01-01');
  
  // Initial submission
  entries.push({
    id: `${caseId}-audit-001`,
    timestamp: new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'VERA-AI',
    userName: 'Vera AI System',
    action: 'Case Created',
    details: 'Provider application completed verification and submitted for committee review',
    ipAddress: '192.168.1.100',
    userAgent: 'Vera AI v2.1'
  });

  // Examiner review
  const examiner = examiners[Math.floor(Math.random() * examiners.length)];
  entries.push({
    id: `${caseId}-audit-002`,
    timestamp: new Date(baseDate.getTime() + Math.random() * 35 * 24 * 60 * 60 * 1000).toISOString(),
    userId: examiner.id,
    userName: examiner.name,
    action: 'Final Review Completed',
    details: 'Completed comprehensive review of all verification documents and background checks',
    fromStatus: 'under_review',
    toStatus: 'ready_for_committee',
    ipAddress: '10.0.0.25',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  // Medical director assignment
  const director = medicalDirectors[Math.floor(Math.random() * medicalDirectors.length)];
  entries.push({
    id: `${caseId}-audit-003`,
    timestamp: new Date(baseDate.getTime() + Math.random() * 36 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'SYSTEM',
    userName: 'System Auto-Assignment',
    action: 'Medical Director Assigned',
    details: `Case assigned to ${director.name} for review`,
    ipAddress: '192.168.1.100',
    userAgent: 'System Process'
  });

  // Add random additional entries for realistic audit trail
  if (Math.random() > 0.3) {
    entries.push({
      id: `${caseId}-audit-004`,
      timestamp: new Date(baseDate.getTime() + Math.random() * 40 * 24 * 60 * 60 * 1000).toISOString(),
      userId: director.id,
      userName: director.name,
      action: 'Document Review',
      details: 'Reviewed malpractice insurance documentation',
      ipAddress: '10.0.0.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
  }

  return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

const generateFlags = (severity: 'none' | 'low' | 'medium' | 'high'): VerificationFlag[] => {
  if (severity === 'none') return [];

  const flagTypes = [
    {
      type: 'malpractice' as const,
      sources: ['NPDB', 'State Medical Board', 'Insurance Company'],
      descriptions: ['Malpractice claim settled', 'Pending malpractice suit', 'Insurance claim reported']
    },
    {
      type: 'sanctions' as const,
      sources: ['OIG LEIE', 'State Exclusion List', 'Medicare'],
      descriptions: ['Previous sanction lifted', 'Monitoring agreement', 'Reprimand on record']
    },
    {
      type: 'license_issue' as const,
      sources: ['State Medical Board', 'DEA', 'Licensing Authority'],
      descriptions: ['License suspension history', 'Probationary period completed', 'Late renewal penalty']
    }
  ];

  const flags: VerificationFlag[] = [];
  const numFlags = severity === 'high' ? 2 : 1;

  for (let i = 0; i < numFlags; i++) {
    const flagType = flagTypes[Math.floor(Math.random() * flagTypes.length)];
    const source = flagType.sources[Math.floor(Math.random() * flagType.sources.length)];
    const description = flagType.descriptions[Math.floor(Math.random() * flagType.descriptions.length)];

    flags.push({
      id: `FLAG-${Math.random().toString(36).substr(2, 9)}`,
      type: flagType.type,
      severity: severity as 'low' | 'medium' | 'high',
      source,
      description,
      details: `Detailed information about ${description.toLowerCase()} found during verification process`,
      discoveredDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'under_review',
      requiresThreeDirectors: severity === 'high'
    });
  }

  return flags;
};

const generateMedicalDirectorReviews = (hasFlags: boolean, requiresThree: boolean): MedicalDirectorReview[] => {
  const reviews: MedicalDirectorReview[] = [];
  const numReviews = requiresThree ? 3 : 1;

  for (let i = 0; i < numReviews; i++) {
    const director = medicalDirectors[i];
    const decisions = hasFlags ? ['approve', 'conditional', 'defer'] : ['approve', 'conditional'];
    const decision = decisions[Math.floor(Math.random() * decisions.length)] as 'approve' | 'reject' | 'conditional' | 'defer';

    reviews.push({
      id: `MDR-${Math.random().toString(36).substr(2, 9)}`,
      directorId: director.id,
      directorName: director.name,
      reviewDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      decision,
      comments: decision === 'conditional' 
        ? 'Approved with conditions requiring additional monitoring'
        : decision === 'defer'
        ? 'Recommend deferring pending additional documentation'
        : 'All requirements met, recommend for approval',
      conditions: decision === 'conditional' 
        ? ['6-month performance review required', 'Peer consultation for complex cases']
        : undefined,
      signature: `${director.name.replace('Dr. ', '')}_${Date.now()}`,
      acknowledged: true
    });
  }

  return reviews;
};

export const generateCommitteeCases = (): CommitteeCase[] => {
  const cases: CommitteeCase[] = [];
  const statuses: CommitteeCase['status'][] = ['ready_for_committee', 'under_committee_review', 'approved', 'conditional'];
  const specialties = [
    'Cardiology', 'Emergency Medicine', 'Internal Medicine', 'Surgery', 'Pediatrics',
    'Orthopedics', 'Neurology', 'Anesthesiology', 'Radiology', 'Pathology'
  ];

  const providers = [
    'Dr. Sarah Johnson, MD', 'Dr. Michael Chen, MD', 'Dr. Elena Rodriguez, NP',
    'Dr. David Thompson, PA-C', 'Dr. Lisa Park, MD', 'Dr. James Wilson, DC',
    'Dr. Maria Garcia, MD', 'Dr. Robert Davis, MD', 'Dr. Amanda Foster, NP',
    'Dr. Christopher Lee, MD', 'Dr. Jennifer Brown, PA-C', 'Dr. Matthew Kim, MD'
  ];

  for (let i = 0; i < 50; i++) {
    const caseId = `CC-${String(i + 1).padStart(4, '0')}`;
    const providerId = `PRV-${String(i + 1).padStart(4, '0')}`;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const examiner = examiners[Math.floor(Math.random() * examiners.length)];
    const medicalDirector = medicalDirectors[Math.floor(Math.random() * medicalDirectors.length)];
    
    // Determine if case has flags (20% chance for high severity requiring 3 directors)
    const flagSeverity = Math.random() < 0.2 ? 'high' : 
                        Math.random() < 0.3 ? 'medium' : 
                        Math.random() < 0.4 ? 'low' : 'none';
    
    const flags = generateFlags(flagSeverity);
    const hasFlags = flags.length > 0;
    const requiresThreeDirectors = flags.some(f => f.requiresThreeDirectors);
    
    const medicalDirectorReviews = generateMedicalDirectorReviews(hasFlags, requiresThreeDirectors);
    const auditTrail = generateAuditTrail(caseId);

    cases.push({
      id: caseId,
      providerId,
      providerName: providers[i % providers.length],
      specialty: specialties[Math.floor(Math.random() * specialties.length)],
      npi: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      status,
      priority: hasFlags ? 'expedited' : Math.random() > 0.8 ? 'urgent' : 'routine',
      submittedToCommittee: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      examinerName: examiner.name,
      examinerId: examiner.id,
      assignedMedicalDirector: medicalDirector.name,
      medicalDirectorId: medicalDirector.id,
      hasFlags,
      flags,
      medicalDirectorReviews,
      auditTrail,
      documentsReviewed: [
        'Application Form', 'CV/Resume', 'Medical License', 'DEA Registration',
        'Board Certification', 'Malpractice Insurance', 'Hospital Privileges'
      ],
      credentialingScore: Math.floor(Math.random() * 30) + 70,
      riskAssessment: hasFlags ? (flagSeverity === 'high' ? 'high' : 'medium') : 'low',
      nextReviewDate: status === 'approved' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      privileges: {
        requested: ['Inpatient Care', 'Outpatient Care', 'Emergency Department'],
        recommended: ['Inpatient Care', 'Outpatient Care'],
        granted: status === 'approved' ? ['Inpatient Care', 'Outpatient Care'] : undefined
      },
      insurance: {
        carrier: 'Medical Protective',
        policyNumber: `MP${Math.floor(Math.random() * 1000000)}`,
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverageAmount: '$2,000,000/$6,000,000'
      },
      contractDetails: {
        type: Math.random() > 0.5 ? 'employed' : 'independent',
        startDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        department: specialties[Math.floor(Math.random() * specialties.length)],
        supervisor: medicalDirectors[Math.floor(Math.random() * medicalDirectors.length)].name
      }
    });
  }

  return cases;
};