import type { FileRouteTypes } from '@/routeTree.gen';

/**
 * Every route path the app actually has, straight from the generated route
 * tree — so a typo in the config below is a compile error, not a redirect loop
 * discovered at runtime.
 */
export type AppRoute = FileRouteTypes['to'];

/**
 * The one place that decides which parts of this app a signed-out visitor can
 * reach.
 *
 * **Everything is private unless it is listed here.** That direction matters:
 * a route added without a thought is protected, and the mistake shows up as a
 * redirect to the sign-in screen the first time anyone opens it. The opposite
 * default — public unless someone remembers to guard it — leaks quietly and is
 * usually found by whoever it leaks to.
 *
 * Patterns:
 *
 * | Pattern      | Matches                                        |
 * |--------------|------------------------------------------------|
 * | `/login`     | that path exactly                              |
 * | `/docs/*`    | `/docs` and everything beneath it               |
 * | `*`          | every route — only for a deliberately open app  |
 *
 * Matching is on the pathname alone; search params and hashes are ignored.
 */
export type AuthRouteConfig = {
  /** Reachable without a session. Anything not listed requires one. */
  publicRoutes: readonly string[];

  /**
   * Public routes that stop making sense once you are signed in — the sign-in
   * and register screens. Landing on one with a session redirects to
   * `afterSignInRoute` instead. Same pattern syntax as `publicRoutes`.
   */
  guestOnlyRoutes: readonly string[];

  /** Where an unauthenticated visitor is sent, with `?redirect=` attached. */
  signInRoute: AppRoute;

  /** Where sign-in lands when there is no `?redirect=` to honour. */
  afterSignInRoute: AppRoute;

  /** Where signing out lands. */
  afterSignOutRoute: AppRoute;
};

export const authConfig: AuthRouteConfig = {
  publicRoutes: [
    '/login',
    '/register',
    // The landing spot for a provider round trip, plus anything else the auth
    // flow needs on its way through.
    '/auth/*',
  ],

  guestOnlyRoutes: ['/login', '/register'],

  signInRoute: '/login',
  afterSignInRoute: '/dashboard',
  afterSignOutRoute: '/login',
};
