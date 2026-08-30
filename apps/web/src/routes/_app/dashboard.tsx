import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, TriangleAlert } from 'lucide-react';

import { Blueprint, Kicker, PanelHead } from '@/components/industry/Blueprint';
import { InvoiceStatusTag, VisitStatusTag } from '@/components/industry/Tag';
import { Button } from '@/components/ui/button';
import { dashboardSummaryOptions } from '@/features/dashboard/queries/dashboardResource';
import { invoices } from '@/features/invoices/queries/invoiceResource';
import { lowStockOptions } from '@/features/inventory/queries/inventoryResource';
import { visitDayOptions } from '@/features/visits/queries/visitResource';
import { visitTypeLabel } from '@/features/visits/components/VisitColumns';
import { longDate, rupiah, shortTime } from '@/lib/format';

/** `YYYY-MM-DD` for today, in the browser's timezone. */
function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const RECENT_INVOICE_PARAMS = {
  limit: 4,
  sortBy: 'createdAt',
  sortOrder: 'desc',
} as const;

export const Route = createFileRoute('/_app/dashboard')({
  staticData: { breadcrumbTitle: 'Dashboard' },
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(dashboardSummaryOptions()),
      queryClient.ensureQueryData(visitDayOptions(todayKey())),
    ]),
  component: DashboardPage,
});

function DashboardPage() {
  const today = todayKey();
  const { data: summary } = useQuery(dashboardSummaryOptions());
  const { data: queue } = useQuery(visitDayOptions(today));
  const { data: lowStock } = useQuery(
    lowStockOptions(summary?.lowStock.threshold),
  );
  const { data: recentInvoices } = useQuery(
    invoices.listOptions(RECENT_INVOICE_PARAMS),
  );

  const seen = summary?.patientsSeen;
  const weekDelta = seen ? seen.thisWeek - seen.lastWeek : 0;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="kicker-accent">{longDate(new Date())}</div>
          <h3 className="mt-1 text-[27px]">Good day, Admin</h3>
        </div>
        <div className="flex flex-none gap-2.5">
          <Button variant="outline" asChild>
            <Link to="/sale">New sale</Link>
          </Button>
          <Button asChild>
            <Link to="/visit/register">
              <Plus />
              Register visit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Visits today"
          value={summary ? String(summary.visitsToday.total) : '—'}
          note={
            summary
              ? `${summary.visitsToday.scheduled} scheduled · ${summary.visitsToday.ongoing} ongoing · ${summary.visitsToday.finished} finished`
              : ''
          }
        />
        <Stat
          label="Revenue today"
          value={summary ? rupiah(summary.revenueToday.total) : '—'}
          note={
            summary
              ? `${summary.revenueToday.paidCount} invoices paid · ${summary.revenueToday.pendingCount} pending`
              : ''
          }
        />
        <Stat
          label="Low stock"
          value={summary ? String(summary.lowStock.count) : '—'}
          note={
            summary ? `at or below ${summary.lowStock.threshold} in stock` : ''
          }
          emphasis={Boolean(summary && summary.lowStock.count > 0)}
        />
        <Stat
          label="Patients seen this week"
          value={seen ? String(seen.thisWeek) : '—'}
          note={
            seen ? `${weekDelta >= 0 ? '+' : ''}${weekDelta} vs last week` : ''
          }
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Blueprint className="flex min-h-0 flex-col p-3">
          <PanelHead
            title="Today's queue"
            action={<Link to="/visit">All visits</Link>}
          />
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="table text-[13px]">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Owner</th>
                  <th>Patients</th>
                  <th>Vet</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {queue?.length ? (
                  queue.map((visit) => (
                    <tr
                      key={visit.id}
                      className={
                        visit.status === 'ONGOING'
                          ? 'bg-[color-mix(in_srgb,var(--color-accent)_7%,transparent)]'
                          : undefined
                      }
                    >
                      <td className="tabular-nums">
                        {shortTime(visit.scheduleAt ?? visit.visitDate)}
                      </td>
                      <td>
                        <Link to="/visit/$id" params={{ id: visit.id }}>
                          {visit.owner.name}
                        </Link>
                      </td>
                      <td>
                        {visit.visitDetails
                          .map((detail) => detail.patient.name)
                          .join(', ') || '—'}
                      </td>
                      <td>
                        {[
                          ...new Set(visit.visitDetails.map((d) => d.vet.name)),
                        ].join(', ') || '—'}
                      </td>
                      <td>{visitTypeLabel(visit.visitType)}</td>
                      <td>
                        <VisitStatusTag status={visit.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-ink-600 h-24 text-center">
                      Nothing booked for today yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Blueprint>

        <div className="flex min-h-0 flex-col gap-3.5">
          <Blueprint className="p-3">
            <PanelHead
              title="Needs restocking"
              action={<Link to="/inventory">Inventory</Link>}
            />
            <div className="flex flex-col gap-1.5">
              {lowStock?.length ? (
                lowStock.slice(0, 5).map((row) => (
                  <div
                    key={row.productId}
                    className="flex items-center gap-2 text-[12.5px]"
                  >
                    <TriangleAlert className="text-brand-800 size-[13px] flex-none" />
                    <span className="min-w-0 flex-1 truncate">
                      {row.product.name}
                    </span>
                    <span className="text-brand-800 tabular-nums">
                      {row.totalQty} {row.product.dispensingUnit}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-ink-600 m-0 text-[12.5px]">
                  Everything is above its reorder point.
                </p>
              )}
            </div>
          </Blueprint>

          <Blueprint className="min-h-0 flex-1 overflow-hidden p-3">
            <PanelHead
              title="Recent invoices"
              action={<Link to="/invoice">Finance</Link>}
            />
            <div className="flex flex-col gap-2">
              {recentInvoices?.data.length ? (
                recentInvoices.data.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-baseline gap-2 text-[12.5px]"
                  >
                    <Link
                      to="/invoice/$id"
                      params={{ id: invoice.id }}
                      className="font-heading text-[13px]"
                    >
                      {invoice.identifier}
                    </Link>
                    <span className="text-ink-600 min-w-0 flex-1 truncate">
                      {invoice.owner?.name ?? 'Walk-in'}
                    </span>
                    <span className="tabular-nums">
                      {rupiah(invoice.totalGross)}
                    </span>
                    <InvoiceStatusTag status={invoice.status} />
                  </div>
                ))
              ) : (
                <p className="text-ink-600 m-0 text-[12.5px]">
                  No invoices yet.
                </p>
              )}
            </div>
          </Blueprint>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  emphasis = false,
}: {
  label: string;
  value: string;
  note: string;
  emphasis?: boolean;
}) {
  return (
    <Blueprint className="px-3 py-2.5">
      <Kicker>{label}</Kicker>
      <div
        className={`stat-num text-[34px] ${emphasis ? 'text-brand-800' : ''}`}
      >
        {value}
      </div>
      <div className="text-ink-600 text-[11.5px]">{note}</div>
    </Blueprint>
  );
}
