/**
 * Folds the two apps into one Vercel deployment.
 *
 * `apps/web` and `apps/api` each build a self-contained Build Output directory.
 * This copies both into a single `.vercel/output` at the workspace root and
 * writes one routing table over the top, so the whole product ships as one
 * project on one domain:
 *
 *     /v1/*, /api-docs   ->  the NestJS function
 *     /assets/*          ->  static, immutable
 *     anything else      ->  the TanStack Start SSR function
 *
 * Serving both from one origin is what removes CORS from the picture entirely,
 * and it keeps the OAuth round trip and its cookies same-origin.
 *
 * The web routing table is read rather than rewritten, so whatever Nitro
 * decides about caching and filesystem handling survives; this only inserts
 * the API's routes ahead of it.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const webOutput = join(workspaceRoot, 'apps/web/.vercel/output');
const apiOutput = join(workspaceRoot, 'apps/api/.vercel/output');
const merged = join(workspaceRoot, '.vercel/output');

/** The API function's name once merged. Referenced by the routes below. */
const API_FUNCTION = 'api';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

const webConfig = await readJson(join(webOutput, 'config.json'));
const apiConfig = await readJson(join(apiOutput, 'config.json'));

// Start clean: a stale function left behind from an earlier shape would still
// be deployed and still be routable.
await rm(merged, { recursive: true, force: true });
await mkdir(join(merged, 'functions'), { recursive: true });

await cp(join(webOutput, 'static'), join(merged, 'static'), {
  recursive: true,
});
await cp(
  join(webOutput, 'functions/__server.func'),
  join(merged, 'functions/__server.func'),
  { recursive: true },
);
await cp(
  join(apiOutput, 'functions/index.func'),
  join(merged, `functions/${API_FUNCTION}.func`),
  { recursive: true },
);

/**
 * Everything Nest owns, sent to the one function.
 *
 * `dest` selects which function runs; the function still receives the original
 * request path, which is how Nest's `v1` global prefix keeps matching. Swagger
 * is listed separately because `setup('api-docs', ...)` mounts it outside that
 * prefix.
 */
const apiRoutes = [
  { src: '/v1(/.*)?', dest: `/${API_FUNCTION}` },
  { src: '/api-docs(/.*)?', dest: `/${API_FUNCTION}` },
];

// Ahead of `handle: filesystem`, so an API path can never be shadowed by a
// static file that happens to share its name.
const filesystemIndex = webConfig.routes.findIndex(
  (route) => route.handle === 'filesystem',
);
const insertAt =
  filesystemIndex === -1 ? webConfig.routes.length : filesystemIndex;

const routes = [
  ...webConfig.routes.slice(0, insertAt),
  ...apiRoutes,
  ...webConfig.routes.slice(insertAt),
];

await writeFile(
  join(merged, 'config.json'),
  JSON.stringify(
    {
      ...webConfig,
      routes,
      // Defined once, in tools/vercel/api-output.mjs, and carried through.
      ...(apiConfig.crons?.length ? { crons: apiConfig.crons } : {}),
    },
    null,
    2,
  ),
);

console.log(`Merged build output ready at ${merged}`);
console.log(
  routes
    .map((r) => `  ${r.handle ? `handle: ${r.handle}` : `${r.src} -> ${r.dest ?? '(headers)'}`}`)
    .join('\n'),
);
