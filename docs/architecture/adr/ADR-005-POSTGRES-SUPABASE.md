# ADR-005: PostgreSQL and Supabase

- **Status:** Accepted (migration-path amendment 2026-07-15)
- **Date:** 2026-07-14
- **Amended:** 2026-07-15 (MARIB-TAX-SUPABASE-CLI-ENABLEMENT-01)

## Context

The system requires a relational database, managed auth/storage capabilities where approved, and operational reliability without building all platform services from scratch.

Historical repository foundation initially reserved schema migrations under `database/migrations/`. Before any remote apply, owner-approved enablement selected Supabase CLI as the official migration and history mechanism, with canonical files under `supabase/migrations/`.

## Decision

Use **PostgreSQL** with **selected Supabase managed services**. Clients must **not** perform direct client-side business writes that bypass backend rules.

Active migration decision (2026-07-15):

- **Supabase CLI** is the official migration and migration-history mechanism.
- Canonical migration files live under **`supabase/migrations/`**.
- The prior **`database/migrations/`** convention is **superseded before the first remote apply**.
- No Batch 01A migration was applied from the former path.
- The moved Batch 01A file retains the same migration version, filename, SQL content, and SHA-256 (`A197D608D6F33D61488FA6DA3C32BE4E7B5F68458C2E1C6D2482F62F76DB8171`).
- Remote history must be checked with the linked Supabase CLI before application.
- Production apply requires a dedicated authorization (separate controlled stage).

See also: `docs/governance/MARIB-TAX-SUPABASE-CLI-MIGRATION-STANDARD-01.md`.

## Consequences

- Schema evolution via versioned SQL under `supabase/migrations/`.
- Privileged Supabase credentials remain server-only.
- Supabase features are adopted selectively and explicitly, not as an unbounded platform dump.
- Direct `psql` is no longer the default apply path.
- `database/migrations/` remains only as a reserved historical placeholder directory (no active migration copies).

## Guardrails

- No direct client-side business writes to the database for operational data (ADR-010).
- Service-role keys never ship to clients.
- Independent databases per environment.
- No production migration automation.
- No remote link or production apply is authorized by documentation enablement alone.
