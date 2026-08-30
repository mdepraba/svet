import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { getContext } from './integrations/tanstack-query/root-provider';

/**
 * Builds the router, wired to TanStack Query for SSR hand-off.
 *
 * A factory, not a constant: TanStack Start calls it per server request so one
 * visitor's loaded data cannot leak into another's render.
 *
 * @returns A configured router instance.
 */
export function getRouter() {
  const context = getContext();

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
