import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { AppModule } from './app/app.module';
import { configureApp } from './app/configure-app';

/**
 * The API as a platform function rather than a listening server.
 *
 * `main.ts` stays the entry point for a long-running host; this one exists
 * because Vercel (and Cloudflare, and every other function runtime) hands us a
 * request and expects a response, never a port to bind.
 */

// Cached across invocations that reuse a warm instance, which is the whole
// reason a Nest app is affordable here at all — bootstrapping costs far more
// than handling a request. The *promise* is cached rather than the app so two
// requests arriving during a cold start share one bootstrap instead of racing
// into two.
let appPromise: Promise<NestFastifyApplication> | undefined;

async function createApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  configureApp(app);

  // `init()` rather than `listen()`: wire the app up, bind nothing.
  await app.init();
  // Fastify builds its router lazily; without this the first request can
  // arrive before the plugin tree has finished registering.
  await app.getHttpAdapter().getInstance().ready();

  return app;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  appPromise ??= createApp();

  const app = await appPromise;

  // Hand the raw Node request to Fastify's own server the way a real socket
  // would, so routing, hooks, and serialisation all behave as they do locally.
  app.getHttpAdapter().getInstance().server.emit('request', req, res);
}
