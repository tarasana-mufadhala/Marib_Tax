# Staging E2E

This directory is the cross-component acceptance boundary for the Marib Tax
System. It must target an isolated Staging deployment only. It must never use
production databases, storage, taxpayer data, phone numbers, SMS, or push
credentials.

## Stage 0 — isolation preflight

Copy `.env.staging.example` to an ignored environment file, populate only the
non-secret target values, inject secrets through the runner secret store, then
load the environment and run:

```sh
pnpm test:e2e:preflight
```

The preflight performs no network calls. It fails closed unless the test
dataset and adapters are synthetic and the Staging and Production Supabase
project refs are explicit and different.

## Local executable smoke suite

The current source-only Web and API foundations can be exercised without a
database or external provider:

```sh
pnpm test:e2e:local
pnpm exec playwright install chromium
pnpm test:e2e:web
```

`test:e2e:local` runs the NestJS in-memory E2E modules plus a process-level HTTP
suite against the real Next.js development server. `test:e2e:web` runs the same
Web boundaries through Playwright on desktop and mobile Chromium profiles.

These suites prove only the implemented local boundaries: Arabic RTL
rendering, fail-closed `/admin` access, and mock workspace behavior. They are
not evidence for PostgreSQL, Supabase RLS, Storage, Worker delivery, mobile, or
full FR-101 to FR-206 journeys.

## Planned suites

| Suite              | Tool                       | Required target                                                    |
| ------------------ | -------------------------- | ------------------------------------------------------------------ |
| Web/admin journeys | Playwright                 | Deployed Staging Web + API                                         |
| API integration    | Supertest + Testcontainers | Disposable PostgreSQL/Supabase-compatible database                 |
| Database/RLS       | pgTAP/SQL                  | Disposable database populated by migrations and synthetic fixtures |
| Mobile journeys    | Flutter `integration_test` | Staging API + Android emulator/test device                         |
| Performance        | k6                         | Approved Staging load window                                       |
| Security           | OWASP ZAP + manual cases   | Approved Staging scan window                                       |

Suites are added only when the corresponding runtime path is implemented. A
mock page, in-memory repository, reserved directory, or disabled adapter is not
accepted as proof of an end-to-end production path.

## Release rule

No Release Candidate is allowed until every critical journey for FR-101 to
FR-105 and FR-201 to FR-206 has passed against the same reconciled Staging SHA,
and the signed UAT pack records that SHA and environment identity.
