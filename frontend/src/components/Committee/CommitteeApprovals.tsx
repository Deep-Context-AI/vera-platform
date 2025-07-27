import React, { useState } from 'react';
import { 
  Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertTriangle, 
  FileText, Calendar, User, Download, Upload, Flag, Shield,
  ChevronDown, ChevronRight, MessageSquare, Award, Building,
  Phone, Mail, MapPin, GraduationCap, Stethoscope, Star, RefreshCw
} from 'lucide-react';

interface CommitteeFile {
  id: string;
  providerName: string;
  npi: string;
  specialty: string;
  facility: string;
  submittedDate: string;
  reviewType: 'initial' | 'recredentialing' | 'corrective_action';
  status: 'pending' | 'approved' | 'rejected' | 'deferred';
  assignedReviewer: string;
  flaggedItems: string[];
  riskLevel: 'low' | 'medium' | 'high';
  completionDate?: string;
  lastActivity: string;
  documentsCount: number;
  comments: number;
  veraConfidence: number;
  flaggedBy?: string;
  flagReason?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

export default function CommitteeApprovals() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterReviewer, setFilterReviewer] = useState('all');
  const [selectedFile, setSelectedFile] = useState<CommitteeFile | null>(null);
  const [bulkActions, setBulkActions] = useState<string[]>([]);

  // Mock committee files data
  const committeeFiles: CommitteeFile[] = [
    {
      id: '1',
      providerName: 'Dr. Patricia White',
      npi: '1234567890',
      specialty: 'Internal Medicine',
      facility: 'General Hospital',
      submittedDate: '2024-01-10',
      reviewType: 'initial',
      status: 'pending',
      assignedReviewer: 'Dr. Medical Director',
      flaggedItems: ['Prior malpractice claim - 2019', 'License disciplinary action'],
      riskLevel: 'high',
      lastActivity: '2024-01-15',
      documentsCount: 24,
      comments: 3,
      veraConfidence: 78,
      flaggedBy: 'John Doe',
      flagReason: 'Multiple red flags require committee review'
    },
    {
      id: '2',
      providerName: 'Dr. Kevin Lee',
      npi: '2345678901',
      specialty: 'Cardiology',
      facility: 'Heart Center',
      submittedDate: '2024-01-12',
      reviewType: 'recredentialing',
      status: 'pending',
      assignedReviewer: 'Dr. Medical Director',
      flaggedItems: ['OIG sanctions found', 'Expired DEA certificate'],
      riskLevel: 'high',
      lastActivity: '2024-01-14',
      documentsCount: 18,
      comments: 5,
      veraConfidence: 65,
      flaggedBy: 'Jane Smith',
      flagReason: 'Federal sanctions require immediate review'
    },
    {
      id: '3',
      providerName: 'Dr. Amanda Clark',
      npi: '3456789012',
      specialty: 'Pediatrics',
      facility: 'Children\'s Hospital',
      submittedDate: '2024-01-08',
      reviewType: 'corrective_action',
      status: 'pending',
      assignedReviewer: 'Dr. Medical Director',
      flaggedItems: ['Borderline license status', 'Incomplete CME credits'],
      riskLevel: 'medium',
      lastActivity: '2024-01-13',
      documentsCount: 22,
      comments: 2,
      veraConfidence: 85,
      flaggedBy: 'Mike Johnson',
      flagReason: 'License status requires clarification'
    },
    // Approved files
    {
      id: '4',
      providerName: 'Dr. Sarah Johnson',
      npi: '4567890123',
      specialty: 'Cardiothoracic Surgery',
      facility: 'University Medical Center',
      submittedDate: '2023-12-15',
      reviewType: 'initial',
      status: 'approved',
      assignedReviewer: 'Dr. Medical Director',
      flaggedItems: [],
      riskLevel: 'low',
      lastActivity: '2024-01-05',
      documentsCount: 28,
      comments: 1,
      veraConfidence: 97,
      approvalDate: '2024-01-05',
      completionDate: '2024-01-05'
    },
    {
      id: '5',
      providerName: 'Dr. Michael Chen',
      npi: '5678901234',
      specialty: 'Neurology',
      facility: 'Brain Institute',
      submittedDate: '2023-12-20',
      reviewType: 'recredentialing',
      status: 'approved',
      assignedReviewer: 'Dr. Medical Director',
      flaggedItems: [],
      riskLevel: 'low',
      lastActivity: '2024-01-08',
      documentsCount: 25,
      comments: 0,
      veraConfidence: 94,
      approvalDate: '2024-01-08',
      completionDate: '2024-01-08'
    },
    // Rejected files
    {
      id: '6',
      providerName: 'Dr. Robert Wilson',
      npi: '6789012345',
      specialty: 'Emergency Medicine',
      facility: 'County Hospital',
      submittedDate: '2024-01-05',
      reviewType: 'initial',
      status: 'rejected',
      assignedReviewer: 'Dr. Medical Director',
      flaggedItems: ['Multiple malpractice claims', 'License suspension history', 'Failed background check'],
      riskLevel: 'high',
      lastActivity: '2024-01-12',
      documentsCount: 15,
      comments: 8,
      veraConfidence: 45,
      rejectionReason: 'Multiple serious concerns regarding patient safety and regulatory compliance',
      completionDate: '2024-01-12'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deferred': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case 'initial': return <User className="w-4 h-4 text-blue-600" />;
      case 'recredentialing': return <RefreshCw className="w-4 h-4 text-green-600" />;
      case 'corrective_action': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredFiles = committeeFiles.filter(file => {
    const matchesTab = file.status === activeTab;
    const matchesSearch = file.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.npi.includes(searchTerm) ||
                         file.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || file.riskLevel === filterRisk;
    const matchesReviewer = filterReviewer === 'all' || file.assignedReviewer === filterReviewer;
    
    return matchesTab && matchesSearch && matchesRisk && matchesReviewer;
  });

  const pendingCount = committeeFiles.filter(f => f.status === 'pending').length;
  const approvedCount = committeeFiles.filter(f => f.status === 'approved').length;
  const rejectedCount = committeeFiles.filter(f => f.status === 'rejected').length;

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on files:`, bulkActions);
    setBulkActions([]);
  };

  const renderFileDetail = () => {
    if (!selectedFile) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getReviewTypeIcon(selectedFile.reviewType)}
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedFile.providerName}
                </h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedFile.status)}`}>
                {selectedFile.status.charAt(0).toUpperCase() + selectedFile.status.slice(1)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(selectedFile.riskLevel)}`}>
                {selectedFile.riskLevel.toUpperCase()} RISK
              </span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex h-[calc(95vh-120px)]">
            {/* Left Panel - Credentialing Packet */}
            <div className="w-2/3 border-r border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Credentialing Packet</h3>
                
                {/* Verification Steps Timeline */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Verification Steps Progress</h4>
                  <div className="space-y-4">
                    {['Application Review', 'NPI', 'NPDB', 'CA License', 'DEA License', 'ABMS', 'SanctionCheck', 'LADMF', 'Medical Enrollment', 'Medicare Enrollment', 'Hospital Privileges', 'Final Decision'].map((step, index) => (
                      <div key={step} className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{step}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-green-600">Completed</span>
                              <span className="text-xs text-gray-500">Jan {15 - index}, 2024</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-600">Vera Confidence: {Math.floor(Math.random() * 10) + 90}%</span>
                            <button className="text-sm text-blue-600 hover:text-blue-800">View Documents ({Math.floor(Math.random() * 3) + 1})</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Document Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Core Credentials</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ Medical License (CA-A12345) - Expires 12/31/2025</li>
                        <li>✓ DEA Certificate (BD1234567) - Expires 08/15/2025</li>
                        <li>✓ Board Certification - {selectedFile.specialty}</li>
                        <li>✓ NPI Verification - {selectedFile.npi}</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Background Checks</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ NPDB Query - No adverse actions</li>
                        <li>✓ OIG Sanctions Check - Clear</li>
                        <li>✓ State Sanctions - Clear</li>
                        <li>✓ Medicare Enrollment - Active</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Vera AI Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Vera AI Analysis Summary</h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3">
                      <h5 className="font-medium text-blue-900 mb-2">Vera's Top Level Results (TLR):</h5>
                      <p className="text-sm text-blue-800 mb-2">
                        Vera's comprehensive analysis processed {selectedFile.documentsCount} documents through advanced ML pipelines, 
                        cross-referencing 12 verification steps against federal and state databases. The AI detected 
                        {selectedFile.flaggedItems.length > 0 ? ` ${selectedFile.flaggedItems.length} risk indicators` : ' no significant risk indicators'} 
                        requiring human review, achieving {selectedFile.veraConfidence}% confidence through multi-layered validation algorithms.
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Vera's Recommendation:</strong> {selectedFile.riskLevel === 'high' ? 
                          'COMMITTEE REVIEW REQUIRED - Multiple risk factors detected that exceed automated approval thresholds. Human oversight recommended for patient safety compliance.' :
                          selectedFile.riskLevel === 'medium' ? 
                          'STANDARD REVIEW - Minor discrepancies identified but within acceptable parameters. Manual verification of flagged items recommended.' :
                          'AUTO-APPROVAL ELIGIBLE - All verification criteria met with high confidence. Standard credentialing workflow approved.'
                        }
                      </p>
                    </div>
                    
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Overall Risk Assessment: <strong>{selectedFile.riskLevel.toUpperCase()}</strong></p>
                      <p>• Verification Confidence: <strong>{selectedFile.veraConfidence}%</strong></p>
                      <p>• Documents Processed: <strong>{selectedFile.documentsCount}</strong></p>
                      <p>• Processing Time: <strong>2.3 minutes</strong></p>
                      <p>• Red Flags Detected: <strong>{selectedFile.flaggedItems.length}</strong></p>
                      <p>• AI Model Version: <strong>v2.1.3-healthcare</strong></p>
                      <p>• Validation Score: <strong>{Math.floor(Math.random() * 10) + 85}/100</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Committee Review */}
            <div className="w-1/3 p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Provider Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">NPI:</span>
                    <span className="text-gray-900">{selectedFile.npi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Specialty:</span>
                    <span className="text-gray-900">{selectedFile.specialty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Facility:</span>
                    <span className="text-gray-900">{selectedFile.facility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Review Type:</span>
                    <span className="text-gray-900 capitalize">{selectedFile.reviewType.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Review Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="text-gray-900">{new Date(selectedFile.submittedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned Reviewer:</span>
                    <span className="text-gray-900">{selectedFile.assignedReviewer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Documents:</span>
                    <span className="text-gray-900">{selectedFile.documentsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vera Confidence:</span>
                    <span className={`font-medium ${
                      selectedFile.veraConfidence >= 90 ? 'text-green-600' :
                      selectedFile.veraConfidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedFile.veraConfidence}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Committee Action History */}
            {selectedFile.status !== 'pending' && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Committee Decision History</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Application Submitted</p>
                        <p className="text-xs text-gray-500">{new Date(selectedFile.submittedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Verification Completed</p>
                        <p className="text-xs text-gray-500">Jan 14, 2024 - All 12 steps verified</p>
                      </div>
                    </div>
                    {selectedFile.status === 'approved' && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Committee Approved</p>
                          <p className="text-xs text-gray-500">{selectedFile.approvalDate} by {selectedFile.assignedReviewer}</p>
                        </div>
                      </div>
                    )}
                    {selectedFile.status === 'rejected' && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Committee Rejected</p>
                          <p className="text-xs text-gray-500">{selectedFile.completionDate}</p>
                          <p className="text-xs text-red-600 mt-1">{selectedFile.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedFile.flaggedItems.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-900 mb-3 flex items-center">
                  <Flag className="w-4 h-4 mr-2" />
                  Flagged Items Requiring Committee Review
                </h3>
                <ul className="space-y-2">
                  {selectedFile.flaggedItems.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-red-800 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                {selectedFile.flaggedBy && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm text-red-700">
                      <strong>Flagged by:</strong> {selectedFile.flaggedBy}
                    </p>
                    {selectedFile.flagReason && (
                      <p className="text-sm text-red-700 mt-1">
                        <strong>Reason:</strong> {selectedFile.flagReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedFile.status === 'approved' && selectedFile.approvalDate && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approval Details
                </h3>
                <p className="text-sm text-green-800">
                  Approved on {new Date(selectedFile.approvalDate).toLocaleDateString()} by {selectedFile.assignedReviewer}
                </p>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Credentialing Complete</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Provider cleared for all clinical privileges</li>
                    <li>• Hospital staff membership approved</li>
                    <li>• Insurance provider network enrollment authorized</li>
                    <li>• Next recredentialing due: {new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedFile.status === 'rejected' && selectedFile.rejectionReason && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2 flex items-center">
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejection Details
                </h3>
                <p className="text-sm text-red-800">{selectedFile.rejectionReason}</p>
                <p className="text-sm text-red-700 mt-2">
                  Rejected on {new Date(selectedFile.completionDate!).toLocaleDateString()}
                </p>
              </div>
            )}

            {selectedFile.status === 'pending' && (
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Clock className="w-4 h-4" />
                  <span>Defer</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span>Add Comment</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Committee Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve provider credentialing applications</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-yellow-600">Requires committee review</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Files</p>
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              <p className="text-sm text-green-600">Ready for credentialing</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected Files</p>
              <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
              <p className="text-sm text-red-600">Applications denied</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'pending', label: 'Pending Approvals', count: pendingCount, icon: Clock },
              { id: 'approved', label: 'Approved Files', count: approvedCount, icon: CheckCircle },
              { id: 'rejected', label: 'Rejected Files', count: rejectedCount, icon: XCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>

              <select
                value={filterReviewer}
                onChange={(e) => setFilterReviewer(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Reviewers</option>
                <option value="Dr. Medical Director">Dr. Medical Director</option>
                <option value="Dr. Chief of Staff">Dr. Chief of Staff</option>
              </select>
            </div>

            {bulkActions.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{bulkActions.length} selected</span>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Bulk Reject
                </button>
              </div>
            )}
          </div>
        </div>

        {/* File List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flagged Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vera Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={bulkActions.includes(file.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkActions([...bulkActions, file.id]);
                        } else {
                          setBulkActions(bulkActions.filter(id => id !== file.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{file.providerName}</div>
                        <div className="text-sm text-gray-500">{file.specialty} • {file.facility}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getReviewTypeIcon(file.reviewType)}
                      <span className="text-sm text-gray-900 capitalize">
                        {file.reviewType.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(file.riskLevel)}`}>
                      {file.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {file.flaggedItems.length > 0 ? (
                        <div className="space-y-1">
                          {file.flaggedItems.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-start space-x-1">
                              <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-red-700 line-clamp-1">{item}</span>
                            </div>
                          ))}
                          {file.flaggedItems.length > 2 && (
                            <div className="text-xs text-red-600">
                              +{file.flaggedItems.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">No flags</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            file.veraConfidence >= 90 ? 'bg-green-500' :
                            file.veraConfidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${file.veraConfidence}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{file.veraConfidence}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(file.submittedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No files found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* File Detail Modal */}
      {renderFileDetail()}
    </div>
  );
}