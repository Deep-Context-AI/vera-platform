'use client';

import React, { useState } from 'react';
import { Search, Eye, FileText, Plus, Upload, Clock, AlertTriangle, Users, CheckCircle, Sliders } from 'lucide-react';
import { staticProviders } from '@/lib/data/staticProviders';
import { Provider } from '@/types/platform';
import Link from 'next/link';

interface FilterState {
  status: string[];
  priority: string[];
  dueDate: string;
  reviewer: string;
  specialty: string;
  progress: string;
}

const ProvidersPage: React.FC = () => {
  const [providers] = useState<Provider[]>(staticProviders);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'lastActivity' | 'name'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    dueDate: 'all',
    reviewer: 'all',
    specialty: 'all',
    progress: 'all'
  });

  // Get unique values for filter options
  const uniqueSpecialties = [...new Set(providers.map(p => p.specialty))].sort();

  const getDueDateCategory = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'thisWeek';
    if (diffDays <= 30) return 'thisMonth';
    if (diffDays <= 60) return 'nextMonth';
    return 'future';
  };

  const getProgressCategory = (percentage: number) => {
    if (percentage < 25) return 'just_started';
    if (percentage < 50) return 'in_progress';
    if (percentage < 75) return 'mostly_complete';
    if (percentage < 100) return 'almost_done';
    return 'complete';
  };

  const filteredProviders = providers.filter(provider => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.npi.includes(searchTerm) ||
      provider.id.includes(searchTerm);
    
    // Status filter
    const matchesStatus = filters.status.length === 0 || filters.status.includes(provider.status);
    
    // Priority filter
    const matchesPriority = filters.priority.length === 0 || filters.priority.includes(provider.priority);
    
    // Due date filter
    const matchesDueDate = filters.dueDate === 'all' || getDueDateCategory(provider.dueDate) === filters.dueDate;
    
    // Reviewer filter
    const matchesReviewer = filters.reviewer === 'all' || provider.assignedReviewer === filters.reviewer;
    
    // Specialty filter
    const matchesSpecialty = filters.specialty === 'all' || provider.specialty === filters.specialty;
    
    // Progress filter
    const matchesProgress = filters.progress === 'all' || getProgressCategory(provider.completionPercentage) === filters.progress;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDueDate && 
           matchesReviewer && matchesSpecialty && matchesProgress;
  }).sort((a, b) => {
    let aValue: string | number, bValue: string | number;
    
    switch (sortBy) {
      case 'dueDate':
        aValue = new Date(a.dueDate).getTime();
        bValue = new Date(b.dueDate).getTime();
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
        break;
      case 'lastActivity':
        aValue = new Date(a.lastActivity).getTime();
        bValue = new Date(b.lastActivity).getTime();
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Quick filter functions
  const setQuickFilter = (type: string) => {
    switch (type) {
      case 'urgent':
        setFilters({
          ...filters,
          priority: ['high'],
          status: ['pending', 'in-review'],
          dueDate: 'thisWeek'
        });
        break;
      case 'overdue':
        setFilters({
          ...filters,
          dueDate: 'overdue',
          status: [],
          priority: []
        });
        break;
      case 'pending_vera':
        setFilters({
          ...filters,
          reviewer: 'Vera AI',
          status: ['pending', 'in-review'],
          priority: []
        });
        break;
      case 'ready_for_review':
        setFilters({
          ...filters,
          status: ['verification-complete'],
          priority: []
        });
        break;
      case 'due_next_month':
        setFilters({
          ...filters,
          dueDate: 'nextMonth',
          status: [],
          priority: []
        });
        break;
      default:
        // Clear all filters
        setFilters({
          status: [],
          priority: [],
          dueDate: 'all',
          reviewer: 'all',
          specialty: 'all',
          progress: 'all'
        });
    }
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      dueDate: 'all',
      reviewer: 'all',
      specialty: 'all',
      progress: 'all'
    });
  };

  const toggleArrayFilter = (filterType: keyof FilterState, value: string) => {
    const currentArray = filters[filterType] as string[];
    if (currentArray.includes(value)) {
      setFilters({
        ...filters,
        [filterType]: currentArray.filter(item => item !== value)
      });
    } else {
      setFilters({
        ...filters,
        [filterType]: [...currentArray, value]
      });
    }
  };

  const getStatusColor = (status: Provider['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'in-review':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'verification-complete':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'on-hold':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority: Provider['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <span className="text-red-600 dark:text-red-400 font-medium">
          Overdue ({Math.abs(diffDays)} days)
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
          {diffDays === 0 ? 'Due Today' : `${diffDays} days`}
        </span>
      );
    } else {
      return (
        <span className="text-gray-700 dark:text-gray-300">
          {date.toLocaleDateString()}
        </span>
      );
    }
  };

  const VerificationSteps = ({ steps }: { steps: Provider['verificationSteps'] }) => (
    <div className="flex space-x-1">
      {Object.entries(steps).map(([key, completed]) => (
        <div
          key={key}
          className={`w-3 h-3 rounded-full border-2 ${
            completed ? 'bg-green-500 border-green-500' : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500'
          }`}
          title={key.replace(/_/g, ' ').toUpperCase()}
        />
      ))}
    </div>
  );

  // Quick stats
  const stats = {
    total: providers.length,
    pending: providers.filter(p => p.status === 'pending').length,
    inReview: providers.filter(p => p.status === 'in-review').length,
    approved: providers.filter(p => p.status === 'approved').length,
    overdue: providers.filter(p => getDueDateCategory(p.dueDate) === 'overdue').length,
    highPriority: providers.filter(p => p.priority === 'high').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Providers</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and track all provider verifications and credentials
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Provider</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Review</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.inReview}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.overdue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.highPriority}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setQuickFilter('urgent')}
          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
        >
          Urgent (High Priority + Due Soon)
        </button>
        <button
          onClick={() => setQuickFilter('overdue')}
          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
        >
          Overdue
        </button>
        <button
          onClick={() => setQuickFilter('ready_for_review')}
          className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
        >
          Ready for Review
        </button>
        <button
          onClick={() => setQuickFilter('due_next_month')}
          className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
        >
          Due Next Month
        </button>
        <button
          onClick={() => setQuickFilter('')}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search providers, specialties, NPIs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex items-center space-x-3">
                         <select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'lastActivity' | 'name')}
               className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
             >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="lastActivity">Sort by Last Activity</option>
              <option value="name">Sort by Name</option>
            </select>

            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Sliders className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <div className="space-y-2">
                  {['pending', 'in-review', 'verification-complete', 'approved', 'rejected', 'on-hold'].map(status => (
                    <label key={status} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => toggleArrayFilter('status', status)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{status.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                <div className="space-y-2">
                  {['high', 'medium', 'low'].map(priority => (
                    <label key={priority} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={() => toggleArrayFilter('priority', priority)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specialty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialty</label>
                <select
                  value={filters.specialty}
                  onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Specialties</option>
                  {uniqueSpecialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Providers ({filteredProviders.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredProviders.map((provider) => (
            <div key={provider.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{provider.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{provider.specialty}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">NPI: {provider.npi} • ID: {provider.id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {/* Status */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(provider.status)}`}>
                      {provider.status.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Priority</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(provider.priority)}`}>
                      {provider.priority}
                    </span>
                  </div>

                  {/* Due Date */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                    <div className="text-sm">
                      {formatDate(provider.dueDate)}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Progress</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${provider.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{provider.completionPercentage}%</span>
                    </div>
                  </div>

                  {/* Verification Steps */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Steps</p>
                    <VerificationSteps steps={provider.verificationSteps} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/practitioners/${provider.id}`}
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No providers found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvidersPage; 