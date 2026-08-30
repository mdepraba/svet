# web

The SVET front end: TanStack Start (React 19, Vite, Nitro), TanStack Router and
Query, Tailwind 4, shadcn/ui on Radix.

```bash
pnpm nx serve web      # http://localhost:4200
```

The API must be running too — see the [workspace README](../../README.md).
This document covers how the app is arranged; it is not a user guide.

## Layout

```
src/
  routes/        file-based routes; the URL structure is this tree
  features/      one folder per domain — components + queries
  components/    shared across features
    ui/            shadcn primitives — generated, avoid hand-editing
    industry/      the app's own building blocks (ListTable, Toolbar, PageHead…)
  lib/           API client, resource factory, auth, formatting
  integrations/  TanStack Query wiring
  hooks/         shared hooks
  router.tsx     router construction
  styles.css     Tailwind entry + design tokens
```

Two aliases both point at `src/`: **`@/`** in application code, **`#/`** in
`components.json`, so anything shadcn generates imports through `#/`. They
resolve identically.

## Routing

Routes are files. `routeTree.gen.ts` is generated from them — **never edit it**,
and expect it to change whenever you add a route.

| Convention                                       | Meaning                                              |
| ------------------------------------------------ | ---------------------------------------------------- |
| `__root.tsx`                                     | wraps everything; auth redirect lives here           |
| `_app.tsx`                                       | layout route for the signed-in app (sidebar, header) |
| `_app/owner/index.tsx`                           | `/owner`                                             |
| `_app/owner/$id.tsx`                             | `/owner/:id`                                         |
| `login.tsx`, `register.tsx`, `auth/callback.tsx` | public, outside `_app`                               |

### Where rendering happens

`_app.tsx` sets **`ssr: false`** for the entire signed-in app. That is
deliberate: every screen under it loads per-user data with an access token held
in browser storage, which a server render cannot see — so SSR would fetch
anonymously and get 401s. Nothing there is public or cacheable anyway.

The public screens keep SSR.

### The auth gate

Two layers, because neither is sufficient alone:

1. `__root.tsx`'s `beforeLoad` redirects unauthenticated visitors, but returns
   early on the server (`typeof window === 'undefined'`) since it cannot see
   the session.
2. `<AuthGate>` repeats the check after hydration, so a server-rendered first
   paint is not a way past the redirect.

What counts as public or guest-only is declared in `@/lib/auth/auth.config`,
not in either of those files — `routeAccess.ts` reads it and the route guards
only enforce it.

## Data layer

Every list/detail screen goes through **one factory**: `createResource` in
[`src/lib/resource.ts`](src/lib/resource.ts). Because the API gives nearly every
resource the same twelve verbs, a feature's whole data layer is a declaration:

```ts
export const owners = createResource<OwnerResponse, OwnerListItemsResponse, CreateOwner, UpdateOwner, OwnerDetail>({
  key: 'owners',
  path: '/owner',
  itemSchema: OwnerResponseSchema,
  listSchema: OwnerListItemsResponseSchema,
  detailSchema: OwnerDetailSchema,
});
```

That gives you query keys, fetchers, `useList` / `useOne` / `useCreate` /
`useUpdate` / `useRemove`, and `ensureList` / `ensureDetail` for route loaders.

Things worth knowing about it:

- **Responses are parsed, not cast.** A backend shape change fails at the
  boundary with a Zod error instead of crashing a component three levels down.
- **`useList` keeps the previous page** (`keepPreviousData`) so a table does not
  collapse into a spinner on every pager click.
- **Mutations invalidate the whole resource** (`keys.all`), plus the specific
  detail key on update. Simple and slightly broad — fine at this data size.
- **The list parameter is `limit`**, matching the API. The response's `meta`
  calls the same number `perPage`.

Anything that is not plain CRUD — the dashboard aggregate, inventory movements,
the visit worksheet — has a hand-written query file in its feature folder
instead.

### Caching

The live `QueryClient` is created in
[`src/integrations/tanstack-query/root-provider.tsx`](src/integrations/tanstack-query/root-provider.tsx)
and reaches routes through the router context, not a React provider. It sets
**no `defaultOptions`**, so React Query's defaults apply: `staleTime: 0`,
refetch on mount and window focus. Combined with the router's
`defaultPreloadStaleTime: 0`, a hover preload is a real request.

> `src/components/Providers.tsx` looks like the query setup but **is not
> mounted** — nothing imports it. Its `staleTime` and toast-on-error handlers
> are inert. Wiring that behaviour up means moving it into `getContext()`.

### Talking to the API

