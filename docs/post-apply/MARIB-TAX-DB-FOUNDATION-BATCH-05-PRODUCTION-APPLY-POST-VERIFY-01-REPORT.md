# MARIB-TAX-DB-FOUNDATION-BATCH-05-PRODUCTION-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_05_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE

## Scope

- Environment: Production
- Supabase project ref: `sjmtiwzddztxfrncwkpx`
- Repository: `tarasana-mufadhala/Marib_Tax`
- Base main HEAD at apply: `c669f01f3f76eabf1da4ccaa4af27e2b0215110d`
- Verification report created: `2026-07-19` (Asia/Riyadh)
- Supabase CLI: `2.109.1`
- Batch 06 work during apply phase: None

## Applied Migration

- Version: `20260720120000`
- File: `supabase/migrations/20260720120000_create_masterdata_activities_and_property.sql`
- SHA-256: `D3F15F918B721DD00865CFF8702BBF4313BB21FB741228D5ECCF5F82E7FB148C`
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
| Working tree clean / origin/main baseline | PASS — HEAD `c669f01` matched `origin/main` |
| Migration SHA-256 exact match | PASS |
| Linked project ref `sjmtiwzddztxfrncwkpx` | PASS |
| Remote history: 01A/02/03/04 once each; Batch 05 absent | PASS |
| Eight Batch 05 tables absent | PASS — `commercial_activities=0\|branches=0\|activity_addresses=0\|activity_status_histories=0\|properties=0\|property_units=0\|ownership_records=0\|ownership_histories=0` |
| TABLE-021 / `v_taxpayer_properties` absent | PASS — both `0` |
| Managed backup posture | PASS — latest physical COMPLETED `2026-07-18T22:04:26.808Z`; WALG enabled |
| Dry-run listed exactly Batch 05 | PASS |

## Apply Result

- Command: `npx --yes supabase@2.109.1 db push --linked --yes`
- Exit result: success (`Finished supabase db push.`)
- Migration applied: `20260720120000_create_masterdata_activities_and_property.sql`
- Non-blocking CLI warning: pg-delta catalog cache / Docker Desktop pipe miss after apply; migration apply and verifier gates passed
- Additional migrations: none

## Migration-History Verification

| Migration | Local | Remote |
| --- | ---: | ---: |
| `20260715175300` — Batch 01A | 1 | 1 |
| `20260716190000` — Batch 02 | 1 | 1 |
| `20260717120000` — Batch 03 | 1 | 1 |
| `20260719120000` — Batch 04 | 1 | 1 |
| `20260720120000` — Batch 05 | 1 | 1 |

Post-apply dry-run:

- Result: `Remote database is up to date.`
- Pending migrations: 0

## Structural Verification

Read-only verifier: `scripts/db/verify/verify_batch_05_masterdata_activities_and_property.sql`

| Check | Result |
| --- | --- |
| `final_status` | **PASS** |
| Dependencies (`taxpayers` / `legal_entities` / `user_profiles`) | true |
| `table_mismatch_count` | 0 |
| `index_mismatch_count` | 0 |
| `forbidden_grant_count` | 0 |
| `seed_mismatch_count` | 0 |
| `policy_count` | 0 |
| `property_ownership_units_present` (TABLE-021) | false |
| `taxpayer_properties_view_present` | false |
| `properties_taxpayer_id_present` | false |
| All eight table row counts | 0 |
| All mismatch arrays | `[]` |

## Resulting Production Objects

Eight empty tables with RLS enabled, no policies, no unexpected grants, and no seed rows:

- `masterdata.commercial_activities`
- `masterdata.branches`
- `masterdata.activity_addresses`
- `masterdata.activity_status_histories`
- `masterdata.properties`
- `masterdata.property_units`
- `masterdata.property_ownership_records`
- `masterdata.property_ownership_histories`

Excluded objects remain absent:

- `masterdata.property_ownership_units` (TABLE-021)
- `masterdata.v_taxpayer_properties`
- `masterdata.properties.taxpayer_id`

## Non-actions confirmation

This phase did not:

- apply Batch 06 or any later migration;
- run `migration repair` or `db reset --linked`;
- seed or backfill operational data;
- create TABLE-021 or `v_taxpayer_properties`;
- deploy applications;
- send notifications;
- expose credentials or secrets in this report.

## Decision detail

**PASS** — Batch 05 is `APPLIED` and verifier `PASS`. Batch 06 source authoring may begin; Batch 06 must not be applied to production without a separate explicit approval.
