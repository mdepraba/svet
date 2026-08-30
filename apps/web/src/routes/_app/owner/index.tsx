import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import { ListTable, Pager } from '@/components/industry/ListTable';
import { PageHead } from '@/components/industry/PageHead';
import { SearchInput, Toolbar } from '@/components/industry/Toolbar';
import { Button } from '@/components/ui/button';
import { ownerColumns } from '@/features/owners/components/OwnerColumn';
import { owners } from '@/features/owners/queries/ownerResource';
import type { ListParams } from '@/lib/resource';

const searchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  q: z.string().default('').catch(''),
});

function toParams(search: z.infer<typeof searchSchema>): ListParams {
  return { page: search.page, limit: 10, search: search.q || undefined };
}

export const Route = createFileRoute('/_app/owner/')({
  staticData: { breadcrumbTitle: 'Owner' },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) =>
    owners.ensureList(queryClient, toParams(search)),
  component: OwnerIndexPage,
});

function OwnerIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data, isFetching } = useQuery(owners.listOptions(toParams(search)));

  const total = data?.meta.total ?? 0;

  return (
    <div className="flex h-full flex-col gap-3.5">
      <PageHead
        kicker="Medical"
        title="Owners"
        actions={
          <Button asChild>
            <Link to="/owner/add">Add owner</Link>
          </Button>
        }
      />

      <Toolbar count={`${total} ${total === 1 ? 'owner' : 'owners'}`}>
        <SearchInput
          placeholder="Search name, email or phone"
          value={search.q}
          onChange={(event) =>
            navigate({
              search: (prev) => ({ ...prev, page: 1, q: event.target.value }),
            })
          }
        />
      </Toolbar>

      <ListTable
        columns={ownerColumns}
        data={data?.data ?? []}
        isLoading={isFetching && !data}
        emptyMessage="No owners match this search."
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
