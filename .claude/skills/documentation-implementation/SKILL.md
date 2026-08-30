---
name: documentation-implementation
description: Technical documentation for this Nx workspace - API references for the NestJS/Fastify API, guides for the TanStack Start React app, TSDoc in TypeScript source, READMEs, and business reference docs. Use for documentation, docs, user-docs, api-docs, guide, readme tags. Provides this repo's documentation locations, sources of truth, validation commands, and clarity standards.
---

# Documentation Implementation Skill

Guidance for writing documentation in the **svet-monorepo** workspace: an Nx +
pnpm monorepo with a NestJS API on Fastify (`apps/api`), a TanStack Start React
app (`apps/web`), and a shared Zod schema library (`libs/schemas`).

## When To Use This Skill

Load this Skill when the task has tags:

- `documentation`, `docs`, `user-docs`, `api-docs`
- `guide`, `readme`, `tutorial`, `reference`

## Stack Facts You Must Get Right

Documentation that contradicts these is wrong, no matter how well written.

| Thing           | Reality in this repo                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| API framework   | NestJS 11 on **Fastify** (not Express) — `@nestjs/platform-fastify`                                                  |
| API base URL    | `http://localhost:3000/v1` — global prefix `v1`, set in `apps/api/src/app/configure-app.ts`                          |
| OpenAPI UI      | `http://localhost:3000/api-docs` — `SwaggerModule.setup('api-docs', ...)`, **not** under the `v1` prefix             |
| Auth            | Bearer JWT. `AccessTokenGuard` is a global `APP_GUARD`, so **every route is closed unless it is marked `@Public()`** |
| Validation      | Zod via `nestjs-zod` — global `ZodValidationPipe`, DTOs are `createZodDto(SomeSchema)`                               |
| Contract source | `libs/schemas` (`@svet-monorepo/schemas`) — shared by API and web                                                    |
| ORM             | Prisma 7 (client generated into `apps/api/src/database/prisma/generated/client`) on PostgreSQL                       |
| Web app         | TanStack Start + Router + Query, React 19, Tailwind 4, shadcn/radix, react-hook-form                                 |
| Package manager | **pnpm**, Node >= 24. Prefix commands with `pnpm nx ...`                                                             |
| Test runner     | None wired up yet — do not document `nx test` targets that do not exist                                              |

## Where Documentation Lives

Check for an existing home before creating a new file.

| Path                                    | Contains                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `README.md`                             | Workspace root — still the stock Nx template; overview and task commands belong here          |
| `DEPLOYMENT.md`                         | CI/CD, GitHub Actions, Vercel Build Output API deploys — the model to imitate for prose style |
| `CLAUDE.md`                             | Working rules for agents in this workspace                                                    |
| `apps/web/README.md`                    | Web app setup, styling, routing notes                                                         |
| `apps/web/AGENTS.md`                    | Generated TanStack Intent index — **do not hand-edit**                                        |
| `libs/schemas/README.md`                | Schema library                                                                                |
| `.claude/reference/business/`           | Business-level docs: `overview.md` plus nine numbered user-story files                        |
| `.env.example`, `apps/api/.env.example` | Environment variables — update whenever config changes                                        |

**Business docs are deliberately non-technical.** `.claude/reference/business/README.md`
states "no technical detail." Do not put endpoints, table names, or code in there;
those belong in the app-level docs.

## Sources of Truth

Read these before writing — never document from memory or from an older doc.

1. **Request/response shapes** → `libs/schemas/src/lib/<domain>/*.schema.ts`.
   The Zod schema is the contract; the DTO is a thin wrapper over it.
2. **Routes, verbs, params** → `apps/api/src/modules/<domain>/*.controller.ts`.
3. **Behaviour, includes, side effects** → the matching `*.service.ts`.
4. **Persistence** → `apps/api/src/database/prisma/schema.prisma`.
5. **Web data access** → `apps/web/src/features/<domain>/queries/*Resource.ts` and
   `apps/web/src/lib/resource.ts`.
6. **Cross-cutting API behaviour** → `configure-app.ts` (CORS, prefix, Swagger,
   exception filter) and `app.module.ts` (global pipe and guard).

If the OpenAPI document already describes an endpoint correctly, link to
`/api-docs` rather than transcribing it into markdown that will rot.

## Validation Commands

Only these exist. There is no `markdownlint`, `cspell`, `mkdocs`, or `docs:build`
in this workspace — do not invent them.

