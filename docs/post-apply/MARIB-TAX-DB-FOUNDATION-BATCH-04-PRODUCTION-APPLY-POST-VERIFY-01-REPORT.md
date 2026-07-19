# MARIB-TAX-DB-FOUNDATION-BATCH-04-PRODUCTION-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_04_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE

## Scope

- Environment: Production
- Supabase project ref: `sjmtiwzddztxfrncwkpx`
- Repository: `tarasana-mufadhala/Marib_Tax`
- Base main HEAD at apply: `9ff9c4cbc4ee86fad60d1ac26f4842a62677b78e`
- Autopilot HEAD at apply: `965abb4f5d0c04c143490825ce410670e1a1c2ab`
- Verification report created: `2026-07-19` (Asia/Riyadh)
- Supabase CLI: `2.109.1`
- Batch 05 work during apply phase: None

## Applied Migration

- Version: `20260719120000`
- File: `supabase/migrations/20260719120000_create_taxpayer_registry_and_legal_entities.sql`
- SHA-256: `19D92BF7FB23251BF17FE61A80194075ED9FEEB970EFD89EBC88CEF75174F3A4`
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
| Working tree clean | PASS |
| Migration SHA-256 exact match | PASS |
| Linked project ref `sjmtiwzddztxfrncwkpx` | PASS |
| Remote history: 01A/02/03 once each; Batch 04 absent | PASS |
| Six Batch 04 tables absent | PASS — `taxpayers=0\|contacts=0\|links=0\|assoc=0\|entities=0\|tax_numbers=0` |
| Managed backup posture | PASS — latest physical COMPLETED `2026-07-18T22:04:26.808Z`; WALG enabled |
| Dry-run listed exactly Batch 04 | PASS |

## Apply Result

- Command: `npx --yes supabase@2.109.1 db push --linked --yes`
- Exit result: success (`Finished supabase db push.`)
- Migration applied: `20260719120000_create_taxpayer_registry_and_legal_entities.sql`
- PostgreSQL notices: two long CHECK constraint identifiers truncated to 63 characters (expected PG behavior); constraints remain present and enforced
- Non-blocking CLI warning: pg-delta catalog cache certificate miss after apply; migration apply and verifier gates passed
- Additional migrations: none

## Migration-History Verification

| Migration | Local | Remote |
| --- | ---: | ---: |
| `20260715175300` — Batch 01A | 1 | 1 |
| `20260716190000` — Batch 02 | 1 | 1 |
| `20260717120000` — Batch 03 | 1 | 1 |
| `20260719120000` — Batch 04 | 1 | 1 |

Post-apply dry-run:

- Result: `Remote database is up to date.`
- Pending migrations: 0

## Structural Verification

Read-only verifier: `scripts/db/verify/verify_batch_04_taxpayer_registry_and_legal_entities.sql`

| Check | Result |
| --- | --- |
| `final_status` | **PASS** |
| Dependencies (`user_profiles` / `staff_profiles` / `roles`) | true |
| `table_mismatch_count` | 0 |
| `column_mismatch_count` | 0 |
| `index_mismatch_count` | 0 |
| `forbidden_grant_count` | 0 |
| `seed_mismatch_count` | 0 |
| `policy_count` | 0 |
| `tax_number_digits_check_present` | true |
| All six table row counts | 0 |
| All mismatch arrays | `[]` |

## Resulting Production Objects

Six empty tables with RLS enabled, no policies, no unexpected grants, and no seed rows:

- `registry.taxpayers`
- `registry.taxpayer_contacts`
- `registry.taxpayer_account_links`
- `registry.taxpayer_legal_entity_associations`
- `legal.legal_entities`
- `legal.tax_numbers`

## Non-actions confirmation

This phase did not:

- apply Batch 05 or any later migration;
- run `migration repair` or `db reset --linked`;
- seed or backfill operational data;
- deploy applications;
- send notifications;
- expose credentials or secrets in this report.

## Decision detail

**PASS** — Batch 04 is `APPLIED` and verifier `PASS`. Batch 05 source authoring may begin; Batch 05 must not be applied to production without a separate explicit approval.
