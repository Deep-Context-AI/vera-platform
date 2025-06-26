'use client';

import { useApplicationsStore } from '@/stores/applicationsStore';
import { DataTable, ExtendedColumnDef, DefaultContextMenuItems } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Eye, Trash2, Copy } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/lib/api';
import { useEffect } from 'react';

export function ApplicationsDataTable() {
  // Subscribe to Zustand store
  const applications = useApplicationsStore((state) => state.applications);
  const loading = useApplicationsStore((state) => state.loading);
  const error = useApplicationsStore((state) => state.error);
  const fetchApplications = useApplicationsStore((state) => state.fetchApplications);
  const updateApplicationStatus = useApplicationsStore((state) => state.updateApplicationStatus);
  const deleteApplication = useApplicationsStore((state) => state.deleteApplication);

  // Load data on mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Define columns with custom renderers
  const columns: ExtendedColumnDef<Application>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cellRenderer: ({ value }) => (
        <Badge variant="outline" className="font-mono">
          #{value}
        </Badge>
      ),
      enableSorting: true,
      enableFiltering: true,
      filterType: 'number',
      width: 100,
    },
    {
      accessorKey: 'npi_number',
      header: 'NPI Number',
      cellRenderer: 'text',
      enableSorting: true,
      enableFiltering: true,
      contextMenuRenderer: ({ value, row }) => (
        <DefaultContextMenuItems
          row={row}
          onCopy={() => navigator.clipboard.writeText(value || '')}
          onView={() => console.log('View NPI details:', value)}
        />
      ),
      width: 150,
    },
    {
      accessorKey: 'license_number',
      header: 'License',
      cellRenderer: 'text',
      enableSorting: true,
      enableFiltering: true,
      width: 120,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cellRenderer: ({ value, row, table }) => {
        const handleStatusChange = async (newStatus: ApplicationStatus) => {
          await updateApplicationStatus(row.original.id, newStatus);
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge 
                variant={
                  value?.toLowerCase().includes('approved') ? 'default' :
                  value?.toLowerCase().includes('pending') ? 'secondary' :
                  value?.toLowerCase().includes('rejected') ? 'destructive' :
                  'outline'
                }
                className="cursor-pointer"
              >
                {value || 'Unknown'}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusChange('SUBMITTED')}>
                Submitted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('UNDER_REVIEW')}>
                Under Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('APPROVED')}>
                Approved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('REJECTED')}>
                Rejected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: true,
      enableFiltering: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Under Review', value: 'UNDER_REVIEW' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Pending', value: 'PENDING' },
      ],
      width: 140,
    },
    {
      accessorKey: 'work_history',
      header: 'Work History',
      cellRenderer: 'badgeList',
      enableSorting: false,
      enableFiltering: false,
      contextMenuRenderer: ({ value, row }) => (
        <DefaultContextMenuItems
          row={row}
          onView={() => console.log('View work history:', value)}
        />
      ),
      width: 200,
    },
    {
      accessorKey: 'malpractice_insurance',
      header: 'Insurance',
      cellRenderer: ({ value }) => {
        if (!value) return <span className="text-gray-400">—</span>;
        
        return (
          <div className="text-sm">
            <div className="font-medium">{value.carrier}</div>
            <div className="text-gray-500 text-xs">
              Until: {new Date(value.coverage_end).toLocaleDateString()}
            </div>
          </div>
        );
      },
      enableSorting: false,
      enableFiltering: true,
      width: 180,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cellRenderer: 'date',
      enableSorting: true,
      enableFiltering: true,
      filterType: 'date',
      width: 120,
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cellRenderer: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log('View', row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Edit', row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Application
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(row.original))}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Data
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => deleteApplication(row.original.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableFiltering: false,
      enableHiding: false,
      width: 80,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
          <p className="text-sm text-gray-600">
            Manage and review practitioner applications
          </p>
        </div>
      </div>

      <DataTable
        data={applications}
        columns={columns}
        isLoading={loading}
        error={error}
        onRefresh={fetchApplications}
        enableSorting={true}
        enableFiltering={true}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={25}
        searchable={true}
        searchPlaceholder="Search applications..."
        onRowClick={(row) => console.log('Row clicked:', row.original)}
        onRowDoubleClick={(row) => console.log('Row double-clicked:', row.original)}
        className="bg-white rounded-lg shadow"
      />
    </div>
  );
} 