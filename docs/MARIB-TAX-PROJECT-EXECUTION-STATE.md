# Marib Tax Project Execution State

**Inventory time:** 2026-07-20 (Asia/Riyadh) — Attachments Wave 02 merged

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline at apply: `origin/main` `8d62af2` (PR #59 merge).
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.

## Database

| Batch  | Source               | Production                 |
| ------ | -------------------- | -------------------------- |
| 01A–07 | COMPLETE             | APPLIED / VERIFIED PASS    |
| 08     | MERGED — source only | NOT_STARTED — apply closed |
| 09+    | BLOCKED              | NOT_STARTED                |

## Attachments Wave 02 merge checkpoint

- **Decision:** `PASS — ATTACHMENTS_WAVE_01_INTEGRATION_READY_FOR_ORDERED_MERGE`.
- **Merged PRs:** #61 `0415db6`, #63 `828b91f`, #65 `61c5111`, #64 `6ba0bb2`, #62 `01e7bf8`, #66 `c2e37bc`.
- **Current `origin/main`:** `c2e37bc15867299bc1c53a6e47e8cff991b653b7` before this checkpoint record.
- **Batch 08 source:** `MERGED / NOT APPLIED`.
- **Migration SHA-256:** `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`.
- **Production:** `PROD-DB-08 = CLOSED`; no preflight, dry-run, SQL, Storage, deploy, real file, or real-data operation occurred.
- **Next safe source task:** none from Attachments Wave 02; any production action requires a fresh exact approval.

## Previous continuation checkpoint

- **Last completed:** PROD-DB-07 controlled apply + post-verify PASS.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Completed:** Batch 08 files metadata migration/verifier/report merged through PR #61.
- **Source SHA:** `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`; intermediate SHA `BDEDBD04...` and Wave 01 SHA `C5BC82D...` are superseded.
- **Local gates:** static SQL PASS; OpenAPI PASS; typecheck PASS; 88 tests PASS using workspace concurrency 1; builds PASS. Format PASS. Web ESLint process crashed without diagnostics and remains for CI confirmation.
- **Next allowed after review:** source delivery only; no production preflight/apply without a new explicit approval.
- **Forbidden now:** Batch 08 `db push`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, deploy, real taxpayer data, real SMS/OTP/WhatsApp.

## Wave 02 Track A checkpoint

- PR #61 is corrected in place: required non-blank `document_category_code` is separate from server-owned `storage_accounting_category_code`.
- Checksum remains nullable only during incomplete upload; an executable database check and application-policy boundary require a valid observed SHA-256 before becoming `available`.
- Migration/verifier static scope remains exactly three tables, three RLS enablements, no policies, no positive grants, and no data writes.
- Duplicate active links are prevented without blocking retained historical unlink/relink cycles.
- `PROD-DB-08 = CLOSED`; no linked preflight, dry-run, SQL, or apply occurred.
