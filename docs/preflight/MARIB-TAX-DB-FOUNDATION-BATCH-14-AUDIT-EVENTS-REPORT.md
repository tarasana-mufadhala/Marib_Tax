# MARIB Tax DB Foundation — Batch 14 Audit & Events Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_14_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-14 = NOT_STARTED` (requires the governed cycle and independent user approval)

## Artifacts

- Migration: `supabase/migrations/20260731120100_create_audit_events_schema_tables.sql`
- Migration SHA-256: `A02DC51BF4ED2CACBB2A930078AA3118569CB8A40F455100EB1E076D19DF78A3`
- Read-only verifier: `scripts/db/verify/verify_batch_14_audit.sql`
- Verifier SHA-256: `B5EAF380535724293668066CAF49782670AAFE96CC252E6DD7866D7ED65841E0`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-14-AUDIT-EVENTS-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_14_AUDIT_EVENTS_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main`

## Scope and boundaries

The source defines three tables in schema `audit`:

1. `audit_logs`
2. `log_events`
3. `event_outbox`

- Physical names match the implementation definitions: `audit_logs`, `log_events`, `event_outbox`.
- RLS enabled on all three tables; positive client grants revoked; no seeds; no Storage schema mutation.
- Transactional outbox handles generic event dispatch and is completely decoupled from the notification outbox.

## Structural review (source)

- Schema: `audit`
- Exactly three `CREATE TABLE` + three `ENABLE ROW LEVEL SECURITY`
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0
- Checks and indexes are designed to optimize query performance for audit logs (by entity and actor) and events outbox.

## Non-actions

This source report authorizes no apply. It did not apply Batch 14 anywhere, mutate Storage, or use real data. Local execution is pending a running database connection and does not replace the governed production preflight.
