# Marib Tax Project Execution State

**Inventory time:** 2026-07-20 (Asia/Riyadh) — Batch 06 design-decision gate HOLD + source correction

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline before this gate: `origin/main` at Batch 06 source merge `6d31a6e`.
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.

## Database

| Batch  | Source                                         | Production                                              |
| ------ | ---------------------------------------------- | ------------------------------------------------------ |
| 01A–05 | COMPLETE                                       | APPLIED / VERIFIED PASS                                |
| 06     | **CORRECTED after HOLD** (SHA `F0446C89…`)     | NOT APPLIED — PROD-DB-06 CLOSED                        |
| 07+    | BLOCKED                                        | NOT_STARTED                                            |

## Continuation checkpoint

- **Last completed:** Batch 06 design-decision gate review; reopen constraints corrected; ADR-016 recorded.
- **Evidence:** `docs/reviews/MARIB-TAX-BATCH-06-DESIGN-DECISION-GATE-01.md`
- **Active:** none.
- **Approval gates:** PROD-DB-06 preflight and apply remain closed.
- **Forbidden now:** production preflight/dry-run, `db push`, seed/backfill, deploy, real taxpayer data, real SMS/OTP/WhatsApp.
