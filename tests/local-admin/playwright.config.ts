import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'anonymous.spec.ts',
  forbidOnly: true,
  retries: 0,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3191' },
  webServer: {
    command:
      'pnpm --filter @marib-tax/admin-dashboard exec next dev --hostname 127.0.0.1 --port 3191',
    url: 'http://127.0.0.1:3191/login',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
