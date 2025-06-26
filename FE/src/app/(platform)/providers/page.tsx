'use client';

import React, { useEffect } from 'react';
import { Plus, Upload, Users, Clock, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { DataTable, ExtendedColumnDef } from '@/components/ui/data-table';
import { useApplicationsStore } from '@/stores/applicationsStore';
import { Application } from '@/types/applications';

const ProvidersPage: React.FC = () => {
  // Zustand store integration
  const applications = useApplicationsStore((state) => state.applications);
  const loading = useApplicationsStore((state) => state.loading);
  const error = useApplicationsStore((state) => state.error);
  const fetchApplications = useApplicationsStore((state) => state.fetchApplications);

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Calculate quick stats from real data
  const stats = {
    total: applications.length,
    submitted: applications.filter(app => app.status === 'SUBMITTED').length,
    underReview: applications.filter(app => app.status === 'UNDER_REVIEW').length,
    approved: applications.filter(app => app.status === 'APPROVED').length,
    rejected: applications.filter(app => app.status === 'REJECTED').length,
    pending: applications.filter(app => app.status === 'PENDING').length,
  };

  // Define table columns
  const columns: ExtendedColumnDef<Application>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cellRenderer: "text",
      enableSorting: true,
      width: 80,
    },
    {
      accessorKey: "npi_number",
      header: "NPI Number",
      cellRenderer: "text",
      enableSorting: true,
      enableFiltering: true,
      filterType: "text",
    },
    {
      accessorKey: "license_number",
      header: "License Number",
      cellRenderer: "text",
      enableSorting: true,
      enableFiltering: true,
      filterType: "text",
    },
    {
      accessorKey: "status",
      header: "Status",
      cellRenderer: "badge",
      enableSorting: true,
      enableFiltering: true,
      filterType: "select",
      filterOptions: [
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "Approved", value: "APPROVED" },
        { label: "Rejected", value: "REJECTED" },
        { label: "Pending", value: "PENDING" },
      ],
    },
    {
      accessorKey: "work_history",
      header: "Work History",
      cellRenderer: "badgeList",
      enableSorting: false,
      width: 200,
    },
    {
      accessorKey: "malpractice_insurance",
      header: "Insurance",
      cellRenderer: ({ value }) => {
        if (!value) return <span className="text-gray-400">No insurance</span>;
        return (
          <div className="text-sm">
            <div className="font-medium">{value.carrier}</div>
            <div className="text-gray-500">Until {new Date(value.coverage_end).toLocaleDateString()}</div>
          </div>
        );
      },
      enableSorting: false,
      width: 150,
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cellRenderer: "date",
      enableSorting: true,
      enableFiltering: true,
      filterType: "date",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cellRenderer: "actions",
      enableSorting: false,
      width: 100,
    },
  ];



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Provider Applications</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and track all provider applications and verifications
          </p>
        </div>
        <div className="flex items-center space-x-3">
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.submitted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Under Review</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.underReview}</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.rejected}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Applications</h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchApplications()}
            className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Applications ({applications.length})
          </h2>
        </div>

        <div className="p-6">
          <DataTable
            data={applications}
            columns={columns}
            isLoading={loading}
            enableSorting={true}
            enableFiltering={true}
            enableColumnVisibility={true}
            enableRowSelection={false}
            enablePagination={true}
            pageSize={10}
            searchable={true}
            searchPlaceholder="Search applications by NPI, license, or status..."
            onRowClick={(row) => {
              // Navigate to details page
              window.location.href = `/practitioners/${row.original.provider_id || row.original.id}`;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProvidersPage; 