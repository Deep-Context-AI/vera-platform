import React, { useState } from 'react';
import { Search, Filter, Eye, CheckCircle, Clock, AlertTriangle, FileText, Calendar, User } from 'lucide-react';
import { Provider } from '../../types';

interface VerificationsDashboardProps {
  onSelectProvider: (provider: Provider) => void;
}

export default function VerificationsDashboard({ onSelectProvider }: VerificationsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('urgency');

  // Sample data - 50 providers with verification files that Vera has already pulled
  const verificationQueue: Provider[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      npi: '1234567890',
      email: 'sarah.johnson@email.com',
      phone: '(555) 123-4567',
      status: 'pending',
      assignedExaminer: 'John Doe',
      dueDate: '2024-01-16', // Due today - urgent
      createdAt: '2024-01-10',
      completedSteps: 8,
      totalSteps: 10
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
      dueDate: '2024-01-17', // Due tomorrow
      createdAt: '2024-01-08',
      completedSteps: 10,
      totalSteps: 10
    },
    {
      id: '3',
      name: 'Dr. Emily Davis',
      specialty: 'Pediatrics',
      npi: '3456789012',
      email: 'emily.davis@email.com',
      phone: '(555) 345-6789',
      status: 'pending',
      assignedExaminer: 'Mike Johnson',
      dueDate: '2024-01-18',
      createdAt: '2024-01-12',
      completedSteps: 7,
      totalSteps: 10
    },
    {
      id: '4',
      name: 'Dr. Robert Wilson',
      specialty: 'Orthopedics',
      npi: '4567890123',
      email: 'robert.wilson@email.com',
      phone: '(555) 456-7890',
      status: 'pending',
      assignedExaminer: 'John Doe',
      dueDate: '2024-01-20',
      createdAt: '2024-01-05',
      completedSteps: 9,
      totalSteps: 10
    },
    // Adding more providers to reach 50
    ...Array.from({ length: 46 }, (_, i) => ({
      id: `${i + 5}`,
      name: `Dr. Provider ${i + 5}`,
      specialty: ['Family Medicine', 'Internal Medicine', 'Emergency Medicine', 'Psychiatry', 'Radiology'][i % 5],
      npi: `${1000000000 + i}`,
      email: `provider${i + 5}@email.com`,
      phone: `(555) ${String(i + 100).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
      status: 'pending' as const,
      assignedExaminer: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Manager'][i % 4],
      dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completedSteps: Math.floor(Math.random() * 10) + 1,
      totalSteps: 10
    }))
  ];

  const getPriorityLevel = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 0) return 'overdue';
    if (daysUntilDue <= 1) return 'urgent';
    if (daysUntilDue <= 3) return 'high';
    if (daysUntilDue <= 7) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'text-red-700 bg-red-100';
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'Overdue';
      case 'urgent': return 'Due Today';
      case 'high': return 'Due Soon';
      case 'medium': return 'This Week';
      case 'low': return 'On Track';
      default: return 'Unknown';
    }
  };

  const getVerificationStatus = (completedSteps: number, totalSteps: number) => {
    if (completedSteps === totalSteps) return 'ready-for-review';
    if (completedSteps >= 7) return 'nearly-complete';
    return 'in-progress';
  };

  // Sort providers by urgency (most urgent first)
  const sortedProviders = [...verificationQueue].sort((a, b) => {
    const priorityOrder = { 'overdue': 0, 'urgent': 1, 'high': 2, 'medium': 3, 'low': 4 };
    const aPriority = getPriorityLevel(a.dueDate);
    const bPriority = getPriorityLevel(b.dueDate);
    
    if (aPriority !== bPriority) {
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    }
    
    // If same priority, sort by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const filteredProviders = sortedProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.npi.includes(searchTerm);
    
    const verificationStatus = getVerificationStatus(provider.completedSteps, provider.totalSteps);
    const matchesFilter = filterStatus === 'all' || verificationStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Review Queue</h1>
          <p className="text-gray-600 mt-1">Review and validate Vera's automated verification work</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Queue:</span>
            <span className="ml-2 font-semibold text-gray-900">{filteredProviders.length} providers</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredProviders.filter(p => getPriorityLevel(p.dueDate) === 'overdue').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Due Today</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredProviders.filter(p => getPriorityLevel(p.dueDate) === 'urgent').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Due Soon</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredProviders.filter(p => getPriorityLevel(p.dueDate) === 'high').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ready for Review</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredProviders.filter(p => getVerificationStatus(p.completedSteps, p.totalSteps) === 'ready-for-review').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(filteredProviders.reduce((acc, p) => acc + (p.completedSteps / p.totalSteps), 0) / filteredProviders.length * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
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
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="ready-for-review">Ready for Review</option>
                <option value="nearly-complete">Nearly Complete</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="urgency">Sort by Urgency</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="completion">Sort by Completion</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Provider List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vera Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Examiner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.map((provider) => {
                const priority = getPriorityLevel(provider.dueDate);
                const completionPercentage = (provider.completedSteps / provider.totalSteps) * 100;
                const veraConfidence = Math.floor(Math.random() * 20) + 80; // Random confidence 80-99%

                return (
                  <tr key={provider.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(priority)}`}>
                        {getPriorityText(priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                        <div className="text-sm text-gray-500">NPI: {provider.npi}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider.specialty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-3" style={{ width: '100px' }}>
                          <div
                            className={`h-2 rounded-full ${
                              completionPercentage === 100 ? 'bg-blue-500' :
                              completionPercentage >= 70 ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          {provider.completedSteps}/{provider.totalSteps}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ width: '60px' }}>
                          <div
                            className={`h-2 rounded-full ${
                              veraConfidence >= 90 ? 'bg-green-500' :
                              veraConfidence >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${veraConfidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{veraConfidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{provider.assignedExaminer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(provider.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => onSelectProvider(provider)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No providers found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}