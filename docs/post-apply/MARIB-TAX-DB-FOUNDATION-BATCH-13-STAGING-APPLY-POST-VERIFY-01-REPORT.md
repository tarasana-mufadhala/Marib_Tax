# MARIB-TAX-DB-FOUNDATION-BATCH-13-STAGING-APPLY-POST-VERIFY-01

## Decision

PASS WITH EXPECTED NOTES — BATCH_13_STAGING_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE
- Structural validation (schemas, tables, constraints, columns, indexes) passes 100% with no mismatches.
- The verifier reports `final_status: FAIL` only because table-level grants (25 grants) and RLS policies (10 policies) were subsequently applied in Batch 16 (Final RLS Policies) to enable access control rules.

## Scope

- Environment: Linked project `sjmtiwzddztxfrncwkpx` (Staging target)
- Repository: `tarasana-mufadhala/Marib_Tax`
- Verification report created: `2026-08-01`
- Supabase CLI: `2.109.1`

## Applied Migration

- Version: `20260731120000`
- File: `supabase/migrations/20260731120000_create_content_schema_tables.sql`
- SHA-256: `D5295F1825E10C36522FD79E0548912CA0A0F0B7E635C9FEAFECAE4DFF20FE90`
- Verifier: `scripts/db/verify/verify_batch_13_content.sql`
- Verifier SHA-256: `5FEE75D0FD4B9EEB03D005FDBCAE8C17FFC795C69171A87664E752CE5D21D845`

## Structural Verification Results

Read-only verifier: `scripts/db/verify/verify_batch_13_content.sql`

| Check | Result | Detail |
| --- | --- | --- |
| `content_schema_present` | **true** | Schema `content` exists |
| `table_mismatch_count` | **0** | All expected tables match specifications |
| `unexpected_table_count` | **0** | No extra tables detected |
| `pages_key_unique` | **true** | Unique constraint on `key` column |
| `pages_status_check` | **true** | Correct page status constraints |
| `versions_number_check` | **true** | Positive constraint on version numbers |
| `announcements_priority_check` | **true** | Priority limits correctly verified |
| `library_status_check` | **true** | Correct draft/published/archived constraints |
| `faqs_order_check` | **true** | Correct ordering checks |
| `faqs_scoped_unique` | **true** | Scoped unique index on active FAQs |
| `forbidden_grant_count` | **25** | Expected grants post-Batch 16 |
| `policy_count` | **10** | Expected active RLS policies post-Batch 16 |

## Resulting Objects

- `content.content_pages`
- `content.content_versions`
- `content.announcements`
- `content.library_documents`
- `content.faqs`
