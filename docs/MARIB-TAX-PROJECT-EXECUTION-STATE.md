# Marib Tax Project Execution State

**Inventory time:** 2026-07-19 (Asia/Riyadh) — after PROD-DB-05 apply + verifier PASS

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- `origin/main` at apply baseline: `c669f01` (Foundation CI PASS).
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.
- Primary worktree: `C:\projects\Marib_Tax`, local `main` ahead commit preserved.

## Database

| Batch  | Source                | Production                                  |
| ------ | --------------------- | ------------------------------------------ |
| 01A–04 | COMPLETE              | APPLIED / VERIFIED                         |
| 05     | COMPLETE              | **APPLIED / VERIFIED PASS**                |
| 06     | NEXT (source only)    | NOT_STARTED — requires separate approval   |
| 07+    | BLOCKED               | NOT_STARTED                               |

## Continuation checkpoint

- **Last completed:** PROD-DB-05 production apply + structural verifier PASS.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-05-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Active:** Batch 06 source authoring only (no production apply).
- **Approval gates:** PROD-DB-06 apply remains closed pending a new explicit user approval.
- **Forbidden without new approval:** Batch 06+ production apply, deploy/publish, secrets, real taxpayer data, real SMS/OTP/WhatsApp.
