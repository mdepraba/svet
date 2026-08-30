import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { TriangleAlert } from 'lucide-react';
import { z } from 'zod';

import { ListTable, Pager } from '@/components/industry/ListTable';
import { PageHead } from '@/components/industry/PageHead';
import { Tag } from '@/components/industry/Tag';
import { SearchInput, SegFilter, Toolbar } from '@/components/industry/Toolbar';
import { Button } from '@/components/ui/button';
import { dashboardSummaryOptions } from '@/features/dashboard/queries/dashboardResource';
import {
  ledgerOptions,
  lowStockOptions,
} from '@/features/inventory/queries/inventoryResource';
import { dateTime } from '@/lib/format';
import type { StockMovementResponse } from '@svet-monorepo/schemas';

const MOVEMENT_OPTIONS = [
  { value: 'all', label: 'All movements' },
  { value: 'in', label: 'In' },
  { value: 'out', label: 'Out' },
  { value: 'medical', label: 'Medical use' },
] as const;

const searchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  q: z.string().default('').catch(''),
  movement: z.enum(['all', 'in', 'out', 'medical']).default('all').catch('all'),
});

function toParams(search: z.infer<typeof searchSchema>) {
  return {
    page: search.page,
    limit: 10,
    search: search.q || undefined,
    movement: search.movement === 'all' ? undefined : search.movement,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  };
}

/** `PURCHASE_IN` reads as `PURCHASE IN` in the movement column. */
function movementLabel(type: string) {
  return type.replace(/_/g, ' ');
}

function movementTone(type: string) {
  if (type === 'MEDICAL_USE') return 'accent' as const;
  return type.endsWith('_IN') ? ('outline' as const) : ('neutral' as const);
}

const ledgerColumns: ColumnDef<StockMovementResponse>[] = [
  {
    id: 'when',
    header: 'When',
    cell: ({ row }) => (
      <span className="tabular-nums">{dateTime(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'product',
    header: 'Product',
    cell: ({ row }) => row.original.product.name,
  },
  {
    id: 'movement',
    header: 'Movement',
    cell: ({ row }) => (
      <Tag
        tone={movementTone(row.original.movementType)}
        className="text-[9px]"
      >
        {movementLabel(row.original.movementType)}
      </Tag>
    ),
  },
  {
    id: 'reference',
    header: 'Reference',
    cell: ({ row }) =>
      row.original.movementRef ?? (
        <span className="text-ink-500">{row.original.notes ?? '—'}</span>
      ),
  },
  {
    id: 'change',
    header: 'Change',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const change = row.original.changeQty;
      // A minus sign, not a hyphen — the column is read as arithmetic.
      return (
        <span className="tabular-nums">
          {change > 0 ? `+${change}` : `−${Math.abs(change)}`}
        </span>
      );
    },
  },
  {
    id: 'balance',
    header: 'Balance',
    meta: { align: 'right' },
    cell: ({ row }) =>
      row.original.balanceAfter === null ? (
        <span className="text-ink-400">—</span>
      ) : (
        <span className="tabular-nums">{row.original.balanceAfter}</span>
      ),
  },
  {
    id: 'by',
    header: 'By',
    cell: ({ row }) =>
      row.original.createdByUser?.name ?? (
        <span className="text-ink-400">—</span>
      ),
  },
];

export const Route = createFileRoute('/_app/inventory/')({
  staticData: { breadcrumbTitle: 'Inventory' },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) =>
    queryClient.ensureQueryData(ledgerOptions(toParams(search))),
  component: InventoryPage,
});

function InventoryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data, isFetching } = useQuery(ledgerOptions(toParams(search)));
  const { data: summary } = useQuery(dashboardSummaryOptions());
  const { data: lowStock } = useQuery(
    lowStockOptions(summary?.lowStock.threshold),
  );

  const total = data?.meta.total ?? 0;
  const setSearch = (next: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...next }) });

  return (
    <div className="flex h-full flex-col gap-3.5">
      <PageHead
        kicker="Stock ledger · append only"
        title="Inventory"
        actions={
          <>
            <Button variant="outline" disabled>
              Adjustment
            </Button>
            <Button disabled>Receive purchase</Button>
          </>
        }
      />

      {lowStock && lowStock.length > 0 ? (
        <div className="border-primary flex items-center gap-3 border bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] px-3 py-2">
          <TriangleAlert className="text-brand-800 size-[15px] flex-none" />
          <span className="text-[12.5px]">
            {lowStock.length}{' '}
            {lowStock.length === 1 ? 'product is' : 'products are'} at or below
            the reorder point:{' '}
            {lowStock
              .slice(0, 3)
              .map(
                (row) =>
                  `${row.product.name} ${row.totalQty}/${summary?.lowStock.threshold ?? '—'}`,
              )
              .join(', ')}
            {lowStock.length > 3 ? ', …' : '.'}
          </span>
          <Button variant="outline" size="sm" className="ml-auto" asChild>
            <Link to="/product">Open catalog</Link>
          </Button>
        </div>
      ) : null}

      <Toolbar count={`${total} ${total === 1 ? 'movement' : 'movements'}`}>
        <SearchInput
          className="w-[220px]"
          placeholder="Search product"
          value={search.q}
          onChange={(event) => setSearch({ q: event.target.value })}
        />
        <SegFilter
          name="movement-filter"
          value={search.movement}
          options={MOVEMENT_OPTIONS}
          onChange={(movement) => setSearch({ movement })}
        />
      </Toolbar>

      <ListTable
        columns={ledgerColumns}
        data={data?.data ?? []}
        isLoading={isFetching && !data}
        emptyMessage="No stock movements recorded yet."
      />

      <Pager
        meta={data?.meta}
        onPageChange={(page) =>
          navigate({ search: (prev) => ({ ...prev, page }) })
        }
      />
    </div>
  );
}
