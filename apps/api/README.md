# api

The SVET backend: NestJS 11 on Fastify, Prisma 7, PostgreSQL.

Served under the global prefix **`/v1`**. OpenAPI UI at **`/api-docs`**, which
sits outside the prefix.

```bash
pnpm nx serve api      # http://localhost:3000/v1
```

Setup and environment variables are in the [workspace README](../../README.md).
This document is about how the code is arranged and why.

## Two entry points, one configuration

| File            | Used by                               |
| --------------- | ------------------------------------- |
| `main.ts`       | `nx serve`, containers — binds a port |
| `serverless.ts` | Vercel — exports a request handler    |

Neither one configures the app. Both call `configureApp()` from
[`app/configure-app.ts`](src/app/configure-app.ts), which sets CORS, the global
prefix, the Prisma exception filter, and Swagger. That indirection exists
because a CORS origin fixed in one entry point and not the other is a bug that
only appears in production.

## Request lifecycle

```
request
  │
  ├─ ZodValidationPipe      global pipe    — validates the DTO, 400 on failure
  ├─ AccessTokenGuard       global guard   — 401 unless the handler is @Public()
  ├─ Controller                            — routing and shape only
  ├─ Service                               — business rules, Prisma calls
  └─ PrismaClientExceptionFilter           — P2002 → 409, P2025 → 404
```

The pipe and the guard are registered in
[`app/app.module.ts`](src/app/app.module.ts); the filter in `configure-app.ts`.
All three are opt-**out**. A new controller is validated and protected without
its author doing anything, and opening a route up takes a deliberate
`@Public()`. Forgetting a decorator fails closed.

## Directory layout

```
src/
  app/          composition root, cross-cutting configuration
  common/       DTOs, error filters, interfaces, utils shared by all modules
  database/     Prisma schema, migrations, generated client
  guard/        the global auth guard and its decorators
  jobs/         scheduled work, plus the routes that trigger it
  modules/      one folder per resource — the bulk of the app
  shared/       PrismaService and its @Global module
```

`@/` maps to `src/`, so imports read `@/common/utils/pagination.util` from
anywhere. Payload types come from `@svet-monorepo/schemas`.

## The CRUD module pattern

Most of `modules/` is the same four files repeated per resource:

```
modules/owners/
  dto/owner.dto.ts       createZodDto wrappers — no rules of their own
  owner.controller.ts    routes
  owner.service.ts       Prisma work
  owner.module.ts        wiring
```

The controllers are deliberately uniform. Thirteen of them expose exactly the
same twelve verbs, which is what lets the web client drive all of them from one
`createResource` factory:

| Route                          | Purpose                        |
| ------------------------------ | ------------------------------ |
| `GET /v1/owner`                | paginated list                 |
| `GET /v1/owner/all`            | unpaginated, for backup/export |
| `GET /v1/owner/:id`            | one row, with detail relations |
| `POST /v1/owner`               | create                         |
| `PATCH /v1/owner/bulk`         | create many                    |
| `PATCH /v1/owner/:id`          | update                         |
| `DELETE /v1/owner/:id`         | soft delete — sets `deletedAt` |
| `DELETE /v1/owner/bulk`        | soft delete many               |
| `DELETE /v1/owner/force/:id`   | permanent delete               |
| `DELETE /v1/owner/force/bulk`  | permanent delete many          |
| `PATCH /v1/owner/restore/:id`  | clear `deletedAt`              |
| `PATCH /v1/owner/restore/bulk` | restore many                   |

Resource paths are **singular** (`/owner`, not `/owners`) even though the
module folder is plural.

Not everything is a CRUD resource, and the exceptions are worth knowing before
you assume the shape:

| Controller       | Verbs | Why it differs                                      |
| ---------------- | ----- | --------------------------------------------------- |
| `visit`          | 16    | CRUD plus status transitions                        |
| `treatment`      | 13    | CRUD plus one extra read                            |
| `medical-record` | 13    | CRUD plus one extra read                            |
| `visit-detail`   | 11    | no bulk create                                      |
| `invoice`        | 9     | invoices are not bulk-created or bulk-restored      |
| `inventory`      | 4     | ledger, stock, low-stock, movement — not a resource |
| `setting`        | 2     | a single row: read it, patch it                     |
| `dashboard`      | 1     | one aggregate read                                  |

**Keep literal routes above `:id`.** Every controller declares `bulk`,
`force/…`, and `restore/…` before the parameterised routes. Follow it — it is
the Nest convention, it is what the whole codebase does, and it removes any
question of whether the router prefers a static segment over a parameter.

### Where the work goes

Controllers do routing and nothing else — no conditionals, no Prisma. Services
own the rules. In practice a service file is mostly a set of `satisfies
Prisma.XInclude` constants near the top, because the list view and the detail
view need different relations:

```ts
/** The list needs the owner's pets and the date they were last in. */
const ownerListInclude = { ... } satisfies Prisma.OwnerInclude;

/** The detail screen adds their visit and invoice history. */
const ownerDetailInclude = { ... } satisfies Prisma.OwnerInclude;
```

`satisfies` rather than a type annotation keeps the literal's exact shape, so
`Prisma.OwnerGetPayload<{ include: typeof ownerListInclude }>` can derive the
row type instead of anyone hand-writing it.

Services may also map rows on the way out (`toListItem` flattening a
`visits[0].visitDate` into `lastVisitAt`, for instance). When they do, the
returned shape is **wider than the Zod response schema** in `libs/schemas` —
the schema is not enforced on the way out of the API, only on the way into the
web client.

