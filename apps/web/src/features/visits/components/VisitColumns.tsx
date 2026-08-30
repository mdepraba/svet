import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import type { VisitListItem } from '@svet-monorepo/schemas';

import { VisitStatusTag } from '@/components/industry/Tag';
import { dateTime, rupiah } from '@/lib/format';

/** `MEDIC` reads as `Medical` everywhere the vet sees it. */
export function visitTypeLabel(type: VisitListItem['visitType']): string {
  return type === 'MEDIC' ? 'Medical' : 'Non-medical';
}

/** De-duplicated, because two pets on one visit often share a vet. */
function vetNames(visit: VisitListItem): string {
  const names = [...new Set(visit.visitDetails.map((d) => d.vet.name))];
  return names.length ? names.join(', ') : '—';
}

function patientNames(visit: VisitListItem): string {
  const names = visit.visitDetails.map((d) => d.patient.name);
  return names.length ? names.join(', ') : '—';
}

const Dash = () => <span className="text-ink-400">—</span>;

export const visitColumns: ColumnDef<VisitListItem>[] = [
  {
    id: 'when',
    header: 'Date / time',
    // The desk books against `scheduleAt`; walk-ins only ever have `visitDate`.
    cell: ({ row }) => (
      <span className="tabular-nums">
        {dateTime(row.original.scheduleAt ?? row.original.visitDate)}
      </span>
    ),
  },
  {
    id: 'owner',
    header: 'Owner',
    cell: ({ row }) => (
      <Link to="/visit/$id" params={{ id: row.original.id }}>
        {row.original.owner.name}
      </Link>
    ),
  },
  {
    id: 'patients',
    header: 'Patients',
    cell: ({ row }) => patientNames(row.original),
  },
  { id: 'vet', header: 'Vet', cell: ({ row }) => vetNames(row.original) },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => visitTypeLabel(row.original.visitType),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <VisitStatusTag status={row.original.status} />,
  },
  {
    id: 'invoice',
    header: 'Invoice',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const invoice = row.original.invoices[0];
      if (!invoice) return <Dash />;
      return (
        <Link to="/invoice/$id" params={{ id: invoice.id }}>
          {invoice.identifier}
        </Link>
      );
    },
  },
  {
    id: 'total',
    header: 'Total',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const invoice = row.original.invoices[0];
      if (!invoice) return <Dash />;
      return <span className="tabular-nums">{rupiah(invoice.totalGross)}</span>;
    },
  },
];
