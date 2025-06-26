import { Row, Column, Table } from "@tanstack/react-table";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { getCellRenderer } from "./cell-renderers";
import { ExtendedColumnDef, ContextMenuContext } from "./types";

interface DataTableCellProps<TData> {
  row: Row<TData>;
  column: Column<TData>;
  table: Table<TData>;
  columnDef: ExtendedColumnDef<TData>;
  className?: string;
}

export function DataTableCell<TData>({
  row,
  column,
  table,
  columnDef,
  className,
}: DataTableCellProps<TData>) {
  const value = row.getValue(column.id);
  
  // Get the appropriate cell renderer
  const cellRenderer = getCellRenderer(columnDef.cellRenderer || 'text');
  
  // Render the cell content
  const cellContent = cellRenderer({
    value,
    row,
    column,
    table,
  });

  // If no context menu renderer, return the cell content directly
  if (!columnDef.contextMenuRenderer) {
    return (
      <div className={cn("px-4 py-2", className)}>
        {cellContent}
      </div>
    );
  }

  // Render with context menu
  const contextMenuContext: ContextMenuContext<TData> = {
    value,
    row,
    column,
    table,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={cn("px-4 py-2 cursor-context-menu", className)}>
          {cellContent}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {columnDef.contextMenuRenderer(contextMenuContext)}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Default context menu items for common actions
export function DefaultContextMenuItems<TData>({
  row,
  onView,
  onEdit,
  onDelete,
  onCopy,
}: {
  row: Row<TData>;
  onView?: (data: TData) => void;
  onEdit?: (data: TData) => void;
  onDelete?: (data: TData) => void;
  onCopy?: (data: TData) => void;
}) {
  return (
    <>
      {onView && (
        <div 
          className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
          onClick={() => onView(row.original)}
        >
          View Details
        </div>
      )}
      {onEdit && (
        <div 
          className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
          onClick={() => onEdit(row.original)}
        >
          Edit
        </div>
      )}
      {onCopy && (
        <div 
          className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
          onClick={() => onCopy(row.original)}
        >
          Copy
        </div>
      )}
      {onDelete && (
        <>
          <div className="border-t border-gray-200 my-1" />
          <div 
            className="px-2 py-1.5 text-sm hover:bg-red-50 text-red-600 cursor-pointer"
            onClick={() => onDelete(row.original)}
          >
            Delete
          </div>
        </>
      )}
    </>
  );
} 