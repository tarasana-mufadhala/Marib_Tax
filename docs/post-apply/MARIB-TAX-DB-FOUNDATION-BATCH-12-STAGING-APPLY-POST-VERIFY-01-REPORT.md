# MARIB-TAX-DB-FOUNDATION-BATCH-12-STAGING-APPLY-POST-VERIFY-01

## Decision

PASS WITH EXPECTED NOTES — BATCH_12_STAGING_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE
- Structural validation (schemas, tables, constraints, columns, indexes) passes 100% with no mismatches.
- The verifier reports `final_status: FAIL` only because table-level grants (20 grants) were subsequently applied to the `authenticated` role in Batch 16 (Final RLS Policies) to enable security policies.

## Scope

- Environment: Linked project `sjmtiwzddztxfrncwkpx` (Staging target)
- Repository: `tarasana-mufadhala/Marib_Tax`
- Verification report created: `2026-08-01`
- Supabase CLI: `2.109.1`

## Applied Migration

- Version: `20260727120000`
- File: `supabase/migrations/20260727120000_create_imports_schema_tables.sql`
- SHA-256: `2804124F768641F439B3DC325220C5CF36F25FE1D1FBF3A16C874631B8CBE93D`
- Verifier: `scripts/db/verify/verify_batch_12_imports.sql`
- Verifier SHA-256: `2FFAF72F036B9FB1716D78FA6B99D998A718F2F20F4FD1A546B53D2E4FB0DDB6`

## Structural Verification Results

Read-only verifier: `scripts/db/verify/verify_batch_12_imports.sql`

| Check | Result | Detail |
| --- | --- | --- |
| `imports_schema_present` | **true** | Schema `imports` exists |
| `table_mismatch_count` | **0** | All expected tables match specifications |
| `unexpected_table_count` | **0** | Dropped legacy `import_batches` table |
| `public_ref_unique` | **true** | Unique constraint on `public_ref` |
| `files_size_check` | **true** | Non-negative constraint on `file_size_bytes` |
| `rows_number_check` | **true** | Positive constraint on `row_number` |
| `errors_severity_check` | **true** | Correct severity constraints |
| `matches_score_check` | **true** | Correct score range constraints |
| `job_status_required` | **true** | Correct nullable definitions |
| `job_idempotency_scoped_unique` | **true** | Correct scoped index for idempotency keys |
| `forbidden_grant_count` | **20** | Expected grants to `authenticated` role post-Batch 16 |
| `policy_count` | **4** | Expected active RLS policies post-Batch 16 |

## Resulting Objects

- `imports.import_jobs`
- `imports.import_files`
- `imports.import_rows`
- `imports.import_errors`
- `imports.import_matches`
