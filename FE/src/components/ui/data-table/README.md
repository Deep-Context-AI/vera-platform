# Flexible Data Table System

A comprehensive, reusable data table component built on [shadcn/ui](https://ui.shadcn.com/docs/components/data-table#introduction) primitives and TanStack Table, designed for seamless integration with Zustand state management.

## Features

✅ **Extensible Cell Rendering** - Built-in renderers + custom strategies  
✅ **Smart Column Headers** - Sorting, filtering, and visibility controls  
✅ **Context Menus** - Per-cell and per-column right-click actions  
✅ **Global Search** - Deep search through all data including nested objects  
✅ **Advanced Filtering** - Column-specific filters with different input types  
✅ **Zustand Integration** - Direct integration with your state management  
✅ **TypeScript First** - Full type safety and IntelliSense support  
✅ **Responsive Design** - Mobile-friendly with proper overflow handling

## Quick Start

```tsx
import { DataTable, ExtendedColumnDef } from "@/components/ui/data-table";
import { useApplicationsStore } from "@/stores/applicationsStore";

const columns: ExtendedColumnDef<Application>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cellRenderer: "text",
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    cellRenderer: "badge",
    enableFiltering: true,
    filterType: "select",
    filterOptions: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
];

function MyTable() {
  const data = useApplicationsStore((state) => state.applications);
  const loading = useApplicationsStore((state) => state.loading);

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={loading}
      searchable={true}
      enablePagination={true}
    />
  );
}
```

## Built-in Cell Renderers

### Text Renderer

```tsx
{
  accessorKey: 'name',
  header: 'Name',
  cellRenderer: 'text', // Basic text display
}
```

### Badge Renderer

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  cellRenderer: 'badge', // Colored badge based on value
}
```

### Badge List Renderer

```tsx
{
  accessorKey: 'tags',
  header: 'Tags',
  cellRenderer: 'badgeList', // Array of values as badges
}
```

### Currency Renderer

```tsx
{
  accessorKey: 'amount',
  header: 'Amount',
  cellRenderer: 'currency', // Formatted currency display
}
```

### Date Renderer

```tsx
{
  accessorKey: 'created_at',
  header: 'Created',
  cellRenderer: 'date', // Formatted date display
}
```

### Status Renderer

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  cellRenderer: 'status', // Colored status indicators
}
```

### Actions Renderer

```tsx
{
  accessorKey: 'actions',
  header: 'Actions',
  cellRenderer: 'actions', // Dropdown menu with common actions
}
```

## Custom Cell Renderers

### Inline Custom Renderer

```tsx
{
  accessorKey: 'complex_data',
  header: 'Complex Data',
  cellRenderer: ({ value, row, column, table }) => (
    <div className="custom-cell">
      <strong>{value.title}</strong>
      <p className="text-sm text-gray-500">{value.description}</p>
    </div>
  ),
}
```

### Zustand-Integrated Renderer

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  cellRenderer: ({ value, row }) => {
    const updateStatus = useApplicationsStore(state => state.updateApplicationStatus);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge className="cursor-pointer">{value}</Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => updateStatus(row.original.id, 'APPROVED')}>
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus(row.original.id, 'REJECTED')}>
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}
```

## Column Headers

### Basic Header

```tsx
{
  accessorKey: 'name',
  header: 'Name',
  enableSorting: true,
  enableFiltering: true,
}
```

### Custom Header Renderer

```tsx
{
  accessorKey: 'priority',
  header: 'Priority',
  headerRenderer: ({ column, title, isFiltered }) => (
    <div className="flex items-center gap-2">
      <span>{title}</span>
      {isFiltered && <Badge variant="secondary" className="text-xs">Filtered</Badge>}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting()}
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </div>
  ),
}
```

### Filter Types

```tsx
// Text filter
{
  accessorKey: 'name',
  header: 'Name',
  enableFiltering: true,
  filterType: 'text', // Default
}

// Select filter
{
  accessorKey: 'status',
  header: 'Status',
  enableFiltering: true,
  filterType: 'select',
  filterOptions: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
}

// Number filter
{
  accessorKey: 'amount',
  header: 'Amount',
  enableFiltering: true,
  filterType: 'number',
}

