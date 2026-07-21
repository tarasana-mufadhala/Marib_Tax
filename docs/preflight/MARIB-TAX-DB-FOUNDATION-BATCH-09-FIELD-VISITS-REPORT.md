# MARIB Tax DB Foundation — Batch 09 Field Visits Report

## Status

Source only for this report. Production apply remains closed. Fresh linked preflight evidence (no apply) is recorded in `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md`.

- `BATCH_09_SOURCE = MERGED / NOT APPLIED`
- `PROD-DB-09 = REQUIRES_USER_APPROVAL`

## Artifacts

- Migration: `supabase/migrations/20260724120000_create_field_visits_family.sql`
- Migration SHA-256: `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D`
- Read-only verifier: `scripts/db/verify/verify_batch_09_field_visits_family.sql`
- Verifier SHA-256: `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-09-FIELD-VISITS-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_09_FIELD_VISITS_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main` `7fe71ea1d63381450b834f8f3803bac783f4df10`

## Scope and boundaries

The source defines TABLE-050…055 only in schema `visits`:

1. `field_visits`
2. `visit_schedules`
3. `visit_team_members`
4. `visit_results`
5. `visit_result_corrections`
6. `visit_evidences`

- Exact-one parent context: nullable `service_request_id` / `balagh_id` with XOR CHECK; RESTRICT FKs; no `cases` table.
- Required `created_by_staff_profile_id`; taxpayer cannot create visits in this foundation.
- Schedule revisions retained; actual start/end and location snapshot are separate from scheduled times.
- Active team membership uniqueness via partial unique index; historical membership retained.
- One result per visit; corrections append-only with mandatory non-blank reason and correcting staff.
- Evidence links to Batch 08 `files.attachments` metadata only; no Postgres bytes, Storage buckets, policies, or `storage.objects` FKs.
- RLS enabled on all six tables; no policies; positive grants revoked; no seed/backfill; no service-specific trigger defaults.

## Deferred open decisions

- OD-08 / DMOD-08 service-specific visit triggers
- OD-15 / DMOD-15 correction authority roster
- DM-08 team masking / full result catalogue
- Exact `cancelVisit` authority

## Non-actions

This source report itself authorizes no apply. The later production preflight used linked read-only checks and `--dry-run` only; it did not apply Batch 09, mutate Storage, seed, deploy, or use real taxpayer data.
