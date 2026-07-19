# Marib Tax Project Execution State

**Inventory time:** 2026-07-20 (Asia/Riyadh) — after PROD-DB-06 apply + verifier PASS

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- `origin/main` at apply baseline: `9637b72` (PR #55 preflight merged; Foundation CI PASS).
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.

## Database

| Batch  | Source                | Production                                |
| ------ | --------------------- | ----------------------------------------- |
| 01A–05 | COMPLETE              | APPLIED / VERIFIED PASS                   |
| 06     | COMPLETE              | **APPLIED / VERIFIED PASS**               |
| 07     | NEXT (source only)    | NOT_STARTED — requires separate approval  |
| 08+    | BLOCKED               | NOT_STARTED                               |

## Continuation checkpoint

- **Last completed:** PROD-DB-06 production apply + structural verifier PASS.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-06-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Active:** Batch 07 source authoring only (no production apply).
- **Approval gates:** PROD-DB-07 apply remains closed pending a new explicit user approval.
- **Forbidden without new approval:** Batch 07+ production apply, deploy/publish, secrets, real taxpayer data, real SMS/OTP/WhatsApp.
