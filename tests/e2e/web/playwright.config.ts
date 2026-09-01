import { defineConfig, devices } from '@playwright/test';

const localBaseUrl = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['line']],
  outputDir: '../../../test-results/playwright',
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: localBaseUrl,
    locale: 'ar-YE',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'node --require ../../tests/e2e/web/node-memory-shim.cjs ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100',
    cwd: 'apps/web',
    url: localBaseUrl,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
