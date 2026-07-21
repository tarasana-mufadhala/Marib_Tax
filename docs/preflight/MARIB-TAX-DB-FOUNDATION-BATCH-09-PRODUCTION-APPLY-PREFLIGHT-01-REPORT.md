# MARIB-TAX-DB-FOUNDATION-BATCH-09 — Production Apply Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-PREFLIGHT-01 |
| Repository | `tarasana-mufadhala/Marib_Tax` |
| Base main HEAD | `08841bada5ea570acc2cc64d180a9934aa32e66b` |
| Target project ref | `sjmtiwzddztxfrncwkpx` |
| Supabase CLI | `2.109.1` |
| Migration version | `20260724120000` |
| Migration file | `supabase/migrations/20260724120000_create_field_visits_family.sql` |
| Migration SHA-256 | `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D` |
| Verifier | `scripts/db/verify/verify_batch_09_field_visits_family.sql` |
| Verifier SHA-256 | `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77` |
| Design acceptance | `PASS — BATCH_09_FIELD_VISITS_DESIGN_APPROVED_FOR_SOURCE` |
| Source PR | `#70` MERGED |
| Mode | Production preflight only; no migration apply |
| Decision | **PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY** |

## 0. Baseline and source integrity (G0)

- `git fetch origin` completed; working tree clean.
- `HEAD` matched `origin/main` exactly: `08841bada5ea570acc2cc64d180a9934aa32e66b`.
- PR #70 is `MERGED` (merge commit `08841ba`).
- Migration SHA-256 matched `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D`.
- Verifier SHA-256 matched `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77`.
- Source creates exactly six tables: `visits.field_visits`, `visits.visit_schedules`, `visits.visit_team_members`, `visits.visit_results`, `visits.visit_result_corrections`, `visits.visit_evidences`.
- Application-supplied UUIDs; explicit PK/FK; `ON DELETE RESTRICT`; XOR parent (`service_request_id` XOR `balagh_id`); required `created_by_staff_profile_id`; active team membership uniqueness; historical membership retained; schedule revisions retained; one original result per visit; additive corrections with required reason; Batch 08 `files.attachments` evidence reference only; no Storage access grant; no Storage schema mutation; no bytes/base64; RLS enabled on all six; no `CREATE POLICY`; no positive grants; no seed/backfill; no hard-delete/purge; no service-specific automatic visit trigger; no `cases` table.
- Open decisions remain unencoded: OD-08 automatic visit triggers; OD-15 correction authority; DM-08 team-member masking; `cancelVisit` behavior.

## 1. Linked project and migration history (G1)

- Linked project ref matched `sjmtiwzddztxfrncwkpx`.
- No migration repair was used.

| Migration | Local | Remote |
| --- | ---: | ---: |
| `20260715175300` — Batch 01A | 1 | 1 |
| `20260716190000` — Batch 02 | 1 | 1 |
| `20260717120000` — Batch 03 | 1 | 1 |
| `20260719120000` — Batch 04 | 1 | 1 |
| `20260720120000` — Batch 05 | 1 | 1 |
| `20260721120000` — Batch 06 | 1 | 1 |
| `20260722120000` — Batch 07 | 1 | 1 |
| `20260723120000` — Batch 08 | 1 | 1 |
| `20260724120000` — Batch 09 | 1 | 0 |

- Batches 01A–08 exist exactly once locally and remotely.
- Batch 09 is absent remotely.
- No later migration is pending.
- No duplicate migration version.
- No local/remote migration-history mismatch.

## 2. Remote structural absence (G2)

Six Batch 09 tables absent:

`field_visits=0|visit_schedules=0|visit_team_members=0|visit_results=0|visit_result_corrections=0|visit_evidences=0`

Partial Batch 09 objects absent:

`tables=0|indexes=0|constraints=0|foreign_keys=0|policies=0|grants=0|triggers=0|functions=0|sequences=0`

`cases_any=false`. Schema `visits` remains present from prior foundation batches (`visits_schema=true`), which is expected and not a Batch 09 object.

Approved read-only mechanism used: Supabase CLI `db query --linked`. No direct `psql` and no dashboard SQL.

## 3. Backup and recovery posture (G3)

- Latest visible managed physical backup: `2026-07-20T22:04:12.315Z` — status `COMPLETED`.
- WALG enabled: yes.
- PITR enabled: no.
- Restore was not executed.
- No backup was created.
- No backup contents or credentials were copied into this report.

## 4. Dry-run (G4)

`npx --yes supabase@2.109.1 db push --linked --dry-run` completed successfully.

Exactly one migration listed:

`20260724120000_create_field_visits_family.sql`

## 5. Open decisions intentionally not encoded

- OD-08 / DMOD-08 — automatic / service-specific visit triggers
- OD-15 / DMOD-15 — correction authority roster
- DM-08 — team-member masking / full result catalogue
- Exact `cancelVisit` authority/behavior

No open decision was silently finalized in source or this preflight.

## 6. Non-actions confirmation

This preflight did not apply any migration, run `db push` without `--dry-run`, seed data, repair, reset, create Storage buckets/policies, upload/download objects, deploy, publish, start Batch 10, use real taxpayer data, send SMS/OTP/WhatsApp, or expose secrets.

**Explicit confirmation: no production write occurred.**

## 7. Decision

**PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY**

Final production state after this preflight:

- `PROD-DB-09 = REQUIRES_USER_APPROVAL`
- `BATCH_09_SOURCE = MERGED / NOT APPLIED`

A separate explicit authorization is required before applying Batch 09 to production. This preflight must not be reused as apply approval.
