/**
 * Where the API lives. Lives in its own module because both `api.ts` and the
 * token-refresh plumbing need it, and importing one from the other would make
 * a cycle.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1';
