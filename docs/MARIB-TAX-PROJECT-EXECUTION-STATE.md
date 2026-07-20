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
- **Source SHA:** `C5BC82DFFC0D159FF19389398FF926820E71EDD8065EFDDA6894AACC6654D81C`.
- **Local gates:** static SQL PASS; OpenAPI PASS; typecheck PASS; 88 tests PASS using workspace concurrency 1; builds PASS. Format PASS. Web ESLint process crashed without diagnostics and remains for CI confirmation.
- **Next allowed after review:** source delivery only; no production preflight/apply without a new explicit approval.
- **Forbidden now:** Batch 08 `db push`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, deploy, real taxpayer data, real SMS/OTP/WhatsApp.
