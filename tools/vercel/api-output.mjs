/**
 * Completes the Vercel Build Output for the API.
 *
 * Webpack has already written the bundle to
 * `apps/api/.vercel/output/functions/index.func/index.js`; what is missing is
 * the metadata that tells Vercel how to run it and what to route to it. Those
 * are two small JSON files, written here rather than committed so the runtime
 * and the cron schedule live in one readable place.
 *
 * Everything this file describes is Vercel-shaped. Moving to another host
 * means replacing this script and the deploy step in the workflow — the
 * application code above it does not change.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outputDir = join(workspaceRoot, 'apps/api/.vercel/output');
const functionDir = join(outputDir, 'functions/index.func');

/**
 * Node 24 to match the runtime the workspace develops against.
 *
 * `maxDuration` is generous because a cold start pays for the whole Nest
 * bootstrap — module resolution, the Prisma client, the Fastify plugin tree —
 * before it can even look at the request.
 */
const functionConfig = {
  runtime: 'nodejs24.x',
  handler: 'index.js',
  launcherType: 'Nodejs',
  shouldAddHelpers: false,
  supportsResponseStreaming: true,
  maxDuration: 30,
};

/**
 * The schedules that `@Cron` used to own.
 *
 * A frozen function has no clock of its own, so Vercel calls these routes on
 * the schedule instead. The times mirror the decorators they replace:
 * `EVERY_DAY_AT_MIDNIGHT` and `EVERY_DAY_AT_3AM`. Vercel Cron runs on UTC —
 * on a long-running host the decorators fire in the server's local zone, so
 * expect the wall-clock time to shift unless the host was already UTC.
 */
const crons = [
  { path: '/v1/cron/visit-status', schedule: '0 0 * * *' },
  { path: '/v1/cron/prune-sessions', schedule: '0 3 * * *' },
];

const routingConfig = {
  version: 3,
  // One function behind everything: Nest owns its own routing, including the
  // `v1` prefix and the `/api-docs` Swagger page that sits outside it.
  routes: [{ src: '/(.*)', dest: '/index' }],
  crons,
};

await mkdir(functionDir, { recursive: true });

await writeFile(
  join(functionDir, '.vc-config.json'),
  JSON.stringify(functionConfig, null, 2),
);

await writeFile(
  join(outputDir, 'config.json'),
  JSON.stringify(routingConfig, null, 2),
);

console.log(`Vercel build output ready at ${outputDir}`);
