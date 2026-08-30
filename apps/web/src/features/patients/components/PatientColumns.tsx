import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import type { PatientListItem } from '@svet-monorepo/schemas';

import { shortDate } from '@/lib/format';

const Dash = () => <span className="text-ink-400">—</span>;

export const patientColumns: ColumnDef<PatientListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link to="/patient/$id" params={{ id: row.original.id }}>
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: 'species', header: 'Species' },
  {
    accessorKey: 'breed',
    header: 'Breed',
    cell: ({ row }) => row.original.breed || <Dash />,
  },
  {
    accessorKey: 'dob',
    header: 'Date of birth',
    cell: ({ row }) =>
      row.original.dob ? (
        <span className="tabular-nums">{shortDate(row.original.dob)}</span>
      ) : (
        <Dash />
      ),
  },
  {
    id: 'owner',
    header: 'Owner',
    cell: ({ row }) => (
      <Link to="/owner/$id" params={{ id: row.original.ownerId }}>
        {row.original.owner.name}
      </Link>
    ),
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
    id: 'records',
    header: 'Records',
    meta: { align: 'right' },
    cell: ({ row }) => row.original.recordCount,
  },
];
