import { Column, Row, Table } from "@tanstack/react-table";
import { ReactNode } from "react";

// Cell rendering strategy types
export type CellValue = any;

export interface CellRenderContext<TData = any> {
  value: CellValue;
  row: Row<TData>;
  column: Column<TData>;
  table: Table<TData>;
}

export interface CellRenderer<TData = any> {
  (context: CellRenderContext<TData>): ReactNode;
}

// Built-in cell renderers
export interface CellRenderers {
  text: CellRenderer;
  badge: CellRenderer;
  badgeList: CellRenderer;
  currency: CellRenderer;
  date: CellRenderer;
  status: CellRenderer;
  actions: CellRenderer;
  custom: (renderer: CellRenderer) => CellRenderer;
}

// Column header types
export interface ColumnHeaderContext<TData = any> {
  column: Column<TData>;
  table: Table<TData>;
  title: string;
  canSort?: boolean;
  canFilter?: boolean;
  canHide?: boolean;
  filterValue?: any;
  isFiltered?: boolean;
}

export interface ColumnHeaderRenderer<TData = any> {
  (context: ColumnHeaderContext<TData>): ReactNode;
}

// Context menu types
export interface ContextMenuContext<TData = any> {
  value: CellValue;
  row: Row<TData>;
  column: Column<TData>;
  table: Table<TData>;
}

export interface ContextMenuRenderer<TData = any> {
  (context: ContextMenuContext<TData>): ReactNode;
}

// Column definition with extended features
export interface ExtendedColumnDef<TData = any> {
  accessorKey: string;
  header: string;
  cellRenderer?: keyof CellRenderers | CellRenderer<TData>;
  headerRenderer?: ColumnHeaderRenderer<TData>;
  contextMenuRenderer?: ContextMenuRenderer<TData>;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableHiding?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number';
  filterOptions?: Array<{ label: string; value: any }>;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  meta?: Record<string, any>;
}

// Table configuration
export interface DataTableConfig<TData = any> {
  data: TData[];
  columns: ExtendedColumnDef<TData>[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (row: Row<TData>) => void;
  onRowDoubleClick?: (row: Row<TData>) => void;
  className?: string;
  toolbarActions?: ReactNode;
}

// Search and filter state
export interface TableState {
  globalFilter: string;
  columnFilters: Record<string, any>;
  sorting: Array<{ id: string; desc: boolean }>;
  columnVisibility: Record<string, boolean>;
  rowSelection: Record<string, boolean>;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
} 