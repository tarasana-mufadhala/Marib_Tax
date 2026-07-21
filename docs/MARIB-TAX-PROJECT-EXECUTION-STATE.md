# Marib Tax Project Execution State

**Inventory time:** 2026-07-21 (Asia/Riyadh) — PROD-DB-09 production preflight PASS; apply closed pending approval

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline: `origin/main` `08841bada5ea570acc2cc64d180a9934aa32e66b` (PR #70 merge).
- Preflight branch: `prod-db-09-preflight-01`.

## Database

| Batch  | Source                          | Production                         |
| ------ | ------------------------------- | ---------------------------------- |
| 01A–08 | COMPLETE                        | APPLIED / VERIFIED PASS            |
| 09     | MERGED / NOT APPLIED            | REQUIRES_USER_APPROVAL (`PROD-DB-09`) |
| 10+    | NOT_STARTED                    | NOT_STARTED                       |

## Batch 09 production preflight checkpoint

- **Design gate:** `PASS — BATCH_09_FIELD_VISITS_DESIGN_APPROVED_FOR_SOURCE`
- **Source PR:** #70 MERGED
- **Migration:** `supabase/migrations/20260724120000_create_field_visits_family.sql`
- **Migration SHA-256:** `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D`
- **Verifier:** `scripts/db/verify/verify_batch_09_field_visits_family.sql`
- **Verifier SHA-256:** `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77`
- **Preflight report:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md`
- **Approval packet:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPROVAL-PACKET.md`
- **Source report:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-09-FIELD-VISITS-REPORT.md`
- **Production:** `PROD-DB-09 = REQUIRES_USER_APPROVAL`
- **Source state:** `BATCH_09_SOURCE = MERGED / NOT APPLIED`
- **Open decisions still deferred:** OD-08 triggers; OD-15 correction authority; DM-08 masking/result catalogue; `cancelVisit` authority
- **Forbidden now:** `db push` without `--dry-run`, `db push --linked --yes`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, Storage operations, real data, deploy, Batch 10, real SMS/OTP/WhatsApp, reuse of this preflight as apply approval.

## Previous continuation checkpoint

- **Last production apply:** PROD-DB-08 controlled apply + post-verify PASS (PR #69 / `7fe71ea`).
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
