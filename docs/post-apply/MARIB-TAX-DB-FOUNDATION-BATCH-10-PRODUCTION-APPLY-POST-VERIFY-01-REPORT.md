# MARIB-TAX-DB-FOUNDATION-BATCH-10-PRODUCTION-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_10_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE

## Scope

- Environment: Linked project `sjmtiwzddztxfrncwkpx` (Production/Staging target per lead directive)
- Repository: `tarasana-mufadhala/Marib_Tax`
- HEAD at apply: `8542225` (`feat(api): implement operational modules ...`, post PR #75)
- Verification report created: `2026-07-31`
- Supabase CLI: `2.109.1`
- Batch 11/12+ work during apply phase: None (local files held aside; see note below)
- Storage bucket/policy/upload/download during apply phase: None

## Applied Migration

- Version: `20260725120000`
- File: `supabase/migrations/20260725120000_create_dues_payment_evidence_family.sql`
- SHA-256: `C0B5AD447F810D6DCC8E931440F222E3ABE832E1E141E1E6FECAF17ADA5D1B42`
- Verifier: `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql`
- Verifier SHA-256: `9EB3D1B27A6AC3D2486D9F1EF083D1534089F5DFE1ECCFC0050D563B3C4CE182`
- Applied migrations in the controlled session: 1
- Seed executed: No
- Backfill executed: No
- Repair executed: No
- Reset executed: No
- Rollback executed: No
- `--include-all`: Not used
- Dashboard SQL / direct `psql`: Not used
- Verifier execution path: `npx --yes supabase@2.109.1 db query --linked --file ...` (approved linked mechanism; no direct `psql`)

## Single-Apply Isolation Note

Local working tree also contained later, not-yet-approved migration files (Batch 11 `20260726120000` and uncommitted Batch 12/13/14 sources). Because `db push` applies all pending migrations, those files were temporarily moved out of `supabase/migrations/` before the dry-run/apply and restored afterwards, guaranteeing exactly one authorized migration per apply. No file content was modified; Batch 10 SHA-256 was re-verified before apply.

## Pre-Apply Gates

| Gate | Result |
| --- | --- |
| Migration SHA-256 exact match | PASS — `C0B5AD447F810D6DCC8E931440F222E3ABE832E1E141E1E6FECAF17ADA5D1B42` (matches approval packet) |
| Verifier SHA-256 exact match | PASS — `9EB3D1B27A6AC3D2486D9F1EF083D1534089F5DFE1ECCFC0050D563B3C4CE182` |
| Linked project ref `sjmtiwzddztxfrncwkpx` | PASS |
| Remote history: 01A–09 once each; Batch 10 absent | PASS — latest remote version was `20260724120000` |
| Pre-apply dry-run listed exactly Batch 10 | PASS |
| Preflight evidence | PASS — `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-10-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md` (PASS_WITH_NOTES) + approval packet |

## Apply Result

- Command: `npx --yes supabase@2.109.1 db push --linked`
- Exit result: success; remote history gained exactly `20260725120000`
- Migration applied: `20260725120000_create_dues_payment_evidence_family.sql`
- Additional migrations: none
- This was the only production write authorized for Batch 10.

## Migration-History Verification (post-apply)

| Migration | Remote |
| --- | ---: |
| `20260715175300` — Batch 01A | 1 |
| `20260716190000` — Batch 02 | 1 |
| `20260717120000` — Batch 03 | 1 |
| `20260719120000` — Batch 04 | 1 |
| `20260720120000` — Batch 05 | 1 |
| `20260721120000` — Batch 06 | 1 |
| `20260722120000` — Batch 07 | 1 |
| `20260723120000` — Batch 08 | 1 |
| `20260724120000` — Batch 09 | 1 |
| `20260725120000` — Batch 10 | 1 |

## Structural Verification

Read-only verifier: `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql`

| Check | Result |
| --- | --- |
| `final_status` | **PASS** |
| `table_mismatch_count` | 0 |
| `forbidden_grant_count` | 0 |
| `policy_count` | 0 |
| `storage_fk_count` | 0 |
| `gateway_column_count` | 0 |
| `cases_relation_absent` | true |
| `due_receipt_links_absent` | true |
| `receipt_due_id_required` / `receipt_due_fk_restrict` | true / true |
| `receipt_due_history_index` / `receipt_due_id_not_unique` | true / true |
| `case_xor_check` (request_id XOR balagh_id parent) | true |
| `due_amount_non_negative` / `due_amount_numeric` | true / true |
| `correction_reason_check` / `replacement_reason_check` | true / true |
| `receipt_self_lineage_fk` / `confirmation_receipt_fk` / `basis_attachment_fk` | true / true / true |
| Staff/actor required checks (correction, replacement, confirmation) | true |
| Prereq schemas/tables present (service_requests, balaghs, staff/user profiles, attachments, dues schema) | true |
| Row counts all seven tables | 0 |
| `table_mismatches` | `[]` |

## Resulting Production Objects

Seven empty `dues` payment-evidence tables with RLS enabled, no policies, no unexpected grants, no seed rows:

- `dues.payment_dues`
- `dues.due_basis_document_references`
- `dues.due_corrections`
- `dues.payment_notices`
- `dues.payment_receipts`
- `dues.receipt_correction_replacements`
- `dues.payment_confirmations`

## Production impact

Batch 10 metadata/structure only: seven empty dues payment-evidence tables with default-deny RLS. No Storage mutation, no seed/backfill, no payment gateway, no deploy, no real taxpayer data, no SMS/OTP/WhatsApp.

## Non-Actions Confirmation

This apply session did not run `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, Storage bucket/policy creation, real upload/download, deploy, or real SMS/OTP/WhatsApp. Approval for this apply was the lead directive issued 2026-07-31 authorizing Batch 10 push + verifier; no earlier approval was reused.

## Follow-on

- PROD-DB-10 = **APPLIED / VERIFIED PASS** (K0 closed: `BATCH_10 = APPLIED / VERIFIED PASS`)
- Batch 11 apply executed under the same directive; see `MARIB-TAX-DB-FOUNDATION-BATCH-11-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`.
