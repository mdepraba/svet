import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      /**
       * The module boundary, enforced rather than intended.
       *
       * There is one maintainer and no reviewer to catch a leaked boundary, so
       * the rule has to be the thing that catches it. A module's internals are
       * unreachable from outside; the only way in is
       * `modules/<name>/index.ts`, which exports the module, its `ports/`
       * service, and its contract types.
       *
       * Intra-module imports are written relative (`./services/x`), so they do
       * not match these patterns and stay legal.
       *
       * Note what this does *not* yet catch: modules still in the flat
       * `<name>.service.ts` shape have no `services/` folder, so nothing
       * protects them. Each one starts being enforced the moment it adopts the
       * structure. Known offenders today, to fix as those slices migrate:
       *   - modules/dashboard/dashboard.service.ts -> settings
       *   - modules/invoices/invoice.service.ts    -> settings
       *   - modules/visits/visit.service.ts        -> invoices, inventory, settings
       */
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/modules/*/services/**',
                '**/modules/*/dto/**',
                '**/modules/*/controllers/**',
                '**/modules/*/adapters/**',
                '**/modules/*/infrastructure/**',
              ],
              message:
                'Cross-module access goes through modules/<name>/index.ts only.',
            },
          ],
        },
      ],
    },
  },
];
