# Marib Tax Project Execution State

**Inventory time:** 2026-07-21 (Asia/Riyadh) — PROD-DB-08 production apply + post-verify PASS

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline at apply: `origin/main` `5ce8c0648bec6629432460e10e5ca6e003b69ac5` (PR #68 merge).
- Apply worktree branch: `prod-db-08-apply-01`.

## Database

| Batch  | Source               | Production              |
| ------ | -------------------- | ----------------------- |
| 01A–08 | COMPLETE             | APPLIED / VERIFIED PASS |
| 09+    | NOT_STARTED (source only may begin) | NOT_STARTED |

## PROD-DB-08 apply checkpoint

- **Decision:** `PASS — BATCH_08_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE`.
- **Migration SHA-256:** `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`.
- **Verifier SHA-256:** `97ADD70F0E0F4A821FC77ACAA95A2272DBF06533E07BEAD995104EC08254DBCE`.
- **Linked project ref:** `sjmtiwzddztxfrncwkpx`.
- **Remote history:** Batches 01A–08 once each; no pending migrations.
- **Verifier:** `final_status=PASS`; empty tables; RLS enabled; no policies/forbidden grants/seeds; no Storage FKs; active-link uniqueness and version uniqueness present.
- **Post-apply dry-run:** `Remote database is up to date.`
- **Backup posture at preflight:** latest physical COMPLETED `2026-07-20T22:04:12.315Z`; WALG enabled; PITR disabled; no restore.
- **Production:** `PROD-DB-08 = APPLIED / VERIFIED PASS`.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`.
- **Follow-on:** Batch 09 may begin as **source only**; production apply for Batch 09 remains closed.
- **Forbidden now:** Batch 09 apply, Storage bucket/policy creation, real upload/download, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, deploy, real taxpayer data, real SMS/OTP/WhatsApp, reuse of this approval for any other migration.

## PROD-DB-08 preflight checkpoint (historical)

- **Decision:** `PASS — STALE_PARALLEL_TASK_RECONCILED` then `PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY`.
- **Merged PRs:** #61–#67 all MERGED; HEAD exact match to `origin/main` `3955c1f`, then preflight evidence merged as PR #68 / `5ce8c06`.
- **Evidence:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md`, `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPROVAL-PACKET.md`.

## Attachments Wave 02 merge checkpoint

- **Decision:** `PASS — ATTACHMENTS_WAVE_01_INTEGRATION_READY_FOR_ORDERED_MERGE`.
- **Merged PRs:** #61 `0415db6`, #63 `828b91f`, #65 `61c5111`, #64 `6ba0bb2`, #62 `01e7bf8`, #66 `c2e37bc`, #67 `3955c1f`.
- **Batch 08 source SHA:** `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`.
- **Production before PROD-DB-08 apply:** `REQUIRES_USER_APPROVAL` after preflight; Wave 02 merges did not authorize apply.

## Previous continuation checkpoint

- **Last completed before this apply:** PROD-DB-08 fresh production preflight PASS (PR #68 / `5ce8c06`).
- **Prior production apply:** PROD-DB-07 controlled apply + post-verify PASS.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Source SHA:** `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`; intermediate SHA `BDEDBD04...` and Wave 01 SHA `C5BC82D...` are superseded.

## Wave 02 Track A checkpoint

- PR #61 is corrected in place: required non-blank `document_category_code` is separate from server-owned `storage_accounting_category_code`.
- Checksum remains nullable only during incomplete upload; an executable database check and application-policy boundary require a valid observed SHA-256 before becoming `available`.
- Migration/verifier static scope remains exactly three tables, three RLS enablements, no policies, no positive grants, and no data writes.
- Duplicate active links are prevented without blocking retained historical unlink/relink cycles.
