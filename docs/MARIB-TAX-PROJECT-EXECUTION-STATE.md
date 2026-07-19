# Marib Tax Project Execution State

**Inventory time:** 2026-07-20 (Asia/Riyadh) — after PROD-DB-06 apply PASS; Batch 07 source authored

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- `origin/main` after Batch 06 post-verify: `848e437` (PR #56 merged; Foundation CI PASS).
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`.

## Database

| Batch  | Source                              | Production                                              |
| ------ | ----------------------------------- | ------------------------------------------------------ |
| 01A–06 | COMPLETE                            | APPLIED / VERIFIED PASS                                 |
| 07     | **COMPLETE (source)**               | APPLY CLOSED — SHA `71A430F7D9B11BC01202E675DEBD8ED5D7D15769E30F12A1FE07353807B9F7C7` |
| 08+    | BLOCKED                             | NOT_STARTED                                             |

## Continuation checkpoint

- **Last completed:** PROD-DB-06 production apply + structural verifier PASS; Batch 07 source authored.
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-06-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Active:** none.
- **Approval gates:** PROD-DB-07 apply remains closed pending a new explicit user approval and fresh preflight.
- **Forbidden without new approval:** Batch 07+ production apply, deploy/publish, secrets, real taxpayer data, real SMS/OTP/WhatsApp.
