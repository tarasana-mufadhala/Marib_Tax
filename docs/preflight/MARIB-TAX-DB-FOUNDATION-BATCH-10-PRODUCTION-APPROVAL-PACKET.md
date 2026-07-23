# MARIB-TAX-DB-FOUNDATION-BATCH-10 — Production Approval Packet

**Status:** `REQUIRES_USER_APPROVAL` — preflight complete; apply remains closed. This packet does not authorize Batch 10 apply, Batch 11, Storage operations, payment gateway integration, notifications, or any other migration.

## Reviewed artifact

| Field | Value |
| --- | --- |
| Project ref | `sjmtiwzddztxfrncwkpx` |
| Migration | `supabase/migrations/20260725120000_create_dues_payment_evidence_family.sql` |
| SHA-256 | `C0B5AD447F810D6DCC8E931440F222E3ABE832E1E141E1E6FECAF17ADA5D1B42` |
| Verifier | `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql` |
| Verifier SHA-256 | `9EB3D1B27A6AC3D2486D9F1EF083D1534089F5DFE1ECCFC0050D563B3C4CE182` |
| Runner | Supabase CLI `2.109.1` |
| Expected change | Seven empty `dues` payment-evidence tables; RLS enabled; REL-069 direct 1:N due–receipt FK (`payment_due_id` NOT NULL, not UNIQUE); RESTRICT FKs; numeric(18,2) money; no policies/grants/seeds; no gateway/Storage/notification implementation |
| Design acceptance | PASS — `docs/reviews/MARIB-TAX-BATCH-10-DUES-PAYMENTS-DESIGN-DECISION-GATE-01.md` |
| Preflight evidence | `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-10-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md` |
| Source state | `BATCH_10_SOURCE = MERGED / NOT APPLIED` |
| Baseline | `540403b71c33ce4d641d35eed205689e800b90c7` (PR #73) |

## Approval requested

Approval must explicitly authorize one controlled production application of Batch 10 against project `sjmtiwzddztxfrncwkpx`. Approval of documentation, design acceptance, Batch 10 source merge (PR #73), Batches 01A–09, or this preflight packet does **not** by itself authorize apply. Prior approvals must not be reused.

## Mandatory preflight (completed for this packet)

1. Clean checkout based on reviewed `origin/main` `540403b71c33ce4d641d35eed205689e800b90c7`.
2. PR #73 MERGED; `HEAD` equals `origin/main` exactly.
3. Recompute migration SHA-256; require the exact value above.
4. Recompute verifier SHA-256; require the exact value above.
5. Confirm linked project ref is exactly `sjmtiwzddztxfrncwkpx`.
6. Confirm remote history contains Batches 01A–09 exactly once each and does not contain Batch 10.
7. Confirm the seven Batch 10 tables do not exist.
8. Confirm no partial Batch 10 indexes/constraints/FKs/policies/grants/triggers/functions/sequences exist, including absence of `payment_receipts_payment_due_fkey`, `payment_receipts_payment_due_received_at_idx`, and `dues.due_receipt_links`.
9. Confirm managed backup/recovery posture (latest physical COMPLETED; WALG enabled; PITR disabled; no restore).
10. Confirm REL-069 CLOSED model in source: mandatory non-unique `payment_receipts.payment_due_id`; confirmation remains receipt-level.
11. Confirm open decisions remain open: overpayment handling; CK-T02 not-both vs exact-one; OD-15; DM-09 catalogues; PHY-35.
12. Run only:

```text
npx --yes supabase@2.109.1 db push --linked --dry-run
```

13. Stop unless the dry-run lists exactly `20260725120000_create_dues_payment_evidence_family.sql`.

## Exact apply command — closed until approval

```text
npx --yes supabase@2.109.1 db push --linked
```

Do not add `--include-all`. Do not retry blindly. Do not use `migration repair`, `db reset --linked`, dashboard SQL, or direct `psql`. Do not create Storage buckets/policies, perform real upload/download, integrate a payment gateway, or send notifications as part of Batch 10 apply.

## Required post-verification

1. Remote history contains Batch 10 exactly once.
2. Execute `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql`.
3. Require `final_status = PASS`, empty tables, RLS enabled, no unexpected policies/grants/seed, REL-069 FK present and non-unique, no `due_receipt_links`, no `cases`, no gateway/Storage objects.
4. Dry-run reports no pending migrations.
5. Record post-apply report before Batch 11 or any Storage/notification work begins.

## Stop conditions

SHA mismatch, wrong project, unexpected history, more than one pending migration, pre-existing Batch 10 objects, apply/partial failure, verifier mismatch, silent finalization of open decisions, Storage/bucket/gateway mutation, or production uncertainty.
