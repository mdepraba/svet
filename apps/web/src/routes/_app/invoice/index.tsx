import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';

import { ListTable, Pager } from '@/components/industry/ListTable';
import { PageHead } from '@/components/industry/PageHead';
import { InvoiceStatusTag } from '@/components/industry/Tag';
import { Button } from '@/components/ui/button';
import { SearchInput, Toolbar } from '@/components/industry/Toolbar';
import { invoices } from '@/features/invoices/queries/invoiceResource';
import { dateTime, rupiah } from '@/lib/format';
import type { InvoiceResponse } from '@svet-monorepo/schemas';

const searchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  q: z.string().default('').catch(''),
});

function toParams(search: z.infer<typeof searchSchema>) {
  return {
    page: search.page,
    limit: 10,
    search: search.q || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  };
}

const invoiceColumns: ColumnDef<InvoiceResponse>[] = [
  {
    id: 'identifier',
    header: 'Invoice',
    cell: ({ row }) => (
      <Link to="/invoice/$id" params={{ id: row.original.id }}>
        {row.original.identifier}
      </Link>
    ),
  },
  {
    id: 'issued',
    header: 'Issued',
    cell: ({ row }) => (
      <span className="tabular-nums">{dateTime(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'owner',
    header: 'Owner',
    cell: ({ row }) =>
      row.original.owner ? (
        <Link to="/owner/$id" params={{ id: row.original.owner.id }}>
          {row.original.owner.name}
        </Link>
      ) : (
        <span className="text-ink-600">—</span>
      ),
  },
  {
    id: 'source',
    header: 'Source',
    cell: ({ row }) =>
      row.original.visitId ? (
        <Link to="/visit/$id" params={{ id: row.original.visitId }}>
          Visit
        </Link>
      ) : (
        <span className="text-ink-500">Walk-in retail</span>
      ),
  },
  {
    id: 'lines',
    header: 'Lines',
    meta: { align: 'right' },
    cell: ({ row }) => row.original.invoiceDetails.length,
  },
  {
    id: 'payment',
    header: 'Payment',
    cell: ({ row }) => row.original.paymentMethod,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <InvoiceStatusTag status={row.original.status} />,
  },
  {
    id: 'total',
    header: 'Total',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="tabular-nums">{rupiah(row.original.totalGross)}</span>
    ),
  },
];

export const Route = createFileRoute('/_app/invoice/')({
  staticData: { breadcrumbTitle: 'Invoice' },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) =>
    invoices.ensureList(queryClient, toParams(search)),
  component: InvoiceIndexPage,
});

function InvoiceIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data, isFetching } = useQuery(invoices.listOptions(toParams(search)));

  const total = data?.meta.total ?? 0;

  return (
    <div className="flex h-full flex-col gap-3.5">
      <PageHead
        kicker="Finance"
        title="Invoices"
        actions={
          <Button asChild>
            <Link to="/sale">New sale</Link>
          </Button>
        }
      />

      <Toolbar count={`${total} ${total === 1 ? 'invoice' : 'invoices'}`}>
        <SearchInput
          placeholder="Search number or owner"
          value={search.q}
          onChange={(event) =>
            navigate({
              search: (prev) => ({ ...prev, page: 1, q: event.target.value }),
            })
          }
        />
      </Toolbar>

      <ListTable
        columns={invoiceColumns}
        data={data?.data ?? []}
        isLoading={isFetching && !data}
        isHighlighted={(invoice) => invoice.status === 'PENDING'}
        emptyMessage="No invoices yet."
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
