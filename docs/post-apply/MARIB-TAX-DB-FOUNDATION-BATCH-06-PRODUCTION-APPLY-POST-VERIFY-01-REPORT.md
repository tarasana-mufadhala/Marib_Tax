# MARIB-TAX-DB-FOUNDATION-BATCH-06-PRODUCTION-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_06_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE

## Scope

- Environment: Production
- Supabase project ref: `sjmtiwzddztxfrncwkpx`
- Repository: `tarasana-mufadhala/Marib_Tax`
- Base main HEAD at apply: `9637b725a4132250f2d2cb9c1171b799cfe92658`
- Verification report created: `2026-07-20` (Asia/Riyadh)
- Supabase CLI: `2.109.1`
- Batch 07 work during apply phase: None

## Applied Migration

- Version: `20260721120000`
- File: `supabase/migrations/20260721120000_create_service_requests_family.sql`
- SHA-256: `F0446C8964C4345D79669C6926B983776213CB06BFD6E4C2DB27BDC3EFB0AE7D`
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
| Working tree clean / origin/main baseline | PASS — HEAD `9637b72` matched `origin/main` |
| Migration SHA-256 exact match | PASS |
| Linked project ref `sjmtiwzddztxfrncwkpx` | PASS |
| Remote history: 01A–05 once each; Batch 06 absent | PASS |
| Fourteen Batch 06 tables absent | PASS |
| No relation named `cases` | PASS |
| Reopen source constraints (reason/staff NOT NULL + non-blank) | PASS |
| Managed backup posture | PASS — latest physical COMPLETED `2026-07-18T22:04:26.808Z`; WALG enabled |
| Dry-run listed exactly Batch 06 | PASS |

## Apply Result

- Command: `npx --yes supabase@2.109.1 db push --linked --yes`
- Exit result: success (`Finished supabase db push.`)
- Migration applied: `20260721120000_create_service_requests_family.sql`
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

Post-apply dry-run:

- Result: `Remote database is up to date.`
- Pending migrations: 0

## Structural Verification

Read-only verifier: `scripts/db/verify/verify_batch_06_service_requests_family.sql`

| Check | Result |
| --- | --- |
| `final_status` | **PASS** |
| Dependencies (taxpayers / activities / branches / profiles) | true |
| `table_mismatch_count` | 0 |
| `index_mismatch_count` | 0 |
| `forbidden_grant_count` | 0 |
| `seed_mismatch_count` | 0 |
| `policy_count` | 0 |
| `cases_relation_present` | false |
| `reopen_reason_not_null` | true |
| `reopen_staff_not_null` | true |
| `reopen_reason_not_blank_check_present` | true |
| All fourteen table row counts | 0 |
| All mismatch arrays | `[]` |

## Resulting Production Objects

Fourteen empty `requests` tables with RLS enabled, no policies, no unexpected grants, and no seed rows:

- `requests.service_types`
- `requests.service_requests`
- `requests.request_selected_activities`
- `requests.request_selected_branches`
- `requests.request_form_snapshots`
- `requests.request_form_snapshot_payloads`
- `requests.request_status_histories`
- `requests.request_assignment_histories`
- `requests.request_completion_requests`
- `requests.request_completion_responses`
- `requests.request_decision_records`
- `requests.request_decision_revisions`
- `requests.request_close_archive_records`
- `requests.request_reopen_records`

No relation named `cases`. No FR-201…206 catalogue seed.

## Non-actions confirmation

This phase did not:

- apply Batch 07 or any later migration;
- run `migration repair` or `db reset --linked`;
- seed or backfill operational data;
- create a `cases` relation;
- deploy applications;
- send notifications;
- expose credentials or secrets in this report.

## Decision detail

**PASS** — Batch 06 is `APPLIED` and verifier `PASS`. Batch 07 source authoring may begin; Batch 07 must not be applied to production without a separate explicit approval.
