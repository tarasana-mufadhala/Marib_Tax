# Marib Tax Project Execution State

**Inventory time:** 2026-07-20 (Asia/Riyadh) — Batch 08 files metadata source active

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline at apply: `origin/main` `8d62af2` (PR #59 merge).
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.

## Database

| Batch  | Source               | Production                 |
| ------ | -------------------- | -------------------------- |
| 01A–07 | COMPLETE             | APPLIED / VERIFIED PASS    |
| 08     | ACTIVE — source only | NOT_STARTED — apply closed |
| 09+    | BLOCKED              | NOT_STARTED                |

## Continuation checkpoint

- **Last completed:** PROD-DB-07 controlled apply + post-verify PASS.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Active:** Batch 08 files metadata migration/verifier/report on `feat/db-foundation-batch-08-files-metadata`.
- **Source SHA:** `71B17156E347582000B2F54E24A8E18EBB0BE45B3E2919F2C4CF17C6F2E845BA`; Wave 01 SHA `C5BC82D...` is superseded.
- **Local gates:** static SQL PASS; OpenAPI PASS; typecheck PASS; 88 tests PASS using workspace concurrency 1; builds PASS. Format PASS. Web ESLint process crashed without diagnostics and remains for CI confirmation.
- **Next allowed after review:** source delivery only; no production preflight/apply without a new explicit approval.
- **Forbidden now:** Batch 08 `db push`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, deploy, real taxpayer data, real SMS/OTP/WhatsApp.

## Wave 02 Track A checkpoint

- PR #61 is corrected in place: required non-blank `document_category_code` is separate from server-owned `storage_accounting_category_code`.
- Checksum remains nullable only during incomplete upload; becoming `available` requires a valid observed SHA-256 at the application-policy boundary.
- Migration/verifier static scope remains exactly three tables, three RLS enablements, no policies, no positive grants, and no data writes.
- `PROD-DB-08 = CLOSED`; no linked preflight, dry-run, SQL, or apply occurred.
