# Deployment

Both apps ship as **one Vercel project on one domain**. GitHub Actions
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) does all the building;
Vercel builds nothing and only serves what it is handed.

```
svet-brown.vercel.app/            ->  web (TanStack Start SSR function)
svet-brown.vercel.app/patients    ->  web (SSR)
svet-brown.vercel.app/assets/*    ->  static, immutable
svet-brown.vercel.app/v1/*        ->  api  (NestJS function)
svet-brown.vercel.app/api-docs    ->  api  (Swagger)
```

Serving both from one origin is the point: there is no CORS to configure, and
the OAuth round trip and its cookies stay same-origin.

## How the artifact is built

Each app builds a self-contained
[Build Output API v3](https://vercel.com/docs/build-output-api/v3) directory,
and [`tools/vercel/merge-output.mjs`](tools/vercel/merge-output.mjs) folds them
into one at the workspace root:

| Step | Produces |
|---|---|
| `nx build web` (Nitro `vercel` preset) | `apps/web/.vercel/output` — static + `__server.func` |
| `nx build-vercel api` | `apps/api/.vercel/output` — `index.func`, everything bundled |
| `node tools/vercel/merge-output.mjs` | `.vercel/output` — both functions, one routing table |
| `vercel deploy --prebuilt` | the deployment |

The merge reads the web app's routing table rather than replacing it, so
whatever Nitro decides about caching and filesystem handling survives; it only
inserts the API's routes ahead of `handle: filesystem`.

Reproduce the whole thing locally:

```bash
NITRO_PRESET=vercel VITE_API_URL=https://svet-brown.vercel.app/v1 \
  pnpm nx run-many -t build build-vercel --projects=web,api
node tools/vercel/merge-output.mjs
```

## One-time setup

### 1. Turn off Vercel's Git integration

**Do this first.** The project was imported from GitHub, so Vercel is currently
building on every push. It cannot build this workspace correctly — an Nx
monorepo root has no build it recognises — and if it could, you would get two
deployments racing for the same domain.

*Vercel → your project → Settings → Git → Disconnect.* Keep the project itself;
only the repository connection goes. Also set **Framework Preset** to *Other*
under *Settings → General*.

### 2. Link the project

From the workspace root, not from inside an app:

```bash
npm install -g vercel
vercel login
vercel link          # choose the existing project (svet-brown)
```

That writes `.vercel/project.json`. Read the two ids out of it — you need them
as GitHub secrets, and then the file can go (it is gitignored):

```bash
cat .vercel/project.json     # projectId, orgId
```

### 3. Get a database

Vercel runs your code but gives you no database, and Prisma needs a real
Postgres. [Neon](https://neon.tech) suits this setup because it hands you both
connection strings you need — they differ only by `-pooler` in the hostname:

```
# Pooled  -> DATABASE_URL
postgresql://user:pass@ep-name-123-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Direct  -> MIGRATE_DATABASE_URL
postgresql://user:pass@ep-name-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Supabase works the same way (*Settings → Database* shows both).

### 4. GitHub secrets and variables

*Settings → Secrets and variables → Actions.*

Secrets:

| Name | Value |
|---|---|
| `VERCEL_TOKEN` | Account token from *Vercel → Settings → Tokens* |
| `VERCEL_ORG_ID` | `orgId` from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` from `.vercel/project.json` |
| `MIGRATE_DATABASE_URL` | The **direct** (unpooled) Postgres URL |

Variables:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://svet-brown.vercel.app/v1` |

`VITE_API_URL` is a *variable*, not a secret: it is compiled into the client
bundle and is public the moment anyone loads the site. It lives in GitHub
rather than Vercel because Vite substitutes it at **build** time, and the build
happens in Actions — a value set in Vercel's dashboard would never be seen.

It is absolute rather than the relative `/v1`, because `login` and `register`
render server-side and a relative URL cannot be fetched from a server. If you
later add a custom domain, update this variable and redeploy so it keeps
matching the site's own origin.

### 5. Vercel environment variables

*Settings → Environment Variables*, scoped to Production and Preview.

| Name | Value |
|---|---|
| `DATABASE_URL` | The **pooled** Postgres URL |
| `JWT_ACCESS_SECRET` | Generate — see below |
| `JWT_REFRESH_SECRET` | Generate separately, do not reuse the access secret |
| `CRON_SECRET` | Generate the same way; see *Scheduled jobs* |
| `PUBLIC_API_URL` | `https://svet-brown.vercel.app/v1` |
| `FRONTEND_URL` | `https://svet-brown.vercel.app` (no `/v1`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional — omit and Google sign-in is simply not offered |

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`PUBLIC_API_URL` and `FRONTEND_URL` are the same host now, differing only by
the `/v1` suffix — the API still needs both because it cannot discover its own
public hostname from behind Vercel's proxy.

[`.env.example`](.env.example) documents the optional variables and their
defaults.

Scoping `DATABASE_URL` to both Production and Preview means preview deploys
write to production data. If you would rather they did not, create a second
Neon branch and scope a separate `DATABASE_URL` to Preview only.

If you use Google sign-in, add
`https://svet-brown.vercel.app/v1/auth/oauth/google/callback` to the authorised
redirect URIs in the Google Cloud console. It must match `PUBLIC_API_URL`
exactly.

## What runs when

The default branch is `dev`, and that is what the workflow treats as
production.

**On a pull request** — lint, typecheck and build for affected projects, then a
preview deployment. The URL appears on the run.

**On a push to `dev`** — the same checks, then `prisma migrate deploy` against
`MIGRATE_DATABASE_URL`, then a production deployment.

Migrations run *before* the new code goes live, so the schema is never behind
the code reading it. `migrate deploy` only applies committed migrations and
never generates or resets — it is the one Prisma command that is safe to run
unattended. It also means a destructive migration still needs the usual
two-step treatment: ship the code that stops using a column first, drop the
column in a later commit.

Because one artifact contains both apps, a change to either rebuilds both. A
commit touching neither (docs, for instance) deploys nothing.

`api-e2e` does not run in CI — it needs a live Postgres and a served API, so it
stays a local target:

```bash
pnpm nx e2e api-e2e
```

## Two things that changed to make this work

### Scheduled jobs

The two `@Cron` jobs — visit status automation at midnight, refresh-token
pruning at 3am — **cannot fire on a serverless host**. A function is frozen
between requests, so nothing inside the process holds a clock. Left alone they
would silently stop running, which is the kind of failure nobody notices for a
month.

They are now reachable over HTTP as well, at `/v1/cron/visit-status` and
`/v1/cron/prune-sessions`
([`apps/api/src/jobs/cron.controller.ts`](apps/api/src/jobs/cron.controller.ts)),
and the schedule that calls them lives in
[`tools/vercel/api-output.mjs`](tools/vercel/api-output.mjs). The decorators are
still there and still work on a long-running host; both jobs are idempotent, so
having two possible triggers is safe.

Those routes are public, so they carry their own door: they require
`Authorization: Bearer $CRON_SECRET`, which Vercel Cron sends automatically.
**If `CRON_SECRET` is unset the routes refuse every caller** rather than
running unauthenticated.

Vercel Cron runs on UTC, while `@Cron` fires in the host's local zone. Unless
your server was already UTC, expect the wall-clock time to move. Vercel's Hobby
plan also allows only one run per day per job, which both of these fit.

### Database connections

Each warm function instance holds its own `pg` pool, and Vercel will happily
run many at once. `DATABASE_URL` must point at a **pooler** or you will exhaust
the connection limit under modest load.

`MIGRATE_DATABASE_URL` must be the opposite: a **direct** connection. A
transaction pooler cannot run the DDL and advisory locks a migration needs.

## Moving to Cloudflare

The portability is real but not symmetric, and it is worth knowing which half
is easy before planning around it.

**`apps/web` is a one-line change.** Nitro has first-class Cloudflare presets.
Set `NITRO_PRESET` in the workflow to `cloudflare-module` and swap the deploy
step for `wrangler deploy`. Nothing in the app itself changes — that is the
whole reason the preset is read from an environment variable in
[`apps/web/vite.config.mts`](apps/web/vite.config.mts) rather than hardcoded.

**`apps/api` is a rewrite of its edges, not a config change.** Workers are not
Node: `@nestjs/platform-fastify` expects `node:http`, and while `nodejs_compat`
covers a good deal, it does not cover Fastify's server. Realistically that move
means either swapping the Fastify adapter for a fetch-based one, or putting the
API somewhere that runs a Node process — Fly, Railway, Render, or a container.

If the API does move to a long-running host, most of this setup gets simpler
rather than harder: `nx build api` already produces a normal server build, the
`@Cron` decorators start working on their own, and the cron routes and
`CRON_SECRET` can be dropped.

## Local commands

```bash
pnpm nx serve api                 # API on :3000
pnpm nx serve web                 # web on :4200

pnpm nx run-many -t lint typecheck build   # what CI runs
pnpm nx affected -t lint typecheck build   # only what changed

pnpm nx db-migrate api            # create a migration
pnpm nx db-studio api             # browse the database
```

Locally the two still run on separate ports, so `.env` keeps
`VITE_API_URL=http://localhost:3000/v1` and CORS applies as before. The
single-origin arrangement is a property of the deployment, not of development.
