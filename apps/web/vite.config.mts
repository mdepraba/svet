import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { workspaceRoot } from '@nx/devkit';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitro } from 'nitro/vite';

import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Which Nitro preset the server build targets. Kept in an env var so the host
// is a deploy-time decision rather than a code change: `vercel` in CI,
// `cloudflare-module` if we move, `node-server` for a plain container.
const preset = process.env.NITRO_PRESET ?? 'node-server';

const config = defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  server: { port: 4200, fs: { allow: [workspaceRoot] } },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({ srcDirectory: './src' }),
    nitro({ preset }),
    viteReact(),
  ],
  build: { outDir: '../../dist/apps/web', emptyOutDir: true },
});

export default config;
