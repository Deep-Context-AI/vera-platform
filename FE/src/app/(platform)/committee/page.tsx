'use client';

import React, { useState } from 'react';
import {
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Calendar,
  Shield,
  Gavel,
  Flag,
  X
} from 'lucide-react';
import { staticCommitteeCases } from '@/lib/data/staticCommitteeData';
import { CommitteeCase, VerificationFlag } from '@/types/platform';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CaseDetailModalProps {
  case_: CommitteeCase;
  isOpen: boolean;
  onClose: () => void;
}

const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ case_, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'flags' | 'reviews' | 'audit'>('summary');
  const [expandedAuditItems, setExpandedAuditItems] = useState<Record<string, boolean>>({});

  const getStatusColor = (status: CommitteeCase['status']) => {
    switch (status) {
      case 'ready_for_committee':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'under_committee_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'conditional':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      case 'deferred':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getFlagSeverityColor = (severity: VerificationFlag['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const toggleAuditExpansion = (entryId: string) => {
    setExpandedAuditItems(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden p-0" showCloseButton={false}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">{case_.providerName}</DialogTitle>
                  <p className="text-gray-600 dark:text-gray-400">{case_.specialty} • Case ID: {case_.id}</p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(case_.status)}`}>
                      {case_.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {case_.hasFlags && (
                      <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                        <Flag className="w-3 h-3" />
                        <span className="text-xs font-medium">{case_.flags.length} Flag{case_.flags.length > 1 ? 's' : ''}</span>
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">Score: {case_.credentialingScore}/100</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Gavel className="w-4 h-4 mr-2 inline" />
                  Committee Decision
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8">
                {[
                  { key: 'summary', label: 'Case Summary', icon: FileText },
                  { key: 'flags', label: 'Verification Flags', icon: AlertTriangle, badge: case_.flags.length },
                  { key: 'reviews', label: 'Medical Director Reviews', icon: Shield, badge: case_.medicalDirectorReviews.length },
                  { key: 'audit', label: 'Audit Trail', icon: Clock, badge: case_.auditTrail.length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as 'summary' | 'flags' | 'reviews' | 'audit')}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 text-xs font-medium px-2 py-0.5 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {activeTab === 'summary' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Provider Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Provider Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">NPI:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{case_.npi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Specialty:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{case_.specialty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Contract Type:</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{case_.contractDetails.type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Department:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{case_.contractDetails.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Review Status</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Examiner:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{case_.examinerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Medical Director:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{case_.assignedMedicalDirector}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{new Date(case_.submittedToCommittee).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Risk Assessment:</span>
                        <span className={`font-medium capitalize ${case_.riskAssessment === 'high' ? 'text-red-600 dark:text-red-400' :
                            case_.riskAssessment === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-green-600 dark:text-green-400'
                          }`}>
                          {case_.riskAssessment}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Privileges</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Requested</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {case_.privileges.requested.map(privilege => (
                            <span key={privilege} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 text-xs rounded">
                              {privilege}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Recommended</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {case_.privileges.recommended.map(privilege => (
                            <span key={privilege} className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-xs rounded">
                              {privilege}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance & Documents */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Malpractice Insurance</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Carrier:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{case_.insurance.carrier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Coverage:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{case_.insurance.coverageAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Expiration:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{new Date(case_.insurance.expirationDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Documents Reviewed</h3>
                    <div className="space-y-2">
                      {case_.documentsReviewed.map(doc => (
                        <div key={doc} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{doc}</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Credentialing Score</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${case_.credentialingScore >= 90 ? 'bg-green-500' :
                              case_.credentialingScore >= 80 ? 'bg-yellow-500' :
                                'bg-red-500'
                            }`}
                          style={{ width: `${case_.credentialingScore}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{case_.credentialingScore}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'flags' && (
              <div className="space-y-6">
                {case_.flags.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Verification Flags</h3>
                    <p className="text-gray-600 dark:text-gray-400">This provider has no verification flags or concerns.</p>
                  </div>
                ) : (
                  case_.flags.map(flag => (
                    <div key={flag.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className={`px-4 py-3 border-l-4 ${flag.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
                          flag.severity === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' :
                            flag.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
                              'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                        }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded border ${getFlagSeverityColor(flag.severity)}`}>
                                {flag.severity.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{flag.type.replace('_', ' ').toUpperCase()}</span>
                              {flag.requiresThreeDirectors && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 px-2 py-1 rounded">
                                  3 Directors Required
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{flag.description}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{flag.details}</p>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Source: {flag.source} • Discovered: {new Date(flag.discoveredDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {case_.medicalDirectorReviews.map(review => (
                  <div key={review.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{review.directorName}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reviewed on {new Date(review.reviewDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${review.decision === 'approve' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                          review.decision === 'conditional' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            review.decision === 'defer' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                        {review.decision.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{review.comments}</p>
                    {review.conditions && review.conditions.length > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                        <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">Conditions:</h5>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                          {review.conditions.map((condition, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{condition}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-4">
                {case_.auditTrail.map(entry => (
                  <div key={entry.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{entry.action}</span>
                          {entry.fromStatus && entry.toStatus && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {entry.fromStatus} → {entry.toStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{entry.details}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.userName} • {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAuditExpansion(entry.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {expandedAuditItems[entry.id] ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {expandedAuditItems[entry.id] && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <div>User ID: {entry.userId}</div>
                        <div>IP Address: {entry.ipAddress}</div>
                        <div>User Agent: {entry.userAgent}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function CommitteeReviewPage() {
  const [cases] = useState<CommitteeCase[]>(staticCommitteeCases);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [flagFilter, setFlagFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<CommitteeCase | null>(null);
  const [showCaseDetail, setShowCaseDetail] = useState(false);

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.id.includes(searchTerm) ||
      case_.npi.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    const matchesFlag = flagFilter === 'all' ||
      (flagFilter === 'flagged' && case_.hasFlags) ||
      (flagFilter === 'clean' && !case_.hasFlags);

    return matchesSearch && matchesStatus && matchesFlag;
  });

  const approvedCases = filteredCases.filter(c => c.status === 'approved');
  const readyForCommittee = filteredCases.filter(c => c.status === 'ready_for_committee' || c.status === 'under_committee_review');

  const getStatusColor = (status: CommitteeCase['status']) => {
    switch (status) {
      case 'ready_for_committee':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'under_committee_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'conditional':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      case 'deferred':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleCaseClick = (case_: CommitteeCase) => {
    setSelectedCase(case_);
    setShowCaseDetail(true);
  };

  const CaseCard = ({ case_ }: { case_: CommitteeCase }) => (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleCaseClick(case_)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{case_.providerName}</h3>
            {case_.hasFlags && (
              <div className="flex items-center space-x-1">
                <Flag className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  {case_.flags.length} Flag{case_.flags.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{case_.specialty}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Case ID: {case_.id} • NPI: {case_.npi}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(case_.status)}`}>
          {case_.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Examiner:</span>
          <p className="font-medium text-gray-900 dark:text-white">{case_.examinerName}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Medical Director:</span>
          <p className="font-medium text-gray-900 dark:text-white">{case_.assignedMedicalDirector}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Risk Assessment:</span>
          <p className={`font-medium capitalize ${getRiskColor(case_.riskAssessment)}`}>
            {case_.riskAssessment}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Score:</span>
          <p className="font-medium text-gray-900 dark:text-white">{case_.credentialingScore}/100</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Submitted: {new Date(case_.submittedToCommittee).toLocaleDateString()}
        </span>
        <div className="flex items-center space-x-2">
          {case_.flags.some(f => f.requiresThreeDirectors) && (
            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 px-2 py-1 rounded">
              3 Directors Required
            </span>
          )}
          <Eye className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Committee Review
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve provider credentialing cases ready for committee decision
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cases, providers, NPIs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="ready_for_committee">Ready for Committee</option>
              <option value="under_committee_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="conditional">Conditional</option>
              <option value="deferred">Deferred</option>
            </select>

            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Cases</option>
              <option value="flagged">Flagged Cases</option>
              <option value="clean">Clean Cases</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ready for Committee</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{readyForCommittee.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{approvedCases.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Flagged Cases</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredCases.filter(c => c.hasFlags).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">3-Director Required</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredCases.filter(c => c.flags.some(f => f.requiresThreeDirectors)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Case Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ready for Committee */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ready for Committee Review</h2>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full">
              {readyForCommittee.length} cases
            </span>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {readyForCommittee.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No cases ready for committee review</p>
              </div>
            ) : (
              readyForCommittee.map(case_ => (
                <CaseCard key={case_.id} case_={case_} />
              ))
            )}
          </div>
        </div>

        {/* Approved Cases */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Approved Cases</h2>
            <span className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-sm font-medium px-3 py-1 rounded-full">
              {approvedCases.length} cases
            </span>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {approvedCases.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No approved cases</p>
              </div>
            ) : (
              approvedCases.map(case_ => (
                <CaseCard key={case_.id} case_={case_} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Case Detail Modal */}
      {selectedCase && (
        <CaseDetailModal
          case_={selectedCase}
          isOpen={showCaseDetail}
          onClose={() => {
            setShowCaseDetail(false);
            setSelectedCase(null);
          }}
        />
      )}
    </div>
  );
} 