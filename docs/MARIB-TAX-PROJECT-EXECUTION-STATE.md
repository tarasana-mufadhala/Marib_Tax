# Marib Tax Project Execution State

**Inventory time:** 2026-07-21 (Asia/Riyadh) — Batch 09 field visits design gate PASS + source authored

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git

- Baseline: `origin/main` `7fe71ea1d63381450b834f8f3803bac783f4df10` (PR #69 merge).
- Source branch: `batch-09-field-visits-source-01`.

## Database

| Batch  | Source                                   | Production              |
| ------ | ---------------------------------------- | ----------------------- |
| 01A–08 | COMPLETE                                 | APPLIED / VERIFIED PASS |
| 09     | READY_FOR_REVIEW / NOT APPLIED          | CLOSED (`PROD-DB-09`)   |
| 10+    | NOT_STARTED                             | NOT_STARTED             |

## Batch 09 source checkpoint

- **Design gate:** `PASS — BATCH_09_FIELD_VISITS_DESIGN_APPROVED_FOR_SOURCE`
- **Evidence:** `docs/reviews/MARIB-TAX-BATCH-09-FIELD-VISITS-DESIGN-DECISION-GATE-01.md`
- **Migration:** `supabase/migrations/20260724120000_create_field_visits_family.sql`
- **Migration SHA-256:** `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D`
- **Verifier:** `scripts/db/verify/verify_batch_09_field_visits_family.sql`
- **Verifier SHA-256:** `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77`
- **Source report:** `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-09-FIELD-VISITS-REPORT.md`
- **Production:** `PROD-DB-09 = CLOSED`
- **Forbidden now:** production preflight, `db push --linked --dry-run`, `db push --linked --yes`, `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, Storage operations, real data, deploy, Batch 10, real SMS/OTP/WhatsApp.

## Previous continuation checkpoint

- **Last production apply:** PROD-DB-08 controlled apply + post-verify PASS (PR #69 / `7fe71ea`).
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
