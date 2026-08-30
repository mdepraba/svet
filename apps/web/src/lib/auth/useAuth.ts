import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { authConfig } from './auth.config';
import { signOut as endSession } from './authClient';
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  watchOtherTabs,
} from './session';

/**
 * The signed-in user, and the one action a component ever needs to take about
 * it.
 *
 * `user` is null both when signed out and for the instant after a provider
 * redirect hands over tokens but before `/auth/me` answers — check
 * `isAuthenticated` for the question "may this person be here", and `user` for
 * "what do I put in the avatar".
 */
export function useAuth() {
  const navigate = useNavigate();

  const session = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(watchOtherTabs, []);

  const signOut = useCallback(
    async (options: { allSessions?: boolean } = {}) => {
      await endSession(options);
      await navigate({ to: authConfig.afterSignOutRoute, replace: true });
    },
    [navigate],
  );

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: session !== null,
    signOut,
  };
}
