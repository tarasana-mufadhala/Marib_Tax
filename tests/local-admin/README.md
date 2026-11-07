# Local admin anonymous-route smoke tests

Run from the repository root after installing locked workspace dependencies and
Playwright Chromium:

    pnpm exec playwright test --config tests/local-admin/playwright.config.ts

Uses only a fresh loopback Next.js process on port 3191. Browser requests to other
origins and local API routes are aborted. No login is submitted. This browser
filter does not sandbox server-side code: do not supply operational credentials
or production environment configuration to the test process.

These tests cover absent sessions and forged role headers, not JWT validity or
API authorization. The current middleware accepts any nonempty session cookie;
that behavior needs a separately reviewed authentication fix and is not certified
by this smoke suite. No release/staging/production readiness is claimed.
