import { expect, test } from '@playwright/test';

// No credentials, real datasets, login submissions or remote API access.
test.beforeEach(async ({ context }) => {
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (
      url.origin !== 'http://127.0.0.1:3191' ||
      url.pathname.startsWith('/api')
    ) {
      await route.abort();
      return;
    }
    await route.continue();
  });
});

for (const path of ['/', '/taxpayers', '/dues']) {
  test(`anonymous ${path} redirects to login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(
      `http://127.0.0.1:3191/login?redirect=${encodeURIComponent(path)}`,
    );
  });
}

test('client role headers do not replace a session', async ({ page }) => {
  await page.setExtraHTTPHeaders({
    Authorization: 'Bearer synthetic-invalid-token',
    'X-User-Role': 'admin',
  });
  await page.goto('/taxpayers');
  await expect(page).toHaveURL(/\/login\?redirect=%2Ftaxpayers$/);
});
