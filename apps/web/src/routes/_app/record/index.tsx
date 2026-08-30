import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { z } from 'zod';

import { Blueprint } from '@/components/industry/Blueprint';
import { Pager } from '@/components/industry/ListTable';
import { SearchInput, SegFilter, Toolbar } from '@/components/industry/Toolbar';
import { Button } from '@/components/ui/button';
import { medicalRecords } from '@/features/records/queries/recordResource';
import { shortDate } from '@/lib/format';
import type { MedicalRecordListItem } from '@svet-monorepo/schemas';

const SPECIES_OPTIONS = [
  { value: 'all', label: 'All species' },
  { value: 'Cat', label: 'Cat' },
  { value: 'Dog', label: 'Dog' },
  { value: 'other', label: 'Other' },
] as const;

const searchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  q: z.string().default('').catch(''),
  species: z.enum(['all', 'Cat', 'Dog', 'other']).default('all').catch('all'),
  /** The record whose summary is expanded underneath its row. */
  open: z.string().default('').catch(''),
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

/**
 * The species filter runs client-side: the record search on the API matches
 * diagnoses and product names, and narrowing by species is a property of the
 * patient rather than of the record.
 */
function matchesSpecies(
  record: MedicalRecordListItem,
  species: z.infer<typeof searchSchema>['species'],
) {
  if (species === 'all') return true;
  const patientSpecies = record.patient.species.toLowerCase();
  if (species === 'other') return !['cat', 'dog'].includes(patientSpecies);
  return patientSpecies === species.toLowerCase();
}

export const Route = createFileRoute('/_app/record/')({
  staticData: { breadcrumbTitle: 'Medical record' },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) =>
    medicalRecords.ensureList(queryClient, toParams(search)),
  component: RecordIndexPage,
});

function RecordIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useQuery(medicalRecords.listOptions(toParams(search)));

  const rows = (data?.data ?? []).filter((record) =>
    matchesSpecies(record, search.species),
  );

  const setSearch = (next: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...next }) });

  const toggle = (id: string) =>
    navigate({
      search: (prev) => ({ ...prev, open: prev.open === id ? '' : id }),
    });

  return (
    <div className="flex h-full flex-col gap-3.5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="kicker-accent">
            Medical · one row per record, per patient
          </div>
          <h3 className="mt-0.5 text-[25px]">Medical records</h3>
        </div>
        <span className="text-ink-600 text-xs">
          Search a diagnosis to see how it was treated before
        </span>
      </div>

      <Toolbar count={`${rows.length} shown`}>
        <SearchInput
          className="w-[320px]"
          placeholder="Search a diagnosis or a product"
          value={search.q}
          onChange={(event) => setSearch({ q: event.target.value })}
        />
        <SegFilter
          name="record-species"
          value={search.species}
          options={SPECIES_OPTIONS}
          onChange={(species) => setSearch({ species })}
        />
      </Toolbar>

      <Blueprint className="min-h-0 flex-1 overflow-auto p-0">
        <table className="table text-[12.5px]">
          <thead>
            <tr>
              <th className="w-8 pl-3" />
              <th>Date</th>
              <th>Patient</th>
              <th>Species / breed</th>
              <th>Owner</th>
              <th>Vet</th>
              <th>Diagnosis</th>
              <th className="pr-3 text-right">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-ink-600 h-24 text-center">
                  No records match this search.
                </td>
              </tr>
            ) : (
              rows.map((record) => {
                const isOpen = search.open === record.id;
                const detail = record.visitDetails;

                return (
                  <RecordRows
                    key={record.id}
                    record={record}
                    isOpen={isOpen}
                    onToggle={() => toggle(record.id)}
                    visitId={detail?.visitId}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </Blueprint>

      <Pager
        meta={data?.meta}
        onPageChange={(page) =>
          navigate({ search: (prev) => ({ ...prev, page }) })
        }
      />
    </div>
  );
}

function RecordRows({
  record,
  isOpen,
  onToggle,
  visitId,
}: {
  record: MedicalRecordListItem;
  isOpen: boolean;
  onToggle: () => void;
  visitId: string | undefined;
}) {
  const detail = record.visitDetails;

  return (
    <>
      <tr
        className={
          isOpen
            ? 'bg-[color-mix(in_srgb,var(--color-accent)_7%,transparent)]'
            : undefined
        }
      >
        <td className="pl-3">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse record' : 'Expand record'}
          >
            {isOpen ? (
              <ChevronDown className="text-primary size-3.5" />
            ) : (
              <ChevronRight className="size-3.5 opacity-45" />
            )}
          </button>
        </td>
        <td className="tabular-nums">
          {shortDate(detail?.visit.visitDate ?? null)}
        </td>
        <td>
          <Link to="/patient/$id" params={{ id: record.patientId }}>
            {record.patient.name}
          </Link>
        </td>
        <td>
          {record.patient.species}
          {record.patient.breed ? ` · ${record.patient.breed}` : ''}
        </td>
        <td>
          <Link to="/owner/$id" params={{ id: record.patient.owner.id }}>
            {record.patient.owner.name}
          </Link>
        </td>
        <td>{detail?.vet.name ?? '—'}</td>
        <td>{record.diagnosis ?? <span className="text-ink-400">—</span>}</td>
        <td className="pr-3 text-right">
          {visitId ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/visit/$id" params={{ id: visitId }}>
                Detail
              </Link>
            </Button>
          ) : (
            <span className="text-ink-400">—</span>
          )}
        </td>
      </tr>

      {isOpen ? (
        <tr className="bg-[color-mix(in_srgb,var(--color-accent)_4%,transparent)]">
          <td colSpan={8} className="px-3 pt-0 pb-3 pl-10">
            <div className="border-border mb-2.5 grid grid-cols-2 border sm:grid-cols-4">
              <Vital label="Temp °C" value={record.temperature} />
              <Vital label="Pulse" value={record.pulse} />
              <Vital label="Resp" value={record.respiration} />
              <Vital label="Weight kg" value={record.weight} last />
            </div>

            <div className="mb-2.5 grid gap-3.5 sm:grid-cols-3">
              <Prose label="Anamnesis" text={record.anamnesis} />
              <Prose label="Diagnosis" text={record.diagnosis} />
              <Prose label="Plan" text={record.treatment} />
            </div>

            <div className="border-border flex flex-wrap items-center gap-3.5 border-t pt-2">
              <span className="text-ink-600 text-[11.5px]">
                {usedSummary(record)}
              </span>
              {detail ? (
                <Link
                  to="/visit/$id"
                  params={{ id: detail.visitId }}
                  className="ml-auto text-xs"
                >
                  Open visit
                </Link>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** `Used · General consultation, SC fluids · Ringer Lactate ×1, …` */
function usedSummary(record: MedicalRecordListItem): string {
  const services =
    record.visitDetails?.visitTreatmentAssocs.map((line) =>
      line.qty > 1
        ? `${line.treatment.name} ×${line.qty}`
        : line.treatment.name,
    ) ?? [];
  const productsFromVisit =
    record.visitDetails?.visitProductAssocs.map(
      (line) => `${line.product.name} ×${line.qty}`,
    ) ?? [];
  const productsFromUsage = record.MedicalUsages.map(
    (usage) => `${usage.product.name} ×${usage.quantity}`,
  );

  const products = productsFromVisit.length
    ? productsFromVisit
    : productsFromUsage;

  if (services.length === 0 && products.length === 0) {
    return 'Nothing recorded as used on this visit.';
  }

  return ['Used', services.join(', ') || null, products.join(', ') || null]
    .filter(Boolean)
    .join(' · ');
}

function Vital({
  label,
  value,
  last = false,
}: {
  label: string;
  value: number | null;
  last?: boolean;
}) {
  return (
    <div className={`px-2.5 py-1.5 ${last ? '' : 'border-border sm:border-r'}`}>
      <div className="text-[9px] tracking-[0.1em] uppercase opacity-50">
        {label}
      </div>
      <div className="stat-num text-[16px]">{value ?? '—'}</div>
    </div>
  );
}

function Prose({ label, text }: { label: string; text: string | null }) {
  return (
    <div>
      <div className="mb-0.5 text-[9.5px] tracking-[0.1em] uppercase opacity-50">
        {label}
      </div>
      <div className="text-[12.5px] leading-[1.5]">
        {text || <span className="text-ink-400">—</span>}
      </div>
    </div>
  );
}
