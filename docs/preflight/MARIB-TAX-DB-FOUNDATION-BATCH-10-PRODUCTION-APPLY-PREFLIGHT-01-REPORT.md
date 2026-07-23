# MARIB-TAX-DB-FOUNDATION-BATCH-10 — Production Apply Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-10-PRODUCTION-APPLY-PREFLIGHT-01 |
| Repository | `tarasana-mufadhala/Marib_Tax` |
| Base main HEAD | `540403b71c33ce4d641d35eed205689e800b90c7` |
| Target project ref | `sjmtiwzddztxfrncwkpx` |
| Supabase CLI | `2.109.1` |
| Migration version | `20260725120000` |
| Migration file | `supabase/migrations/20260725120000_create_dues_payment_evidence_family.sql` |
| Migration SHA-256 | `C0B5AD447F810D6DCC8E931440F222E3ABE832E1E141E1E6FECAF17ADA5D1B42` |
| Verifier | `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql` |
| Verifier SHA-256 | `9EB3D1B27A6AC3D2486D9F1EF083D1534089F5DFE1ECCFC0050D563B3C4CE182` |
| Design acceptance | `PASS — BATCH_10_DUES_PAYMENTS_DESIGN_APPROVED_FOR_SOURCE` |
| Source PR | `#73` MERGED |
| Mode | Production preflight only; no migration apply |
| Decision | **PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY** |

## 0. Baseline and source integrity (G0)

- `git fetch origin` completed; working tree clean.
- `HEAD` matched `origin/main` exactly: `540403b71c33ce4d641d35eed205689e800b90c7`.
- PR #73 is `MERGED` (merge commit `540403b`).
- Migration SHA-256 matched `C0B5AD447F810D6DCC8E931440F222E3ABE832E1E141E1E6FECAF17ADA5D1B42`.
- Verifier SHA-256 matched `9EB3D1B27A6AC3D2486D9F1EF083D1534089F5DFE1ECCFC0050D563B3C4CE182`.
- Source creates exactly seven tables: `dues.payment_dues`, `dues.due_basis_document_references`, `dues.due_corrections`, `dues.payment_notices`, `dues.payment_receipts`, `dues.receipt_correction_replacements`, `dues.payment_confirmations`.
- Application-supplied UUIDs; explicit PK/FK; `ON DELETE RESTRICT` / `ON UPDATE NO ACTION`; monetary columns `numeric(18,2)` only (no float money); non-blank currency/status/reason checks; no payment gateway/provider/settlement/checkout columns; no generic `cases` table or `case_id`; no Storage paths/URLs/buckets/policies/bytes; no notification delivery implementation; RLS enabled on all seven; no `CREATE POLICY`; no positive client grants (`REVOKE ALL` from `PUBLIC`/`anon`/`authenticated`/`service_role`); no seed/backfill; no hard-delete or purge path.
- REL-069 CLOSED structure confirmed in source: `payment_receipts.payment_due_id uuid NOT NULL`; FK `payment_receipts_payment_due_fkey` → `dues.payment_dues(id)`; `payment_due_id` is not UNIQUE; no `dues.due_receipt_links`; one due may have multiple receipts; one receipt belongs to exactly one due; partial payment structurally possible through multiple receipts.
- Confirmation remains receipt-level evidence and does not approve or complete a service request or balagh.
- Open decisions remain unencoded: overpayment handling; CK-T02 not-both versus exact-one parent; OD-15 correction authority; DM-09 status/outcome catalogues; PHY-35 formal money-type acceptance.

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
| `20260724120000` — Batch 09 | 1 | 1 |
| `20260725120000` — Batch 10 | 1 | 0 |

- Batches 01A–09 exist exactly once locally and remotely.
- Batch 10 is absent remotely.
- No later migration is pending.
- No duplicate migration version.
- No local/remote migration-history mismatch.

## 2. Remote structural absence (G2)

Seven Batch 10 tables absent:

`payment_dues=0|due_basis_document_references=0|due_corrections=0|payment_notices=0|payment_receipts=0|receipt_correction_replacements=0|payment_confirmations=0`

Partial Batch 10 objects absent:

`tables=0|indexes=0|constraints=0|foreign_keys=0|policies=0|grants=0|triggers=0|functions=0|sequences=0`

Specifically absent remotely: `payment_receipts_payment_due_fkey`, `payment_receipts_payment_due_received_at_idx`, `dues.due_receipt_links`.

`cases_any=false`. Schema `dues` remains present from prior foundation batches (`dues_schema=true`), which is expected and not a Batch 10 object.

Approved read-only mechanism used: Supabase CLI `db query --linked`. No direct `psql` and no dashboard SQL.

## 3. Backup and recovery posture (G3)

- Latest visible managed physical backup: `2026-07-21T22:03:36.134Z` — status `COMPLETED`.
- WALG enabled: yes.
- PITR enabled: no.
- Restore was not executed.
- No backup was created.
- No backup contents or credentials were copied into this report.

## 4. Dry-run (G4)

`npx --yes supabase@2.109.1 db push --linked --dry-run` completed successfully.

Exactly one migration listed:

`20260725120000_create_dues_payment_evidence_family.sql`

Confirmation: only Batch 10 is pending.

## 5. Open decisions intentionally not encoded

- Overpayment handling
- CK-T02 not-both versus exact-one parent
- OD-15 correction authority
- DM-09 status/outcome catalogues
- PHY-35 formal money-type acceptance

No open decision was silently finalized in source or this preflight.

## 6. Non-actions confirmation

This preflight did not apply any migration, run `db push` without `--dry-run`, seed data, repair, reset, create Storage buckets/policies, upload/download objects, integrate a payment gateway, deploy, publish, start Batch 11, use real taxpayer or receipt data, send SMS/OTP/WhatsApp, or reuse an older production approval.

**Explicit confirmation: no production write occurred.**

## 7. Decision

**PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY**

Final production state after this preflight:

- `PROD-DB-10 = REQUIRES_USER_APPROVAL`
- `BATCH_10_SOURCE = MERGED / NOT APPLIED`

A separate explicit authorization is required before applying Batch 10 to production. This preflight must not be reused as apply approval.