```bash
# Format markdown and TS (prettier, singleQuote; apps/web also uses biome)
pnpm prettier --check "**/*.md"
pnpm prettier --write "**/*.md"

# Lint and typecheck what you touched
pnpm nx run-many -t lint
pnpm nx typecheck web
pnpm nx affected -t lint typecheck

# Verify API docs against the running API
pnpm nx serve api          # http://localhost:3000/v1, docs at /api-docs
pnpm nx serve web          # http://localhost:4200

# Inspect the data you are documenting
pnpm nx db-studio api
```

Verify every documented endpoint against the live API or `/api-docs` before
claiming it works.

## Success Criteria (Before Completing Task)

✅ **Accurate** — matches the controller, schema, and Prisma model as they are today
✅ **Complete** — all documented params, responses, and error cases present
✅ **Examples run** — curl commands and TS snippets actually execute
✅ **Paths correct** — every referenced file exists at that path
✅ **Links valid** — relative links resolve
✅ **Formatted** — `pnpm prettier --check` passes
✅ **Right home** — technical detail stays out of `.claude/reference/business/`

## Common Documentation Tasks

### API Documentation

- Path under the `/v1` prefix, and the HTTP verb
- Whether the route is `@Public()` or needs `Authorization: Bearer <token>`
- Query params — most list endpoints take `PaginationDto` (`page`, `limit`,
  `search`, `sortBy`, `sortOrder`)
- Body shape, named after the Zod schema it comes from
- Response shape: bare item, `{ data, meta }` list, or detail-with-relations
- Error responses, using the real envelope (below)

### Web Guides

- Route path in `apps/web/src/routes`
- The feature folder behind it (`features/<domain>/{components,queries}`)
- The `createResource` hooks a screen uses
- Prerequisites: API running, `.env` values set

### READMEs

- Overview, prerequisites (`pnpm install`, Node 24, PostgreSQL)
- `pnpm nx serve api` / `pnpm nx serve web`
- Configuration via `.env`, cross-linked to `.env.example`

### Code Documentation (TSDoc)

- Explain **why**, not what the signature already says (house style, below)
- Document non-obvious contracts, invariants, and gotchas
- Note soft-delete semantics, pagination defaults, and units

## Documentation Patterns

### API Endpoint Documentation

Real conventions: `v1` prefix, singular resource paths (`/owner`, `/patient`),
bulk routes declared before `:id` routes, and separate soft-delete /
force-delete / restore verbs.

````markdown
## POST /v1/owner

Creates an owner (a human client of the clinic).

**Authentication:** Required — `Authorization: Bearer <accessToken>`.
All routes are closed by the global `AccessTokenGuard` unless marked `@Public()`.

**Request body** — `CreateOwnerSchema` (`libs/schemas/src/lib/owner/owner.schema.ts`):

```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "+6281234567890",
  "address": "Jl. Merdeka 10"
}
```

`name` is required (min 1 char); `email` must be a valid address; `email`,
`phone`, and `address` are optional and nullable.

**Success response (201 Created)** — `OwnerResponseSchema`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "+6281234567890",
  "address": "Jl. Merdeka 10",
  "deletedAt": null
}
```

**Error responses** — the shape produced by `PrismaClientExceptionFilter` and
Nest's default exception handling:

- **400 Bad Request** — Zod validation failed (`ZodValidationPipe`)
- **401 Unauthorized** — missing or invalid bearer token
- **404 Not Found** — Prisma `P2025`

  ```json
  {
    "statusCode": 404,
    "message": "The requested resource was not found.",
    "error": "PrismaClientKnownRequestError"
  }
  ```

- **409 Conflict** — Prisma `P2002`, unique constraint

  ```json
  {
    "statusCode": 409,
    "message": "Duplicate data error. The field(s) [email] must be unique.",
    "error": "PrismaClientKnownRequestError"
  }
  ```

**Example:**

```bash
curl -X POST http://localhost:3000/v1/owner \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi Santoso","email":"budi@example.com"}'
```
````

### Paginated List Documentation

Every list endpoint takes `PaginationDto` and returns `{ data, meta }`. Document
the defaults — they come from `PaginationSchema`, not from the controller.

````markdown
## GET /v1/owner

**Query parameters:**

| Param       | Type            | Default     | Notes              |
| ----------- | --------------- | ----------- | ------------------ |
| `page`      | number          | `1`         | min 1              |
| `limit`     | number          | `10`        | min 1, **max 100** |
| `search`    | string          | —           | optional free-text |
| `sortBy`    | string          | `createdAt` | column name        |
| `sortOrder` | `asc` \| `desc` | `desc`      |                    |

**Response (200 OK):**

```json
{
  "data": [{ "id": "550e8400-...", "name": "Budi Santoso" }],
  "meta": {
    "total": 42,
    "lastPage": 5,
    "currentPage": 1,
    "perPage": 10,
    "prev": null,
    "next": 2
  }
}
```
````

Note the mismatch worth calling out for readers: the request parameter is
`limit`, but the response metadata reports it as `perPage`.

### Soft Delete Conventions

Resources are soft-deleted (`deletedAt`). Document all four verbs when the
controller has them, or a reader will assume `DELETE` is permanent:

| Route                              | Effect                                         |
| ---------------------------------- | ---------------------------------------------- |
| `DELETE /v1/<resource>/:id`        | Soft delete — sets `deletedAt`                 |
| `DELETE /v1/<resource>/bulk`       | Soft delete many — body is a `string[]` of ids |
| `DELETE /v1/<resource>/force/:id`  | Permanent delete                               |
| `PATCH /v1/<resource>/restore/:id` | Clears `deletedAt`                             |

### Code Documentation Pattern (TSDoc)

House style is **short prose explaining the reasoning**, not exhaustive `@param`
blocks that restate the type signature. See `apps/web/src/lib/resource.ts`,
`apps/api/src/app/configure-app.ts`, and `apps/api/src/guard/access-token.guard.ts`.

```ts
/**
 * The list needs the owner's pets and the date they were last in.
 *
 * `take: 1` on visits is deliberate — the screen shows only `lastVisitAt`, and
 * pulling the full history here would make the list query grow with the
 * clinic's age.
 */
