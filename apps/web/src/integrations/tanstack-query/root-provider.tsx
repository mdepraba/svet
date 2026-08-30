import { QueryClient } from '@tanstack/react-query';

/**
 * Builds the router context holding the app's QueryClient.
 *
 * @returns `{ queryClient }`. No `defaultOptions` are set, so React Query's
 *   defaults apply: `staleTime: 0`, refetch on mount and on window focus.
 */
export function getContext() {
  const queryClient = new QueryClient();

  return {
    queryClient,
  };
}
