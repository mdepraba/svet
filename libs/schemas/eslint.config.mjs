import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      /**
       * The wire contract is shared by the browser and the server, so it must
       * never reach back into either. One import from `apps/api` here would
       * drag Prisma types into the frontend bundle.
       */
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/apps/api/**', '@/**'],
              message:
                'libs/schemas is the shared wire contract and must not import from an app.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
