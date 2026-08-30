import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Blueprint, Kicker } from '@/components/industry/Blueprint';
import { InvoiceStatusTag, VisitStatusTag } from '@/components/industry/Tag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { owners } from '@/features/owners/queries/ownerResource';
import { visitTypeLabel } from '@/features/visits/components/VisitColumns';
import { petAge, rupiah, shortDate } from '@/lib/format';
import type { OwnerDetail } from '@svet-monorepo/schemas';

export const Route = createFileRoute('/_app/owner/$id')({
  staticData: { breadcrumbTitle: 'Owner' },
  loader: ({ context: { queryClient }, params }) =>
    owners.ensureDetail(queryClient, params.id),
  component: OwnerDetailPage,
});

function OwnerDetailPage() {
  const { id } = Route.useParams();
  const { data: owner } = useQuery(owners.detailOptions(id));

  if (!owner) return null;
  return <OwnerDetailView key={owner.id} owner={owner} />;
}

function OwnerDetailView({ owner }: { owner: OwnerDetail }) {
  const update = owners.useUpdate();
  const [form, setForm] = useState({
    name: owner.name,
    phone: owner.phone ?? '',
    email: owner.email ?? '',
    address: owner.address ?? '',
  });

  useEffect(() => {
    setForm({
      name: owner.name,
      phone: owner.phone ?? '',
      email: owner.email ?? '',
      address: owner.address ?? '',
    });
  }, [owner]);

  function handleSave() {
    update.mutate(
      {
        id: owner.id,
        input: {
          name: form.name,
          // Empty inputs clear the column rather than storing "".
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
        },
      },
      {
        onSuccess: () => toast.success('Owner updated'),
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : 'Could not save',
          ),
      },
    );
  }

  const inVisitPatientIds = new Set(
    owner.visits
      .filter((visit) => visit.status === 'ONGOING')
      .flatMap((visit) => visit.patients.map((patient) => patient.id)),
  );

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_300px]">
      <div className="flex min-h-0 flex-col gap-3.5 overflow-auto">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="kicker-accent">Owner</div>
            <h3 className="mt-0.5 text-[25px]">{owner.name}</h3>
          </div>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Field label="Name">
            <Input
              className="h-9"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </Field>
          <Field label="Phone">
            <Input
              className="h-9"
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </Field>
          <Field label="Email">
            <Input
              className="h-9"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </Field>
          <Field label="Address">
            <Input
              className="h-9"
              value={form.address}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
            />
          </Field>
        </div>

        <Blueprint className="p-3">
          <div className="mb-2 flex items-baseline">
            <Kicker>Visit history</Kicker>
            <span className="text-ink-600 ml-auto text-xs">
              {owner.visits.length}{' '}
              {owner.visits.length === 1 ? 'visit' : 'visits'}
            </span>
          </div>
          <table className="table text-[12.5px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patients</th>
                <th>Type</th>
                <th>Status</th>
                <th className="text-right">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {owner.visits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-ink-600 h-16 text-center">
                    No visits yet.
                  </td>
                </tr>
              ) : (
                owner.visits.map((visit) => {
                  const invoice = owner.invoices.find(
                    (candidate) => candidate.visitId === visit.id,
                  );
                  return (
                    <tr key={visit.id}>
                      <td className="tabular-nums">
                        <Link to="/visit/$id" params={{ id: visit.id }}>
                          {shortDate(visit.visitDate)}
                        </Link>
                      </td>
                      <td>
                        {visit.patients
                          .map((patient) => patient.name)
                          .join(', ') || '—'}
                      </td>
                      <td>{visitTypeLabel(visit.visitType)}</td>
                      <td>
                        <VisitStatusTag status={visit.status} />
                      </td>
                      <td className="text-right">
                        {invoice ? (
                          <Link to="/invoice/$id" params={{ id: invoice.id }}>
                            {invoice.identifier}
                          </Link>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Blueprint>

        <Blueprint className="p-3">
          <Kicker className="mb-2">Invoices</Kicker>
          <div className="flex flex-col gap-2">
            {owner.invoices.length === 0 ? (
              <p className="text-ink-600 m-0 text-[12.5px]">
                Nothing billed to this owner yet.
              </p>
            ) : (
              owner.invoices.map((invoice) => (
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
                  <span className="text-ink-600 min-w-0 flex-1">
                    {shortDate(invoice.createdAt)}
                  </span>
                  <span className="tabular-nums">
                    {rupiah(invoice.totalGross)}
                  </span>
                  <InvoiceStatusTag status={invoice.status} />
                </div>
              ))
            )}
          </div>
        </Blueprint>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <Blueprint className="p-3">
          <div className="mb-2 flex items-baseline">
            <Kicker>Patients</Kicker>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              asChild
            >
              <Link to="/patient/add">
                <Plus />
                Add pet
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {owner.patients.length === 0 ? (
              <p className="text-ink-600 m-0 text-[12.5px]">
                No pets on file yet.
              </p>
            ) : (
              owner.patients.map((patient) => (
                <Link
                  key={patient.id}
                  to="/patient/$id"
                  params={{ id: patient.id }}
                  className="hover:bg-accent flex items-center gap-2 px-1.5 py-1 no-underline"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground text-[13px]">
                      {patient.name}
                    </div>
                    <div className="text-ink-600 text-[11px]">
                      {[patient.species, patient.breed, petAge(patient.dob)]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  {inVisitPatientIds.has(patient.id) ? (
                    <span className="tag tag-accent text-[9px]">IN VISIT</span>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </Blueprint>

        <Blueprint className="p-3">
          <Kicker className="mb-1.5">Record trail</Kicker>
          <p className="text-ink-600 m-0 text-[11.5px] leading-[1.6]">
            {owner.lastVisitAt
              ? `Last seen ${shortDate(owner.lastVisitAt)}.`
              : 'No visits recorded yet.'}
            <br />
            Every record stores who created and last updated it.
          </p>
        </Blueprint>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="text-ink-700 mb-1.5 block text-xs">{label}</span>
      {children}
    </label>
  );
}
