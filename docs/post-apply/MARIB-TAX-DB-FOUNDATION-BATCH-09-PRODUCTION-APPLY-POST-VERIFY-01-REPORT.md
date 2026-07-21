# MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_09_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE

## Scope

- Environment: Production
- Supabase project ref: `sjmtiwzddztxfrncwkpx`
- Repository: `tarasana-mufadhala/Marib_Tax`
- Base main HEAD at apply: `da3796bd9af296ac96d0033341eb036a1328f19c`
- Verification report created: `2026-07-21` (Asia/Riyadh)
- Supabase CLI: `2.109.1`
- Batch 10 work during apply phase: None
- Storage bucket/policy/upload/download during apply phase: None

## Applied Migration

- Version: `20260724120000`
- File: `supabase/migrations/20260724120000_create_field_visits_family.sql`
- SHA-256: `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D`
- Verifier: `scripts/db/verify/verify_batch_09_field_visits_family.sql`
- Verifier SHA-256: `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77`
- Applied migrations in the controlled session: 1
- Seed executed: No
- Backfill executed: No
- Repair executed: No
- Reset executed: No
- Rollback executed: No
- `--include-all`: Not used
- Dashboard SQL / direct `psql`: Not used
- Verifier execution path: `npx --yes supabase@2.109.1 db query --linked --file ...` (approved linked mechanism; no direct `psql`)

## Pre-Apply Gates

| Gate | Result |
| --- | --- |
| Working tree clean / origin/main baseline | PASS — HEAD `da3796b` matched `origin/main`; PR #71 MERGED |
| Migration SHA-256 exact match | PASS — `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D` |
| Verifier SHA-256 exact match | PASS — `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77` |
| Linked project ref `sjmtiwzddztxfrncwkpx` | PASS |
| Remote history: 01A–08 once each; Batch 09 absent | PASS |
| Six Batch 09 tables absent | PASS |
| Partial Batch 09 objects absent | PASS — `tables=0\|indexes=0\|constraints=0\|foreign_keys=0\|policies=0\|grants=0\|triggers=0\|functions=0\|sequences=0` |
| Open decisions remain unencoded | PASS — OD-08 / OD-15 / DM-08 masking / `cancelVisit` |
| Managed backup posture | PASS — latest physical COMPLETED `2026-07-20T22:04:12.315Z`; WALG enabled; PITR disabled |
| Pre-apply dry-run listed exactly Batch 09 | PASS |

## Apply Result

- Command: `npx --yes supabase@2.109.1 db push --linked --yes`
- Exit result: success (`Finished supabase db push.`)
- Migration applied: `20260724120000_create_field_visits_family.sql`
- Non-blocking CLI warning: pg-delta catalog cache certificate miss after apply; migration apply and verifier gates passed
- Additional migrations: none
- This was the only production write authorized by this approval.

## Migration-History Verification

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
| `20260724120000` — Batch 09 | 1 | 1 |

Post-apply dry-run:

- Result: `Remote database is up to date.`
- Pending migrations: 0

## Structural Verification

Read-only verifier: `scripts/db/verify/verify_batch_09_field_visits_family.sql`

| Check | Result |
| --- | --- |
| `final_status` | **PASS** |
| `table_mismatch_count` | 0 |
| `forbidden_grant_count` | 0 |
| `policy_count` | 0 |
| `storage_fk_count` | 0 |
| `cases_relation_absent` | true |
| `exact_one_parent_check` | true |
| `one_result_per_visit` | true |
| `correction_reason_check` / `correction_reason_required` | true |
| `one_active_team_membership` | true |
| `team_history_unique` | true |
| Schedule revision uniqueness (`visit_schedules_field_visit_revision_key`) | present |
| Evidence FK to `files.attachments` | present |
| Visit-schema triggers / functions | 0 / 0 |
| RLS enabled on all six tables | true (via `table_mismatch_count=0`) |
| Row counts all six tables | 0 |
| `table_mismatches` | `[]` |

## Resulting Production Objects

Six empty `visits` family tables with RLS enabled, no policies, no unexpected grants, and no seed rows:

- `visits.field_visits`
- `visits.visit_schedules`
- `visits.visit_team_members`
- `visits.visit_results`
- `visits.visit_result_corrections`
- `visits.visit_evidences`

## Open decisions intentionally not encoded

- OD-08 / DMOD-08 — automatic / service-specific visit triggers
- OD-15 / DMOD-15 — correction authority roster
- DM-08 — team-member masking / full result catalogue
- Exact `cancelVisit` authority/behavior

## Production impact

Batch 09 metadata/structure only: six empty visit-family tables with default-deny RLS. No Storage mutation, no seed/backfill, no Batch 10, no deploy, no real taxpayer data, no SMS/OTP/WhatsApp.

## Non-Actions Confirmation

This apply session did not run `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, Storage bucket/policy creation, real upload/download, Batch 10 source/apply, deploy, or real SMS/OTP/WhatsApp. No earlier approval was reused.

## Follow-on

- PROD-DB-09 = **APPLIED / VERIFIED PASS**
- Batch 10 may begin as **source only** after this post-apply report is merged; production apply for Batch 10 remains closed until a separate explicit approval.