// Date filter
{
  accessorKey: 'created_at',
  header: 'Created',
  enableFiltering: true,
  filterType: 'date',
}
```

## Context Menus

### Default Context Menu

```tsx
{
  accessorKey: 'name',
  header: 'Name',
  contextMenuRenderer: ({ row }) => (
    <DefaultContextMenuItems
      row={row}
      onView={(data) => console.log('View:', data)}
      onEdit={(data) => console.log('Edit:', data)}
      onDelete={(data) => console.log('Delete:', data)}
      onCopy={(data) => navigator.clipboard.writeText(JSON.stringify(data))}
    />
  ),
}
```

### Custom Context Menu

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  contextMenuRenderer: ({ value, row }) => (
    <>
      <div
        className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
        onClick={() => handleApprove(row.original.id)}
      >
        Quick Approve
      </div>
      <div
        className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
        onClick={() => handleReject(row.original.id)}
      >
        Quick Reject
      </div>
      <div className="border-t border-gray-200 my-1" />
      <div
        className="px-2 py-1.5 text-sm hover:bg-red-50 text-red-600 cursor-pointer"
        onClick={() => handleDelete(row.original.id)}
      >
        Delete Application
      </div>
    </>
  ),
}
```

## Advanced Search

The global search automatically handles:

- **Primitive values** (strings, numbers, booleans)
- **Nested objects** (searches through all properties)
- **Arrays** (searches through array items and their properties)
- **Complex data structures** (work_history, malpractice_insurance, etc.)

```tsx
<DataTable
  data={applications}
  columns={columns}
  searchable={true}
  searchPlaceholder="Search applications, NPI, license, work history..."
/>
```

## Zustand Integration Example

```tsx
function ApplicationsDataTable() {
  // Direct Zustand integration
  const applications = useApplicationsStore((state) => state.applications);
  const loading = useApplicationsStore((state) => state.loading);
  const error = useApplicationsStore((state) => state.error);
  const fetchApplications = useApplicationsStore(
    (state) => state.fetchApplications
  );
  const updateStatus = useApplicationsStore(
    (state) => state.updateApplicationStatus
  );
  const deleteApp = useApplicationsStore((state) => state.deleteApplication);

  const columns: ExtendedColumnDef<Application>[] = [
    {
      accessorKey: "status",
      header: "Status",
      cellRenderer: ({ value, row }) => (
        <StatusDropdown
          value={value}
          onChange={(newStatus) => updateStatus(row.original.id, newStatus)}
        />
      ),
      contextMenuRenderer: ({ row }) => (
        <DefaultContextMenuItems
          row={row}
          onDelete={(data) => deleteApp(data.id)}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={applications}
      columns={columns}
      isLoading={loading}
      error={error}
      onRefresh={fetchApplications}
    />
  );
}
```

## Configuration Options

```tsx
interface DataTableConfig {
  data: TData[];
  columns: ExtendedColumnDef<TData>[];
  enableSorting?: boolean; // Default: true
  enableFiltering?: boolean; // Default: true
  enableColumnVisibility?: boolean; // Default: true
  enableRowSelection?: boolean; // Default: false
  enablePagination?: boolean; // Default: true
  pageSize?: number; // Default: 10
  searchable?: boolean; // Default: true
  searchPlaceholder?: string; // Default: "Search..."
  onRowClick?: (row: Row<TData>) => void;
  onRowDoubleClick?: (row: Row<TData>) => void;
  className?: string;
}
```

## Performance Tips

1. **Use selective Zustand subscriptions** in your table components
2. **Memoize complex cell renderers** with `useMemo` or `useCallback`
3. **Enable pagination** for large datasets
4. **Use column width** constraints for better performance
5. **Disable unnecessary features** (sorting, filtering) for simple tables

## Migration from Previous Table

```tsx
// Old approach
const { applications, loading, updateStatus } = useApplications();

// New approach with Zustand + DataTable
const applications = useApplicationsStore(state => state.applications);
const loading = useApplicationsStore(state => state.loading);
const updateStatus = useApplicationsStore(state => state.updateApplicationStatus);

// Use in column definition
{
  accessorKey: 'status',
  cellRenderer: ({ value, row }) => (
    <StatusBadge
      value={value}
      onChange={(newStatus) => updateStatus(row.original.id, newStatus)}
    />
  ),
}
```

This system provides maximum flexibility while maintaining type safety and performance. The integration with Zustand ensures your table state stays in sync with your application state automatically.