`apiFetch` in `lib/api.ts` is the only thing that talks to the API. It attaches
the bearer token, and on a 401 it rotates the token once and retries the request
once before giving up — so an expired access token is invisible to calling code
and does not bounce the user to `/login`. Pass `{ anonymous: true }` for the
endpoints that mint tokens, where attaching one would be circular.

Failures throw `ApiError` carrying `status` and the API's `error` code (the
`{ statusCode, message, error }` envelope the backend returns). A 204 resolves
as `undefined` rather than failing to parse.

`lib/apiConfig.ts` holds the base URL in its own module so the refresh plumbing
can import it without creating a cycle.

`VITE_API_URL` is baked in at **build** time. Changing it requires a rebuild,
not a restart. It defaults to `http://localhost:3000/v1`.

## Features

`features/<domain>/` holds what only that domain needs:

```
features/owners/
  components/    OwnerForm, OwnerColumn — forms and table column defs
  queries/       ownerResource.ts + an index.ts barrel
```

Current domains: `auth`, `catalog`, `dashboard`, `inventory`, `invoices`,
`owners`, `patients`, `products`, `records`, `settings`, `staff`, `treatments`,
`visits`.

A route file composes; it should not fetch directly. Loaders call the
feature's `ensureList` / `ensureDetail`, components call its hooks.

## Components

- **`components/ui/`** — shadcn primitives (new-york style, zinc base, Lucide
  icons), added with the shadcn CLI. Treat them as generated: local changes get
  lost the next time one is regenerated.
- **`components/industry/`** — this app's own vocabulary. `ListTable`,
  `Toolbar`, `PageHead`, `Tag`, `Blueprint`. A new list screen should reach for
  these before assembling a table by hand.
- Everything else in `components/` is app furniture: `Sidebar`, `Header`,
  `AuthGate`, `ThemeToggle`, `DynamicBreadcrumb`.

Compose class names with `cn()` from `@/lib/utils` so a caller's `className`
can override a component's own utilities.

## Styling and theming

Tailwind 4 via the Vite plugin — configuration lives in `src/styles.css` as CSS
variables, not in a `tailwind.config.js`. `components.json` points shadcn at
the same file.

Theme (`light` / `dark` / `auto`) is applied by an inline script in
`__root.tsx` that runs before first paint, reading `localStorage.theme`. It
sets a class and `data-theme` on `<html>`. That is why the script is inlined
and not imported: anything deferred would flash the wrong theme.

`useIsMobile()` duplicates Tailwind's `md` breakpoint (768px) in JS. Use it only
when a phone needs a different component tree; anything a `md:` class can
express should stay in CSS.

## Errors

Route errors under `_app` render `GlobalErrorComponent` (`ErrorSonner.tsx`),
which both toasts and renders an inline retry. Retry calls
`router.invalidate()`, re-running the failed loader without a full reload.

There is no global query-error toast, since the component that would provide it
is not mounted — a failed query surfaces through whatever the component does
with `isError`.

## Build and checks

```bash
pnpm nx typecheck web    # tsc --noEmit
pnpm nx lint web         # ESLint
pnpm nx build web        # typecheck runs first — it is a declared dependency
```

The build target is Nitro, and its output shape depends on `NITRO_PRESET`:
`node-server` by default, `vercel` in CI. See [`DEPLOYMENT.md`](../../DEPLOYMENT.md).

This project sets `strict: true` in its own `tsconfig.json`, overriding the
workspace base, along with `noUnusedLocals` and `noUnusedParameters` — code that
type-checks elsewhere in the monorepo may not here.

Formatting is **Biome** for this app (`biome.json`: tabs, double quotes), while
the rest of the workspace uses Prettier. Biome ignores `routeTree.gen.ts` and
`styles.css`.

`AGENTS.md` in this folder is a generated TanStack Intent index. Do not
hand-edit it.

There is no test target — no runner is configured in this workspace yet.

## Conventions

- **Payload types come from `@svet-monorepo/schemas`.** Do not redeclare a
  response shape locally.
- **Feature code stays in its feature folder** until a second domain needs it.
- **Comments explain why** — short prose about a decision or a trap, not
  restatements of the signature.
- **UI strings are Indonesian**; identifiers and comments are English.

## Troubleshooting

**A new route 404s**
`routeTree.gen.ts` regenerates on the dev server. Restart `nx serve web` if it
has not picked the file up.

**Everything redirects to `/login`**
No session in browser storage, or the API rejected the token. Check the network
tab for a 401 from `/v1`.

**Requests go to the wrong host**
`VITE_API_URL` is compile-time. Rebuild after changing it.

**A screen renders empty with no error**
A Zod parse failure in the resource layer throws — check the console for the
path it names, then compare against the schema in `libs/schemas`.

**Formatting fights with the editor**
This app uses Biome, not Prettier. Point the editor at `apps/web/biome.json`.
