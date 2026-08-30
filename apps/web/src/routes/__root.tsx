import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { Toaster } from 'sonner';

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';

import { AuthGate } from '@/components/AuthGate';
import { authConfig } from '@/lib/auth/auth.config';
import { isGuestOnlyRoute, isPublicRoute } from '@/lib/auth/routeAccess';
import { isSignedIn } from '@/lib/auth/session';

import appCss from '../styles.css?url';

import type { QueryClient } from '@tanstack/react-query';

interface MyRouterContext {
  queryClient: QueryClient;
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
  /**
   * The route guard, applied to every route in the app because it hangs off
   * the root. What counts as public lives in `@/lib/auth/auth.config` — this
   * only enforces it.
   *
   * Client-only: the session is in the browser's storage, which the server
   * render cannot see. `<AuthGate>` repeats the check after hydration so a
   * server-rendered first paint is not a way past it.
   */
  beforeLoad: ({ location }) => {
    if (typeof window === 'undefined') return;

    const signedIn = isSignedIn();

    if (!signedIn && !isPublicRoute(location.pathname)) {
      throw redirect({
        to: authConfig.signInRoute,
        search: { redirect: location.pathname },
        replace: true,
      });
    }

    if (signedIn && isGuestOnlyRoute(location.pathname)) {
      throw redirect({ to: authConfig.afterSignInRoute, replace: true });
    }
  },

  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'SVET',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <div className="flex flex-1 items-center justify-center p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="text-muted-foreground text-sm">
          Halaman yang kamu cari tidak tersedia.
        </p>
      </div>
    </div>
  ),
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script>{THEME_INIT_SCRIPT}</script>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <AuthGate>{children}</AuthGate>

        <Toaster position="top-right" />

        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
