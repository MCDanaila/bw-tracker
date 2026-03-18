import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Skeleton } from '@/core/components/ui/skeleton';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No results.',
  onRowClick,
  pageSize = 25,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <>
    {/* Desktop Table Layout */}
    <div className="hidden md:block rounded-lg border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? (
                        <ArrowUp size={14} />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                className={onRowClick ? 'cursor-pointer' : undefined}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>

    {/* Mobile Card Layout */}
    <div className="md:hidden space-y-4">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card text-card-foreground p-4 space-y-3">
            {columns.slice(0, 3).map((_, j) => (
              <div key={j} className="flex justify-between items-center">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ))
      ) : table.getRowModel().rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        table.getRowModel().rows.map(row => (
          <div
            key={row.id}
            className={`rounded-lg border bg-card text-card-foreground p-4 space-y-3 shadow-sm ${
              onRowClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
            }`}
            onClick={() => onRowClick?.(row.original)}
          >
            {row.getVisibleCells().map(cell => {
              // Try to extract a clean string from header if possible, otherwise use column id
              const headerValue = typeof cell.column.columnDef.header === 'string' 
                ? cell.column.columnDef.header 
                : cell.column.id;

              return (
                <div key={cell.id} className="flex justify-between items-center gap-4 text-sm border-b last:border-0 pb-2 last:pb-0">
                  <span className="font-medium text-muted-foreground break-words min-w-[30%]">
                    {/* Render complex headers safely but ignore click events for sorting inside cards */}
                    <div className="pointer-events-none capitalize">
                      {headerValue}
                    </div>
                  </span>
                  <span className="text-right truncate flex-1 flex justify-end">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
    </>
  );
}

// Re-export the table instance type for pagination component
export { useReactTable };
export type { DataTableProps };
