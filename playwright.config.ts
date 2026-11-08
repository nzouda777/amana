import { defineConfig, devices } from '@playwright/test'

/**
 * Tests de bout en bout et captures. Par défaut, Playwright démarre le serveur de
 * production (`pnpm start`, après `pnpm build`) ; `PLAYWRIGHT_BASE_URL` permet de
 * viser un serveur déjà lancé (dev ou recette).
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm start',
        // Serveur de production local : clés Turnstile de test et e-mails écrits en
        // fichier (src/env.ts). Jamais en production réelle.
        env: { ALLOW_DEV_SERVICES: '1' },
        url: `${baseURL}/fr/styleguide`,
        reuseExistingServer: true,
        timeout: 180_000,
      },
})
