'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Plus, 
  Upload, 
  Users, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Shield,
  AlertCircle,
  Download,
  Eye,
  Edit
} from 'lucide-react';
import { DataTable, ExtendedColumnDef } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { ApplicationsAPI } from '@/lib/api';
import { ApplicationDetailsView } from '@/types/applications';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const ProvidersPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationDetailsView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });

  // Fetch applications from the view with pagination
  const fetchApplications = useCallback(async (page: number = 1, pageSize: number = 25) => {
    setLoading(true);
    setError(null);
    
    try {
      const offset = (page - 1) * pageSize;
      
      // Fetch applications from the view with pagination
      const { data: appsData, error: appsError } = await ApplicationsAPI.getApplicationDetailsFromView({
        limit: pageSize,
        offset: offset
      });

      if (appsError) {
        setError(appsError.message || 'Failed to fetch applications');
        return;
      }

      // Get total count for pagination (we'll need a separate API call for this)
      const { data: allData } = await ApplicationsAPI.getApplicationDetailsFromView({
        limit: 1000000 // Large number to get all records for count
      });

      const totalCount = allData?.length || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      setApplications(appsData || []);
      setPagination({
        page,
        pageSize,
        total: totalCount,
        totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchApplications(1, 10); // Use hardcoded initial values
  }, [fetchApplications]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchApplications(newPage, pagination.pageSize);
    }
  }, [pagination.totalPages, pagination.pageSize, fetchApplications]);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    fetchApplications(1, newPageSize); // Reset to page 1 when changing page size
  }, [fetchApplications]);

  // Calculate enhanced stats from the current page data
  const stats = {
    total: pagination.total,
    verified: applications.filter(app => app.verification_status === 'VERIFIED').length,
    npiMissing: applications.filter(app => app.verification_status === 'NPI_MISSING').length,
    npiInactive: applications.filter(app => app.verification_status === 'NPI_INACTIVE').length,
    submitted: applications.filter(app => app.status === 'SUBMITTED').length,
    underReview: applications.filter(app => app.status === 'UNDER_REVIEW').length,
    approved: applications.filter(app => app.status === 'APPROVED').length,
  };

  // Get verification status badge color
  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      case 'NPI_MISSING':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      case 'NPI_INACTIVE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
      case 'UNDER_REVIEW':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get verification status icon
  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Shield className="w-4 h-4 text-green-600" />;
      case 'NPI_MISSING':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'NPI_INACTIVE':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'UNDER_REVIEW':
        return <Clock className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // Skeleton loading component for stats
  const StatsCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-5 w-5" />
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-6 w-8" />
        </div>
      </div>
    </div>
  );

  // Skeleton loading component for table rows
  const TableRowSkeleton = () => (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-12" />
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-24 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
        </div>
      </td>
    </tr>
  );

  // Define enhanced table columns using the view data
  const columns: ExtendedColumnDef<ApplicationDetailsView>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cellRenderer: "text",
      enableSorting: true,
      width: 80,
    },
    {
      accessorKey: "full_name",
      header: "Provider Name",
      cellRenderer: ({ value, row }) => {
        const app = row.original;
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {value || `${app.practitioner_first_name || ''} ${app.practitioner_last_name || ''}`.trim() || 'Unknown'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ID: {app.provider_id || 'N/A'}
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableFiltering: true,
      filterType: "text",
      width: 200,
    },
    {
      accessorKey: "npi_number_verified",
      header: "NPI Number",
      cellRenderer: ({ row }) => {
        const app = row.original;
        return (
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {app.npi_number_verified || app.npi_number || 'No NPI'}
          </div>
        );
      },
      enableSorting: true,
      enableFiltering: true,
      filterType: "text",
      width: 120,
    },
    {
      accessorKey: "npi_description",
      header: "Specialty/Description",
      cellRenderer: ({ value, row }) => {
        const app = row.original;
        return (
          <div>
            {value && (
              <div className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                {value}
              </div>
            )}
            {app.npi_taxonomy_code && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Code: {app.npi_taxonomy_code}
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
      width: 200,
    },
    {
      accessorKey: "verification_status",
      header: "Verification Status",
      cellRenderer: ({ value }) => (
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getVerificationStatusColor(value)}`}>
          {getVerificationStatusIcon(value)}
          <span>{value.replace('_', ' ')}</span>
        </div>
      ),
      enableSorting: true,
      enableFiltering: true,
      filterType: "select",
      filterOptions: [
        { label: "Verified", value: "VERIFIED" },
        { label: "NPI Missing", value: "NPI_MISSING" },
        { label: "NPI Inactive", value: "NPI_INACTIVE" },
        { label: "Approved", value: "APPROVED" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Pending", value: "PENDING" },
      ],
      width: 150,
    },
    {
      accessorKey: "license_number",
      header: "License",
      cellRenderer: ({ value, row }) => {
        const app = row.original;
        return (
          <div>
            {value && (
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {value}
              </div>
            )}
            {app.dea_number && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                DEA: {app.dea_number}
              </div>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableFiltering: true,
      filterType: "text",
      width: 120,
    },

    {
      accessorKey: "created_at",
      header: "Created",
      cellRenderer: "date",
      enableSorting: true,
      enableFiltering: true,
      filterType: "date",
      width: 120,
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cellRenderer: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.location.href = `/practitioners/${row.original.provider_id || row.original.id}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
      enableSorting: false,
      width: 100,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Provider Verification Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive provider applications with NPI verification and practitioner details
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {loading ? (
          // Show skeleton loading for stats
          <>
            {Array.from({ length: 7 }).map((_, index) => (
              <StatsCardSkeleton key={index} />
            ))}
          </>
        ) : (
          // Show actual stats
          <>
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
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.verified}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">NPI Missing</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.npiMissing}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">NPI Inactive</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.npiInactive}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.approved}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Under Review</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.underReview}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.submitted}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Provider Data</h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchApplications(pagination.page, pagination.pageSize)}
            className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Enhanced Applications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Provider Applications with Verification Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete provider information with NPI verification status and practitioner details
              </p>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            // Show skeleton loading for table
            <div className="space-y-4">
              {/* Search bar skeleton */}
              <div className="flex items-center space-x-4 mb-6">
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
              
              {/* Table skeleton */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3"><Skeleton className="h-4 w-8" /></th>
                      <th className="px-6 py-3"><Skeleton className="h-4 w-24" /></th>
                      <th className="px-6 py-3"><Skeleton className="h-4 w-28" /></th>
                      <th className="px-6 py-3"><Skeleton className="h-4 w-32" /></th>
                      <th className="px-6 py-3"><Skeleton className="h-4 w-24" /></th>
                      <th className="px-6 py-3"><Skeleton className="h-4 w-16" /></th>
                      <th className="px-6 py-3"><Skeleton className="h-4 w-20" /></th>
                      <th className="px-6 py-3"><Skeleton className="h-4 w-16" /></th>
                      <th className="px-6 py-3"><Skeleton className="h-4 w-16" /></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from({ length: pagination.pageSize }).map((_, index) => (
                      <TableRowSkeleton key={index} />
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination skeleton */}
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="flex items-center space-x-6">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <DataTable
                data={applications}
                columns={columns}
                isLoading={false}
                enableSorting={true}
                enableFiltering={true}
                enableColumnVisibility={true}
                enableRowSelection={false}
                enablePagination={false} // Disable internal pagination
                searchable={true}
                searchPlaceholder="Search by provider name, NPI, license, specialty, or taxonomy code..."
                onRowClick={(row) => {
                  window.location.href = `/practitioners/${row.original.provider_id || row.original.id}`;
                }}
              />
              
              {/* Custom Server-Side Pagination */}
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Rows per page:
                  </p>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProvidersPage; 