const ownerListInclude = {
  patients: { where: { deletedAt: null }, select: patientSelect },
  visits: {
    where: { deletedAt: null },
    select: { visitDate: true },
    orderBy: { visitDate: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.OwnerInclude;
```

Reach for full tags only on a shared, exported API where callers need the
contract spelled out:

```ts
/**
 * Builds the query/mutation layer for one API resource.
 *
 * Every model exposes the same twelve-verb controller, so the only things that
 * differ per resource are the path and the response schemas.
 *
 * @param options.key   Root of the react-query key, e.g. `owners`.
 * @param options.path  API path under the `/v1` prefix, e.g. `/owner`.
 * @param options.detailSchema Falls back to `itemSchema` when the detail
 *   endpoint carries no extra relations.
 *
 * @example
 * export const owners = createResource<
 *   OwnerResponse, OwnerListItemsResponse, CreateOwner, UpdateOwner, OwnerDetail
 * >({
 *   key: 'owners',
 *   path: '/owner',
 *   itemSchema: OwnerResponseSchema,
 *   listSchema: OwnerListItemsResponseSchema,
 *   detailSchema: OwnerDetailSchema,
 * });
 */
```

**Do not** restate a Zod schema's rules in a comment — the schema is the
contract and the prose will drift. Point at the schema instead.

### Setup Guide Pattern

````markdown
# Running the API Locally

## Prerequisites

- Node.js 24+ and pnpm 11 (see `packageManager` in `package.json`)
- A PostgreSQL database

## 1. Install dependencies

```bash
pnpm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

`DATABASE_URL` and `FRONTEND_URL` are read by the API. `FRONTEND_URL` also sets
the allowed CORS origin, defaulting to `http://localhost:4200`.

## 3. Set up the database

```bash
pnpm nx db-generate api   # generate the Prisma client
pnpm nx db-push api       # or: pnpm nx db-migrate api
```

## 4. Start the API

```bash
pnpm nx serve api
```

The API listens on `http://localhost:3000/v1`, with OpenAPI docs at
`http://localhost:3000/api-docs`.

## Troubleshooting

**Problem:** `@prisma/client did not initialize yet`
**Solution:** Run `pnpm nx db-generate api`. The `build` target depends on it,
but a bare `tsc` or editor session does not.

**Problem:** Browser requests fail CORS preflight on PATCH or DELETE
**Solution:** Check `FRONTEND_URL` matches the web app's origin exactly.
`configure-app.ts` lists the allowed verbs explicitly because `@fastify/cors`
defaults to GET, HEAD, and POST only.

**Problem:** Every request returns 401
**Solution:** `AccessTokenGuard` is global. Send a bearer token, or mark the
handler `@Public()`.
````

## Common Blocker Scenarios

### Blocker 1: Implementation Incomplete

**Issue:** Cannot document a feature that does not exist yet.
**Try:** Check the controller and the matching `features/<domain>` folder; hit
the endpoint against `pnpm nx serve api`.
**If blocked:** Report — implementation incomplete or requirements unclear.

### Blocker 2: API Behaviour Unclear

**Issue:** Unsure what an endpoint does or returns.
**Try:** Read controller → service → Prisma include; check the Zod schema in
`libs/schemas`; open `/api-docs`; curl it with a real token.
**If blocked:** Report — need clarification on API behaviour.

### Blocker 3: Schema and Response Disagree

**Issue:** The Zod response schema does not match what the service returns —
mapper functions such as `toListItem` add computed fields like `lastVisitAt`.
**Try:** Trust the live response, document that, and flag the drift.
**If blocked:** Report — schema and implementation disagree, need a decision on
which is correct.

### Blocker 4: Missing UI Assets

**Issue:** A web guide needs screenshots but the screen is not built or reachable.
**Try:** Describe steps in prose; reference the route path and feature folder.
**If blocked:** Report — need access to the running UI.

### Blocker 5: Contradictory Information

**Issue:** Code does X, the business user story says Y, an existing doc says Z.
**Try:** Test the actual behaviour and document that; note the discrepancy and
which user-story file it contradicts.
**If blocked:** Report — need an authoritative answer.

## Blocker Report Format

```
⚠️ BLOCKED - Requires Senior Engineer

Issue: [Specific problem]

Attempted Research:
- [Files read - controller, service, schema]
- [Commands run / endpoints hit]
- [Why it did not resolve the question]

Blocked By: [Task ID / incomplete implementation / unclear requirements]

Partial Progress: [Documentation completed so far]

Requires: [What would unblock it]
```

## Documentation Quality Checklist

### Clarity

✅ Simple, direct language; technical terms defined on first use
✅ Short sentences; active voice ("The API returns the owner")
✅ Consistent domain vocabulary — this is a **veterinary clinic** app:
_owner_ (the human client), _patient_ (the animal), _visit_, _treatment_,
_product_, _invoice_. Never swap "owner" for "customer" or "patient" for "pet"
mid-document; `.claude/reference/business/overview.md` fixes these terms.

### Completeness

✅ Auth requirement stated for every endpoint
✅ Pagination params and defaults documented on list endpoints
✅ Soft delete vs force delete distinguished
✅ Error envelope shown, not just status codes
✅ Env vars listed and cross-linked to `.env.example`

### Accuracy

✅ Examples executed against a running API
✅ File paths verified to exist
✅ Response bodies copied from real responses, not invented
✅ Route paths include the `/v1` prefix

### Formatting

✅ Consistent heading levels
✅ Code fences tagged with a language (`ts`, `tsx`, `bash`, `json`, `prisma`)
✅ Tables formatted correctly
✅ `pnpm prettier --check` passes

## Writing Style Guidelines

### Use Active Voice

❌ "The owner object is returned by the API"
✅ "The API returns the owner"

### Be Specific To This Repo

❌ "Call the endpoint with the data"
✅ "Send `POST /v1/owner` with a `CreateOwnerSchema` body and a bearer token"

❌ "Run the dev server"
✅ "Run `pnpm nx serve api`"

### Show, Don't Just Tell

❌ "Configure the API URL"
✅ Show the file and the values:

```env
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/svet
FRONTEND_URL=http://localhost:4200
```

### Anticipate Questions

After each instruction, ask what breaks here. In this stack the usual answers
are a missing `db-generate`, a CORS origin mismatch, and the global auth guard.
Put those in Troubleshooting.

## What NOT To Do

❌ Don't document Express idioms — the API runs on Fastify
❌ Don't omit the `/v1` prefix from route paths
❌ Don't imply routes are public; the global guard closes them by default
❌ Don't use `npm run` or a bare global `nx` — this workspace is pnpm + Nx targets
❌ Don't reference `nx test` targets; none are configured
❌ Don't restate a Zod schema's rules in prose that will drift from it
❌ Don't hand-edit `apps/web/AGENTS.md` (generated)
❌ Don't put technical detail into `.claude/reference/business/`
❌ Don't use vague terms ("simply", "just", "obviously")
❌ Don't ship untested code examples

## Focus Areas

When reading task sections, prioritize:

- `requirements` — what needs documenting
- `context` — purpose and audience (developer vs clinic staff)
- `documentation` — existing docs to update rather than duplicate
- `implementation` — the controller/service/schema that define the truth

## Remember

- **Read the schema first** — `libs/schemas` is the contract both sides share
- **Verify against the running app** — `/api-docs` and curl, not memory
- **Update, don't duplicate** — check the doc-locations table above
- **Keep business docs business-level** — no code in `.claude/reference/business/`
- **Report blockers promptly** — drift between schema and service is a real finding

## Related References In This Repo

- `CLAUDE.md` — Nx workflow rules for this workspace
- `DEPLOYMENT.md` — the prose and table style to imitate
- `.claude/reference/business/overview.md` — domain glossary and business rules
- `.claude/skills/ui-ux-expert/SKILL.md` — UI conventions when documenting screens
- `.claude/skills/rbac-architect/SKILL.md` — roles and permissions vocabulary