## Cross-cutting pieces

| Concern  | File                              | Notes                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------- |
| Auth     | `guard/access-token.guard.ts`     | Global. Reads a bearer token, resolves the caller via `AuthPort` |
| Opt-out  | `guard/public.decorator.ts`       | `@Public()` — the only way to open a route                       |
| Caller   | `guard/current-user.decorator.ts` | `@CurrentUser()` — the principal the guard attached              |
| Paging   | `common/utils/pagination.util.ts` | `paginate()` — page query + count, returns `{ data, meta }`      |
| Errors   | `common/errors/prisma.error.ts`   | Prisma error codes → HTTP status                                 |
| Database | `shared/prisma.service.ts`        | `@Global`, so no module imports it explicitly                    |

### Pagination

Every list endpoint takes `PaginationDto` and returns `{ data, meta }`. The
defaults live in `PaginationSchema` in `libs/schemas`, not in the controller:
`page` 1, `limit` 10 (max 100), `sortBy` `createdAt`, `sortOrder` `desc`.

Two things to know before you rely on it:

- The request says `limit`; the response's `meta` calls it `perPage`.
- `sortBy` is a free string passed straight to Prisma's `orderBy`. An unknown
  column makes Prisma throw, so a bad `?sortBy=` returns 500, not 400.

### Soft deletes

Nearly every model carries `deletedAt`. `DELETE` sets it; the `force` routes
actually remove the row. Queries must filter `deletedAt: null` themselves —
there is no global middleware doing it, so a forgotten filter silently returns
deleted records.

## The auth module

`modules/auth` is the one module that is not CRUD, and it is structured as
ports and adapters:

```
auth/
  ports/auth.port.ts              what the rest of the app may ask of auth
  contracts/                      shared types
  controllers/                    HTTP surface + its error filter
  services/                       sign-in, OAuth sign-in, sessions, rules
  infrastructure/                 JWT issuer, Google provider, registries
  auth.config.ts                  environment → typed config, once, at boot
```

Everything outside the module talks to `AuthPort` and never to a service inside
it — including `AccessTokenGuard`, which is why the guard lives in `guard/`
rather than here. `auth.config.ts` reads `process.env` at startup and throws if
`JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` is missing, so a misconfigured API
fails at boot instead of at the first sign-in.

These files are already commented in some depth; read them rather than this
section if you are changing auth behaviour.

## Scheduled work

`jobs/` holds two things that run on a clock:

- `visit.job.ts` — moves `SCHEDULED` visits to `ONGOING` once their time has
  passed, and abandons day-old `ONGOING` visits as `CANCELLED`.
- session pruning, reached through `AuthPort`.

Both are driven by `@Cron` decorators **and** exposed as routes under
`/v1/cron/*` by `cron.controller.ts`. That duplication is intentional: a
serverless deployment is frozen between requests, so the timers never fire
there and the platform scheduler calls the routes instead. Both jobs are
idempotent, so two trigger paths are safe.

The cron routes are `@Public()` — they carry no user — and authenticate with
`CRON_SECRET` compared in constant time. **Unset `CRON_SECRET` means they
refuse every caller**, which is the safe direction to fail.

## Database

Prisma's schema, migrations, and generated client all live under
`src/database/prisma/`. The client is generated **into the source tree**
(`generated/`), not into `node_modules`, which is why imports read
`@/database/prisma/generated/client`.

```bash
pnpm nx db-generate api    # regenerate the client after editing schema.prisma
pnpm nx db-migrate api     # create and apply a migration
pnpm nx db-push api        # push without a migration (early development)
pnpm nx db-studio api      # browse the data
```

`db-generate` is a dependency of `build`, but nothing regenerates the client
for your editor — after changing `schema.prisma`, run it yourself or TypeScript
will keep type-checking against the old models.

Connection goes through an explicit `pg` Pool and the `@prisma/adapter-pg`
driver adapter rather than Prisma's bundled query engine, which is what lets
the same build run as a serverless function.

Conventions in `schema.prisma`: UUID primary keys, `snake_case` column names
via `@map` against `camelCase` fields, and `createdAt` / `updatedAt` /
`deletedAt` on nearly every model.

## Conventions

- **Payload types come from `@svet-monorepo/schemas`.** DTOs are
  `createZodDto(SomeSchema)` and hold no rules of their own. Do not restate a
  schema's constraints in a DTO or a comment.
- **Comments explain why.** The house style is short prose about a decision or
  a trap, not `@param` blocks restating the signature. Full TSDoc tags are for
  exported, shared APIs.
- **`@/` for intra-app imports**, relative paths only within a folder.
- **Indonesian appears in user-facing strings and some log messages.** Code,
  identifiers, and comments are English.

## Checks

```bash
pnpm nx lint api
pnpm nx build api
```

There is **no `typecheck` target on this project** — `web` has one, `api` does
not, so type errors here surface at `build` time. There is no test target
either; no runner is configured in this workspace yet.

## Troubleshooting

**`@prisma/client did not initialize yet`**
Run `pnpm nx db-generate api`.

**The process exits at startup naming a JWT secret**
`auth.config.ts` requires `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

**A new route returns 401 and you did not add auth**
That is the global guard. Add `@Public()` if the route is genuinely public.

**`/bulk` is treated as an id**
A `:id` route is declared above it. Move the literal routes up.

**A deleted record still appears in a list**
The query is missing `deletedAt: null`. Nothing applies it for you.

**Preflight fails on PATCH or DELETE**
`FRONTEND_URL` must match the browser's origin exactly.
