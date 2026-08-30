import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import { ListTable, Pager } from '@/components/industry/ListTable';
import { PageHead } from '@/components/industry/PageHead';
import { SearchInput, SegFilter, Toolbar } from '@/components/industry/Toolbar';
import { Button } from '@/components/ui/button';
import { patientColumns } from '@/features/patients/components/PatientColumns';
import {
  patients,
  type PatientListParams,
} from '@/features/patients/queries/patientResource';

/**
 * Cat and Dog are the two the clinic sees most, so they get their own tabs;
 * everything else falls into Other, which the API cannot express as a single
 * `species=` value — it is filtered client-side against the fetched page.
 */
const SPECIES_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Cat', label: 'Cat' },
  { value: 'Dog', label: 'Dog' },
  { value: 'other', label: 'Other' },
] as const;

const searchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  q: z.string().default('').catch(''),
  species: z.enum(['all', 'Cat', 'Dog', 'other']).default('all').catch('all'),
});

function toParams(search: z.infer<typeof searchSchema>): PatientListParams {
  return {
    page: search.page,
    limit: 10,
    search: search.q || undefined,
    species:
      search.species === 'all' || search.species === 'other'
        ? undefined
        : search.species,
  };
}

export const Route = createFileRoute('/_app/patient/')({
  staticData: { breadcrumbTitle: 'Patient' },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) =>
    patients.ensureList(queryClient, toParams(search)),
  component: PatientIndexPage,
});

function PatientIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data, isFetching } = useQuery(patients.listOptions(toParams(search)));

  const rows =
    search.species === 'other'
      ? (data?.data ?? []).filter(
          (patient) => !['cat', 'dog'].includes(patient.species.toLowerCase()),
        )
      : (data?.data ?? []);

  const total = data?.meta.total ?? 0;

  const setSearch = (next: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...next }) });

  return (
    <div className="flex h-full flex-col gap-3.5">
      <PageHead
        kicker="Medical"
        title="Patients"
        actions={
          <Button asChild>
            <Link to="/patient/add">Add patient</Link>
          </Button>
        }
      />

      <Toolbar count={`${total} ${total === 1 ? 'patient' : 'patients'}`}>
        <SearchInput
          className="w-[240px]"
          placeholder="Search pet or owner name"
          value={search.q}
          onChange={(event) => setSearch({ q: event.target.value })}
        />
        <SegFilter
          name="patient-species"
          value={search.species}
          options={SPECIES_OPTIONS}
          onChange={(species) => setSearch({ species })}
        />
      </Toolbar>

      <ListTable
        columns={patientColumns}
        data={rows}
        isLoading={isFetching && !data}
        emptyMessage="No patients match these filters."
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
