import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff, Filter, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ColumnHeaderContext, ExtendedColumnDef } from "./types";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  columnDef?: ExtendedColumnDef<TData>;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  columnDef,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [filterValue, setFilterValue] = useState(
    (column.getFilterValue() as string) ?? ""
  );

  const canSort = columnDef?.enableSorting !== false && column.getCanSort();
  const canFilter = columnDef?.enableFiltering !== false && column.getCanFilter();
  const canHide = columnDef?.enableHiding !== false && column.getCanHide();
  const isFiltered = column.getIsFiltered();

  // Use custom header renderer if provided
  if (columnDef?.headerRenderer) {
    const context: ColumnHeaderContext<TData> = {
      column,
      table: column.getTable(),
      title,
      canSort,
      canFilter,
      canHide,
      filterValue: column.getFilterValue(),
      isFiltered,
    };
    return <>{columnDef.headerRenderer(context)}</>;
  }

  // Default header renderer
  if (!canSort && !canFilter && !canHide) {
    return <div className={cn(className)}>{title}</div>;
  }

  const handleFilterChange = (value: string) => {
    setFilterValue(value);
    column.setFilterValue(value || undefined);
  };

  const clearFilter = () => {
    setFilterValue("");
    column.setFilterValue(undefined);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent -ml-3 h-8 relative"
          >
            <span>{title}</span>
            
            {/* Sort indicator */}
            {canSort && (
              <>
                {column.getIsSorted() === "desc" ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === "asc" ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronsUpDown className="ml-2 h-4 w-4" />
                )}
              </>
            )}
            
            {/* Filter indicator */}
            {isFiltered && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full" />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-[200px]">
          {/* Sorting options */}
          {canSort && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="mr-2 h-4 w-4" />
                Sort Ascending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="mr-2 h-4 w-4" />
                Sort Descending
              </DropdownMenuItem>
              {(canFilter || canHide) && <DropdownMenuSeparator />}
            </>
          )}
          
          {/* Filter options */}
          {canFilter && (
            <>
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filter</span>
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={clearFilter}
                    >
                      <FilterX className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {/* Filter input based on type */}
                {columnDef?.filterType === 'select' && columnDef.filterOptions ? (
                  <Select
                    value={filterValue}
                    onValueChange={handleFilterChange}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {columnDef.filterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={`Filter ${title.toLowerCase()}...`}
                    value={filterValue}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="h-8"
                    type={columnDef?.filterType === 'number' ? 'number' : 'text'}
                  />
                )}
              </div>
              {canHide && <DropdownMenuSeparator />}
            </>
          )}
          
          {/* Hide column option */}
          {canHide && (
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide Column
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Simplified header for non-interactive columns
export function SimpleColumnHeader<TData, TValue>({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return <div className={cn("font-medium", className)}>{title}</div>;
} 