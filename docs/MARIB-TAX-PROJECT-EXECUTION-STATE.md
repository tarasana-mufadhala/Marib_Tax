# Marib Tax Project Execution State

**Inventory time:** 2026-07-20 (Asia/Riyadh) — Batch 07 design PASS + PROD-DB-07 preflight

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline: `origin/main` at PR #58 merge `31ad36d`, plus Batch 07 uniqueness correction + PROD-DB-07 preflight docs on branch `docs/db-foundation-batch-07-production-preflight-01`.
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.

## Database

| Batch  | Source                                                              | Production                                              |
| ------ | ------------------------------------------------------------------- | ------------------------------------------------------ |
| 01A–06 | COMPLETE                                                            | APPLIED / VERIFIED PASS                                 |
| 07     | ACCEPTED (SHA `10BA80E8…`)                                          | NOT APPLIED — PROD-DB-07 = REQUIRES_USER_APPROVAL       |
| 08+    | BLOCKED                                                             | NOT_STARTED                                             |

## Continuation checkpoint

- **Last completed:** Batch 07 post-correction design acceptance PASS; PROD-DB-07 preflight-only PASS_WITH_NOTES.
- **Evidence:** `docs/reviews/MARIB-TAX-BATCH-07-DESIGN-DECISION-GATE-01.md`, `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md`, `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPROVAL-PACKET.md`
- **Active:** waiting for explicit PROD-DB-07 production apply approval.
- **Forbidden now:** real `db push`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, Batch 08 apply, deploy, real taxpayer data, real SMS/OTP/WhatsApp.
