import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Download, Calendar, User, FileText, 
  ChevronRight, ChevronLeft, Check, Settings, Upload, Eye,
  BarChart3, Database, Shield, Clock, AlertTriangle, CheckCircle
} from 'lucide-react';

interface AuditRequest {
  id: string;
  name: string;
  type: string;
  payer: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  files: number;
  createdBy: string;
  createdAt: string;
  sampleSize: number;
  providersIncluded: string[];
}

interface Template {
  id: string;
  name: string;
  payer: string;
  fieldsMap: Record<string, string>;
  requiredDocuments: string[];
  outputFormats: string[];
  createdBy: string;
  updatedAt: string;
}

export default function InteractiveReports() {
  const [activeView, setActiveView] = useState<'dashboard' | 'create-audit' | 'templates'>('dashboard');
  const [wizardStep, setWizardStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Audit creation state
  const [auditForm, setAuditForm] = useState({
    name: '',
    type: '',
    payer: '',
    templateId: '',
    sampleSize: 100,
    selectionLogic: 'random',
    outputFormats: ['xlsx', 'zip'],
    asOfDate: new Date().toISOString().split('T')[0]
  });

  // Sample audit requests
  const auditRequests: AuditRequest[] = [
    {
      id: '1',
      name: 'Aetna Q1 2024 Network Audit',
      type: 'Network Audit',
      payer: 'Aetna',
      status: 'complete',
      files: 125,
      createdBy: 'Sarah Compliance',
      createdAt: '2024-01-15T10:30:00Z',
      sampleSize: 125,
      providersIncluded: ['Dr. Smith', 'Dr. Johnson', 'Dr. Chen']
    },
    {
      id: '2',
      name: 'NCQA Recredentialing Sample',
      type: 'NCQA Recred',
      payer: 'NCQA',
      status: 'running',
      files: 0,
      createdBy: 'Mike Auditor',
      createdAt: '2024-01-16T09:15:00Z',
      sampleSize: 75,
      providersIncluded: []
    },
    {
      id: '3',
      name: 'CMS Medicare Enrollment Audit',
      type: 'CMS Audit',
      payer: 'CMS',
      status: 'queued',
      files: 0,
      createdBy: 'Linda Manager',
      createdAt: '2024-01-16T11:45:00Z',
      sampleSize: 200,
      providersIncluded: []
    }
  ];

  // Sample templates
  const templates: Template[] = [
    {
      id: '1',
      name: 'Aetna Network Audit 2024',
      payer: 'Aetna',
      fieldsMap: {
        'Provider Name': 'provider.full_name',
        'NPI': 'provider.npi',
        'License Number': 'licenses[0].number',
        'License Expiration': 'licenses[0].expiration_date',
        'DEA Number': 'dea.number',
        'Board Certification': 'board_certs[0].board_name'
      },
      requiredDocuments: ['State License', 'DEA', 'Board Certification', 'Malpractice Insurance'],
      outputFormats: ['xlsx', 'zip'],
      createdBy: 'Sarah Compliance',
      updatedAt: '2024-01-10T14:20:00Z'
    },
    {
      id: '2',
      name: 'NCQA Recredentialing 2024',
      payer: 'NCQA',
      fieldsMap: {
        'Provider Name': 'provider.full_name',
        'NPI': 'provider.npi',
        'Primary Specialty': 'provider.specialty',
        'License Status': 'licenses[0].status',
        'Board Expiration': 'board_certs[0].expiration_date'
      },
      requiredDocuments: ['State License', 'Board Certification', 'Work History', 'CME Credits'],
      outputFormats: ['xlsx', 'pdf'],
      createdBy: 'Mike Auditor',
      updatedAt: '2024-01-12T16:45:00Z'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'queued': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'queued': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleCreateAudit = () => {
    setActiveView('create-audit');
    setWizardStep(1);
  };

  const handleNextStep = () => {
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Reports Management</h1>
          <p className="text-gray-600 mt-1">Generate compliance audit packets and manage templates</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveView('templates')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Templates</span>
          </button>
          <button
            onClick={handleCreateAudit}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Audit</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900">{auditRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditRequests.filter(a => a.status === 'complete').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditRequests.filter(a => a.status === 'running' || a.status === 'queued').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Templates</p>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search audits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="complete">Completed</option>
              <option value="running">Running</option>
              <option value="queued">Queued</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {auditRequests.length} audits
          </div>
        </div>
      </div>

      {/* Audit Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audit Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type / Payer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sample Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditRequests.map((audit) => (
                <tr key={audit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{audit.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{audit.type}</div>
                    <div className="text-sm text-gray-500">{audit.payer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(audit.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(audit.status)}`}>
                        {audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.sampleSize} providers
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.status === 'complete' ? audit.files : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.createdBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(audit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {audit.status === 'complete' && (
                        <button className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-50">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderWizardStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Audit Name</label>
          <input
            type="text"
            value={auditForm.name}
            onChange={(e) => setAuditForm({...auditForm, name: e.target.value})}
            placeholder="e.g., Aetna Q1 2024 Network Audit"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Audit Type / Payer</label>
          <select
            value={auditForm.payer}
            onChange={(e) => setAuditForm({...auditForm, payer: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Payer</option>
            <option value="Aetna">Aetna</option>
            <option value="NCQA">NCQA</option>
            <option value="CMS">CMS</option>
            <option value="URAC">URAC</option>
            <option value="Humana">Humana</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
          <select
            value={auditForm.templateId}
            onChange={(e) => setAuditForm({...auditForm, templateId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Create New Template</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sample Size</label>
          <input
            type="number"
            value={auditForm.sampleSize}
            onChange={(e) => setAuditForm({...auditForm, sampleSize: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Selection Logic</label>
        <div className="space-y-2">
          {[
            { value: 'random', label: 'Random Sampling', desc: 'Randomly select providers from entire database' },
            { value: 'stratified', label: 'Stratified Sampling', desc: 'Sample by specialty, location, or other criteria' },
            { value: 'uploaded', label: 'Upload Provider List', desc: 'Upload specific NPI or provider IDs' }
          ].map(option => (
            <label key={option.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="selectionLogic"
                value={option.value}
                checked={auditForm.selectionLogic === option.value}
                onChange={(e) => setAuditForm({...auditForm, selectionLogic: e.target.value})}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-500">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {auditForm.selectionLogic === 'uploaded' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">Upload CSV with Provider IDs or NPIs</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Choose File
          </button>
        </div>
      )}
    </div>
  );

  const renderWizardStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Field Mapping</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-3 gap-4 font-medium text-gray-700">
                <span>Template Field</span>
                <span>Internal Field</span>
                <span>Required</span>
              </div>
            </div>
            {[
              { template: 'Provider Name', internal: 'provider.full_name', required: true },
              { template: 'NPI', internal: 'provider.npi', required: true },
              { template: 'License Number', internal: 'licenses[0].number', required: true },
              { template: 'License Expiration', internal: 'licenses[0].expiration_date', required: true },
              { template: 'DEA Number', internal: 'dea.number', required: false },
              { template: 'Board Certification', internal: 'board_certs[0].board_name', required: false }
            ].map((field, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{field.template}</span>
                <span className="text-sm text-gray-600 font-mono">{field.internal}</span>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.required}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
          <div className="space-y-2">
            {[
              'State License',
              'DEA Certificate',
              'Board Certification',
              'Malpractice Insurance',
              'Medicare/Medicaid Sanctions Check',
              'Work History',
              'CV/Resume',
              'CME Credits'
            ].map(doc => (
              <label key={doc} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  defaultChecked={['State License', 'DEA Certificate', 'Board Certification', 'Malpractice Insurance'].includes(doc)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">{doc}</span>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Output Format</h4>
            <div className="space-y-2">
              {[
                { value: 'xlsx', label: 'Excel Spreadsheet' },
                { value: 'csv', label: 'CSV File' },
                { value: 'pdf', label: 'PDF Report' },
                { value: 'zip', label: 'ZIP of Documents' }
              ].map(format => (
                <label key={format.value} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    defaultChecked={['xlsx', 'zip'].includes(format.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">{format.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Data As-Of Date</label>
            <input
              type="date"
              value={auditForm.asOfDate}
              onChange={(e) => setAuditForm({...auditForm, asOfDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderWizardStep3 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Preview Sample Data</h3>
        <p className="text-sm text-blue-800">Review the first 3 providers to ensure data mapping is correct</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NPI</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Expiration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[
              { name: 'Dr. Sarah Johnson', npi: '1234567890', license: 'CA-A12345', expiration: '2025-12-31', docs: 6 },
              { name: 'Dr. Michael Chen', npi: '2345678901', license: 'CA-B67890', expiration: '2025-06-30', docs: 8 },
              { name: 'Dr. Emily Davis', npi: '3456789012', license: 'CA-C11111', expiration: '2025-09-15', docs: 7 }
            ].map((provider, index) => (
              <tr key={index}>
                <td className="px-4 py-3 text-sm text-gray-900">{provider.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{provider.npi}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{provider.license}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{provider.expiration}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{provider.docs} files</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Sample Provider Document List:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>📄 CA Medical License.pdf</div>
          <div>📄 DEA Certificate.pdf</div>
          <div>📄 Board Certification - Cardiology.pdf</div>
          <div>📄 Malpractice Insurance Policy.pdf</div>
          <div>📄 NPDB Query Results.pdf</div>
          <div>📄 CV and Work History.pdf</div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Ready to Generate</h4>
        <div className="text-sm text-green-800 space-y-1">
          <div>• Audit will include {auditForm.sampleSize} randomly selected providers</div>
          <div>• Estimated generation time: 5-10 minutes</div>
          <div>• Output formats: Excel spreadsheet + ZIP of documents</div>
          <div>• All data frozen as of {new Date(auditForm.asOfDate).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="flex justify-center">
        <button className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
          Generate Audit Packet
        </button>
      </div>
    </div>
  );

  const renderCreateAudit = () => (
    <div className="max-w-4xl mx-auto">
      {/* Wizard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Create Audit Packet</h1>
          <button
            onClick={() => setActiveView('dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-4">
          {[
            { step: 1, title: 'Setup', desc: 'Define audit parameters' },
            { step: 2, title: 'Template & Fields', desc: 'Map data and documents' },
            { step: 3, title: 'Generate', desc: 'Preview and create packet' }
          ].map((item) => (
            <div key={item.step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                wizardStep >= item.step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {wizardStep > item.step ? <Check className="w-4 h-4" /> : item.step}
              </div>
              <div className="ml-3">
                <div className="font-medium text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
              {item.step < 3 && (
                <ChevronRight className="w-5 h-5 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {wizardStep === 1 && renderWizardStep1()}
        {wizardStep === 2 && renderWizardStep2()}
        {wizardStep === 3 && renderWizardStep3()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handlePrevStep}
          disabled={wizardStep === 1}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {wizardStep < 3 ? (
          <button
            onClick={handleNextStep}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="text-sm text-gray-500">
            Review and click "Generate Audit Packet" above
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'create-audit' && renderCreateAudit()}
        {activeView === 'templates' && (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Template Management</h2>
            <p className="text-gray-600">Template management interface will be implemented here</p>
          </div>
        )}
      </div>
    </div>
  );
}