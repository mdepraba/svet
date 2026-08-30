import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Blueprint } from '@/components/industry/Blueprint';
import { authConfig } from '@/lib/auth/auth.config';
import { fetchCurrentUser, landingRoute } from '@/lib/auth/authClient';
import { clearSession, saveTokens } from '@/lib/auth/session';

/**
 * Where a provider round trip lands.
 *
 * The API puts the result in the URL *fragment* rather than the query string,
 * because a fragment never leaves the browser — no proxy log, no server access
 * log, and no `Referer` header ever sees the tokens. The cost is that only
 * client-side JavaScript can read it, which is why this page does its work in
 * an effect and shows a holding message meanwhile.
 */
export const Route = createFileRoute('/auth/callback')({
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Finishing sign-in…');

  // React 19 runs effects twice in development; consuming the fragment twice
  // would try to store tokens that are no longer in the URL.
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));

    // Clear the fragment before anything can await, so the tokens are out of
    // the address bar and out of the history entry.
    window.history.replaceState(null, '', window.location.pathname);

    const failure = params.get('error');

    if (failure) {
      const description =
        params.get('error_description') ?? 'That sign-in did not complete.';

      clearSession();
      setMessage(description);
      toast.error(description);
      void navigate({ to: authConfig.signInRoute, replace: true });

      return;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = Number(params.get('expires_in'));

    if (!accessToken || !refreshToken || !Number.isFinite(expiresIn)) {
      clearSession();
      setMessage('That sign-in link was incomplete.');
      toast.error('That sign-in link was incomplete. Try again.');
      void navigate({ to: authConfig.signInRoute, replace: true });

      return;
    }

    const linked = params.get('linked') === '1';
    const redirectTo = params.get('redirect_to');

    saveTokens({ accessToken, refreshToken, expiresIn });

    // The fragment carries tokens but not who they belong to, so the first
    // thing the new session does is ask.
    fetchCurrentUser()
      .then((user) => {
        toast.success(
          linked
            ? `Signed in as ${user.name} — that provider is now linked to your existing account.`
            : `Signed in as ${user.name}`,
        );

        void navigate({ to: landingRoute(redirectTo), replace: true });
      })
      .catch(() => {
        clearSession();
        setMessage('Could not confirm that sign-in.');
        toast.error('Could not confirm that sign-in. Try again.');
        void navigate({ to: authConfig.signInRoute, replace: true });
      });
  }, [navigate]);

  return (
    <div className="bg-background text-foreground grid min-h-screen place-items-center p-6">
      <Blueprint className="w-[340px] max-w-full px-4 py-4 text-center">
        <div className="font-heading text-[19px]">Almost there</div>
        <div className="text-ink-600 mt-1 text-xs">{message}</div>
      </Blueprint>
    </div>
  );
}
