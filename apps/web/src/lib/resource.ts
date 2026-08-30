import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { z } from 'zod';

import { apiFetch } from './api';

/**
 * The server's pagination contract (see `apps/api/src/common/utils/pagination.util.ts`).
 * Note `limit`, not `perPage` — the DTO ignores anything else and falls back to 10.
 */
export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /**
   * Screen-specific filters — `species` on patients, `status` on visits.
   * Serialised as-is; `undefined` and `''` are dropped so a cleared filter
   * does not become `?species=`.
   */
  [key: string]: string | number | undefined;
};

export function listQueryString(params: ListParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

type ResourceOptions<TItem, TList, TDetail> = {
  /** Root of the react-query key, e.g. `owners`. */
  key: string;
  /** API path under the `/v1` prefix, e.g. `/owner`. */
  path: string;
  /** The bare row a write returns. */
  itemSchema: z.ZodType<TItem>;
  listSchema: z.ZodType<TList>;
  /**
   * What `GET /path/:id` returns, when the detail endpoint carries more
   * relations than a write does. Defaults to `itemSchema`.
   */
  detailSchema?: z.ZodType<TDetail>;
};

/**
 * Builds the query/mutation layer for one API resource. Every model exposes
 * the same twelve-verb controller, so the only things that differ per resource
 * are the path and the two response schemas — which is all this takes.
 *
 * Responses are parsed rather than cast, so a backend shape change surfaces at
 * the boundary instead of as a render crash three components deep.
 */
export function createResource<
  TItem,
  TList,
  TCreate,
  TUpdate = Partial<TCreate>,
  TDetail = TItem,
>({
  key,
  path,
  itemSchema,
  listSchema,
  detailSchema,
}: ResourceOptions<TItem, TList, TDetail>) {
  const readSchema = (detailSchema ??
    (itemSchema as unknown as z.ZodType<TDetail>)) as z.ZodType<TDetail>;

  const keys = {
    all: [key] as const,
    lists: () => [key, 'list'] as const,
    list: (params: ListParams = {}) => [key, 'list', params] as const,
    details: () => [key, 'detail'] as const,
    detail: (id: string) => [key, 'detail', id] as const,
  };

  async function getList(params: ListParams = {}): Promise<TList> {
    const response = await apiFetch<TList>(`${path}${listQueryString(params)}`);
    return listSchema.parse(response);
  }

  async function getOne(id: string): Promise<TDetail> {
    const response = await apiFetch<TDetail>(`${path}/${id}`);
    return readSchema.parse(response);
  }

  async function create(input: TCreate): Promise<TItem> {
    const response = await apiFetch<TItem>(path, {
      method: 'POST',
      body: input,
    });
    return itemSchema.parse(response);
  }

  async function update(id: string, input: TUpdate): Promise<TItem> {
    const response = await apiFetch<TItem>(`${path}/${id}`, {
      method: 'PATCH',
      body: input,
    });
    return itemSchema.parse(response);
  }

  async function remove(id: string): Promise<void> {
    await apiFetch<void>(`${path}/${id}`, { method: 'DELETE' });
  }

  const listOptions = (params: ListParams = {}) => ({
    queryKey: keys.list(params),
    queryFn: () => getList(params),
  });

  const detailOptions = (id: string) => ({
    queryKey: keys.detail(id),
    queryFn: () => getOne(id),
  });

  return {
    keys,
    getList,
    getOne,
    create,
    update,
    remove,
    listOptions,
    detailOptions,

    /** For route loaders: warm the cache before the component renders. */
    ensureList: (queryClient: QueryClient, params: ListParams = {}) =>
      queryClient.ensureQueryData(listOptions(params)),
    ensureDetail: (queryClient: QueryClient, id: string) =>
      queryClient.ensureQueryData(detailOptions(id)),

    useList(params: ListParams = {}) {
      return useQuery({
        ...listOptions(params),
        // Keeps the previous page on screen while the next one loads, so the
        // table does not collapse to a spinner on every pager click.
        placeholderData: keepPreviousData,
      });
    },

    useOne(id: string, options: { enabled?: boolean } = {}) {
      return useQuery({
        ...detailOptions(id),
        enabled: options.enabled ?? Boolean(id),
      });
    },

    useCreate() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: create,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: keys.all });
        },
      });
    },

    useUpdate() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, input }: { id: string; input: TUpdate }) =>
          update(id, input),
        onSuccess: (_data, variables) => {
          queryClient.invalidateQueries({ queryKey: keys.all });
          queryClient.invalidateQueries({
            queryKey: keys.detail(variables.id),
          });
        },
      });
    },

    useRemove() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: remove,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: keys.all });
        },
      });
    },
  };
}
