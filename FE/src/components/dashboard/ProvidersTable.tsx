import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Download,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { Provider } from '@/types/platform';
import Link from 'next/link';

interface ProvidersTableProps {
  providers: Provider[];
}

type SortField = 'name' | 'specialty' | 'dueDate' | 'status' | 'priority' | 'completionPercentage' | 'submittedDate' | 'assignedReviewer' | 'none';
type SortDirection = 'asc' | 'desc';

const ProvidersTable: React.FC<ProvidersTableProps> = ({ providers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('submittedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const getStatusIcon = (status: Provider['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'in-review':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'verification-complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'on-hold':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
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

  const filteredAndSortedProviders = useMemo(() => {
    let filtered = providers.filter(provider => {
      const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          provider.npi.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || provider.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    if (sortField !== 'none') {
      filtered = filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        
        // Get the appropriate values based on sortField
        if (sortField === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else if (sortField === 'specialty') {
          aValue = a.specialty.toLowerCase();
          bValue = b.specialty.toLowerCase();
        } else if (sortField === 'dueDate') {
          aValue = a.dueDate;
          bValue = b.dueDate;
        } else if (sortField === 'status') {
          aValue = a.status;
          bValue = b.status;
        } else if (sortField === 'priority') {
          aValue = a.priority;
          bValue = b.priority;
        } else if (sortField === 'completionPercentage') {
          aValue = a.completionPercentage;
          bValue = b.completionPercentage;
        } else if (sortField === 'submittedDate') {
          aValue = a.submittedDate;
          bValue = b.submittedDate;
        } else if (sortField === 'assignedReviewer') {
          aValue = a.assignedReviewer.toLowerCase();
          bValue = b.assignedReviewer.toLowerCase();
        } else {
          return 0;
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [providers, searchTerm, sortField, sortDirection, statusFilter, priorityFilter]);

  const paginatedProviders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedProviders.slice(startIndex, endIndex);
  }, [filteredAndSortedProviders, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProviders.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th 
      className={`px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  const VerificationSteps = ({ steps }: { steps: Provider['verificationSteps'] }) => (
    <div className="flex space-x-1">
      {Object.entries(steps).slice(0, 5).map(([key, completed]) => (
        <div
          key={key}
          className={`w-2 h-2 rounded-full border ${
            completed ? 'bg-green-500 border-green-500' : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500'
          }`}
          title={key.replace(/_/g, ' ').toUpperCase()}
        />
      ))}
      {Object.keys(steps).length > 5 && (
        <MoreHorizontal className="w-3 h-3 text-gray-400" />
      )}
    </div>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <span className="text-red-600 dark:text-red-400 font-medium text-xs">
          Overdue
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="text-yellow-600 dark:text-yellow-400 font-medium text-xs">
          {diffDays === 0 ? 'Today' : `${diffDays}d`}
        </span>
      );
    } else {
      return (
        <span className="text-gray-700 dark:text-gray-300 text-xs">
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header Controls */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Provider Verifications ({filteredAndSortedProviders.length})
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm w-full sm:w-64"
              />
            </div>
            
            {/* Filters */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-review">In Review</option>
              <option value="verification-complete">Complete</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="on-hold">On Hold</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Container with proper scrolling */}
      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <SortableHeader field="name" className="sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 min-w-[200px]">Provider</SortableHeader>
                <SortableHeader field="specialty" className="min-w-[140px]">Specialty</SortableHeader>
                <SortableHeader field="status" className="min-w-[120px]">Status</SortableHeader>
                <SortableHeader field="priority" className="min-w-[90px]">Priority</SortableHeader>
                <SortableHeader field="completionPercentage" className="min-w-[100px]">Progress</SortableHeader>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                  Steps
                </th>
                <SortableHeader field="dueDate" className="min-w-[100px]">Due</SortableHeader>
                <SortableHeader field="assignedReviewer" className="min-w-[120px] hidden lg:table-cell">Reviewer</SortableHeader>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-3 py-4 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10 min-w-[200px] border-r border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{provider.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">NPI: {provider.npi}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {provider.id}</div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 min-w-[140px]">
                    <div className="truncate" title={provider.specialty}>
                      {provider.specialty}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap min-w-[120px]">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(provider.status)}`}>
                      {getStatusIcon(provider.status)}
                      <span className="capitalize truncate">
                        {provider.status.replace('-', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap min-w-[90px]">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(provider.priority)}`}>
                      {provider.priority}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap min-w-[100px]">
                    <div className="flex items-center">
                      <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${provider.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{provider.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap min-w-[120px]">
                    <VerificationSteps steps={provider.verificationSteps} />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap min-w-[100px]">
                    {formatDate(provider.dueDate)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 min-w-[120px] hidden lg:table-cell">
                    <div className="truncate" title={provider.assignedReviewer}>
                      {provider.assignedReviewer}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium min-w-[100px]">
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/practitioners/${provider.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                        title="Documents"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedProviders.length)} of {filteredAndSortedProviders.length} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProvidersTable; 