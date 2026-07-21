# Marib Tax Project Execution State

**Inventory time:** 2026-07-21 (Asia/Riyadh) — PROD-DB-09 controlled apply + post-verify PASS

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline at apply: `origin/main` `da3796bd9af296ac96d0033341eb036a1328f19c` (PR #71 merge).
- Apply branch: `prod-db-09-apply-01`.

## Database

| Batch  | Source               | Production              |
| ------ | -------------------- | ----------------------- |
| 01A–09 | COMPLETE             | APPLIED / VERIFIED PASS |
| 10+    | NOT_STARTED         | NOT_STARTED            |

## Batch 09 production apply checkpoint

- **Design gate:** `PASS — BATCH_09_FIELD_VISITS_DESIGN_APPROVED_FOR_SOURCE`
- **Source PR:** #70 MERGED
- **Preflight PR:** #71 MERGED
- **Migration:** `supabase/migrations/20260724120000_create_field_visits_family.sql`
- **Migration SHA-256:** `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D`
- **Verifier:** `scripts/db/verify/verify_batch_09_field_visits_family.sql`
- **Verifier SHA-256:** `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77`
- **Apply command:** `npx --yes supabase@2.109.1 db push --linked --yes`
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Production:** `PROD-DB-09 = APPLIED / VERIFIED PASS`
- **Open decisions still deferred:** OD-08 triggers; OD-15 correction authority; DM-08 masking/result catalogue; `cancelVisit` authority
- **Next:** Batch 10 may begin as **source only** after this post-apply report merges; Batch 10 apply remains closed.

## Previous continuation checkpoint

- **Last prior production apply:** PROD-DB-08 controlled apply + post-verify PASS (PR #69 / `7fe71ea`).
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
