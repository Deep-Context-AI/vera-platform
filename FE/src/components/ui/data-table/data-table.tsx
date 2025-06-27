"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, Search, Settings2, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "./column-header";
import { DataTableCell } from "@/components/ui/data-table/data-table-cell";
import { DataTableConfig } from "@/components/ui/data-table/types";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { TableRowFadeIn } from "@/components/ui/table-row-fade-in";

// Global filter function for search
const globalFilterFn = (
  row: Row<any>,
  columnId: string,
  value: string
) => {
  const searchValue = value.toLowerCase();
  
  // Search through all visible columns
  return Object.values(row.original).some((cellValue) => {
    if (cellValue == null) return false;
    
    // Handle arrays (like work_history)
    if (Array.isArray(cellValue)) {
      return cellValue.some((item) => {
        if (typeof item === 'object') {
          return Object.values(item).some((val) =>
            String(val).toLowerCase().includes(searchValue)
          );
        }
        return String(item).toLowerCase().includes(searchValue);
      });
    }
    
    // Handle objects
    if (typeof cellValue === 'object') {
      return Object.values(cellValue).some((val) =>
        String(val).toLowerCase().includes(searchValue)
      );
    }
    
    // Handle primitive values
    return String(cellValue).toLowerCase().includes(searchValue);
  });
};

interface DataTableProps<TData> extends DataTableConfig<TData> {
  isLoading?: boolean;
  isPaginating?: boolean; // New prop for pagination-specific loading
  error?: string | null;
  onRefresh?: () => void;
  tableId?: string; // Unique identifier for localStorage persistence
  enableRowAnimation?: boolean; // Enable fade-in animation for rows
  animationDelay?: number; // Delay between row animations in ms
}

// Stable empty object to prevent re-renders
const EMPTY_VISIBILITY = {};

export function DataTable<TData>({
  data,
  columns: extendedColumns,
  enableSorting = true,
  enableFiltering = true,
  enableColumnVisibility = true,
  enableRowSelection = false,
  enablePagination = true,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = "Search...",
  onRowClick,
  onRowDoubleClick,
  className,
  isLoading = false,
  isPaginating = false,
  error = null,
  onRefresh,
  toolbarActions,
  tableId = "default-table",
  enableRowAnimation = true,
  animationDelay = 50,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Use the column preferences hook for persistent column visibility
  const {
    columnVisibility,
    setColumnVisibility,
    resetColumnPreferences,
    isLoaded: preferencesLoaded,
  } = useColumnPreferences({
    tableId,
    defaultVisibility: EMPTY_VISIBILITY,
  });

  // Convert extended column definitions to TanStack Table format
  const columns = useMemo<ColumnDef<TData>[]>(() => {
    return extendedColumns.map((colDef): ColumnDef<TData> => ({
      accessorKey: colDef.accessorKey,
      id: colDef.accessorKey,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={colDef.header}
          columnDef={colDef}
        />
      ),
      cell: ({ row, column, table }) => (
        <DataTableCell
          row={row}
          column={column}
          table={table}
          columnDef={colDef}
        />
      ),
      enableSorting: colDef.enableSorting ?? enableSorting,
      enableColumnFilter: colDef.enableFiltering ?? enableFiltering,
      enableHiding: colDef.enableHiding ?? enableColumnVisibility,
      size: colDef.width as number,
      minSize: colDef.minWidth,
      maxSize: colDef.maxWidth,
      meta: colDef.meta,
    }));
  }, [extendedColumns, enableSorting, enableFiltering, enableColumnVisibility]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: enablePagination ? {
        pageIndex: 0,
        pageSize,
      } : undefined,
    },
    initialState: {
      pagination: enablePagination ? {
        pageIndex: 0,
        pageSize,
      } : undefined,
    },
  });

  // Show loading state while preferences are being loaded
  const isTableLoading = isLoading || (enableColumnVisibility && !preferencesLoaded);
  
  // Determine if we should show full skeleton or just animate rows
  const shouldShowSkeleton = isTableLoading && !isPaginating;

  const handleRowClick = useCallback((row: Row<TData>) => {
    if (onRowClick) {
      onRowClick(row);
    }
  }, [onRowClick]);

  const handleRowDoubleClick = useCallback((row: Row<TData>) => {
    if (onRowDoubleClick) {
      onRowDoubleClick(row);
    }
  }, [onRowDoubleClick]);

  const clearAllFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    table.resetColumnFilters();
  };

  const hasActiveFilters = globalFilter || columnFilters.length > 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Table controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Global search */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-8 max-w-sm"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                  onClick={() => setGlobalFilter("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Row count with pagination loading indicator */}
          <div className="text-sm text-gray-700 flex items-center space-x-2">
            {isPaginating && ( 
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                <span className="text-xs text-blue-600">Loading...</span>
              </div>
            )}
            <span>
              {table.getFilteredRowModel().rows.length} of {data.length} row(s)
              {enableRowSelection && table.getFilteredSelectedRowModel().rows.length > 0 && (
                <span className="ml-2">
                  ({table.getFilteredSelectedRowModel().rows.length} selected)
                </span>
              )}
            </span>
          </div>

          {/* Column visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Columns
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    // Get the original column definition for better display names
                    const extendedCol = extendedColumns.find(col => col.accessorKey === column.id);
                    const displayName = extendedCol?.header || column.id;
                    
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {displayName}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={resetColumnPreferences}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Default
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Custom toolbar actions */}
          {toolbarActions}

          {/* Refresh button */}
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isTableLoading}
            >
              {isTableLoading ? "Loading..." : "Refresh"}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {shouldShowSkeleton ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => {
                return enableRowAnimation ? (
                  <TableRowFadeIn
                    key={row.id}
                    index={index}
                    delay={animationDelay}
                    isVisible={!isPaginating}
                    enableAnimation={true}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "cursor-pointer hover:bg-gray-50",
                      onRowClick && "cursor-pointer",
                      row.getIsSelected() && "bg-blue-50"
                    )}
                    onClick={() => handleRowClick(row)}
                    onDoubleClick={() => handleRowDoubleClick(row)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        style={{ width: cell.column.getSize() }}
                        className="p-0"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRowFadeIn>
                ) : (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "cursor-pointer hover:bg-gray-50",
                      onRowClick && "cursor-pointer",
                      row.getIsSelected() && "bg-blue-50"
                    )}
                    onClick={() => handleRowClick(row)}
                    onDoubleClick={() => handleRowDoubleClick(row)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        style={{ width: cell.column.getSize() }}
                        className="p-0"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No results found</p>
                    {hasActiveFilters && (
                      <Button variant="link" size="sm" onClick={clearAllFilters}>
                        Clear filters to see all data
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 