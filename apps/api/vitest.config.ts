import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // مجموعة Vitest تقتصر على apps/api/test.
    // مجلد e2e/ يحوي مواصفات Playwright (playwright.config.ts) ولا تُشغَّل بـ Vitest.
    include: ['test/**/*.test.ts'],
  },
});
