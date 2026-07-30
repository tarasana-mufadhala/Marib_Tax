# Marib Tax Project Execution State

**Inventory time:** 2026-07-22 (Asia/Riyadh) — PROD-DB-10 production preflight complete

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline at preflight: `origin/main` `540403b71c33ce4d641d35eed205689e800b90c7` (PR #73 merge).
- Autopilot worktree: `C:\projects\Marib_Tax-prod-db-10-preflight-01`.
- Preflight branch: `prod-db-10-preflight-01`.

## Database

| Batch  | Source               | Production                              |
| ------ | -------------------- | --------------------------------------- |
| 01A–09 | COMPLETE             | APPLIED / VERIFIED PASS                 |
| 10     | MERGED / NOT APPLIED | REQUIRES_USER_APPROVAL (preflight PASS) |
| 11     | AUTHORED / NOT MERGED / NOT APPLIED | NOT_STARTED                |
| 12+    | NOT_STARTED          | NOT_STARTED                             |

## Batch 11 source checkpoint (2026-07-29)

- **Design gate:** `PASS — BATCH_11_NOTIFICATION_DELIVERY_DESIGN_APPROVED_FOR_SOURCE`
- **Evidence:** `docs/reviews/MARIB-TAX-BATCH-11-NOTIFICATION-DELIVERY-DESIGN-DECISION-GATE-01.md`
- **Migration:** `supabase/migrations/20260726120000_create_notify_notification_delivery.sql` (TABLE-066…072, schema `notify`, 7 tables)
- **Migration SHA-256:** `1925A56DA66BC523605B780E4FCE52A7DB92A07822169FC99739AB9F8DDD5DC0`
- **Verifier:** `scripts/db/verify/verify_batch_11_notification_delivery.sql`
- **Verifier SHA-256:** `E4F03541B3EB25040B26BB2EBD248392CAFC8E3FC3865611D2663120BA6EA0C4`
- **Source report:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-11-NOTIFICATION-DELIVERY-REPORT.md`
- **Foundation validation:** `scripts/validate-foundation.sh` PASS (89/0)
- **Naming:** physical catalog names binding (same precedent as Batches 08–10); `device_tokens`/`notification_preferences` excluded pending Change Request
- **Forbidden now:** any apply, merge without PR/CI, seeds, Storage, real SMS/push, starting Batch 12 before Batch 11 closure.

## PROD-DB-10 preflight checkpoint

- **Design gate:** `PASS — BATCH_10_DUES_PAYMENTS_DESIGN_APPROVED_FOR_SOURCE`
- **Evidence:** `docs/reviews/MARIB-TAX-BATCH-10-DUES-PAYMENTS-DESIGN-DECISION-GATE-01.md`
- **Migration:** `supabase/migrations/20260725120000_create_dues_payment_evidence_family.sql`
- **Migration SHA-256:** `C0B5AD447F810D6DCC8E931440F222E3ABE832E1E141E1E6FECAF17ADA5D1B42`
- **Verifier:** `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql`
- **Verifier SHA-256:** `9EB3D1B27A6AC3D2486D9F1EF083D1534089F5DFE1ECCFC0050D563B3C4CE182`
- **Source report:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-10-DUES-PAYMENTS-REPORT.md`
- **Preflight report:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-10-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md`
- **Approval packet:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-10-PRODUCTION-APPROVAL-PACKET.md`
- **Production:** `PROD-DB-10 = REQUIRES_USER_APPROVAL`
- **Source state:** `BATCH_10_SOURCE = MERGED / NOT APPLIED`
- **REL-069:** CLOSED — direct mandatory non-unique `payment_receipts.payment_due_id` FK (1 due : N receipts); no `due_receipt_links`
- **Deferred open:** overpayment rules; CK-T02 vs exact-one; OD-15; DM-09 catalogues; PHY-35 formal acceptance
- **Preflight result:** PASS_WITH_NOTES — dry-run listed only Batch 10; no production write
- **Forbidden now:** `db push` without `--dry-run`, `db push --linked --yes`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, Storage operations, real data, notifications, deploy, Batch 11, reuse of this preflight as apply approval.

## Previous continuation checkpoint

- **Last production apply:** PROD-DB-09 controlled apply + post-verify PASS.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
