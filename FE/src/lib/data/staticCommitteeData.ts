import { CommitteeCase } from '@/types/platform';

export const staticCommitteeCases: CommitteeCase[] = [
  {
    id: 'CC-0001',
    providerId: 'PRV-0001',
    providerName: 'Dr. Sarah Johnson, MD',
    specialty: 'Cardiology',
    npi: '1234567890',
    status: 'ready_for_committee',
    priority: 'routine',
    submittedToCommittee: '2025-01-15',
    examinerName: 'Jennifer Adams',
    examinerId: 'EX001',
    assignedMedicalDirector: 'Dr. Patricia Williams',
    medicalDirectorId: 'MD001',
    hasFlags: false,
    flags: [],
    medicalDirectorReviews: [
      {
        id: 'MDR-001',
        directorId: 'MD001',
        directorName: 'Dr. Patricia Williams',
        reviewDate: '2025-01-14',
        decision: 'approve',
        comments: 'All requirements met, recommend for approval',
        signature: 'Patricia_Williams_1737844800',
        acknowledged: true
      }
    ],
    auditTrail: [
      {
        id: 'CC-0001-audit-001',
        timestamp: '2025-01-10T09:00:00Z',
        userId: 'VERA-AI',
        userName: 'Vera AI System',
        action: 'Case Created',
        details: 'Provider application completed verification and submitted for committee review',
        ipAddress: '192.168.1.100',
        userAgent: 'Vera AI v2.1'
      },
      {
        id: 'CC-0001-audit-002',
        timestamp: '2025-01-12T14:30:00Z',
        userId: 'EX001',
        userName: 'Jennifer Adams',
        action: 'Final Review Completed',
        details: 'Completed comprehensive review of all verification documents and background checks',
        fromStatus: 'under_review',
        toStatus: 'ready_for_committee',
        ipAddress: '10.0.0.25',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ],
    documentsReviewed: [
      'Medical License',
      'DEA Certificate',
      'Board Certification',
      'Malpractice Insurance',
      'CV/Resume',
      'References'
    ],
    credentialingScore: 95,
    riskAssessment: 'low',
    privileges: {
      requested: ['General Cardiology', 'Cardiac Catheterization', 'Echocardiography'],
      recommended: ['General Cardiology', 'Cardiac Catheterization', 'Echocardiography']
    },
    insurance: {
      carrier: 'Medical Protective',
      policyNumber: 'MP-2024-001',
      expirationDate: '2025-12-31',
      coverageAmount: '$1M/$3M'
    },
    contractDetails: {
      type: 'employed',
      startDate: '2025-02-01',
      department: 'Cardiology',
      supervisor: 'Dr. Michael Chen'
    }
  },
  {
    id: 'CC-0002',
    providerId: 'PRV-0002',
    providerName: 'Dr. Michael Chen, MD',
    specialty: 'Emergency Medicine',
    npi: '2345678901',
    status: 'under_committee_review',
    priority: 'expedited',
    submittedToCommittee: '2025-01-12',
    examinerName: 'Michael Foster',
    examinerId: 'EX002',
    assignedMedicalDirector: 'Dr. Robert Chen',
    medicalDirectorId: 'MD002',
    hasFlags: true,
    flags: [
      {
        id: 'FLAG-001',
        type: 'malpractice',
        severity: 'medium',
        source: 'NPDB',
        description: 'Malpractice claim settled',
        details: 'Settlement of $150,000 for diagnostic error case in 2022. No admission of fault.',
        discoveredDate: '2025-01-08',
        status: 'under_review',
        requiresThreeDirectors: false
      }
    ],
    medicalDirectorReviews: [
      {
        id: 'MDR-002',
        directorId: 'MD002',
        directorName: 'Dr. Robert Chen',
        reviewDate: '2025-01-13',
        decision: 'conditional',
        comments: 'Approved with conditions requiring additional monitoring',
        conditions: ['6-month performance review required', 'Peer consultation for complex cases'],
        signature: 'Robert_Chen_1737844800',
        acknowledged: true
      }
    ],
    auditTrail: [
      {
        id: 'CC-0002-audit-001',
        timestamp: '2025-01-08T10:15:00Z',
        userId: 'VERA-AI',
        userName: 'Vera AI System',
        action: 'Case Created',
        details: 'Provider application completed verification and submitted for committee review',
        ipAddress: '192.168.1.100',
        userAgent: 'Vera AI v2.1'
      }
    ],
    documentsReviewed: [
      'Medical License',
      'DEA Certificate',
      'Board Certification',
      'Malpractice Insurance',
      'CV/Resume',
      'References',
      'Settlement Documentation'
    ],
    credentialingScore: 82,
    riskAssessment: 'medium',
    privileges: {
      requested: ['Emergency Medicine', 'Critical Care', 'Trauma'],
      recommended: ['Emergency Medicine', 'Critical Care']
    },
    insurance: {
      carrier: 'The Doctors Company',
      policyNumber: 'TDC-2024-002',
      expirationDate: '2025-11-30',
      coverageAmount: '$2M/$6M'
    },
    contractDetails: {
      type: 'employed',
      startDate: '2025-02-15',
      department: 'Emergency Medicine',
      supervisor: 'Dr. Lisa Park'
    }
  },
  {
    id: 'CC-0003',
    providerId: 'PRV-0003',
    providerName: 'Dr. Elena Rodriguez, NP',
    specialty: 'Internal Medicine',
    npi: '3456789012',
    status: 'approved',
    priority: 'routine',
    submittedToCommittee: '2025-01-05',
    examinerName: 'Lisa Zhang',
    examinerId: 'EX003',
    assignedMedicalDirector: 'Dr. Maria Gonzalez',
    medicalDirectorId: 'MD003',
    hasFlags: false,
    flags: [],
    medicalDirectorReviews: [
      {
        id: 'MDR-003',
        directorId: 'MD003',
        directorName: 'Dr. Maria Gonzalez',
        reviewDate: '2025-01-08',
        decision: 'approve',
        comments: 'Excellent credentials and references. Highly recommended.',
        signature: 'Maria_Gonzalez_1737844800',
        acknowledged: true
      }
    ],
    committeeDecision: {
      decision: 'approve',
      decisionDate: '2025-01-10',
      notes: 'Unanimously approved by committee. Excellent candidate.',
      votingMembers: ['Dr. Patricia Williams', 'Dr. Robert Chen', 'Dr. Maria Gonzalez'],
      voteBreakdown: {
        approve: 3,
        reject: 0,
        conditional: 0,
        defer: 0
      }
    },
    auditTrail: [
      {
        id: 'CC-0003-audit-001',
        timestamp: '2025-01-03T11:20:00Z',
        userId: 'VERA-AI',
        userName: 'Vera AI System',
        action: 'Case Created',
        details: 'Provider application completed verification and submitted for committee review',
        ipAddress: '192.168.1.100',
        userAgent: 'Vera AI v2.1'
      }
    ],
    documentsReviewed: [
      'NP License',
      'DEA Certificate',
      'Board Certification',
      'Malpractice Insurance',
      'CV/Resume',
      'References',
      'Collaborative Agreement'
    ],
    credentialingScore: 98,
    riskAssessment: 'low',
    privileges: {
      requested: ['Internal Medicine', 'Chronic Disease Management'],
      recommended: ['Internal Medicine', 'Chronic Disease Management'],
      granted: ['Internal Medicine', 'Chronic Disease Management']
    },
    insurance: {
      carrier: 'CNA Healthcare',
      policyNumber: 'CNA-2024-003',
      expirationDate: '2025-10-31',
      coverageAmount: '$1M/$3M'
    },
    contractDetails: {
      type: 'employed',
      startDate: '2025-01-15',
      department: 'Internal Medicine',
      supervisor: 'Dr. James Thompson'
    }
  },
  {
    id: 'CC-0004',
    providerId: 'PRV-0004',
    providerName: 'Dr. David Thompson, PA-C',
    specialty: 'Surgery',
    npi: '4567890123',
    status: 'ready_for_committee',
    priority: 'urgent',
    submittedToCommittee: '2025-01-16',
    examinerName: 'David Martinez',
    examinerId: 'EX004',
    assignedMedicalDirector: 'Dr. James Thompson',
    medicalDirectorId: 'MD004',
    hasFlags: true,
    flags: [
      {
        id: 'FLAG-002',
        type: 'license_issue',
        severity: 'high',
        source: 'State Medical Board',
        description: 'License suspension history',
        details: 'Previous license suspension for 6 months in 2021 due to documentation issues. Completed remedial training.',
        discoveredDate: '2025-01-14',
        status: 'under_review',
        requiresThreeDirectors: true
      }
    ],
    medicalDirectorReviews: [
      {
        id: 'MDR-004a',
        directorId: 'MD004',
        directorName: 'Dr. James Thompson',
        reviewDate: '2025-01-15',
        decision: 'conditional',
        comments: 'Recommend conditional approval with enhanced supervision',
        conditions: ['Direct supervision for first 90 days', 'Monthly chart reviews'],
        signature: 'James_Thompson_1737844800',
        acknowledged: true
      },
      {
        id: 'MDR-004b',
        directorId: 'MD005',
        directorName: 'Dr. Sarah Kim',
        reviewDate: '2025-01-15',
        decision: 'defer',
        comments: 'Recommend deferring pending additional documentation',
        signature: 'Sarah_Kim_1737844800',
        acknowledged: true
      },
      {
        id: 'MDR-004c',
        directorId: 'MD006',
        directorName: 'Dr. Michael Rodriguez',
        reviewDate: '2025-01-16',
        decision: 'conditional',
        comments: 'Conditional approval with strict monitoring protocols',
        conditions: ['Quarterly performance reviews', 'Peer consultation required'],
        signature: 'Michael_Rodriguez_1737844800',
        acknowledged: true
      }
    ],
    auditTrail: [
      {
        id: 'CC-0004-audit-001',
        timestamp: '2025-01-12T08:45:00Z',
        userId: 'VERA-AI',
        userName: 'Vera AI System',
        action: 'Case Created',
        details: 'Provider application completed verification and submitted for committee review',
        ipAddress: '192.168.1.100',
        userAgent: 'Vera AI v2.1'
      }
    ],
    documentsReviewed: [
      'PA License',
      'DEA Certificate',
      'Board Certification',
      'Malpractice Insurance',
      'CV/Resume',
      'References',
      'Remedial Training Certificate',
      'License Reinstatement Documentation'
    ],
    credentialingScore: 76,
    riskAssessment: 'high',
    privileges: {
      requested: ['General Surgery', 'Surgical Assist'],
      recommended: ['Surgical Assist']
    },
    insurance: {
      carrier: 'NORCAL Mutual',
      policyNumber: 'NCM-2024-004',
      expirationDate: '2025-09-30',
      coverageAmount: '$1M/$3M'
    },
    contractDetails: {
      type: 'employed',
      startDate: '2025-02-01',
      department: 'Surgery',
      supervisor: 'Dr. Sarah Kim'
    }
  },
  {
    id: 'CC-0005',
    providerId: 'PRV-0005',
    providerName: 'Dr. Lisa Park, MD',
    specialty: 'Pediatrics',
    npi: '5678901234',
    status: 'conditional',
    priority: 'routine',
    submittedToCommittee: '2025-01-08',
    examinerName: 'Anna Patel',
    examinerId: 'EX005',
    assignedMedicalDirector: 'Dr. Sarah Kim',
    medicalDirectorId: 'MD005',
    hasFlags: false,
    flags: [],
    medicalDirectorReviews: [
      {
        id: 'MDR-005',
        directorId: 'MD005',
        directorName: 'Dr. Sarah Kim',
        reviewDate: '2025-01-11',
        decision: 'conditional',
        comments: 'Approved with conditions for additional pediatric training',
        conditions: ['Complete 40 hours of pediatric emergency training', '3-month probationary period'],
        signature: 'Sarah_Kim_1737844800',
        acknowledged: true
      }
    ],
    committeeDecision: {
      decision: 'conditional',
      decisionDate: '2025-01-12',
      conditions: ['Complete 40 hours of pediatric emergency training', '3-month probationary period'],
      notes: 'Approved with conditions for additional training requirements',
      votingMembers: ['Dr. Patricia Williams', 'Dr. Robert Chen', 'Dr. Sarah Kim'],
      voteBreakdown: {
        approve: 0,
        reject: 0,
        conditional: 3,
        defer: 0
      }
    },
    auditTrail: [
      {
        id: 'CC-0005-audit-001',
        timestamp: '2025-01-06T13:30:00Z',
        userId: 'VERA-AI',
        userName: 'Vera AI System',
        action: 'Case Created',
        details: 'Provider application completed verification and submitted for committee review',
        ipAddress: '192.168.1.100',
        userAgent: 'Vera AI v2.1'
      }
    ],
    documentsReviewed: [
      'Medical License',
      'DEA Certificate',
      'Board Certification',
      'Malpractice Insurance',
      'CV/Resume',
      'References',
      'Pediatric Training Records'
    ],
    credentialingScore: 88,
    riskAssessment: 'low',
    privileges: {
      requested: ['General Pediatrics', 'Pediatric Emergency'],
      recommended: ['General Pediatrics'],
      granted: ['General Pediatrics']
    },
    insurance: {
      carrier: 'ProAssurance',
      policyNumber: 'PA-2024-005',
      expirationDate: '2025-08-31',
      coverageAmount: '$1M/$3M'
    },
    contractDetails: {
      type: 'employed',
      startDate: '2025-01-20',
      department: 'Pediatrics',
      supervisor: 'Dr. Michael Rodriguez'
    }
  }
]; 