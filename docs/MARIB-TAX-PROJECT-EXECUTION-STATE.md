# Marib Tax Project Execution State

**Inventory time:** 2026-07-19 (Asia/Riyadh) — after PROD-DB-05 apply PASS; Batch 06 source authored

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- `origin/main` after Batch 05 post-verify: `8609b05` (PR #52 merged; Foundation CI PASS).
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.
- Primary worktree: `C:\projects\Marib_Tax`, local `main` ahead commit preserved.

## Database

| Batch  | Source                              | Production                                |
| ------ | ----------------------------------- | ----------------------------------------- |
| 01A–05 | COMPLETE                            | APPLIED / VERIFIED PASS                   |
| 06     | **COMPLETE (source)**               | APPLY CLOSED — SHA `162E35E352956E5AC7AFE907D95FC0046A1AE6D76F2F27D5E1126FDA3DB6690E` |
| 07+    | BLOCKED                             | NOT_STARTED                               |

## Continuation checkpoint

- **Last completed:** PROD-DB-05 production apply + structural verifier PASS; Batch 06 source authored.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-05-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Active:** none.
- **Approval gates:** PROD-DB-06 apply remains closed pending a new explicit user approval and fresh preflight.
- **Forbidden without new approval:** Batch 06+ production apply, deploy/publish, secrets, real taxpayer data, real SMS/OTP/WhatsApp.
