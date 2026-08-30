# Deployment

CI and deployment both run in GitHub Actions
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)). Vercel never builds
anything: the workflow produces a finished
[Build Output API v3](https://vercel.com/docs/build-output-api/v3) directory and
ships it with `vercel deploy --prebuilt`.

That split is deliberate. It keeps one place to look when a deploy goes wrong,
lets `nx affected` skip an app that did not change, and means moving to another
host is a change to the last step of a workflow rather than a rebuild of the
pipeline.

| | `apps/web` | `apps/api` |
|---|---|---|
| Framework | TanStack Start (Vite + Nitro) | NestJS on Fastify |
| Build target | `nx build web` | `nx build-vercel api` |
| Produced by | Nitro's `vercel` preset | `webpack.vercel.config.js` + `tools/vercel/api-output.mjs` |
| Output | `apps/web/.vercel/output` | `apps/api/.vercel/output` |
| Shape on Vercel | static assets + one SSR function | one function, everything bundled |

## One-time setup

### 1. Push the repository to GitHub

The workspace has no git remote yet, and the default branch here is `master`
(which is what `nx.json` sets as `defaultBase` and what the workflow triggers
on). Keep those consistent if you rename the branch.

```bash
gh repo create svet-monorepo --private --source=. --remote=origin
git push -u origin master
```

### 2. Create the two Vercel projects

```bash
npm install -g vercel
vercel login

# Answer "no" when asked to link to an existing project.
cd apps/web && vercel link
cd ../api  && vercel link
```

`vercel link` writes `.vercel/project.json` in each app. Read the two ids out
of them — you need them as GitHub secrets, and then the local files can go
(they are gitignored):

```bash
cat apps/web/.vercel/project.json   # projectId, orgId
cat apps/api/.vercel/project.json   # projectId
```

Set both projects' **Framework Preset** to *Other* and turn **off** the Git
integration under *Settings → Git*. Otherwise Vercel builds on push as well,
and you get two deployments racing for the same URL.

### 3. GitHub secrets and variables

*Settings → Secrets and variables → Actions.*

Secrets:

| Name | Value |
|---|---|
| `VERCEL_TOKEN` | Account token from *Vercel → Settings → Tokens* |
| `VERCEL_ORG_ID` | `orgId` from either `project.json` |
| `VERCEL_PROJECT_ID_WEB` | `projectId` from `apps/web/.vercel/project.json` |
| `VERCEL_PROJECT_ID_API` | `projectId` from `apps/api/.vercel/project.json` |
| `MIGRATE_DATABASE_URL` | **Direct** (unpooled) Postgres URL — see below |

Variables:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://<your-api>.vercel.app/v1` |

`VITE_API_URL` is a *variable*, not a secret, because it is compiled into the
client bundle and is public the moment anyone loads the site. It is set in
GitHub rather than in Vercel because Vite reads it at build time, and the build
happens in Actions — a value set in Vercel's dashboard would never be seen.

### 4. Vercel environment variables

Set these on the **api** project (*Settings → Environment Variables*). The web
project needs none; everything it uses is baked in at build time.

| Name | Notes |
|---|---|
| `DATABASE_URL` | **Pooled** connection — see below |
| `JWT_ACCESS_SECRET` | Generate with the command below |
| `JWT_REFRESH_SECRET` | Generate separately, do not reuse the access secret |
| `CRON_SECRET` | Generate the same way; see *Scheduled jobs* |
| `PUBLIC_API_URL` | `https://<your-api>.vercel.app/v1` |
| `FRONTEND_URL` | `https://<your-web>.vercel.app` — sets CORS and the OAuth return |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional; omit and Google sign-in is simply not offered |

To generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

[`.env.example`](.env.example) documents the optional variables and their
defaults.

If you use Google sign-in, add
`https://<your-api>.vercel.app/v1/auth/oauth/google/callback` to the authorised
redirect URIs in the Google Cloud console. It must match `PUBLIC_API_URL`
exactly.

## What runs when

**On a pull request** — lint, typecheck and build for affected projects, then a
preview deploy of whichever apps changed. The deploy URL appears on the run.

**On a push to `master`** — the same checks, then `prisma migrate deploy`
against `MIGRATE_DATABASE_URL`, then a production deploy.

Migrations run *before* the new code goes live, so the schema is never behind
the code reading it. `migrate deploy` only applies committed migrations and
never generates or resets — it is the one Prisma command that is safe to run
unattended. It also means a destructive migration still needs the usual
two-step treatment: ship the code that stops using a column first, drop the
column in a later commit.

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

Note that Vercel Cron runs on UTC, while `@Cron` fires in the host's local
zone. Unless your server was already UTC, expect the wall-clock time to move.

### Database connections

Each warm function instance holds its own `pg` pool, and Vercel will happily
run many at once. Point `DATABASE_URL` at a **pooler** — Neon's pooled
endpoint, Supabase's transaction pooler, or PgBouncer — or you will exhaust the
connection limit under modest load.

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

# Reproduce a deployable build locally
NITRO_PRESET=vercel pnpm nx build web
pnpm nx build-vercel api
```
