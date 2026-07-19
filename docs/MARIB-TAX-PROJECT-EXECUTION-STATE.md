# Marib Tax Project Execution State

**Inventory time:** 2026-07-20 (Asia/Riyadh) — PROD-DB-07 applied and verified

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline at apply: `origin/main` `8d62af2` (PR #59 merge).
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.

## Database

| Batch  | Source                                     | Production                        |
| ------ | ------------------------------------------ | --------------------------------- |
| 01A–07 | COMPLETE                                   | APPLIED / VERIFIED PASS           |
| 08+    | NOT_STARTED (source may begin; apply closed) | NOT_STARTED                     |

## Continuation checkpoint

- **Last completed:** PROD-DB-07 controlled apply + post-verify PASS.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Active:** none.
- **Next allowed:** Batch 08 **source only** (no production apply without a new explicit approval).
- **Forbidden now:** Batch 08 `db push`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, deploy, real taxpayer data, real SMS/OTP/WhatsApp.
