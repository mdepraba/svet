const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { IgnorePlugin } = require('webpack');
const { join } = require('path');

/**
 * Optional peers that Nest and pg probe for at runtime and work fine without.
 *
 * Each is loaded inside a try/catch (`loadPackage`, `optionalRequire`), so the
 * only thing their absence changes is that webpack stops treating a missing
 * module as a build failure. None of them is installed, and none is reachable
 * from this app: validation goes through `nestjs-zod`, there are no templates,
 * no microservice transport, no websocket gateway, and `pg` uses its
 * JavaScript driver rather than the native binding.
 */
const OPTIONAL_PEERS = [
  '@fastify/view',
  '@nestjs/microservices',
  '@nestjs/microservices/microservices-module',
  '@nestjs/websockets/socket-module',
  'class-transformer',
  'class-transformer/cjs/storage',
  'class-transformer/storage',
  'class-validator',
  'pg-native',
];

/**
 * The API bundled as a single Vercel function.
 *
 * It differs from `webpack.config.js` in the two ways that matter for a
 * function runtime: the entry is `serverless.ts` (a handler, not a listener),
 * and nothing is left external — a function directory ships no `node_modules`
 * and gets no install step, so every dependency has to be inside the bundle.
 * That is only affordable because Prisma 7's `prisma-client` generator with
 * the `pg` driver adapter is plain JavaScript, with no Rust engine binary to
 * carry along.
 *
 * The output path is Vercel's Build Output API v3 layout, so
 * `vercel deploy --prebuilt` can ship it untouched.
 */
module.exports = {
  output: {
    path: join(__dirname, '.vercel/output/functions/index.func'),
    filename: 'index.js',
    clean: true,
    // Vercel's Node launcher `require()`s the handler file and calls its
    // default export.
    library: { type: 'commonjs2' },
  },
  plugins: [
    new IgnorePlugin({
      checkResource: (resource) => OPTIONAL_PEERS.includes(resource),
    }),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/serverless.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: true,
      outputHashing: 'none',
      // Bundle everything; there is no install step on the far side.
      // `externalDependencies: 'none'` is the load-bearing line: without it
      // Nx leaves every node_modules import as a bare `require()`, and a
      // function directory has no node_modules to resolve them against.
      externalDependencies: 'none',
      generatePackageJson: false,
      sourceMap: false,
    }),
  ],
};
