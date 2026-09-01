# Marib Tax E2E Readiness Gate 01

**Decision:** `HOLD — NOT READY FOR FULL STAGING E2E OR RELEASE CANDIDATE`

**Measured:** 2026-08-31 (UTC)
**Authoritative source:** `tarasana-mufadhala/Marib_Tax`
**Baseline:** `main` at `d2ab03b3aac92de5d16d8775f93a5b983cd0f066`
**Isolated local branch:** `test/e2e-staging-baseline`

## Current evidence

- The latest `main` GitHub Actions run (run 184, 2026-08-01) failed at Lint;
  Build and the then-existing automated tests passed. Formatting was skipped
  after the lint failure.
- The local baseline initially had 8 formatting violations and 6 lint errors.
- TypeScript typecheck, OpenAPI validation, and all 203 existing tests passed
  before the corrective batch.
- The repository contains 17 Supabase migrations but no executable SQL test in
  `database/tests`.
- The web application explicitly describes operational services and login as
  disabled; its admin page is a fail-closed foundation route.
- The Flutter application has no operational API integration and no
  `integration_test` suite.
- The worker is disabled and has no queue repository or delivery adapter.
- Existing API E2E coverage uses in-memory repositories; it does not prove
  PostgreSQL, Supabase RLS, Storage, Worker delivery, or deployed Staging paths.
- At baseline measurement, no open pull request contained a newer integration
  baseline.

## Executed local E2E batch

The following commands were executed on 2026-08-31 against the isolated local
branch. No Supabase connection, migration, Storage call, SMS, push, deploy, or
Production write occurred.

| Execution | Result | Scope |
| --- | --- | --- |
| `pnpm test:e2e:api` | `PASS — 15/15` | Four NestJS process-level suites using the implemented in-memory repositories. |
| Focused API authorization and attachment security | `PASS — 32/32` | Fail-closed permissions, forged context rejection, ownership, legal hold, and immutable versions. |
| Full API suite | `PASS — 91/91` | All current API tests. |
| `pnpm test:e2e:web:http` | `PASS — 12/12` | Real Next.js server, Arabic RTL HTML, anonymous and forged admin denial, masked registry/masterdata, and attachment filtering/disabled download. |
| Next.js production build | `PASS_WITH_NOTES` | Build and static generation pass when the test-only shim substitutes the sandbox's missing RSS source; the application code is unchanged. |
| Playwright discovery | `PASS — 10 scenarios` | Five scenarios across desktop Chromium and Pixel 5 emulation. |
| Playwright browser execution | `BLOCKED` | Chromium executable is absent; all Playwright CDN download attempts timed out or returned a truncated archive in this runner. One launch attempt reached the explicit missing-executable error before application assertions. |
| Staging isolation preflight | `HOLD — 0/16` | Required Staging identity and fake-adapter values are not configured. Production project `sjmtiwzddztxfrncwkpx` was not contacted. |

The workflow now contains a dedicated `Playwright Web E2E` job for an Ubuntu
GitHub runner, where Chromium can be installed before running the 10 browser
scenarios.

## Gate status

| Gate                  | Status                    | Evidence / blocker                                                                                                                                                                                    |
| --------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation            | `PASS_WITH_NOTES` locally | Format, lint, typecheck, OpenAPI, 205 tests, API/Worker/Contracts builds, and the shimmed Web build pass; normal Web build still depends on an RSS source that this sandbox does not expose. |
| Database/RLS          | `BLOCKED`                 | 17 migrations; zero pgTAP/SQL tests; independent Staging identity not proven.                                                                                                                         |
| API integration       | `PASS_WITH_NOTES` locally | 15/15 API E2E and 91/91 full API tests pass, but operational E2E uses memory repositories rather than PostgreSQL/Supabase.                                                                             |
| Web/admin E2E         | `PASS_WITH_NOTES` locally | 12/12 process-level Web checks pass and 10 Playwright scenarios are ready; browser execution is runner-blocked, while operational admin workflows and authentication remain unimplemented.            |
| Mobile E2E            | `BLOCKED`                 | Operational journeys and Flutter `integration_test` are not implemented.                                                                                                                              |
| Storage authorization | `BLOCKED`                 | No deployed private-storage test target or cross-taxpayer fixture proof.                                                                                                                              |
| Worker/notifications  | `BLOCKED`                 | Worker queue and fake/test providers are not implemented.                                                                                                                                             |
| Security              | `HOLD`                    | Unit-level authorization checks exist; deployed IDOR, file, rate-limit, and ZAP evidence is absent.                                                                                                   |
| Performance           | `NOT_STARTED`             | No k6 suite, SLA target, or approved Staging load window.                                                                                                                                             |
| Backup/restore        | `BLOCKED`                 | No independently identified Staging database or restore rehearsal.                                                                                                                                    |
| UAT                   | `NOT_STARTED`             | Acceptance directory previously contained no signed pack.                                                                                                                                             |

## Exit conditions for the next stage

1. Identify an independent Staging Supabase project ref and the Production ref;
   they must be explicit and different.
2. Provide deployed Staging Web, API, and Worker SHA identity, plus a private
   test Storage target.
3. Enable only a fixed test OTP, fake SMS adapter, and test FCM project.
4. Implement operational Web and Mobile journeys for FR-101 to FR-105 and
   FR-201 to FR-206 before asserting their E2E success.
5. Implement a real Worker outbox consumer with retry/idempotency and a fake
   delivery adapter.
6. Add disposable-database integration and RLS tests before any Staging data
   mutation.

Until these conditions are met, the release decision remains `HOLD` and no
Production action is authorized.
