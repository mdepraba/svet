import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import type { OwnerListItem } from '@svet-monorepo/schemas';

import { shortDate } from '@/lib/format';

const Dash = () => <span className="text-ink-400">—</span>;

export const ownerColumns: ColumnDef<OwnerListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link to="/owner/$id" params={{ id: row.original.id }}>
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.original.email || <Dash />,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) =>
      row.original.phone ? (
        <span className="tabular-nums">{row.original.phone}</span>
      ) : (
        <Dash />
      ),
  },
  {
    id: 'patients',
    header: 'Patients',
    meta: { align: 'right' },
    cell: ({ row }) => row.original.patients.length,
  },
  {
    id: 'lastVisit',
    header: 'Last visit',
    cell: ({ row }) =>
      row.original.lastVisitAt ? (
        <span className="tabular-nums">
          {shortDate(row.original.lastVisitAt)}
        </span>
      ) : (
        <Dash />
      ),
  },
  {
    id: 'open',
    header: '',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <Link
        to="/owner/$id"
        params={{ id: row.original.id }}
        aria-label={`Open ${row.original.name}`}
      >
        <ChevronRight className="ml-auto size-[15px] opacity-45" />
      </Link>
    ),
  },
];
