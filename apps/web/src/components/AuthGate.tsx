import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';

import { authConfig } from '@/lib/auth/auth.config';
import { landingRoute } from '@/lib/auth/authClient';
import { isGuestOnlyRoute, isPublicRoute } from '@/lib/auth/routeAccess';
import { useAuth } from '@/lib/auth/useAuth';

/**
 * Enforces `authConfig` on the client, wrapped around the whole app in
 * `__root.tsx`.
 *
 * The root route's `beforeLoad` catches navigations, which covers every click
 * inside the app. This covers the two cases it cannot: the very first paint
 * after a server render — where `beforeLoad` already ran on the server, with
 * no access to the browser's storage — and a session that disappears while a
 * page is open, because it expired or another tab signed out.
 *
 * Children render either way. The real boundary is the API, which answers 401
 * to a request without a token; this only decides which screen a person is
 * looking at.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute(pathname)) {
      void navigate({
        to: authConfig.signInRoute,
        // `replace`, so the back button does not walk into the page that just
        // bounced them.
        replace: true,
        search: { redirect: pathname },
      });

      return;
    }

    if (isAuthenticated && isGuestOnlyRoute(pathname)) {
      void navigate({ to: landingRoute(null), replace: true });
    }
  }, [isAuthenticated, pathname, navigate]);

  return <>{children}</>;
}
