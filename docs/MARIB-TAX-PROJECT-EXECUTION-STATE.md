# Marib Tax Project Execution State

**Inventory time:** 2026-07-21 (Asia/Riyadh) — Batch 10 dues/payments design gate PASS + source authored

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline: `origin/main` `5d267c3f28f011f2463f246f9b419cf74ac52e57` (PR #72 merge).
- Source branch: `batch-10-dues-payments-source-01`.

## Database

| Batch  | Source                          | Production              |
| ------ | ------------------------------- | ----------------------- |
| 01A–09 | COMPLETE                        | APPLIED / VERIFIED PASS |
| 10     | READY_FOR_REVIEW / NOT APPLIED | CLOSED (`PROD-DB-10`)   |
| 11+    | NOT_STARTED                    | NOT_STARTED             |

## Batch 10 source checkpoint

- **Design gate:** `PASS — BATCH_10_DUES_PAYMENTS_DESIGN_APPROVED_FOR_SOURCE`
- **Evidence:** `docs/reviews/MARIB-TAX-BATCH-10-DUES-PAYMENTS-DESIGN-DECISION-GATE-01.md`
- **Migration:** `supabase/migrations/20260725120000_create_dues_payment_evidence_family.sql`
- **Migration SHA-256:** `C0B5AD447F810D6DCC8E931440F222E3ABE832E1E141E1E6FECAF17ADA5D1B42`
- **Verifier:** `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql`
- **Verifier SHA-256:** `9EB3D1B27A6AC3D2486D9F1EF083D1534089F5DFE1ECCFC0050D563B3C4CE182`
- **Source report:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-10-DUES-PAYMENTS-REPORT.md`
- **Production:** `PROD-DB-10 = CLOSED`
- **REL-069:** CLOSED — direct mandatory non-unique `payment_receipts.payment_due_id` FK (1 due : N receipts); no `due_receipt_links`
- **Deferred open:** overpayment rules; CK-T02 vs exact-one; OD-15; DM-09 catalogues; PHY-35 formal acceptance
- **Forbidden now:** production preflight, `db push --linked --dry-run`, `db push --linked --yes`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, Storage operations, real data, notifications, deploy, Batch 11.

## Previous continuation checkpoint

- **Last production apply:** PROD-DB-09 controlled apply + post-verify PASS (PR #72 / `5d267c3`).
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
