import { authConfig } from './auth.config';

/**
 * Whether a pathname is reachable without signing in, according to
 * `authConfig.publicRoutes`. Anything unlisted is private.
 */
export function isPublicRoute(pathname: string): boolean {
  const path = normalize(pathname);

  return authConfig.publicRoutes.some((pattern) => matches(path, pattern));
}

/**
 * Whether a signed-in visitor should be bounced off this route — the sign-in
 * and register screens, per `authConfig.guestOnlyRoutes`.
 */
export function isGuestOnlyRoute(pathname: string): boolean {
  const path = normalize(pathname);

  return authConfig.guestOnlyRoutes.some((pattern) => matches(path, pattern));
}

function matches(path: string, pattern: string): boolean {
  if (pattern === '*') return true;

  if (pattern.endsWith('/*')) {
    // `/auth/*` covers `/auth` itself as well as everything beneath it — the
    // parent of a public section is not usefully private.
    const prefix = normalize(pattern.slice(0, -2));

    return path === prefix || path.startsWith(`${prefix}/`);
  }

  return path === normalize(pattern);
}

/** Lowercases and drops a trailing slash, so `/Login/` matches `/login`. */
function normalize(pathname: string): string {
  const trimmed = pathname.trim().toLowerCase();
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');

  return withoutTrailingSlash === '' ? '/' : withoutTrailingSlash;
}
