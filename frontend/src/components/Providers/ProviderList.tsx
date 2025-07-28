import { useState } from 'react';
import { Search, ChevronDown, Eye, Edit, MoreVertical, Plus, Download, Upload, FileText, Calendar, Building, User, Phone, Mail } from 'lucide-react';
import { Provider } from '../../types';

interface ProviderListProps {
  onSelectProvider: () => void; // Navigate to hardcoded application ID 16000
}

export default function ProviderList({ onSelectProvider }: ProviderListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFacility, setFilterFacility] = useState('all');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Enhanced provider data with more statuses and information
  const providers: (Provider & { 
    facility: string;
    credentialingDate?: string;
    expirationDate?: string;
    documentsCount: number;
    lastActivity: string;
    risk: 'low' | 'medium' | 'high';
  })[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      npi: '1234567890',
      email: 'sarah.johnson@email.com',
      phone: '(555) 123-4567',
      status: 'active',
      assignedExaminer: 'John Doe',
      dueDate: '2024-01-25',
      createdAt: '2024-01-10',
      completedSteps: 10,
      totalSteps: 10,
      facility: 'General Hospital',
      credentialingDate: '2023-06-15',
      expirationDate: '2025-06-15',
      documentsCount: 24,
      lastActivity: '2024-01-15',
      risk: 'low'
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Neurology',
      npi: '2345678901',
      email: 'michael.chen@email.com',
      phone: '(555) 234-5678',
      status: 'pending',
      assignedExaminer: 'Jane Smith',
      dueDate: '2024-01-20',
      createdAt: '2024-01-08',
      completedSteps: 5,
      totalSteps: 10,
      facility: 'Medical Center',
      documentsCount: 12,
      lastActivity: '2024-01-14',
      risk: 'medium'
    },
    {
      id: '3',
      name: 'Dr. Emily Davis',
      specialty: 'Pediatrics',
      npi: '3456789012',
      email: 'emily.davis@email.com',
      phone: '(555) 345-6789',
      status: 'active',
      assignedExaminer: 'Mike Johnson',
      dueDate: '2024-01-30',
      createdAt: '2024-01-12',
      completedSteps: 10,
      totalSteps: 10,
      facility: 'Children\'s Hospital',
      credentialingDate: '2023-03-20',
      expirationDate: '2025-03-20',
      documentsCount: 28,
      lastActivity: '2024-01-13',
      risk: 'low'
    },
    {
      id: '4',
      name: 'Dr. Robert Wilson',
      specialty: 'Orthopedics',
      npi: '4567890123',
      email: 'robert.wilson@email.com',
      phone: '(555) 456-7890',
      status: 'suspended',
      assignedExaminer: 'John Doe',
      dueDate: '2024-01-18',
      createdAt: '2024-01-05',
      completedSteps: 3,
      totalSteps: 10,
      facility: 'Surgery Center',
      documentsCount: 8,
      lastActivity: '2024-01-10',
      risk: 'high'
    },
    // Add more providers for comprehensive testing
    ...Array.from({ length: 46 }, (_, i) => ({
      id: `${i + 5}`,
      name: `Dr. Provider ${i + 5}`,
      specialty: ['Family Medicine', 'Internal Medicine', 'Emergency Medicine', 'Psychiatry', 'Radiology', 'Anesthesiology', 'Pathology', 'Dermatology'][i % 8],
      npi: `${1000000000 + i}`,
      email: `provider${i + 5}@email.com`,
      phone: `(555) ${String(i + 100).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
      status: ['active', 'pending', 'suspended', 'expired', 'provisional'][i % 5] as Provider['status'],
      assignedExaminer: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Manager'][i % 4],
      dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - (i + 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completedSteps: Math.floor(Math.random() * 10) + 1,
      totalSteps: 10,
      facility: ['General Hospital', 'Medical Center', 'Clinic Network', 'Surgery Center', 'Urgent Care'][i % 5],
      credentialingDate: Math.random() > 0.3 ? new Date(Date.now() - (i + 100) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      expirationDate: Math.random() > 0.3 ? new Date(Date.now() + (365 + i * 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      documentsCount: Math.floor(Math.random() * 25) + 5,
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
    }))
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'provisional': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get unique values for filter options
  const facilities = [...new Set(providers.map(p => p.facility))];
  const specialties = [...new Set(providers.map(p => p.specialty))];

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.npi.includes(searchTerm) ||
                         provider.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || provider.status === filterStatus;
    const matchesFacility = filterFacility === 'all' || provider.facility === filterFacility;
    const matchesSpecialty = filterSpecialty === 'all' || provider.specialty === filterSpecialty;
    
    return matchesSearch && matchesStatus && matchesFacility && matchesSpecialty;
  });

  // Sort providers
  const sortedProviders = [...filteredProviders].sort((a, b) => {
    let aValue: string | number | Date, bValue: string | number | Date;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'specialty':
        aValue = a.specialty;
        bValue = b.specialty;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'facility':
        aValue = a.facility;
        bValue = b.facility;
        break;
      case 'lastActivity':
        aValue = new Date(a.lastActivity);
        bValue = new Date(b.lastActivity);
        break;
      case 'documentsCount':
        aValue = a.documentsCount;
        bValue = b.documentsCount;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const statusCounts = {
    all: providers.length,
    active: providers.filter(p => p.status === 'active').length,
    pending: providers.filter(p => p.status === 'pending').length,
    suspended: providers.filter(p => p.status === 'suspended').length,
    expired: providers.filter(p => p.status === 'expired').length,
    provisional: providers.filter(p => p.status === 'provisional').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Management</h1>
          <p className="text-gray-600 mt-1">Manage all providers, their credentials, and documents</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export All</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Provider</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600 capitalize">
                {status === 'all' ? 'Total Providers' : status}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search providers, NPI, facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="provisional">Provisional</option>
            </select>

            <select
              value={filterFacility}
              onChange={(e) => setFilterFacility(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Facilities</option>
              {facilities.map(facility => (
                <option key={facility} value={facility}>{facility}</option>
              ))}
            </select>

            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>

            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {sortedProviders.length} of {providers.length} providers
        </div>
      </div>

      {/* Provider Display */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>Provider</span>
                      {sortBy === 'name' && (
                        <ChevronDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('specialty')}>
                    <div className="flex items-center space-x-1">
                      <span>Specialty</span>
                      {sortBy === 'specialty' && (
                        <ChevronDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('facility')}>
                    <div className="flex items-center space-x-1">
                      <span>Facility</span>
                      {sortBy === 'facility' && (
                        <ChevronDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}>
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortBy === 'status' && (
                        <ChevronDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('documentsCount')}>
                    <div className="flex items-center space-x-1">
                      <span>Documents</span>
                      {sortBy === 'documentsCount' && (
                        <ChevronDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('lastActivity')}>
                    <div className="flex items-center space-x-1">
                      <span>Last Activity</span>
                      {sortBy === 'lastActivity' && (
                        <ChevronDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                          <div className="text-sm text-gray-500">NPI: {provider.npi}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider.specialty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-1" />
                        {provider.facility}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(provider.status)}`}>
                        {provider.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(provider.completedSteps, provider.totalSteps)}`}
                            style={{ width: `${(provider.completedSteps / provider.totalSteps) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {provider.completedSteps}/{provider.totalSteps}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getRiskColor(provider.risk)}`}>
                        {provider.risk.charAt(0).toUpperCase() + provider.risk.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FileText className="w-4 h-4 text-gray-400 mr-1" />
                        {provider.documentsCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(provider.lastActivity).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectProvider()}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50"
                          title="View Provider"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-50"
                          title="Edit Provider"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-50"
                          title="More Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProviders.map((provider) => (
            <div key={provider.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onSelectProvider()}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{provider.name}</h3>
                  <p className="text-sm text-gray-500">{provider.specialty}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  {provider.facility}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {provider.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {provider.phone}
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(provider.status)}`}>
                  {provider.status}
                </span>
                <span className={`text-sm font-medium ${getRiskColor(provider.risk)}`}>
                  {provider.risk.charAt(0).toUpperCase() + provider.risk.slice(1)} Risk
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{provider.completedSteps}/{provider.totalSteps}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(provider.completedSteps, provider.totalSteps)}`}
                    style={{ width: `${(provider.completedSteps / provider.totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {provider.documentsCount} docs
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(provider.lastActivity).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedProviders.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No providers found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}