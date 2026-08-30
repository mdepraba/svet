# SVET

Practice-management software for a veterinary clinic: the people who own the
animals, the animals themselves, what was done to them, what it cost, and what
came off the shelf to do it.

This is an [Nx](https://nx.dev) monorepo holding two deployable apps and the
contract between them.

| Project   | Path           | What it is                                                        |
| --------- | -------------- | ----------------------------------------------------------------- |
| `api`     | `apps/api`     | NestJS 11 on Fastify, Prisma 7, PostgreSQL                        |
| `web`     | `apps/web`     | TanStack Start (React 19, Vite, Nitro), Tailwind 4, shadcn/radix  |
| `schemas` | `libs/schemas` | Zod schemas both apps import — the shared request/response shapes |

The split that matters most here is the third one. `libs/schemas` is the single
definition of every payload: the API builds its DTOs from those schemas, and the
web client parses responses with the same objects. A field renamed in one place
breaks the build in the other, which is the point.

## Prerequisites

- **Node.js 24+** — enforced by `engines` in `package.json`
- **pnpm 11** — the repo pins `pnpm@11.22.0` via `packageManager`
- **PostgreSQL** — any reachable instance, local or hosted

## First run

```bash
pnpm install

# Environment. The API reads the root file first (see Configuration below).
cp .env.example .env

# Generate the Prisma client, then create the tables.
pnpm nx db-generate api
pnpm nx db-push api        # or: pnpm nx db-migrate api

# Two terminals, or two tabs.
pnpm nx serve api          # http://localhost:3000/v1
pnpm nx serve web          # http://localhost:4200
```

Before the API will start you must fill in `JWT_ACCESS_SECRET` and
`JWT_REFRESH_SECRET` — it refuses to boot without them rather than sign tokens
with a guessable key. Generate each with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

There is no seeded login. Register the first account through the web app's
`/register` screen; it is given the role named by `AUTH_DEFAULT_ROLE`
(`FRONT-DESK` by default), which must already exist in the `role` table.

## Everyday commands

Run tasks through Nx rather than the underlying tool — that is what gets you
caching and the dependency ordering (`build` will not run before
`db-generate`).

```bash
# Serve
pnpm nx serve api                 # watch-mode API on :3000
pnpm nx serve web                 # Vite dev server on :4200

# Check
pnpm nx run-many -t lint          # ESLint across all projects
pnpm nx typecheck web             # tsc --noEmit; web is the only project with this target
pnpm nx affected -t lint typecheck build   # what CI runs

# Build
pnpm nx build api                 # -> dist/apps/api
pnpm nx build web                 # -> apps/web/.output (Nitro)

# Database
pnpm nx db-generate api           # regenerate the Prisma client
pnpm nx db-migrate api            # create + apply a migration
pnpm nx db-push api               # push schema without a migration
pnpm nx db-studio api             # Prisma Studio

# Format
pnpm prettier --write "**/*.md"
```

`pnpm nx graph` draws the project graph if you want to see the dependencies.

**There is no test target.** No test runner is configured in this workspace
yet, so `nx test` and `nx e2e` will not find anything to run.

## Configuration

Environment variables are read by `ConfigModule` from **two files, root
first**: `.env`, then `apps/api/.env`. The first file to define a key wins, so
a value in the root `.env` shadows the same key in `apps/api/.env`.

Both have a checked-in template — `.env.example` and `apps/api/.env.example` —
and the two templates do not cover quite the same ground, so read the root one
first.

| Variable                                                                                   | Required           | Notes                                                                                                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                                                             | yes                | PostgreSQL connection string                                                                                                                           |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`                                                 | yes                | The API will not start without them                                                                                                                    |
| `FRONTEND_URL`                                                                             | —                  | CORS origin for the API. Defaults to `http://localhost:4200`                                                                                           |
| `PORT`                                                                                     | —                  | API port. Defaults to `3000`                                                                                                                           |
| `PUBLIC_API_URL`                                                                           | —                  | This API's public origin **including** `/v1`. Defaults to `http://localhost:$PORT/v1`; must match the provider's registered redirect URI byte for byte |
| `VITE_API_URL`                                                                             | —                  | Where the web app looks for the API. Defaults to `http://localhost:3000/v1`                                                                            |
| `AUTH_DEFAULT_ROLE`                                                                        | —                  | Role given to self-registered accounts. Defaults to `FRONT-DESK`                                                                                       |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                                                | for Google sign-in | Redirect URI: `$PUBLIC_API_URL/auth/oauth/google/callback`                                                                                             |
| `CRON_SECRET`                                                                              | deployed           | Bearer token for `/v1/cron/*`. Unset means those routes refuse everyone                                                                                |
| `JWT_ISSUER`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `OAUTH_STATE_SECRET`, `OAUTH_STATE_TTL` | —                  | Optional; defaults documented in `.env.example`                                                                                                        |

`VITE_API_URL` is read at **build** time by Vite, not at runtime — changing it
means rebuilding the web app, not restarting it.

## How the pieces fit

```
browser ──▶ apps/web  ──HTTP──▶ apps/api ──▶ PostgreSQL
             (Vite/Nitro)        (Fastify)      (Prisma)
                 │                   │
                 └──── libs/schemas ─┘
                      Zod: one definition of every payload
```

A request into the API passes, in order: the global `ZodValidationPipe`
(validates the DTO), the global `AccessTokenGuard` (rejects anything without a
bearer token unless the handler is `@Public()`), then the controller and its
service. Prisma errors on the way out are translated to HTTP by
`PrismaClientExceptionFilter`. All three are installed in
[`apps/api/src/app/app.module.ts`](apps/api/src/app/app.module.ts) and
[`configure-app.ts`](apps/api/src/app/configure-app.ts).

The API is served under the global prefix `/v1`, and its OpenAPI UI sits
outside that prefix at `/api-docs`.

## Path aliases

| Alias                    | Resolves to        | Available in |
| ------------------------ | ------------------ | ------------ |
| `@svet-monorepo/schemas` | `libs/schemas/src` | both apps    |
| `@/*`                    | that app's `src/*` | both apps    |
| `#/*`                    | `apps/web/src/*`   | web only     |

Note that `tsconfig.base.json` sets `strict: false`, and `apps/web` turns
`strict` back on for itself. New code in the API is therefore not strict-checked
by default.

## Documentation map

| Document                                                     | Covers                                           |
| ------------------------------------------------------------ | ------------------------------------------------ |
| [`apps/api/README.md`](apps/api/README.md)                   | API architecture, module anatomy, database work  |
| [`apps/web/README.md`](apps/web/README.md)                   | Routing, features, data layer, styling           |
| [`libs/schemas/README.md`](libs/schemas/README.md)           | The shared contract and how to extend it         |
| [`DEPLOYMENT.md`](DEPLOYMENT.md)                             | CI and Vercel deploys                            |
| [`.claude/reference/business/`](.claude/reference/business/) | What the app is for, in business terms — no code |
| [`CLAUDE.md`](CLAUDE.md)                                     | Conventions for agents working in this repo      |
| `http://localhost:3000/api-docs`                             | Live endpoint reference (run the API first)      |

Start with the business reference if you are new to the domain — it defines
_owner_, _patient_, _visit_, and the rest, and the code uses those words
literally.

## Troubleshooting

**`@prisma/client did not initialize yet`**
Run `pnpm nx db-generate api`. The `build` target depends on it, but your
editor's TypeScript server and a bare `tsc` do not.

**The API exits at startup complaining about a JWT secret**
`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are required. See First run.

**Every API request comes back 401**
`AccessTokenGuard` is global — routes are closed unless marked `@Public()`.
Send a bearer token.

**A `PATCH` or `DELETE` from the browser fails CORS preflight**
`FRONTEND_URL` must match the web app's origin exactly. `@fastify/cors`
defaults to GET/HEAD/POST, which is why `configure-app.ts` lists the verbs
explicitly.

**Registration fails on a fresh database**
`AUTH_DEFAULT_ROLE` names a row that must exist in `role` and not be
soft-deleted; otherwise sign-up raises `RoleUnavailableError`. The name is
matched case-insensitively. Create the role first — `pnpm nx db-studio api` is
the quickest way.

**An Nx task uses a stale result**
`pnpm nx reset` clears the local cache.
