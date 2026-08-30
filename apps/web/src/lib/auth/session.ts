import {
  type AuthSession,
  type AuthUser,
  AuthUserSchema,
} from '@svet-monorepo/schemas';
import { z } from 'zod';

const STORAGE_KEY = 'svet.auth';

/**
 * What the browser holds between page loads.
 *
 * `expiresAt` is an absolute timestamp rather than the `expiresIn` the API
 * sends, because seconds-from-now stops meaning anything the moment it is
 * written to disk.
 */
const StoredSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number(),
  /**
   * Null for the moment between a provider redirect handing over tokens and
   * `/auth/me` answering with who they belong to.
   */
  user: AuthUserSchema.nullable(),
});

export type StoredSession = z.infer<typeof StoredSessionSchema>;

/**
 * A tiny store, rather than React state: the token has to be readable from
 * `apiFetch`, from a route's `beforeLoad`, and from components, and only one
 * of those three is inside a React tree.
 */
let current: StoredSession | null = null;
let loaded = false;
const listeners = new Set<() => void>();

export function getSession(): StoredSession | null {
  if (!loaded) {
    current = readFromStorage();
    loaded = true;
  }

  return current;
}

export function isSignedIn(): boolean {
  return getSession() !== null;
}

export function getUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

/** Stores the tokens from a sign-in, refresh, or provider redirect. */
export function saveTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): StoredSession {
  const existing = getSession();

  return commit({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
    // A refresh keeps whoever was already signed in; a fresh sign-in fills
    // this in a moment later.
    user: existing?.user ?? null,
  });
}

export function saveSession(session: AuthSession): StoredSession {
  return commit({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: Date.now() + session.expiresIn * 1000,
    user: session.user,
  });
}

export function saveUser(user: AuthUser): StoredSession | null {
  const existing = getSession();
  if (!existing) return null;

  return commit({ ...existing, user });
}

export function clearSession(): void {
  current = null;
  loaded = true;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing, or site data blocked. The in-memory value is already
    // gone, which is what matters for this tab.
  }

  notify();
}

// ---------------------------------------------------------------- store ----

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

/** For `useSyncExternalStore`. */
export function getSnapshot(): StoredSession | null {
  return getSession();
}

/**
 * Also for `useSyncExternalStore`. Always null: the server renders no page as
 * signed in, because it cannot see the browser's storage.
 */
export function getServerSnapshot(): StoredSession | null {
  return null;
}

/**
 * Keeps tabs in step — signing out in one signs out the rest, and a refresh in
 * one stops the others from using the token it just rotated away.
 */
export function watchOtherTabs(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;

    current = readFromStorage();
    loaded = true;
    notify();
  };

  window.addEventListener('storage', onStorage);

  return () => window.removeEventListener('storage', onStorage);
}

// ---------------------------------------------------------------- guts -----

function commit(session: StoredSession): StoredSession {
  current = session;
  loaded = true;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // As above: this tab still works, it just will not survive a reload.
  }

  notify();

  return session;
}

function readFromStorage(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = StoredSessionSchema.safeParse(JSON.parse(raw));

    // A stored shape from an older build is treated as no session at all,
    // rather than crashing the first component that reads it.
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}
