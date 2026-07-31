# MARIB Tax DB Foundation — Batch 15 Performance Indexes Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_15_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-15 = NOT_STARTED` (requires the governed cycle and independent user approval)

## Artifacts

- Migration: `supabase/migrations/20260730120000_create_performance_indexes.sql`
- Migration SHA-256: `F5251B3F7AC0661EA068FBAB5395B141E2CF7EA98B026AED11150E83AFD7950C`
- Read-only verifier: `scripts/db/verify/verify_batch_15_performance_indexes.sql`
- Verifier SHA-256: `371A96071F485150C508491321C8634E75BD37B6A2090A8752E6D4FACF801607`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-15-PERFORMANCE-INDEXES-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_15_PERFORMANCE_INDEXES_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main`

## Scope and boundaries

The source updates table columns and adds composite indexes to optimize read/write performance across the following schemas:
- `requests`
- `visits`
- `balaghat`
- `registry`
- `masterdata`
- `dues`
- `notify`
- `imports`
- `content`
- `reporting`

- No new tables are introduced.
- Default-deny RLS posture is preserved.
- No client-facing positive grants are introduced (REVOKE ALL remains active).

## Structural review (source)

- Added columns:
  - `requests.service_requests.assignee_id` (uuid, FK to `identity.staff_profiles`)
  - `visits.field_visits.scheduled_at` (timestamptz)
  - `visits.field_visits.team_lead_id` (uuid, FK to `identity.staff_profiles`)
- Created indexes:
  - Required composite indexes for statuses and assignees.
  - Access plan composite/partial indexes for query optimizations.

## Non-actions

This source report authorizes no apply. It did not apply Batch 15 anywhere, mutate Storage, or use real data. Local execution is pending a running database connection and does not replace the governed production preflight.
