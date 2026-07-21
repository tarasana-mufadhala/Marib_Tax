# MARIB Tax DB Foundation — Batch 10 Dues and Manual Payment Evidence Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_10_SOURCE = READY_FOR_REVIEW / NOT APPLIED`
- `PROD-DB-10 = CLOSED`

## Artifacts

- Migration: `supabase/migrations/20260725120000_create_dues_payment_evidence_family.sql`
- Migration SHA-256: `F19835DA998891736F45073D9300DD1C565D26A5FA052E0ED4998E4B60391DF6`
- Read-only verifier: `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql`
- Verifier SHA-256: `6D310C91DC1F128E983D44A36E3F7BB7974D23F119DBD64B3427A7DB704A56B1`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-10-DUES-PAYMENTS-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_10_DUES_PAYMENTS_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main` `5d267c3f28f011f2463f246f9b419cf74ac52e57`

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
- Receipts have no `payment_due_id` and no `due_receipt_links` (REL-069 NestJS allocation); ADR-015 1 due : N receipts is not encoded as 1:1.
- Receipt replacements append-only with mandatory reason + staff; confirmations reference receipts and do not approve the parent request/balagh.
- RLS enabled on all seven tables; no policies; positive grants revoked; no seed/backfill; no Storage mutation; no notification send.

## Deferred open decisions

- REL-069 physical Due–Receipt join shape
- Overpayment reject / allow / flag rules (NestJS application validation only; no SQL auto-close / overpay CHECK)
- CK-T02 vs exact-one parent (DM-09)
- OD-15 receipt correction authority
- DM-09 status/outcome catalogues and rounding ownership
- PHY-35 formal money-type acceptance

## Gateway / cases scan classification (source artifacts)

Prior scan reported `gateway/cases: 14` against migration + verifier text. Re-inspected every hit after LF normalization.

Inspected files:

- `supabase/migrations/20260725120000_create_dues_payment_evidence_family.sql`
- `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql`

| # | Location | Text class | Classification |
| --- | --- | --- | --- |
| 1 | migration L6 | comment forbids `cases` / gateway / provider / settlement | Allowed (negative documentation) |
| 2 | migration L54 `COMMENT ON TABLE payment_dues` | comment forbids gateway columns / `cases` | Allowed (negative documentation) |
| 3 | migration L176 `COMMENT ON TABLE payment_receipts` | comment forbids `payment_due_id` / gateway columns | Allowed (negative documentation) |
| 4–5 | verifier `cases_relation` CTE | absence check for relation named `cases` | Allowed (negative verifier) |
| 6–10 | verifier `gateway_columns` CTE | absence scan for `%gateway%` / `%provider%` / `%settlement%` / `%checkout%` column names | Allowed (negative verifier) |
| 11–15 | verifier select / PASS predicate / join | expose `gateway_column_count=0` and `cases_relation_absent` | Allowed (negative verifier) |

Additional legitimate parent FKs named `payment_due_id` exist on basis/corrections/notices children only — not on `payment_receipts`, and not a generic `case_id`.

Required semantic result:

- forbidden gateway columns (`gateway_provider`, `gateway_transaction_id`, `checkout_url`, `settlement_id`, `payment_processor`, etc.) = **0**
- generic `cases` table / `case_id` FK / `REFERENCES …cases` = **0**

## Structural review (source)

- Schema: `dues`
- Exactly seven `CREATE TABLE` + seven `ENABLE ROW LEVEL SECURITY`
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0
- Money: `numeric(18,2)` (7 occurrences); no float column types (only a “no float money” comment)
- Currency: non-blank CHECKs on due/correction/notice/receipt currency columns
- Due↔receipt: no `payment_due_id` on receipts; no `UNIQUE(payment_due_id)`; no `due_receipt_links` → one due may associate with many receipts in NestJS (ADR-015) without 1:1 encoding
- Corrections / replacements: append-only with mandatory reason + staff; originals retained; FKs `ON DELETE RESTRICT`
- Confirmations: FK to receipt + required confirmer; comments/IR-65: confirmation ≠ request/balagh final approval; NestJS enforces acceptable receipt state
- Attachments: basis optional FK → `files.attachments` only; no Storage path/URL columns; notice delivery not implemented
- Overpayment: not encoded in SQL

## Windows-native validation

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm format:check` | PASS |
| `git diff --check` | PASS |
| `pnpm validate:openapi` | PASS |
| `pnpm --filter @marib-tax/contracts build` | PASS |
| `pnpm --filter @marib-tax/api typecheck` | PASS |
| `pnpm --filter @marib-tax/api test` | PASS (77) |
| `pnpm --filter @marib-tax/api build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm --filter @marib-tax/web test` | PASS (9) |
| `pnpm --filter @marib-tax/worker test` | PASS (5) |
| `pnpm --filter @marib-tax/contracts test` | PASS (37) |
| `pnpm build` | PASS |
| `pnpm lint` | PASS |
| SQL static boundary (7 tables / 7 RLS / 0 policy/grant/seed; hashes match) | PASS |
| PowerShell foundation subset (mandatory files + workspace/private constraints) | PASS |
| `bash scripts/validate-foundation.sh` | Deferred to GitHub Ubuntu CI (no local `/bin/bash`) |

Final hashes after LF normalization (`.gitattributes eol=lf`):

- Migration SHA-256: `F19835DA998891736F45073D9300DD1C565D26A5FA052E0ED4998E4B60391DF6`
- Verifier SHA-256: `6D310C91DC1F128E983D44A36E3F7BB7974D23F119DBD64B3427A7DB704A56B1`

Source decision remains: **PASS — BATCH_10_DUES_PAYMENTS_DESIGN_APPROVED_FOR_SOURCE**

## Non-actions

This source report authorizes no production preflight, dry-run, `db push`, Storage operation, deploy, real data, notifications, or Batch 11 work.
