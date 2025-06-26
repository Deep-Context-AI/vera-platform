import { Node, Edge } from 'reactflow';

export type WorkflowType = 
  | 'education-check'
  | 'sanction-check' 
  | 'npdb-check'
  | 'medical-board-ca-check'
  | 'license-verification'
  | 'malpractice-check';

export interface WorkflowData {
  title: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  status: 'active' | 'completed' | 'pending' | 'failed';
  lastRun?: string;
  totalRuns: number;
}

export const mockWorkflowData: Record<WorkflowType, WorkflowData> = {
  'education-check': {
    title: 'Education Verification Workflow',
    description: 'Verify medical education credentials and certifications',
    status: 'completed',
    lastRun: '2025-01-15T10:30:00Z',
    totalRuns: 1247,
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'Education Check Triggered',
          description: 'New provider education verification request',
          records: 1247
        }
      },
      {
        id: 'ai-agent-1',
        type: 'aiAgent',
        position: { x: 100, y: 250 },
        data: { 
          label: 'AI Education Verification',
          description: 'Verify medical school and residency credentials',
          agent: 'Vera AI'
        }
      },
      {
        id: 'decision-1',
        type: 'decision',
        position: { x: 100, y: 400 },
        data: { 
          label: 'Credentials Valid?',
          description: 'Check if education credentials meet requirements'
        }
      },
      {
        id: 'action-approved',
        type: 'action',
        position: { x: 300, y: 500 },
        data: { 
          label: 'Mark as Verified',
          description: 'Education credentials approved',
          actionType: 'approve'
        }
      },
      {
        id: 'action-flagged',
        type: 'action',
        position: { x: -100, y: 500 },
        data: { 
          label: 'Flag for Manual Review',
          description: 'Requires human verification',
          actionType: 'flag'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'trigger-1',
        target: 'ai-agent-1',
        animated: true
      },
      {
        id: 'e2-3',
        source: 'ai-agent-1',
        target: 'decision-1',
        animated: true
      },
      {
        id: 'e3-approved',
        source: 'decision-1',
        target: 'action-approved',
        label: 'Valid',
        style: { stroke: '#10b981' },
        labelStyle: { fill: '#10b981', fontWeight: 600 }
      },
      {
        id: 'e3-flagged',
        source: 'decision-1',
        target: 'action-flagged',
        label: 'Invalid/Incomplete',
        style: { stroke: '#f59e0b' },
        labelStyle: { fill: '#f59e0b', fontWeight: 600 }
      }
    ]
  },

  'sanction-check': {
    title: 'Sanctions & Exclusions Check',
    description: 'Verify provider is not on any exclusion or sanction lists',
    status: 'active',
    lastRun: '2025-01-15T14:22:00Z',
    totalRuns: 2156,
    nodes: [
      {
        id: 'trigger-sanctions',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'Sanctions Check Initiated',
          description: 'Check OIG, NPDB, and state exclusion lists',
          records: 2156
        }
      },
      {
        id: 'ai-sanctions',
        type: 'aiAgent',
        position: { x: 100, y: 250 },
        data: { 
          label: 'Multi-Database Scan',
          description: 'Scan OIG LEIE, NPDB, SAM.gov, and state lists',
          agent: 'Vera AI'
        }
      },
      {
        id: 'decision-sanctions',
        type: 'decision',
        position: { x: 100, y: 400 },
        data: { 
          label: 'Clean Record?',
          description: 'No sanctions or exclusions found'
        }
      },
      {
        id: 'action-clear',
        type: 'action',
        position: { x: 300, y: 500 },
        data: { 
          label: 'Clear for Practice',
          description: 'No sanctions found - approved',
          actionType: 'approve'
        }
      },
      {
        id: 'action-review',
        type: 'action',
        position: { x: -100, y: 500 },
        data: { 
          label: 'Escalate to Compliance',
          description: 'Sanctions found - requires review',
          actionType: 'escalate'
        }
      }
    ],
    edges: [
      {
        id: 'es1-2',
        source: 'trigger-sanctions',
        target: 'ai-sanctions',
        animated: true
      },
      {
        id: 'es2-3',
        source: 'ai-sanctions',
        target: 'decision-sanctions',
        animated: true
      },
      {
        id: 'es3-clear',
        source: 'decision-sanctions',
        target: 'action-clear',
        label: 'Clean',
        style: { stroke: '#10b981' },
        labelStyle: { fill: '#10b981', fontWeight: 600 }
      },
      {
        id: 'es3-review',
        source: 'decision-sanctions',
        target: 'action-review',
        label: 'Sanctions Found',
        style: { stroke: '#ef4444' },
        labelStyle: { fill: '#ef4444', fontWeight: 600 }
      }
    ]
  },

  'npdb-check': {
    title: 'NPDB Verification',
    description: 'National Practitioner Data Bank malpractice and disciplinary history check',
    status: 'completed',
    lastRun: '2025-01-15T09:15:00Z',
    totalRuns: 892,
    nodes: [
      {
        id: 'trigger-npdb',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'NPDB Query Initiated',
          description: 'Query National Practitioner Data Bank',
          records: 892
        }
      },
      {
        id: 'ai-npdb',
        type: 'aiAgent',
        position: { x: 100, y: 250 },
        data: { 
          label: 'NPDB Database Query',
          description: 'Search for malpractice claims and disciplinary actions',
          agent: 'Vera AI'
        }
      },
      {
        id: 'decision-npdb',
        type: 'decision',
        position: { x: 100, y: 400 },
        data: { 
          label: 'Any Reports Found?',
          description: 'Check for malpractice or disciplinary reports'
        }
      },
      {
        id: 'action-clean-npdb',
        type: 'action',
        position: { x: 300, y: 500 },
        data: { 
          label: 'NPDB Clear',
          description: 'No adverse reports found',
          actionType: 'approve'
        }
      },
      {
        id: 'decision-severity',
        type: 'decision',
        position: { x: -100, y: 500 },
        data: { 
          label: 'Assess Severity',
          description: 'Evaluate significance of findings'
        }
      },
      {
        id: 'action-minor',
        type: 'action',
        position: { x: -250, y: 650 },
        data: { 
          label: 'Minor Issues - Approve',
          description: 'Minor findings, proceed with approval',
          actionType: 'approve'
        }
      },
      {
        id: 'action-major',
        type: 'action',
        position: { x: 50, y: 650 },
        data: { 
          label: 'Major Issues - Committee Review',
          description: 'Significant findings require committee review',
          actionType: 'escalate'
        }
      }
    ],
    edges: [
      {
        id: 'en1-2',
        source: 'trigger-npdb',
        target: 'ai-npdb',
        animated: true
      },
      {
        id: 'en2-3',
        source: 'ai-npdb',
        target: 'decision-npdb',
        animated: true
      },
      {
        id: 'en3-clean',
        source: 'decision-npdb',
        target: 'action-clean-npdb',
        label: 'No Reports',
        style: { stroke: '#10b981' },
        labelStyle: { fill: '#10b981', fontWeight: 600 }
      },
      {
        id: 'en3-severity',
        source: 'decision-npdb',
        target: 'decision-severity',
        label: 'Reports Found',
        style: { stroke: '#f59e0b' },
        labelStyle: { fill: '#f59e0b', fontWeight: 600 }
      },
      {
        id: 'en-severity-minor',
        source: 'decision-severity',
        target: 'action-minor',
        label: 'Minor',
        style: { stroke: '#10b981' },
        labelStyle: { fill: '#10b981', fontWeight: 600 }
      },
      {
        id: 'en-severity-major',
        source: 'decision-severity',
        target: 'action-major',
        label: 'Major',
        style: { stroke: '#ef4444' },
        labelStyle: { fill: '#ef4444', fontWeight: 600 }
      }
    ]
  },

  'medical-board-ca-check': {
    title: 'California Medical Board Verification',
    description: 'Verify active license status with California Medical Board',
    status: 'active',
    lastRun: '2025-01-15T11:45:00Z',
    totalRuns: 1543,
    nodes: [
      {
        id: 'trigger-ca',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'CA Medical Board Check',
          description: 'Verify license with California Medical Board',
          records: 1543
        }
      },
      {
        id: 'ai-ca',
        type: 'aiAgent',
        position: { x: 100, y: 250 },
        data: { 
          label: 'License Status Verification',
          description: 'Check license status, expiration, and restrictions',
          agent: 'Vera AI'
        }
      },
      {
        id: 'decision-ca-status',
        type: 'decision',
        position: { x: 100, y: 400 },
        data: { 
          label: 'License Active?',
          description: 'Verify license is current and unrestricted'
        }
      },
      {
        id: 'action-ca-valid',
        type: 'action',
        position: { x: 300, y: 500 },
        data: { 
          label: 'License Verified',
          description: 'Active CA medical license confirmed',
          actionType: 'approve'
        }
      },
      {
        id: 'decision-ca-issue',
        type: 'decision',
        position: { x: -100, y: 500 },
        data: { 
          label: 'Issue Type?',
          description: 'Determine type of license issue'
        }
      },
      {
        id: 'action-ca-expired',
        type: 'action',
        position: { x: -250, y: 650 },
        data: { 
          label: 'Request Renewal',
          description: 'License expired - request renewal',
          actionType: 'request'
        }
      },
      {
        id: 'action-ca-restricted',
        type: 'action',
        position: { x: 50, y: 650 },
        data: { 
          label: 'Review Restrictions',
          description: 'License has restrictions - review eligibility',
          actionType: 'review'
        }
      }
    ],
    edges: [
      {
        id: 'eca1-2',
        source: 'trigger-ca',
        target: 'ai-ca',
        animated: true
      },
      {
        id: 'eca2-3',
        source: 'ai-ca',
        target: 'decision-ca-status',
        animated: true
      },
      {
        id: 'eca3-valid',
        source: 'decision-ca-status',
        target: 'action-ca-valid',
        label: 'Active & Valid',
        style: { stroke: '#10b981' },
        labelStyle: { fill: '#10b981', fontWeight: 600 }
      },
      {
        id: 'eca3-issue',
        source: 'decision-ca-status',
        target: 'decision-ca-issue',
        label: 'Issue Found',
        style: { stroke: '#f59e0b' },
        labelStyle: { fill: '#f59e0b', fontWeight: 600 }
      },
      {
        id: 'eca-issue-expired',
        source: 'decision-ca-issue',
        target: 'action-ca-expired',
        label: 'Expired',
        style: { stroke: '#f59e0b' },
        labelStyle: { fill: '#f59e0b', fontWeight: 600 }
      },
      {
        id: 'eca-issue-restricted',
        source: 'decision-ca-issue',
        target: 'action-ca-restricted',
        label: 'Restricted',
        style: { stroke: '#ef4444' },
        labelStyle: { fill: '#ef4444', fontWeight: 600 }
      }
    ]
  },

  'license-verification': {
    title: 'Multi-State License Verification',
    description: 'Verify medical licenses across all practicing states',
    status: 'pending',
    totalRuns: 756,
    nodes: [
      {
        id: 'trigger-license',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'License Verification Started',
          description: 'Verify licenses in all practicing states',
          records: 756
        }
      },
      {
        id: 'ai-license',
        type: 'aiAgent',
        position: { x: 100, y: 250 },
        data: { 
          label: 'Multi-State License Check',
          description: 'Query license status in all relevant states',
          agent: 'Vera AI'
        }
      },
      {
        id: 'decision-all-valid',
        type: 'decision',
        position: { x: 100, y: 400 },
        data: { 
          label: 'All Licenses Valid?',
          description: 'Check if all state licenses are current'
        }
      },
      {
        id: 'action-license-approved',
        type: 'action',
        position: { x: 300, y: 500 },
        data: { 
          label: 'All Licenses Verified',
          description: 'All state licenses are current and valid',
          actionType: 'approve'
        }
      },
      {
        id: 'action-license-issues',
        type: 'action',
        position: { x: -100, y: 500 },
        data: { 
          label: 'Address License Issues',
          description: 'Some licenses need attention',
          actionType: 'flag'
        }
      }
    ],
    edges: [
      {
        id: 'el1-2',
        source: 'trigger-license',
        target: 'ai-license',
        animated: true
      },
      {
        id: 'el2-3',
        source: 'ai-license',
        target: 'decision-all-valid',
        animated: true
      },
      {
        id: 'el3-approved',
        source: 'decision-all-valid',
        target: 'action-license-approved',
        label: 'All Valid',
        style: { stroke: '#10b981' },
        labelStyle: { fill: '#10b981', fontWeight: 600 }
      },
      {
        id: 'el3-issues',
        source: 'decision-all-valid',
        target: 'action-license-issues',
        label: 'Issues Found',
        style: { stroke: '#f59e0b' },
        labelStyle: { fill: '#f59e0b', fontWeight: 600 }
      }
    ]
  },

  'malpractice-check': {
    title: 'Malpractice Insurance Verification',
    description: 'Verify current malpractice insurance coverage',
    status: 'completed',
    lastRun: '2025-01-15T13:30:00Z',
    totalRuns: 1098,
    nodes: [
      {
        id: 'trigger-malpractice',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'Malpractice Check Initiated',
          description: 'Verify current malpractice insurance',
          records: 1098
        }
      },
      {
        id: 'ai-malpractice',
        type: 'aiAgent',
        position: { x: 100, y: 250 },
        data: { 
          label: 'Insurance Verification',
          description: 'Verify coverage amounts and policy status',
          agent: 'Vera AI'
        }
      },
      {
        id: 'decision-coverage',
        type: 'decision',
        position: { x: 100, y: 400 },
        data: { 
          label: 'Adequate Coverage?',
          description: 'Check if coverage meets minimum requirements'
        }
      },
      {
        id: 'action-coverage-ok',
        type: 'action',
        position: { x: 300, y: 500 },
        data: { 
          label: 'Coverage Verified',
          description: 'Malpractice insurance meets requirements',
          actionType: 'approve'
        }
      },
      {
        id: 'action-coverage-insufficient',
        type: 'action',
        position: { x: -100, y: 500 },
        data: { 
          label: 'Request Updated Coverage',
          description: 'Insurance insufficient or expired',
          actionType: 'request'
        }
      }
    ],
    edges: [
      {
        id: 'em1-2',
        source: 'trigger-malpractice',
        target: 'ai-malpractice',
        animated: true
      },
      {
        id: 'em2-3',
        source: 'ai-malpractice',
        target: 'decision-coverage',
        animated: true
      },
      {
        id: 'em3-ok',
        source: 'decision-coverage',
        target: 'action-coverage-ok',
        label: 'Adequate',
        style: { stroke: '#10b981' },
        labelStyle: { fill: '#10b981', fontWeight: 600 }
      },
      {
        id: 'em3-insufficient',
        source: 'decision-coverage',
        target: 'action-coverage-insufficient',
        label: 'Insufficient',
        style: { stroke: '#f59e0b' },
        labelStyle: { fill: '#f59e0b', fontWeight: 600 }
      }
    ]
  }
}; 