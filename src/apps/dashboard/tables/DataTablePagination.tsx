import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { type Table } from '@tanstack/react-table';
import { Button } from '@/core/components/ui/button';
import { Select } from '@/core/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

const PAGE_SIZE_OPTIONS = [
  { label: '10', value: '10' },
  { label: '25', value: '25' },
  { label: '50', value: '50' },
  { label: '100', value: '100' },
];

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2 py-2">
      <div className="text-xs text-muted-foreground">
        {table.getFilteredRowModel().rows.length} row(s) total
      </div>
      <div className="flex items-center gap-2">
        <Select
          options={PAGE_SIZE_OPTIONS}
          value={String(table.getState().pagination.pageSize)}
          onChange={e => table.setPageSize(Number(e.target.value))}
          className="h-8 w-[70px] text-xs"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
