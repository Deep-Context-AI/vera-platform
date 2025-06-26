import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { CellRenderContext, CellRenderers } from "./types";

// Text renderer - basic text display
const textRenderer = ({ value }: CellRenderContext) => {
  return <span className="text-sm">{value?.toString() || "—"}</span>;
};

// Badge renderer - single badge
const badgeRenderer = ({ value, row }: CellRenderContext) => {
  if (!value) return <span className="text-gray-400">—</span>;
  
  // Determine badge variant based on value
  const getVariant = (val: string) => {
    const lowerVal = val.toLowerCase();
    if (lowerVal.includes('approved') || lowerVal.includes('success')) return 'default';
    if (lowerVal.includes('pending') || lowerVal.includes('processing')) return 'secondary';
    if (lowerVal.includes('rejected') || lowerVal.includes('failed')) return 'destructive';
    return 'outline';
  };

  return (
    <Badge variant={getVariant(value.toString())}>
      {value.toString()}
    </Badge>
  );
};

// Badge list renderer - array of values as badges
const badgeListRenderer = ({ value }: CellRenderContext) => {
  if (!Array.isArray(value) || value.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {value.slice(0, 3).map((item, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {typeof item === 'object' ? 
            item.organization || item.name || item.title || Object.values(item)[0] || 'Unknown' : 
            item.toString()}
        </Badge>
      ))}
      {value.length > 3 && (
        <Badge variant="secondary" className="text-xs">
          +{value.length - 3} more
        </Badge>
      )}
    </div>
  );
};

// Currency renderer
const currencyRenderer = ({ value }: CellRenderContext) => {
  if (value == null || isNaN(Number(value))) {
    return <span className="text-gray-400">—</span>;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));

  return <span className="text-right font-medium">{formatted}</span>;
};

// Date renderer
const dateRenderer = ({ value }: CellRenderContext) => {
  if (!value) return <span className="text-gray-400">—</span>;

  try {
    const date = new Date(value);
    return (
      <span className="text-sm">
        {date.toLocaleDateString()}
      </span>
    );
  } catch {
    return <span className="text-gray-400">Invalid Date</span>;
  }
};

// Status renderer with colored indicators
const statusRenderer = ({ value }: CellRenderContext) => {
  if (!value) return <span className="text-gray-400">—</span>;

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('approved') || lowerStatus.includes('success')) 
      return 'bg-green-100 text-green-800';
    if (lowerStatus.includes('pending') || lowerStatus.includes('processing')) 
      return 'bg-yellow-100 text-yellow-800';
    if (lowerStatus.includes('rejected') || lowerStatus.includes('failed')) 
      return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value.toString())}`}>
      {value.toString()}
    </span>
  );
};

// Actions renderer with dropdown menu
const actionsRenderer = ({ row, table }: CellRenderContext) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => console.log('View', row.original)}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => console.log('Edit', row.original)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => console.log('Delete', row.original)}
          className="text-red-600"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Custom renderer wrapper
const customRenderer = (renderer: any) => renderer;

// Export all renderers
export const cellRenderers: CellRenderers = {
  text: textRenderer,
  badge: badgeRenderer,
  badgeList: badgeListRenderer,
  currency: currencyRenderer,
  date: dateRenderer,
  status: statusRenderer,
  actions: actionsRenderer,
  custom: customRenderer,
};

// Helper function to get renderer
export const getCellRenderer = (rendererType: keyof CellRenderers | Function): any => {
  if (typeof rendererType === 'function') {
    return rendererType;
  }
  return cellRenderers[rendererType] || cellRenderers.text;
}; 