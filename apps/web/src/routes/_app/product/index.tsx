import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import { ListTable, Pager } from '@/components/industry/ListTable';
import { PageHead } from '@/components/industry/PageHead';
import { SearchInput, SegFilter, Toolbar } from '@/components/industry/Toolbar';
import { Button } from '@/components/ui/button';
import { productColumns } from '@/features/products/components/ProductColumns';
import {
  products,
  type ProductListParams,
} from '@/features/products/queries/productResource';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'MEDIC', label: 'Medical' },
  { value: 'NON_MEDIC', label: 'Non-medical' },
] as const;

const searchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  q: z.string().default('').catch(''),
  type: z.enum(['all', 'MEDIC', 'NON_MEDIC']).default('all').catch('all'),
});

function toParams(search: z.infer<typeof searchSchema>): ProductListParams {
  return {
    page: search.page,
    limit: 10,
    search: search.q || undefined,
    type: search.type === 'all' ? undefined : search.type,
  };
}

export const Route = createFileRoute('/_app/product/')({
  staticData: { breadcrumbTitle: 'Product' },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) =>
    products.ensureList(queryClient, toParams(search)),
  component: ProductIndexPage,
});

function ProductIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data, isFetching } = useQuery(products.listOptions(toParams(search)));

  const total = data?.meta.total ?? 0;
  const setSearch = (next: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...next }) });

  return (
    <div className="flex h-full flex-col gap-3.5">
      <PageHead
        kicker="Finance"
        title="Products"
        actions={
          <>
            <Button variant="outline" disabled>
              Categories
            </Button>
            <Button variant="outline" disabled>
              Units
            </Button>
            <Button disabled>Add product</Button>
          </>
        }
      />

      <Toolbar count={`${total} ${total === 1 ? 'product' : 'products'}`}>
        <SearchInput
          className="w-[220px]"
          placeholder="Search SKU or name"
          value={search.q}
          onChange={(event) => setSearch({ q: event.target.value })}
        />
        <SegFilter
          name="product-type"
          value={search.type}
          options={TYPE_OPTIONS}
          onChange={(type) => setSearch({ type })}
        />
      </Toolbar>

      <ListTable
        columns={productColumns}
        data={data?.data ?? []}
        isLoading={isFetching && !data}
        emptyMessage="No products match these filters."
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
