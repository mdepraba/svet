import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { z } from 'zod';

import { PageHead } from '@/components/industry/PageHead';
import { ListTable, Pager } from '@/components/industry/ListTable';
import { SearchInput, SegFilter, Toolbar } from '@/components/industry/Toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  visitListOptions,
  type VisitListParams,
} from '@/features/visits/queries/visitResource';
import { visitColumns } from '@/features/visits/components/VisitColumns';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const searchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  q: z.string().default('').catch(''),
  status: z
    .enum(['all', 'SCHEDULED', 'ONGOING', 'FINISHED', 'CANCELLED'])
    .default('all')
    .catch('all'),
  date: z.string().default('').catch(''),
});

/** Turns the URL's search params into the API's list params. */
function toParams(search: z.infer<typeof searchSchema>): VisitListParams {
  return {
    page: search.page,
    limit: 10,
    search: search.q || undefined,
    status: search.status === 'all' ? undefined : search.status,
    date: search.date || undefined,
    sortBy: 'visitDate',
    sortOrder: 'desc',
  };
}

export const Route = createFileRoute('/_app/visit/')({
  staticData: { breadcrumbTitle: 'Visit' },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) =>
    queryClient.ensureQueryData(visitListOptions(toParams(search))),
  component: VisitIndexPage,
});

function VisitIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data, isFetching } = useQuery(visitListOptions(toParams(search)));

  // Every filter resets to page 1 — staying on page 4 of a narrower result
  // set shows an empty table for no visible reason.
  const setSearch = (next: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...next }) });

  const total = data?.meta.total ?? 0;

  return (
    <div className="flex h-full flex-col gap-3.5">
      <PageHead
        kicker="Medical"
        title="Visits"
        actions={
          <Button asChild>
            <Link to="/visit/register">
              <Plus />
              Register visit
            </Link>
          </Button>
        }
      />

      <Toolbar count={`${total} ${total === 1 ? 'visit' : 'visits'}`}>
        <SearchInput
          placeholder="Search by owner name"
          value={search.q}
          onChange={(event) => setSearch({ q: event.target.value })}
        />
        <SegFilter
          name="visit-status"
          value={search.status}
          options={STATUS_OPTIONS}
          onChange={(status) => setSearch({ status })}
        />
        <Input
          type="date"
          className="h-9 w-[152px]"
          value={search.date}
          onChange={(event) => setSearch({ date: event.target.value })}
        />
      </Toolbar>

      <ListTable
        columns={visitColumns}
        data={data?.data ?? []}
        isLoading={isFetching && !data}
        isHighlighted={(visit) => visit.status === 'ONGOING'}
        emptyMessage="No visits match these filters."
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
