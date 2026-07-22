# MARIB Tax DB Foundation — Batch 10 Dues and Manual Payment Evidence Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_10_SOURCE = READY_FOR_REVIEW / NOT APPLIED`
- `PROD-DB-10 = CLOSED`

## Artifacts

- Migration: `supabase/migrations/20260725120000_create_dues_payment_evidence_family.sql`
- Migration SHA-256: `C0B5AD447F810D6DCC8E931440F222E3ABE832E1E141E1E6FECAF17ADA5D1B42`
- Read-only verifier: `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql`
- Verifier SHA-256: `9EB3D1B27A6AC3D2486D9F1EF083D1534089F5DFE1ECCFC0050D563B3C4CE182`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-10-DUES-PAYMENTS-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_10_DUES_PAYMENTS_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main` `5d267c3f28f011f2463f246f9b419cf74ac52e57`

Superseded candidate hashes (not current):

- Migration `F19835DA998891736F45073D9300DD1C565D26A5FA052E0ED4998E4B60391DF6`
- Verifier `6D310C91DC1F128E983D44A36E3F7BB7974D23F119DBD64B3427A7DB704A56B1`

## Scope and boundaries

The source defines TABLE-056…062 only in schema `dues`:

1. `payment_dues`
2. `due_basis_document_references`
3. `due_corrections`
4. `payment_notices`
5. `payment_receipts`
6. `receipt_correction_replacements`
7. `payment_confirmations`

- Manual assessment only; `numeric(18,2)` money + non-blank currency; no float; no gateway/provider/settlement columns.
- Parent context via nullable request/balagh FKs with CK-T02 (not both); no `cases` table.
- Basis references may link Batch 08 `files.attachments`; no Postgres bytes.
- Additive due corrections with prior/new amounts, mandatory reason, and correcting staff.
- Notices are metadata only; delivery remains Batch 11.
- **REL-069 CLOSED:** `payment_receipts.payment_due_id uuid NOT NULL` FK → `dues.payment_dues(id)` (`ON DELETE RESTRICT`); index `(payment_due_id, received_at DESC)`; **not UNIQUE**; no `due_receipt_links`.
- Cardinality: `payment_dues` 1 —— N `payment_receipts`; partial payment = multiple receipts under the same due; a receipt cannot cover multiple dues.
- Receipt replacements append-only with mandatory reason + staff; confirmations reference receipts and do not approve the parent request/balagh.
- RLS enabled on all seven tables; no policies; positive grants revoked; no seed/backfill; no Storage mutation; no notification send.

## Closed decision — REL-069

Approved governance model recorded in source:

1. Every payment receipt belongs to exactly one payment due.
2. Every payment due may have many payment receipts.
3. Partial payment is represented by multiple receipts for the same due.
4. A receipt cannot be allocated to multiple dues.
5. No `due_receipt_links` allocation table.
6. `payment_due_id` must not be UNIQUE.
7. Payment confirmation remains receipt-level evidence and does not approve or complete the parent request or balagh.

## Deferred open decisions

- Overpayment reject / allow / flag rules (NestJS application validation only; no SQL auto-close / overpay CHECK)
- CK-T02 vs exact-one parent (DM-09)
- OD-15 receipt correction authority
- DM-09 status/outcome catalogues and rounding ownership
- PHY-35 formal money-type acceptance

## Structural review (source)

- Schema: `dues`
- Exactly seven `CREATE TABLE` + seven `ENABLE ROW LEVEL SECURITY`
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0
- Money: `numeric(18,2)`; no float column types
- Currency: non-blank CHECKs on due/correction/notice/receipt currency columns
- Due↔receipt: mandatory non-unique `payment_due_id` FK + history index; `due_receipt_links` absent
- Corrections / replacements: append-only with mandatory reason + staff; originals retained; FKs `ON DELETE RESTRICT`
- Confirmations: FK to receipt + required confirmer; confirmation ≠ request/balagh final approval
- Attachments: basis optional FK → `files.attachments` only; no Storage path/URL columns
- Overpayment: not encoded in SQL

## Non-actions

This source report authorizes no production preflight, dry-run, `db push`, Storage operation, deploy, real data, notifications, or Batch 11 work.
