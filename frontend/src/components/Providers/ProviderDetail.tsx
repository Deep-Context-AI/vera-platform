import React, { useState } from 'react';
import { 
  ArrowLeft, User, Phone, Mail, Calendar, FileText, ChevronDown, ChevronUp, 
  CheckCircle, Clock, AlertTriangle, Download, Upload, Eye, Edit, Trash2,
  Building, MapPin, Shield, Award, Star, Flag, Search, Filter, Plus, MoreVertical, Activity
} from 'lucide-react';
import { Provider, VERIFICATION_STEPS } from '../../types';
import StepDetailSidebar from './StepDetailSidebar';

interface ProviderDetailProps {
  provider: Provider;
  onBack: () => void;
}

export default function ProviderDetail({ provider, onBack }: ProviderDetailProps) {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'verification' | 'history'>('overview');
  const [documentsView, setDocumentsView] = useState<'all' | 'provider-uploaded' | 'vera-pulled' | 'generated'>('all');
  const [searchDocuments, setSearchDocuments] = useState('');
  
  const [stepStatuses] = useState<Record<number, string>>({
    0: 'reviewed', 1: 'reviewed', 2: 'reviewed', 3: 'reviewed', 4: 'reviewed',
    5: 'reviewed', 6: 'reviewed', 7: 'reviewed', 8: 'reviewed', 9: 'reviewed',
    10: 'reviewed', 11: 'reviewed'
  });

  // Mock documents data
  const documents = [
    // Provider Uploaded Documents
    {
      id: '1',
      name: 'Medical License - California',
      type: 'Medical License',
      category: 'provider-uploaded',
      uploadedBy: provider.name,
      uploadedAt: '2024-01-10T09:00:00Z',
      size: '2.4 MB',
      format: 'PDF',
      status: 'verified',
      verificationStep: 'CA License',
      veraConfidence: 94
    },
    {
      id: '2',
      name: 'DEA Certificate',
      type: 'DEA License',
      category: 'provider-uploaded',
      uploadedBy: provider.name,
      uploadedAt: '2024-01-10T09:15:00Z',
      size: '1.8 MB',
      format: 'PDF',
      status: 'verified',
      verificationStep: 'DEA License',
      veraConfidence: 96
    },
    {
      id: '3',
      name: 'Board Certification - Cardiology',
      type: 'Board Certification',
      category: 'provider-uploaded',
      uploadedBy: provider.name,
      uploadedAt: '2024-01-10T10:30:00Z',
      size: '3.1 MB',
      format: 'PDF',
      status: 'verified',
      verificationStep: 'ABMS',
      veraConfidence: 98
    },
    {
      id: '4',
      name: 'CV and Application',
      type: 'Application',
      category: 'provider-uploaded',
      uploadedBy: provider.name,
      uploadedAt: '2024-01-10T08:45:00Z',
      size: '4.2 MB',
      format: 'PDF',
      status: 'verified',
      verificationStep: 'Application Review',
      veraConfidence: 92
    },
    // Vera Pulled Documents
    {
      id: '5',
      name: 'NPI Registry Verification',
      type: 'NPI Verification',
      category: 'vera-pulled',
      uploadedBy: 'Vera AI',
      uploadedAt: '2024-01-11T10:00:00Z',
      size: '156 KB',
      format: 'JSON',
      status: 'verified',
      verificationStep: 'NPI',
      veraConfidence: 99
    },
    {
      id: '6',
      name: 'NPDB Query Results',
      type: 'NPDB Report',
      category: 'vera-pulled',
      uploadedBy: 'Vera AI',
      uploadedAt: '2024-01-11T10:05:00Z',
      size: '2.8 MB',
      format: 'PDF',
      status: 'verified',
      verificationStep: 'NPDB',
      veraConfidence: 97
    },
    {
      id: '7',
      name: 'California Medical Board Verification',
      type: 'License Verification',
      category: 'vera-pulled',
      uploadedBy: 'Vera AI',
      uploadedAt: '2024-01-11T11:30:00Z',
      size: '892 KB',
      format: 'PDF',
      status: 'verified',
      verificationStep: 'CA License',
      veraConfidence: 95
    },
    {
      id: '8',
      name: 'DEA Registry Verification',
      type: 'DEA Verification',
      category: 'vera-pulled',
      uploadedBy: 'Vera AI',
      uploadedAt: '2024-01-11T12:00:00Z',
      size: '345 KB',
      format: 'JSON',
      status: 'verified',
      verificationStep: 'DEA License',
      veraConfidence: 98
    },
    {
      id: '9',
      name: 'ABMS Board Certification Verification',
      type: 'Board Verification',
      category: 'vera-pulled',
      uploadedBy: 'Vera AI',
      uploadedAt: '2024-01-11T14:15:00Z',
      size: '1.2 MB',
      format: 'PDF',
      status: 'verified',
      verificationStep: 'ABMS',
      veraConfidence: 96
    },
    {
      id: '10',
      name: 'OIG Sanctions Check',
      type: 'Sanctions Report',
      category: 'vera-pulled',
      uploadedBy: 'Vera AI',
      uploadedAt: '2024-01-11T15:00:00Z',
      size: '567 KB',
      format: 'PDF',
      status: 'verified',
      verificationStep: 'SanctionCheck',
      veraConfidence: 99
    },
    // Generated Documents
    {
      id: '11',
      name: 'Verification Summary Report',
      type: 'Summary Report',
      category: 'generated',
      uploadedBy: 'Vera AI',
      uploadedAt: '2024-01-12T09:00:00Z',
      size: '1.5 MB',
      format: 'PDF',
      status: 'completed',
      verificationStep: 'Final Decision',
      veraConfidence: 97
    },
    {
      id: '12',
      name: 'Credentialing Committee Package',
      type: 'Committee Package',
      category: 'generated',
      uploadedBy: 'Vera AI',
      uploadedAt: '2024-01-12T10:30:00Z',
      size: '8.7 MB',
      format: 'PDF',
      status: 'completed',
      verificationStep: 'Final Decision',
      veraConfidence: 98
    }
  ];

  const getStepStatus = (index: number) => {
    return stepStatuses[index] || 'pending';
  };

  const getDocumentIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf': return '📄';
      case 'json': return '📊';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📎';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'flagged': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'provider-uploaded': return 'bg-blue-50 border-blue-200';
      case 'vera-pulled': return 'bg-purple-50 border-purple-200';
      case 'generated': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'provider-uploaded': return { text: 'Provider Upload', color: 'bg-blue-100 text-blue-800' };
      case 'vera-pulled': return { text: 'Vera Pulled', color: 'bg-purple-100 text-purple-800' };
      case 'generated': return { text: 'AI Generated', color: 'bg-green-100 text-green-800' };
      default: return { text: 'Other', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesView = documentsView === 'all' || doc.category === documentsView;
    const matchesSearch = doc.name.toLowerCase().includes(searchDocuments.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchDocuments.toLowerCase());
    return matchesView && matchesSearch;
  });

  const completedSteps = Object.values(stepStatuses).filter(status => status === 'reviewed').length;
  const progressPercentage = (completedSteps / VERIFICATION_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>
        </div>

        {/* Provider Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            
            <div className="flex-1 grid grid-cols-4 gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{provider.name}</h2>
                <p className="text-lg text-gray-600">{provider.specialty}</p>
                <p className="text-sm text-gray-500">NPI: {provider.npi}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{provider.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{provider.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">General Hospital</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Examiner: {provider.assignedExaminer}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Due: {new Date(provider.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{documents.length} Documents</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Low Risk</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">97% Vera Confidence</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600 font-medium">Active Status</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Verification Progress</h3>
              <span className="text-sm text-gray-600">{completedSteps}/{VERIFICATION_STEPS.length} Complete ({Math.round(progressPercentage)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'verification', label: 'Verification Steps', icon: CheckCircle },
                { id: 'history', label: 'Activity History', icon: Clock }
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
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Provider Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Full Name:</span>
                      <span className="text-sm text-gray-900">{provider.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">NPI Number:</span>
                      <span className="text-sm text-gray-900">{provider.npi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Specialty:</span>
                      <span className="text-sm text-gray-900">{provider.specialty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(provider.status)}`}>
                        {provider.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Application Date:</span>
                      <span className="text-sm text-gray-900">{new Date(provider.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Credentialing Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Assigned Examiner:</span>
                      <span className="text-sm text-gray-900">{provider.assignedExaminer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Due Date:</span>
                      <span className="text-sm text-gray-900">{new Date(provider.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Risk Level:</span>
                      <span className="text-sm text-green-600 font-medium">Low</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Vera Confidence:</span>
                      <span className="text-sm text-blue-600 font-medium">97%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Documents:</span>
                      <span className="text-sm text-gray-900">{documents.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Document Management</h3>
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      <Plus className="w-4 h-4" />
                      <span>Add Document</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Download className="w-4 h-4" />
                      <span>Download All</span>
                    </button>
                  </div>
                </div>

                {/* Document Filters */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchDocuments}
                      onChange={(e) => setSearchDocuments(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                  
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setDocumentsView('all')}
                      className={`px-3 py-2 text-sm ${documentsView === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      All ({documents.length})
                    </button>
                    <button
                      onClick={() => setDocumentsView('provider-uploaded')}
                      className={`px-3 py-2 text-sm ${documentsView === 'provider-uploaded' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Provider ({documents.filter(d => d.category === 'provider-uploaded').length})
                    </button>
                    <button
                      onClick={() => setDocumentsView('vera-pulled')}
                      className={`px-3 py-2 text-sm ${documentsView === 'vera-pulled' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Vera ({documents.filter(d => d.category === 'vera-pulled').length})
                    </button>
                    <button
                      onClick={() => setDocumentsView('generated')}
                      className={`px-3 py-2 text-sm ${documentsView === 'generated' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Generated ({documents.filter(d => d.category === 'generated').length})
                    </button>
                  </div>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => {
                    const categoryBadge = getCategoryBadge(doc.category);
                    return (
                      <div key={doc.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getCategoryColor(doc.category)}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{getDocumentIcon(doc.format)}</span>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{doc.name}</h4>
                              <p className="text-xs text-gray-500">{doc.type}</p>
                            </div>
                          </div>
                          <button className="p-1 rounded hover:bg-white/50">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>

                        <div className="space-y-2 mb-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryBadge.color}`}>
                            {categoryBadge.text}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ml-2 ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                          <div>By: {doc.uploadedBy}</div>
                          <div>Size: {doc.size} • {doc.format}</div>
                          {doc.verificationStep && (
                            <div>Step: {doc.verificationStep}</div>
                          )}
                          {doc.veraConfidence && (
                            <div>Confidence: {doc.veraConfidence}%</div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                          <button className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded">
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                          <button className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded">
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Verification Steps</h3>
                
                {/* Timeline Steps */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    {VERIFICATION_STEPS.map((step, index) => {
                      const status = getStepStatus(index);
                      const isSelected = selectedStepIndex === index;
                      
                      return (
                        <div key={step} className="flex flex-col items-center relative">
                          {/* Connection Line */}
                          {index < VERIFICATION_STEPS.length - 1 && (
                            <div className="absolute top-6 left-full w-full h-0.5 bg-gray-200 z-0" style={{ width: 'calc(100% - 48px)', left: '24px' }}>
                              <div className="h-full bg-green-500 transition-all duration-500" style={{ width: '100%' }}></div>
                            </div>
                          )}
                          
                          {/* Step Circle */}
                          <button
                            onClick={() => setSelectedStepIndex(selectedStepIndex === index ? null : index)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 bg-green-500 ${
                              isSelected ? 'ring-4 ring-blue-200 scale-110' : 'hover:scale-105'
                            }`}
                          >
                            <CheckCircle className="w-6 h-6 text-white" />
                          </button>
                          
                          {/* Step Label */}
                          <div className="mt-2 text-center max-w-20">
                            <div className="text-xs font-medium text-gray-900 leading-tight">{step}</div>
                            <div className="text-xs mt-1 text-green-600">Complete</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Document Viewer */}
                {selectedStepIndex !== null && (
                  <div className="mt-8">
                    <StepDetailSidebar
                      stepName={VERIFICATION_STEPS[selectedStepIndex]}
                      stepNumber={selectedStepIndex + 1}
                      status={getStepStatus(selectedStepIndex)}
                      provider={provider}
                      onClose={() => setSelectedStepIndex(null)}
                      onStatusChange={() => {}}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Activity History</h3>
                <div className="space-y-6">
                  {/* File Access Log */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      File Access Log
                    </h4>
                    <div className="space-y-3">
                      {[
                        { user: 'John Doe', action: 'Opened provider file', time: '2024-01-16 2:30 PM', ip: '192.168.1.45' },
                        { user: 'Jane Smith', action: 'Reviewed NPI verification', time: '2024-01-16 11:45 AM', ip: '192.168.1.22' },
                        { user: 'Mike Johnson', action: 'Downloaded DEA certificate', time: '2024-01-16 9:15 AM', ip: '192.168.1.67' },
                        { user: 'Sarah Manager', action: 'Accessed complete file', time: '2024-01-15 4:20 PM', ip: '192.168.1.12' }
                      ].map((access, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{access.user}</p>
                              <p className="text-xs text-gray-600">{access.action}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{access.time}</p>
                            <p className="text-xs text-gray-400">IP: {access.ip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vera AI Activity */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2 text-purple-600" />
                      Vera AI Processing Log
                    </h4>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-4">
                      <h5 className="font-medium text-purple-900 mb-2">Vera's Comprehensive Analysis & Decisions:</h5>
                      <p className="text-sm text-purple-800 mb-2">
                        <strong>Top Level Results (TLR):</strong> Vera executed full credentialing verification using proprietary ML algorithms 
                        trained on 2.3M healthcare provider records. The system achieved 97% confidence by processing {provider.completedSteps} 
                        verification steps in 2.3 minutes, validating credentials against 15 primary source databases including NPDB, 
                        state licensing boards, DEA registry, and federal sanctions lists.
                      </p>
                      <p className="text-sm text-purple-800 mb-2">
                        <strong>Key AI Decisions Made:</strong> Auto-approved NPI verification (99% confidence), DEA registration 
                        (96% confidence), and license validation (94% confidence). Flagged {Math.floor(Math.random() * 2)} minor 
                        discrepancies for human review - all within acceptable risk parameters. Risk assessment: LOW based on 
                        zero adverse findings across all verification categories.
                      </p>
                      <p className="text-sm text-purple-800">
                        <strong>Final Recommendation:</strong> PROCEED TO COMMITTEE APPROVAL. All critical verification points validated 
                        successfully. No red flags detected. Provider meets all credentialing standards with high confidence scores 
                        across all verification categories. Estimated approval probability: 98.7%.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { 
                          action: 'Batch verification completed', 
                          details: 'Processed all 12 verification steps in 2.3 minutes using advanced ML models. Cross-referenced 15 databases with 100% API success rate.',
                          confidence: '97%',
                          time: '2024-01-15 9:00 AM',
                          status: 'success'
                        },
                        { 
                          action: 'Document analysis performed', 
                          details: 'OCR analysis of 24 documents achieved 98.9% accuracy. Extracted 147 data points, validated digital signatures, detected authentic watermarks.',
                          confidence: '94%',
                          time: '2024-01-15 9:01 AM',
                          status: 'success'
                        },
                        { 
                          action: 'Primary source verification', 
                          details: 'Real-time API verification: NPI Registry (validated), DEA database (active), CA Medical Board (good standing), NPDB (no adverse actions).',
                          confidence: '99%',
                          time: '2024-01-15 9:02 AM',
                          status: 'success'
                        },
                        { 
                          action: 'Risk assessment completed', 
                          details: 'Multi-factor risk analysis: malpractice history (clear), sanctions check (clear), license status (active), education verification (confirmed). Overall risk: LOW.',
                          confidence: '96%',
                          time: '2024-01-15 9:03 AM',
                          status: 'success'
                        }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Award className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  {activity.confidence} confidence
                                </span>
                                <span className="text-xs text-gray-500">{activity.time}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">{activity.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phone Call Transcripts */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-green-600" />
                      Phone Call Transcripts
                    </h4>
                    <div className="space-y-4">
                      {[
                        {
                          caller: 'John Doe (Examiner)',
                          recipient: 'Harvard Medical School Registrar',
                          duration: '4:23',
                          date: '2024-01-15 10:30 AM',
                          outcome: 'Verification letter requested and received'
                        },
                        {
                          caller: 'Jane Smith (Examiner)',
                          recipient: 'DEA Registration Office',
                          duration: '2:15',
                          date: '2024-01-15 2:45 PM',
                          purpose: 'DEA License Verification',
                          purpose: 'DEA License Verification',
                          transcript: `Examiner: "This is Jane Smith calling to verify a DEA registration for Dr. ${provider.name}, registration number BD1234567."

DEA Office: "Can you provide the full name and date of birth for verification?"

Examiner: "Dr. ${provider.name}, DOB March 15, 1975."

DEA Office: "Thank you. I can confirm that registration BD1234567 is active and valid through December 2025."`,
                          outcome: 'DEA registration confirmed active'
                        }
                      ].map((call, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Phone className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{call.caller} → {call.recipient}</p>
                                <p className="text-xs text-gray-600">{call.purpose}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{call.date}</p>
                              <p className="text-xs text-gray-500">Duration: {call.duration}</p>
                            </div>
                          </div>
                          <div className="bg-white rounded p-3 mb-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Call Transcript:</h5>
                            <div className="text-xs text-gray-600 whitespace-pre-line font-mono leading-relaxed">
                              {call.transcript}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Outcome: {call.outcome}
                            </span>
                            <button className="text-xs text-blue-600 hover:text-blue-800">
                              Download Audio Recording
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Activities */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      System Activities
                    </h4>
                    <div className="space-y-2">
                      {[
                        { action: 'Provider file created', user: 'System', time: '2024-01-10 8:00 AM', details: 'Initial application received and file opened' },
                        { action: 'Document uploaded', user: provider.name, time: '2024-01-10 9:30 AM', details: 'Medical license certificate uploaded' },
                        { action: 'Step completed', user: 'John Doe', time: '2024-01-15 10:45 AM', details: 'NPI verification marked as reviewed' },
                        { action: 'Status changed', user: 'Jane Smith', time: '2024-01-15 3:20 PM', details: 'File status updated to "Committee Ready"' },
                        { action: 'Committee flagged', user: 'System', time: '2024-01-15 3:21 PM', details: 'Automatically flagged for committee review based on risk assessment' },
                        { action: 'Email sent', user: 'System', time: '2024-01-15 3:22 PM', details: 'Notification sent to Medical Director about flagged file' }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{activity.action}</span>
                              <span className="text-xs text-gray-500">{activity.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">{activity.details}</span>
                              <span className="text-xs text-gray-500">by {activity.user}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}