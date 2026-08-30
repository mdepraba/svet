# schemas

`@svet-monorepo/schemas` — the Zod definition of every payload that crosses
between `apps/api` and `apps/web`.

This library exists so a payload is defined once. The API builds its DTOs from
these schemas; the web client parses responses with the same objects. Rename a
field here and both sides fail to compile, which is the entire point — the
alternative is a backend change that only shows up as a blank screen.

There is no runtime behaviour here beyond Zod. No HTTP, no Prisma, no React.
Keep it that way: both apps import it, so a dependency added here is a
dependency added to both.

## Layout

```
src/
  index.ts              barrel — every schema is re-exported here
  lib/
    common/             pagination primitives shared by every list
    <domain>/
      <domain>.schema.ts        write shapes, base response, enums
      <domain>-view.schema.ts   read shapes the screens need (optional)
```

One folder per domain: `owner`, `patient`, `visit`, `invoice`, `product`,
`treatment`, `inventory`, `auth`, and so on. Folder names are **singular and
kebab-case** (`medical-record`, `visit-treatment-assoc`).

### Why some domains have a `-view` file

`<domain>.schema.ts` holds what a client sends and the plain row it gets back.
`<domain>-view.schema.ts` holds the richer shapes a screen actually renders —
the list row with its relations and computed fields.

`owner` shows the split: `OwnerResponseSchema` is the bare row a write returns,
while `OwnerListItemSchema` adds `patients` and the computed `lastVisitAt` that
the API's service layer flattens in. Domains whose read and write shapes match
have no `-view` file.

## Naming

| Kind            | Pattern                                                           | Example                        |
| --------------- | ----------------------------------------------------------------- | ------------------------------ |
| Create input    | `Create<Entity>Schema`                                            | `CreateOwnerSchema`            |
| Update input    | `Update<Entity>Schema`                                            | `UpdateOwnerSchema`            |
| Single response | `<Entity>ResponseSchema`                                          | `OwnerResponseSchema`          |
| List row        | `<Entity>ListItemSchema`                                          | `OwnerListItemSchema`          |
| List response   | `<Entity>ListResponseSchema` or `<Entity>ListItemsResponseSchema` | `OwnerListItemsResponseSchema` |
| Enum            | `<Name>Enum`                                                      | `VisitStatusEnum`              |
| Inferred type   | same name, no `Schema`                                            | `type CreateOwner`             |

Every schema is exported alongside its inferred type:

```ts
export const CreateOwnerSchema = z.object({ ... });
export type CreateOwner = z.infer<typeof CreateOwnerSchema>;
```

Where input and output differ after coercion or defaults, export both —
`visit` does this with `CreateVisitInput` (`z.input`) beside `CreateVisit`
(`z.infer`). Forms need the input type; handlers need the output type.

## Conventions

- **Update schemas derive from create schemas**: `CreateOwnerSchema.partial()`,
  extended where an update accepts something a create does not. Do not
  hand-write a second object.
- **Dates are `z.coerce.date()`** on responses — JSON carries strings and the
  screens want `Date`.
- **IDs are `z.uuid()`**, matching the database's UUID primary keys.
- **Nullable, not optional, on responses.** The API returns `null` for an empty
  column; `.optional()` there would let a missing field pass silently.
- **List responses go through `paginatedResponseSchema`** from `lib/common`, so
  every list shares one `{ data, meta }` envelope.
- **Enums are declared here, not in either app.** `VisitStatusEnum` in this
  library is what both the Prisma-backed service and the React status badge
  read from.

## Adding a schema

1. Create or open `src/lib/<domain>/<domain>.schema.ts`.
2. Define the create schema, derive the update schema, then the response
   schema and its list wrapper. Export inferred types for each.
3. Re-export the file from [`src/index.ts`](src/index.ts). **Nothing is
   reachable until you do** — both apps import from the package root, never
   from a deep path.
4. On the API side, wrap it: `export class CreateThingDto extends
createZodDto(CreateThingSchema) {}`.
5. On the web side, hand it to `createResource` as `itemSchema` / `listSchema`.

## A caveat worth knowing

These schemas are enforced **asymmetrically**. Requests into the API are
validated by the global `ZodValidationPipe`, but responses out of it are not —
the API returns whatever its service built. Only the web client parses
responses.

So a response schema is a description of what the API is believed to return,
and the web client is where a mismatch surfaces. If a service adds a computed
field, update the schema in the same commit; if a service's shape drifts from
the schema, the web app throws a Zod error at the boundary, not the API.

## Building

```bash
pnpm nx build schemas     # -> dist/libs/schemas
pnpm nx lint schemas
```

Neither app needs that build during development: `tsconfig.base.json` maps
`@svet-monorepo/schemas` straight to `src/index.ts`, so edits here are picked
up by `nx serve` immediately.
