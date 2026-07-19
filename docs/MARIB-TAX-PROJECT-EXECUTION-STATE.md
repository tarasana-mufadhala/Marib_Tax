# Marib Tax Project Execution State

**Inventory time:** 2026-07-19 (Asia/Riyadh) — after PROD-DB-04 apply + verifier PASS

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Database and runtime

| Batch | Source | Production/runtime | Notes |
| --- | --- | --- | --- |
| 01A–03 | COMPLETE | APPLIED / VERIFIED | Prior batches |
| 04 | COMPLETE | **APPLIED / VERIFIED PASS** | `20260719120000`; SHA `19D92BF7FB23251BF17FE61A80194075ED9FEEB970EFD89EBC88CEF75174F3A4`; six tables empty; dry-run up to date |
| 05 | ACTIVE (source) | NOT_STARTED / CLOSED | Master data TABLE-014…020+022; exclude CONDITIONAL TABLE-021 and production apply |
| 06+ | BLOCKED | NOT_STARTED | Behind Batch 05 |

## Continuation checkpoint

- **Last completed:** PROD-DB-04 applied and verified PASS.
- **Active:** post-apply report PR; then Batch 05 source authoring only.
- **Approval gates:** PROD-DB-05 closed.
- **Next action:** merge post-apply on CI PASS; author Batch 05 source; never `db push` Batch 05 without new approval.
