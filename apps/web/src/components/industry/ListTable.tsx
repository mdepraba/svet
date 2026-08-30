import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@svet-monorepo/schemas';

import { Blueprint } from './Blueprint';

declare module '@tanstack/react-table' {
  // Column-level layout hints, so a screen can right-align a money column
  // without reaching past the ColumnDef it already writes. The two type
  // parameters are fixed by the library's own declaration and go unused here.
  /* eslint-disable @typescript-eslint/no-unused-vars */
  interface ColumnMeta<TData, TValue> {
    align?: 'left' | 'right' | 'center';
    className?: string;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

type ListTableProps<TData> = {
  // `unknown` for the cell value: each screen's columns render their own
  // cells, so the table never needs to know what a column holds.
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Painted with a faint accent wash — the row the user is working in. */
  isHighlighted?: (row: TData) => boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
};

/**
 * The hairline table inside a blueprint frame — the list pattern shared by
 * every index screen on the board. Pagination is server-side, so the table
 * itself only renders the page it was handed.
 */
export function ListTable<TData>({
  columns,
  data,
  isHighlighted,
  emptyMessage = 'No results.',
  isLoading = false,
  className,
}: ListTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const rows = table.getRowModel().rows;

  return (
    <Blueprint className={cn('min-h-0 flex-1 overflow-auto p-0', className)}>
      <table className="table text-[13px]">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => (
                <th
                  key={header.id}
                  className={cn(
                    index === 0 && 'pl-3',
                    index === headerGroup.headers.length - 1 && 'pr-3',
                    alignClass(header.column.columnDef.meta?.align),
                    header.column.columnDef.meta?.className,
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <SkeletonRows rows={6} columns={table.getAllLeafColumns().length} />
          ) : rows.length ? (
            rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  isHighlighted?.(row.original) &&
                    'bg-[color-mix(in_srgb,var(--color-accent)_7%,transparent)]',
                )}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={cn(
                      index === 0 && 'pl-3',
                      index === row.getVisibleCells().length - 1 && 'pr-3',
                      alignClass(cell.column.columnDef.meta?.align),
                      cell.column.columnDef.meta?.className,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="text-ink-600 h-24 text-center"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Blueprint>
  );
}

function alignClass(align?: 'left' | 'right' | 'center') {
  return align === 'right'
    ? 'text-right'
    : align === 'center'
      ? 'text-center'
      : undefined;
}

function SkeletonRows({ rows, columns }: { rows: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex} className={cn(colIndex === 0 && 'pl-3')}>
              <div className="bg-muted h-3.5 w-full max-w-32 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * `Page 1 of 4` with the two buttons the designs draw. The API returns
 * `prev`/`next` as page numbers or null, which is what disables them.
 */
export function Pager({
  meta,
  onPageChange,
  className,
}: {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const currentPage = meta?.currentPage ?? 1;
  const lastPage = Math.max(meta?.lastPage ?? 1, 1);

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-ink-600 text-[12.5px]">
        Page {currentPage} of {lastPage}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta?.prev == null}
          onClick={() => onPageChange(meta?.prev ?? currentPage)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta?.next == null}
          onClick={() => onPageChange(meta?.next ?? currentPage)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
