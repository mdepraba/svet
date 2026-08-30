/**
 * The envelope every list endpoint returns. Mirrors `paginatedResponseSchema`
 * in `@svet-monorepo/schemas` — change both together, nothing checks the drift.
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
  };
}
