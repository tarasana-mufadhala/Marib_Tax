# Marib Tax Project Execution State

**Inventory time:** 2026-07-20 (Asia/Riyadh) — Batch 07 design-decision gate HOLD + source correction

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline before this gate: `origin/main` at Batch 07 source merge `8942ca2`.
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.

## Database

| Batch  | Source                                         | Production                                              |
| ------ | ---------------------------------------------- | ------------------------------------------------------ |
| 01A–06 | COMPLETE                                       | APPLIED / VERIFIED PASS                                |
| 07     | **CORRECTED after HOLD** (SHA `4D51F41B…`)     | NOT APPLIED — PROD-DB-07 CLOSED                        |
| 08+    | BLOCKED                                        | NOT_STARTED                                            |

## Continuation checkpoint

- **Last completed:** Batch 07 design-decision gate HOLD; filer/type/targets/properties corrections; ADR-017 recorded.
- **Evidence:** `docs/reviews/MARIB-TAX-BATCH-07-DESIGN-DECISION-GATE-01.md`
- **Active:** none.
- **Approval gates:** PROD-DB-07 preflight and apply remain closed.
- **Forbidden now:** production preflight/dry-run, `db push`, seed/backfill, deploy, real taxpayer data, real SMS/OTP/WhatsApp.
