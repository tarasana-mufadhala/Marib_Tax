# MARIB-TAX-DB-FOUNDATION-BATCH-03-PRODUCTION-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_03_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE

## Scope

- Environment: Production
- Supabase project ref: `sjmtiwzddztxfrncwkpx`
- Repository: `tarasana-mufadhala/Marib_Tax`
- Base main HEAD at apply: `1064485f6e33de45b16c4dae7eb37608638debda`
- Verification report created: `2026-07-19 02:33:25 UTC`
- Supabase CLI: `2.109.1`
- Batch 04 work during this phase: None (source authoring only after this report)

## Applied Migration

- Version: `20260717120000`
- File: `supabase/migrations/20260717120000_create_identity_authorization_model.sql`
- SHA-256: `BF15774686744A86D641D7B0B212F7B25E53D2AE6A8E4445662CA84475A00A86`
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
| Working tree clean at reviewed main | PASS |
| Migration SHA-256 exact match | PASS |
| Linked project ref `sjmtiwzddztxfrncwkpx` | PASS |
| Remote history: Batch 01A once, Batch 02 once, Batch 03 absent | PASS |
| `identity.user_profiles` and `identity.staff_profiles` present | PASS |
| Batch 03 tables absent before apply | PASS — signature `user_profiles=1\|staff_profiles=1\|roles=0\|permissions=0\|role_permissions=0\|staff_role_assignments=0` |
| Managed backup posture | PASS — latest physical COMPLETED `2026-07-18T22:04:26.808Z`; WALG enabled |
| Dry-run listed exactly Batch 03 | PASS |

## Apply Result

- Command: `npx --yes supabase@2.109.1 db push --linked --yes`
- Exit result: success (`Finished supabase db push.`)
- Migration applied: `20260717120000_create_identity_authorization_model.sql`
- Non-blocking CLI warning: pg-delta catalog cache failed to read a local certificate file after apply; migration apply itself completed and history/verifier gates passed
- Additional migrations: none

## Migration-History Verification

| Migration | Local | Remote |
| --- | ---: | ---: |
| `20260715175300` — Batch 01A | 1 | 1 |
| `20260716190000` — Batch 02 | 1 | 1 |
| `20260717120000` — Batch 03 | 1 | 1 |

Post-apply dry-run:

- Result: `Remote database is up to date.`
- Pending migrations: 0
- Batch 03 reapply required: No

## Structural Verification

Read-only verifier: `scripts/db/verify/verify_batch_03_authorization_model.sql`

| Check | Result |
| --- | --- |
| `final_status` | **PASS** |
| `user_profiles_present` / `staff_profiles_present` | true / true |
| `table_mismatch_count` | 0 |
| `column_mismatch_count` | 0 |
| `constraint_mismatch_count` | 0 |
| `index_mismatch_count` | 0 |
| `forbidden_grant_count` | 0 |
| `seed_mismatch_count` | 0 |
| `policy_count` | 0 |
| `view_count` / `routine_count` / `sequence_count` / `custom_type_count` / `non_internal_trigger_count` | 0 |
| `roles_row_count` | 0 |
| `permissions_row_count` | 0 |
| `role_permissions_row_count` | 0 |
| `staff_role_assignments_row_count` | 0 |
| All mismatch arrays | `[]` |

## Resulting Production Objects

Four empty `identity` authorization tables with RLS enabled, no policies, no unexpected grants, and no seed rows:

- `identity.roles`
- `identity.permissions`
- `identity.role_permissions`
- `identity.staff_role_assignments`

## Non-actions confirmation

This phase did not:

- apply Batch 04 or any later migration;
- run `migration repair` or `db reset --linked`;
- disable RLS;
- seed roles/permissions;
- send notifications;
- deploy applications;
- expose credentials or secrets in this report.

## Decision detail

**PASS** — Batch 03 is `APPLIED` and verifier `PASS`. Batch 04 source authoring may begin; Batch 04 must not be applied to production without a separate explicit approval.
