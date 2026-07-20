# Marib Tax Project Execution State

**Inventory time:** 2026-07-21 (Asia/Riyadh) — PROD-DB-08 production preflight complete

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline at preflight: `origin/main` `3955c1f10f534a367209f73b7466afe9d72bdda5` (PR #67 merge).
- Autopilot worktree: `C:\projects\Marib_Tax-prod-db-08-preflight-01`.

## Database

| Batch  | Source               | Production                              |
| ------ | -------------------- | --------------------------------------- |
| 01A–07 | COMPLETE             | APPLIED / VERIFIED PASS                 |
| 08     | MERGED / NOT APPLIED | REQUIRES_USER_APPROVAL (preflight PASS) |
| 09+    | BLOCKED              | NOT_STARTED                             |

## PROD-DB-08 preflight checkpoint

- **Decision:** `PASS — STALE_PARALLEL_TASK_RECONCILED` then `PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY`.
- **Merged PRs:** #61–#67 all MERGED; HEAD exact match to `origin/main` `3955c1f`.
- **Batch 08 source:** `MERGED / NOT APPLIED`.
- **Migration SHA-256:** `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`.
- **Verifier SHA-256:** `97ADD70F0E0F4A821FC77ACAA95A2272DBF06533E07BEAD995104EC08254DBCE`.
- **Superseded SHAs:** `BDEDBD04…`, `C5BC82D…` — not candidates.
- **Linked project ref:** `sjmtiwzddztxfrncwkpx`.
- **Remote history:** Batches 01A–07 once each; Batch 08 remote absent.
- **Remote structure:** three Batch 08 tables absent; no partial indexes/constraints.
- **Backup posture:** latest physical COMPLETED `2026-07-20T22:04:12.315Z`; WALG enabled; PITR disabled; no restore.
- **Dry-run:** listed exactly `20260723120000_create_files_attachment_metadata.sql`.
- **Production:** `PROD-DB-08 = REQUIRES_USER_APPROVAL`; apply not authorized by this preflight.
- **Evidence:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md`, `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPROVAL-PACKET.md`.
- **Forbidden now:** real `db push`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, Storage bucket/policy creation, real upload/download, seed/backfill, Batch 09, deploy, real taxpayer data, real SMS/OTP/WhatsApp, reuse of old approvals, automatic repair of partial production state.

## Attachments Wave 02 merge checkpoint

- **Decision:** `PASS — ATTACHMENTS_WAVE_01_INTEGRATION_READY_FOR_ORDERED_MERGE`.
- **Merged PRs:** #61 `0415db6`, #63 `828b91f`, #65 `61c5111`, #64 `6ba0bb2`, #62 `01e7bf8`, #66 `c2e37bc`, #67 `3955c1f`.
- **Current `origin/main` before this preflight:** `3955c1f10f534a367209f73b7466afe9d72bdda5`.
- **Batch 08 source:** `MERGED / NOT APPLIED`.
- **Migration SHA-256:** `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`.
- **Production before this preflight:** `PROD-DB-08 = CLOSED`; Wave 02 merges did not authorize preflight/apply.

## Previous continuation checkpoint

- **Last completed before this preflight:** PROD-DB-07 controlled apply + post-verify PASS.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Completed:** Batch 08 files metadata migration/verifier/report merged through PR #61.
- **Source SHA:** `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`; intermediate SHA `BDEDBD04...` and Wave 01 SHA `C5BC82D...` are superseded.
- **Local gates:** static SQL PASS; OpenAPI PASS; typecheck PASS; 88 tests PASS using workspace concurrency 1; builds PASS. Format PASS. Web ESLint process crashed without diagnostics and remains for CI confirmation.

## Wave 02 Track A checkpoint

- PR #61 is corrected in place: required non-blank `document_category_code` is separate from server-owned `storage_accounting_category_code`.
- Checksum remains nullable only during incomplete upload; an executable database check and application-policy boundary require a valid observed SHA-256 before becoming `available`.
- Migration/verifier static scope remains exactly three tables, three RLS enablements, no policies, no positive grants, and no data writes.
- Duplicate active links are prevented without blocking retained historical unlink/relink cycles.
