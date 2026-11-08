import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/a11y/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
    // Les tests unitaires ne dépendent jamais d'une base de données.
    env: { SKIP_ENV_VALIDATION: '1' },
  },
})
