# MARIB Tax Batch 15 Performance Indexes Design Decision Gate

## Decision

**PASS — BATCH_15_PERFORMANCE_INDEXES_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- COLUMNS added (3 nullable, backward-compatible):
  1. `requests.service_requests.assignee_id` (TABLE-024) — uuid FK → `identity.staff_profiles`
  2. `visits.field_visits.scheduled_at` (TABLE-050) — timestamptz
  3. `visits.field_visits.team_lead_id` (TABLE-050) — uuid FK → `identity.staff_profiles`
- INDEXES created: 38 composite indexes across 12 schemas (`requests`, `visits`, `balaghat`, `dues`, `files`, `notify`, `imports`, `audit`, `registry`, `identity`, `masterdata`, `content`)
- Specific user-requested indexes:
  1. `idx_requests_status_submitted_at` on `requests.service_requests (status_code, submitted_at)`
  2. `idx_requests_service_id_assignee_id` on `requests.service_requests (service_type_id, assignee_id)`
  3. `idx_field_visits_scheduled_at_team_lead` on `visits.field_visits (scheduled_at, team_lead_id)`

## Accepted source boundaries

- All added columns are nullable — no impact on existing rows or NestJS data flow.
- FK constraints use `NOT VALID` to avoid table locking on large datasets.
- Every index uses `IF NOT EXISTS` — idempotent re-run safe.
- Composite indexes extend single-column indexes with additional predicates; no duplicates.
- Partial indexes use WHERE clauses to minimize index footprint.
- No RLS policy changes — policies are deferred to Batch 16.
- No positive grants introduced — REVOKE ALL posture preserved.
- No seed data or backfill rows.
- No Storage mutation, buckets, policies, or object bytes.

## Verification result

- Exactly 3 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements.
- 2 new FK constraints (NOT VALID, RESTRICT, NOT DEFERRABLE).
- 38 `CREATE INDEX IF NOT EXISTS` covering all schemas.
- Read-only verifier checks column presence, all 38 index names, and duplicate absence.
- Migration SHA-256: `7FC75EB59844EAB66175C0B034EFCB14F9CD33605AE4B4F51C00288D012D6F53`
- Verifier SHA-256: `25CDC75049B6ECDBEE02617AF5D729E41493DA87CF148E392253052EA343A6AC`

## Production gate

This design PASS does not authorize apply. Production apply requires the full governed cycle: PR → CI PASS → review → merge → production preflight with linked read-only checks and `--dry-run` → independent user approval → single apply → post-apply verifier → closure (`BATCH_15 = APPLIED / VERIFIED PASS`).