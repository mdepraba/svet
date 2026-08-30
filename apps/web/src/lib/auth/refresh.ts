import { AuthSessionSchema } from '@svet-monorepo/schemas';

import { API_BASE_URL } from '../apiConfig';
import { clearSession, getSession, saveTokens, saveUser } from './session';

/**
 * Refresh a little before the access token actually dies, so a request that
 * takes a moment to reach the API does not arrive expired.
 */
const EXPIRY_SKEW_MS = 30_000;

/**
 * One refresh at a time. Without this, a screen that fires five queries on
 * mount sends five refreshes; the API rotates on the first and treats the
 * other four as replayed tokens, which burns the whole session.
 */
let inFlight: Promise<string | null> | null = null;

/**
 * The access token to send with the next request, refreshing first if it is
 * spent. `null` means there is no usable session.
 */
export async function getFreshAccessToken(): Promise<string | null> {
  const session = getSession();
  if (!session) return null;

  if (session.expiresAt - Date.now() > EXPIRY_SKEW_MS) {
    return session.accessToken;
  }

  return refreshAccessToken();
}

/** Forces a rotation — what a 401 on an otherwise valid-looking token means. */
export function refreshAccessToken(): Promise<string | null> {
  inFlight ??= rotate().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

async function rotate(): Promise<string | null> {
  const session = getSession();
  if (!session) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!response.ok) {
      // The refresh token is expired, revoked, or was replayed. There is no
      // recovering from any of those in the browser — sign out and let the
      // route guard take it from here.
      clearSession();
      return null;
    }

    const parsed = AuthSessionSchema.parse(await response.json());

    saveTokens(parsed);
    saveUser(parsed.user);

    return parsed.accessToken;
  } catch {
    // A network blip is not proof the session is dead, so the tokens stay put
    // and the caller simply fails this one request.
    return null;
  }
}
