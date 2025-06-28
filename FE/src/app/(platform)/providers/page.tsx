'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Plus, 
  Upload, 
  Download,
  Eye,
  Edit,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { DataTable, ExtendedColumnDef } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ApplicationsAPI } from '@/lib/api';
import { ApplicationDetailsView } from '@/types/applications';
import { getVerificationStatusColor, getVerificationStatusIcon } from '@/lib/utils';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const ProvidersPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationDetailsView[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });

  // Fetch applications from the view with pagination
  const fetchApplications = useCallback(async (page: number = 1, pageSize: number = 25, isPaginationRequest: boolean = false) => {
    if (isPaginationRequest) {
      setIsPaginating(true);
    } else {
      setLoading(true);
    }
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
      setIsPaginating(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchApplications(1, 10); // Use hardcoded initial values
  }, [fetchApplications]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchApplications(newPage, pagination.pageSize, true); // true indicates this is a pagination request
    }
  }, [pagination.totalPages, pagination.pageSize, fetchApplications]);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    fetchApplications(1, newPageSize); // Reset to page 1 when changing page size
  }, [fetchApplications]);

  // Action handlers
  const handleExport = () => {
    console.log('Export data');
    // TODO: Implement export functionality
  };

  const handleImport = () => {
    console.log('Import data');
    // TODO: Implement import functionality
  };

  const handleAddApplication = () => {
    console.log('Add new application');
    // TODO: Implement add application functionality
  };



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
      accessorKey: "npi_number",
      header: "NPI Number",
      cellRenderer: ({ value }) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {value || 'No NPI'}
        </div>
      ),
      enableSorting: true,
      enableFiltering: true,
      filterType: "text",
      width: 120,
    },

    {
      accessorKey: "verification_status",
      header: "Verification Status",
      cellRenderer: ({ value }) => {
        const IconComponent = getVerificationStatusIcon(value);
        return (
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getVerificationStatusColor(value)}`}>
            <IconComponent className="w-4 h-4" />
            <span>{value.replace('_', ' ')}</span>
          </div>
        );
      },
      enableSorting: true,
      enableFiltering: true,
      filterType: "select",
      filterOptions: [
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "Approved", value: "APPROVED" },
        { label: "Rejected", value: "REJECTED" },
        { label: "Pending", value: "PENDING" },
        { label: "Unknown", value: "UNKNOWN" },
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
            onClick={() => window.location.href = `/providers/${row.original.provider_id || row.original.id}`}
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
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Provider Verification Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive provider applications and practitioner verification details
          </p>
        </div>
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
      <div className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <DataTable
                data={applications}
                columns={columns}
                isLoading={loading}
                isPaginating={isPaginating}
                enableSorting={true}
                enableFiltering={true}
                enableColumnVisibility={true}
                enableRowSelection={false}
                enablePagination={false} // Disable internal pagination
                searchable={true}
                searchPlaceholder="Search by provider name, NPI, license number, or DEA number..."
                tableId="providers-table" // Unique ID for column preferences persistence
                enableRowAnimation={true}
                animationDelay={30} // Faster animation for better UX with many rows
                onRowClick={(row) => {
                  window.location.href = `/providers/${row.original.provider_id || row.original.id}`;
                }}
                toolbarActions={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                        <span>Actions</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleAddApplication}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Application
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleImport}>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
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
        </div>
      </div>
    </div>
  );
};

export default ProvidersPage; 