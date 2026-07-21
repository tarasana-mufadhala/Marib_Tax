# MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_08_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE

## Scope

- Environment: Production
- Supabase project ref: `sjmtiwzddztxfrncwkpx`
- Repository: `tarasana-mufadhala/Marib_Tax`
- Base main HEAD at apply: `5ce8c0648bec6629432460e10e5ca6e003b69ac5`
- Verification report created: `2026-07-21` (Asia/Riyadh)
- Supabase CLI: `2.109.1`
- Batch 09 work during apply phase: None
- Storage bucket/policy/upload/download during apply phase: None

## Applied Migration

- Version: `20260723120000`
- File: `supabase/migrations/20260723120000_create_files_attachment_metadata.sql`
- SHA-256: `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`
- Verifier: `scripts/db/verify/verify_batch_08_files_attachment_metadata.sql`
- Verifier SHA-256: `97ADD70F0E0F4A821FC77ACAA95A2272DBF06533E07BEAD995104EC08254DBCE`
- Applied migrations in the controlled session: 1
- Seed executed: No
- Backfill executed: No
- Repair executed: No
- Reset executed: No
- Rollback executed: No
- `--include-all`: Not used
- Dashboard SQL / direct `psql`: Not used
- Verifier execution path: `npx --yes supabase@2.109.1 db query --linked --file ...` (Management API; no direct `psql`)

## Pre-Apply Gates

| Gate | Result |
| --- | --- |
| Working tree clean / origin/main baseline | PASS — HEAD `5ce8c06` matched `origin/main` |
| Migration SHA-256 exact match | PASS — `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496` |
| Verifier SHA-256 exact match | PASS — `97ADD70F0E0F4A821FC77ACAA95A2272DBF06533E07BEAD995104EC08254DBCE` |
| Linked project ref `sjmtiwzddztxfrncwkpx` | PASS |
| Remote history: 01A–07 once each; Batch 08 absent | PASS |
| Three Batch 08 tables absent | PASS |
| Partial Batch 08 indexes/constraints absent | PASS — `tables=0|indexes=0|constraints=0` |
| Source: 3 CREATE TABLE / 3 RLS; no POLICY/GRANT/INSERT | PASS |
| No bytes/base64; no bucket; no `storage.objects` FK | PASS |
| `document_category_code` independent of accounting category | PASS |
| Checksum nullable; available requires checksum | PASS |
| Active-link partial uniqueness; unlink/relink retained | PASS |
| Retention vocabulary active/archived/legal_hold; no hard delete/purge | PASS (source vocabulary; no purge path) |
| Managed backup posture | PASS — latest physical COMPLETED `2026-07-20T22:04:12.315Z`; WALG enabled; PITR disabled |
| Dry-run listed exactly Batch 08 | PASS |

## Apply Result

- Command: `npx --yes supabase@2.109.1 db push --linked --yes`
- Exit result: success (`Finished supabase db push.`)
- Migration applied: `20260723120000_create_files_attachment_metadata.sql`
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
| `20260723120000` — Batch 08 | 1 | 1 |

Post-apply dry-run:

- Result: `Remote database is up to date.`
- Pending migrations: 0

## Structural Verification

Read-only verifier: `scripts/db/verify/verify_batch_08_files_attachment_metadata.sql`

| Check | Result |
| --- | --- |
| `final_status` | **PASS** |
| `table_mismatch_count` | 0 |
| `forbidden_grant_count` | 0 |
| `policy_count` | 0 |
| `storage_fk_count` | 0 |
| `document_category_required` / non-blank check | true |
| `accounting_category_required` / non-blank check | true |
| `checksum_conditionally_nullable` | true |
| `checksum_format_check` | true |
| `available_checksum_required_check` | true |
| `one_active_owner_link` | true |
| Version uniqueness (`attachment_version_histories_attachment_version_key`) | present |
| RLS enabled on all three tables | true |
| Row counts `attachments` / `links` / `versions` | 0 / 0 / 0 |
| `table_mismatches` | `[]` |

## Resulting Production Objects

Three empty `files` metadata tables with RLS enabled, no policies, no unexpected grants, and no seed rows:

- `files.attachments`
- `files.attachment_links`
- `files.attachment_version_histories`

## Non-Actions Confirmation

This apply session did not run `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, Storage bucket/policy creation, real upload/download, Batch 09 apply, deploy, or real SMS/OTP/WhatsApp.

## Follow-on

- PROD-DB-08 = **APPLIED / VERIFIED PASS**
- Batch 09 may begin as **source only**; production apply for Batch 09 remains closed until a separate explicit approval.
