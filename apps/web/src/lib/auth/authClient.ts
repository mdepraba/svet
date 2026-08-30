import {
  type AuthProvidersResponse,
  AuthProvidersResponseSchema,
  type AuthSession,
  AuthSessionSchema,
  type AuthUser,
  AuthUserSchema,
  type Register,
  type SignIn,
} from '@svet-monorepo/schemas';

import { API_BASE_URL, apiFetch } from '../api';
import { authConfig } from './auth.config';
import { clearSession, getSession, saveSession, saveUser } from './session';

/**
 * Every call the app makes about who is signed in. Responses are parsed rather
 * than cast, so an API shape change surfaces here instead of as a crash three
 * components deep.
 */

export async function signInWithPassword(
  credentials: SignIn,
): Promise<AuthSession> {
  const session = AuthSessionSchema.parse(
    await apiFetch('/auth/login', {
      method: 'POST',
      body: credentials,
      anonymous: true,
    }),
  );

  saveSession(session);

  return session;
}

export async function registerWithPassword(
  input: Register,
): Promise<AuthSession> {
  const session = AuthSessionSchema.parse(
    await apiFetch('/auth/register', {
      method: 'POST',
      body: input,
      anonymous: true,
    }),
  );

  saveSession(session);

  return session;
}

/**
 * Leaves the SPA entirely: the provider round trip is a browser redirect, so
 * that the tokens are minted server-side and the app never handles a provider
 * credential itself.
 *
 * `provider` is whatever the API registered — `google` today, another name
 * tomorrow, with nothing here to change.
 */
export function startProviderSignIn(
  provider: string,
  redirectTo?: string,
): void {
  const url = new URL(
    `${API_BASE_URL}/auth/oauth/${encodeURIComponent(provider)}`,
  );

  if (redirectTo) url.searchParams.set('redirect', redirectTo);

  window.location.assign(url.toString());
}

/** Which sign-in buttons this API can actually honour. */
export async function fetchAuthProviders(): Promise<AuthProvidersResponse> {
  return AuthProvidersResponseSchema.parse(
    await apiFetch('/auth/providers', { anonymous: true }),
  );
}

/** Confirms the stored session against the API and refreshes the cached user. */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const user = AuthUserSchema.parse(await apiFetch('/auth/me'));

  saveUser(user);

  return user;
}

export async function signOut(
  options: { allSessions?: boolean } = {},
): Promise<void> {
  const session = getSession();

  if (session) {
    // Best effort. If the API cannot be reached the local session still goes;
    // leaving the browser signed in because a request failed is the worse of
    // the two outcomes.
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: {
        refreshToken: session.refreshToken,
        allSessions: options.allSessions ?? false,
      },
      anonymous: true,
    }).catch(() => undefined);
  }

  clearSession();
}

/** Where to land after signing in, honouring a `?redirect=` if one is safe. */
export function landingRoute(redirect?: string | null): string {
  if (!redirect) return authConfig.afterSignInRoute;

  const isInAppPath =
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    !redirect.startsWith('/\\');

  return isInAppPath ? redirect : authConfig.afterSignInRoute;
}
