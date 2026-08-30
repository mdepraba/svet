import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, X } from 'lucide-react';
import { z } from 'zod';

import { Blueprint, Kicker } from '@/components/industry/Blueprint';
import { ListTable, Pager } from '@/components/industry/ListTable';
import { PageHead } from '@/components/industry/PageHead';
import { Tag } from '@/components/industry/Tag';
import { Button } from '@/components/ui/button';
import { roles, users } from '@/features/staff/queries/staffResource';
import type { RoleResponse, UserResponse } from '@svet-monorepo/schemas';

const searchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  /** Which role the capability panel is describing. */
  role: z.string().default('').catch(''),
});

const ROLE_PARAMS = { limit: 50, sortBy: 'name', sortOrder: 'asc' } as const;

/**
 * What each role may do. The Prisma `Role` model carries a name only — there
 * is no permission table behind it yet — so this panel documents the intent
 * the rest of the system is built around rather than inventing stored data.
 */
const ROLE_CAPABILITIES: Record<string, { label: string; allowed: boolean }[]> =
  {
    ADMIN: [
      { label: 'Record medical findings and usage', allowed: true },
      { label: 'Choose treatments and products', allowed: true },
      { label: 'Read owner and patient records', allowed: true },
      { label: 'Take payment / issue invoices', allowed: true },
      { label: 'Edit the catalog or prices', allowed: true },
      { label: 'Manage staff accounts', allowed: true },
    ],
    VET: [
      { label: 'Record medical findings and usage', allowed: true },
      { label: 'Choose treatments and products', allowed: true },
      { label: 'Read owner and patient records', allowed: true },
      { label: 'Take payment / issue invoices', allowed: false },
      { label: 'Edit the catalog or prices', allowed: false },
      { label: 'Manage staff accounts', allowed: false },
    ],
    'FRONT-DESK': [
      { label: 'Record medical findings and usage', allowed: false },
      { label: 'Choose treatments and products', allowed: false },
      { label: 'Read owner and patient records', allowed: true },
      { label: 'Take payment / issue invoices', allowed: true },
      { label: 'Edit the catalog or prices', allowed: false },
      { label: 'Manage staff accounts', allowed: false },
    ],
  };

function capabilitiesFor(roleName: string) {
  const key = roleName.toUpperCase().replace(/[\s_]+/g, '-');
  return ROLE_CAPABILITIES[key] ?? null;
}

function roleTone(roleName: string) {
  const key = roleName.toUpperCase();
  if (key === 'ADMIN') return 'outline' as const;
  if (key === 'VET') return 'accent' as const;
  return 'neutral' as const;
}

export const Route = createFileRoute('/_app/staff')({
  staticData: { breadcrumbTitle: 'Users' },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) =>
    Promise.all([
      users.ensureList(queryClient, { page: search.page, limit: 10 }),
      roles.ensureList(queryClient, ROLE_PARAMS),
    ]),
  component: StaffPage,
});

function StaffPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: roleList } = useQuery(roles.listOptions(ROLE_PARAMS));
  const { data: userList, isFetching } = useQuery(
    users.listOptions({ page: search.page, limit: 10 }),
  );

  const allRoles = roleList?.data ?? [];
  const roleById = new Map(allRoles.map((role) => [role.id, role]));
  const selectedRole =
    allRoles.find((role) => role.id === search.role) ?? allRoles[0];

  const columns = staffColumns(roleById);

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[1fr_320px]">
      <div className="flex min-h-0 flex-col gap-3.5">
        <PageHead
          title="Staff accounts"
          actions={<Button disabled>Invite staff</Button>}
        />
        <ListTable
          columns={columns}
          data={userList?.data ?? []}
          isLoading={isFetching && !userList}
          emptyMessage="No staff accounts yet."
        />
        <Pager
          meta={userList?.meta}
          onPageChange={(page) =>
            navigate({ search: (prev) => ({ ...prev, page }) })
          }
        />
      </div>

      <Blueprint className="flex min-h-0 flex-col p-3">
        <Kicker className="mb-2">Role · {selectedRole?.name ?? '—'}</Kicker>

        {allRoles.length > 1 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {allRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() =>
                  navigate({ search: (prev) => ({ ...prev, role: role.id }) })
                }
                className={`border px-2 py-0.5 text-[11px] ${
                  role.id === selectedRole?.id
                    ? 'border-primary text-primary'
                    : 'border-border text-ink-600 hover:bg-accent'
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        ) : null}

        <RoleCapabilities roleName={selectedRole?.name} />

        <p className="text-ink-600 mt-auto pt-3 text-[11.5px]">
          {countHolders(userList?.data ?? [], selectedRole)} accounts hold this
          role. Every record stores who created and last updated it.
        </p>
        <Button variant="outline" className="mt-2 w-full" disabled>
          Edit role
        </Button>
      </Blueprint>
    </div>
  );
}

function countHolders(
  staff: UserResponse[],
  role: RoleResponse | undefined,
): number {
  if (!role) return 0;
  return staff.filter((member) => member.roleId === role.id).length;
}

function RoleCapabilities({ roleName }: { roleName: string | undefined }) {
  const capabilities = roleName ? capabilitiesFor(roleName) : null;

  if (!capabilities) {
    return (
      <p className="text-ink-600 m-0 text-[12.5px]">
        {roleName
          ? `No capability profile is defined for “${roleName}”. Roles carry a name only; permissions are enforced per screen.`
          : 'No roles configured yet.'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-[13px]">
      {capabilities.map((capability) => (
        <div
          key={capability.label}
          className={`flex items-center gap-2 ${capability.allowed ? '' : 'opacity-45'}`}
        >
          {capability.allowed ? (
            <Check className="text-primary size-[15px] flex-none" />
          ) : (
            <X className="size-[15px] flex-none" />
          )}
          {capability.label}
        </div>
      ))}
    </div>
  );
}

function staffColumns(
  roleById: Map<string, RoleResponse>,
): ColumnDef<UserResponse>[] {
  return [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = roleById.get(row.original.roleId);
        if (!role) return <span className="text-ink-400">—</span>;
        return (
          <Tag tone={roleTone(role.name)} className="text-[9px]">
            {role.name.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      // `deletedAt` is the only account state the User model carries.
      cell: ({ row }) =>
        row.original.deletedAt ? (
          <Tag tone="outline" className="text-[9px] opacity-60">
            DISABLED
          </Tag>
        ) : (
          <Tag tone="neutral" className="text-[9px]">
            ACTIVE
          </Tag>
        ),
    },
  ];
}
