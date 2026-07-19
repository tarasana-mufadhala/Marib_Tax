# MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_07_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE

## Scope

- Environment: Production
- Supabase project ref: `sjmtiwzddztxfrncwkpx`
- Repository: `tarasana-mufadhala/Marib_Tax`
- Base main HEAD at apply: `8d62af29a55a07b53469c275678fb4f2ae40076e`
- Verification report created: `2026-07-20` (Asia/Riyadh)
- Supabase CLI: `2.109.1`
- Batch 08 work during apply phase: None

## Applied Migration

- Version: `20260722120000`
- File: `supabase/migrations/20260722120000_create_balaghat_family.sql`
- SHA-256: `10BA80E828CDB39AB60B1816F8EC6D263169CC6DFA6EC7821D979AE2EDA63118`
- Applied migrations in the controlled session: 1
- Seed executed: No
- Backfill executed: No
- Repair executed: No
- Reset executed: No
- Rollback executed: No
- `--include-all`: Not used
- Dashboard SQL / direct `psql`: Not used

## Pre-Apply Gates

| Gate | Result |
| --- | --- |
| Working tree clean / origin/main baseline | PASS — HEAD `8d62af2` matched `origin/main` |
| Migration SHA-256 exact match | PASS — `10BA80E828CDB39AB60B1816F8EC6D263169CC6DFA6EC7821D979AE2EDA63118` |
| Linked project ref `sjmtiwzddztxfrncwkpx` | PASS |
| Remote history: 01A–06 once each; Batch 07 absent | PASS |
| Sixteen Batch 07 tables absent | PASS |
| No relation named `cases` | PASS |
| No TABLE-021 `masterdata.property_ownership_units` | PASS |
| Source: 16 CREATE TABLE / 16 RLS; no POLICY/GRANT/INSERT | PASS |
| Source UNIQUE / filer / type / reopen constraints | PASS |
| Managed backup posture | PASS — latest physical COMPLETED `2026-07-19T22:03:52.367Z`; WALG enabled |
| Dry-run listed exactly Batch 07 | PASS |

## Apply Result

- Command: `npx --yes supabase@2.109.1 db push --linked --yes`
- Exit result: success (`Finished supabase db push.`)
- Migration applied: `20260722120000_create_balaghat_family.sql`
- Non-blocking CLI warning: pg-delta catalog cache certificate miss after apply; migration apply and verifier gates passed
- Additional migrations: none

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

Post-apply dry-run:

- Result: `Remote database is up to date.`
- Pending migrations: 0

## Structural Verification

Read-only verifier: `scripts/db/verify/verify_batch_07_balaghat_family.sql`

| Check | Result |
| --- | --- |
| `final_status` | **PASS** |
| Dependencies (taxpayers / activities / branches / properties / units / ownership / profiles) | true |
| `table_mismatch_count` | 0 |
| `index_mismatch_count` | 0 |
| `forbidden_grant_count` | 0 |
| `seed_mismatch_count` | 0 |
| `policy_count` | 0 |
| `cases_relation_present` | false |
| `property_ownership_units_present` | false |
| `filer_profile_id_not_null` | true |
| `balagh_type_code_not_null` | true |
| Selection UNIQUE (targets/properties/units/activities/branches) | all true |
| `reopen_reason_not_null` | true |
| `reopen_staff_not_null` | true |
| `reopen_reason_not_blank_check_present` | true |
| All sixteen table row counts | 0 |
| All mismatch arrays | `[]` |

## Resulting Production Objects

Sixteen empty `balaghat` tables with RLS enabled, no policies, no unexpected grants, and no seed rows:

- `balaghat.balaghs`
- `balaghat.balagh_selected_targets`
- `balaghat.balagh_selected_properties`
- `balaghat.balagh_selected_property_units`
- `balaghat.balagh_selected_activities`
- `balaghat.balagh_selected_branches`
- `balaghat.balagh_form_snapshots`
- `balaghat.balagh_form_snapshot_payloads`
- `balaghat.balagh_status_histories`
- `balaghat.balagh_assignment_histories`
- `balaghat.balagh_completion_requests`
- `balaghat.balagh_completion_responses`
- `balaghat.balagh_decision_records`
- `balaghat.balagh_decision_revisions`
- `balaghat.balagh_close_archive_records`
- `balaghat.balagh_reopen_records`

## Non-Actions Confirmation

This apply session did not run `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, Batch 08 apply, deploy, or real SMS/OTP/WhatsApp.

## Follow-on

- PROD-DB-07 = **APPLIED / VERIFIED PASS**
- Batch 08 may begin as **source only**; production apply for Batch 08 remains closed until a separate explicit approval.
