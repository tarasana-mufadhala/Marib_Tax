# Environment Strategy — Marib Tax System

## Environments

The Marib Tax System maintains three **independent** environments:

| Environment | Purpose |
| --- | --- |
| Development | Local and shared development integration |
| Staging | Pre-production verification and UAT |
| Production | Live taxpayer and admin operations |

## Isolation rules

- **No shared databases** across environments.
- **No shared storage buckets** across environments.
- **Independent secrets** per environment; never reuse production secrets in development or staging.
- **No automatic production migrations**; production schema changes require controlled, approved execution.
- **No production data in development** (or staging copies without explicit sanitization policy and approval).
- **Production access is least privilege** — minimal accounts, audited access, no casual operator use of service-role credentials.

## Configuration

- Track only placeholder examples (`.env.example`).
- Real credentials live in environment secret stores, never in git.
- Public client variables must be intentionally prefixed and reviewed; server-only secrets must never ship in client bundles.

## Promotion

Changes promote Development → Staging → Production with evidence from tests, reviews, and Definition of Done. Skipping Staging for production-impacting changes is prohibited without an approved exception Change Request.
