# MARIB Tax Batch 15 Performance Indexes Design Decision Gate

## Decision

**PASS — BATCH_15_PERFORMANCE_INDEXES_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- TABLES updated to add missing RLS and performance columns:
  1. `requests.service_requests` (TABLE-024) - Added `assignee_id` (uuid, nullable) referencing `identity.staff_profiles(id)`.
  2. `visits.field_visits` (TABLE-050) - Added `scheduled_at` (timestamptz, nullable) and `team_lead_id` (uuid, nullable) referencing `identity.staff_profiles(id)`.
- INDEXES created (composite and access plan):
  1. `idx_requests_status_submitted_at` on `requests.service_requests (status_code, submitted_at)`
  2. `idx_requests_service_id_assignee_id` on `requests.service_requests (service_type_id, assignee_id)`
  3. `idx_field_visits_scheduled_at_team_lead` on `visits.field_visits (scheduled_at, team_lead_id)`
  4. Additional 40+ indexes covering all schemas (registry, requests, balaghat, masterdata, visits, dues, notify, imports, content, reporting) according to candidate index access plan `MARIB-TAX-INDEX-QUERY-ACCESS-PLAN-01`.

## Accepted source boundaries

- Structural changes are backwards-compatible (all added columns are nullable).
- No new tables are introduced.
- RLS posture is unaffected (tables already have default-deny RLS enabled; policies are deferred to Batch 16).
- All index names and predicates match query patterns to prevent duplicate index footprints.
- Zero positive grants or seed data rows introduced.

## Verification result

- Exactly 3 `ALTER TABLE ... ADD COLUMN` statements.
- Compiles cleanly and repository foundation validation passes.
- Migration SHA-256: `F5251B3F7AC0661EA068FBAB5395B141E2CF7EA98B026AED11150E83AFD7950C`
- Verifier SHA-256: `371A96071F485150C508491321C8634E75BD37B6A2090A8752E6D4FACF801607`

## Production gate

This design PASS does not authorize apply. Production apply requires the full governed cycle: PR → CI PASS → review → merge → production preflight with linked read-only checks and `--dry-run` → independent user approval → single apply → post-apply verifier → closure (`BATCH_15 = APPLIED / VERIFIED PASS`).
