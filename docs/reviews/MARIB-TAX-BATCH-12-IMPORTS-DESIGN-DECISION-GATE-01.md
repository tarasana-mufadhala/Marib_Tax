# MARIB Tax Batch 12 Imports Design Decision Gate

## Decision

**PASS — BATCH_12_IMPORTS_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- TABLES in the `imports` schema (5 tables):
  1. `import_jobs` (TABLE-073 variant)
  2. `import_files` (TABLE-074 variant)
  3. `import_rows` (TABLE-075 variant)
  4. `import_errors` (TABLE-076 variant)
  5. `import_matches` (TABLE-077 variant)
- Physical names follow the user-request and plan-aligned names: `import_jobs`, `import_files`, `import_rows`, `import_errors`, `import_matches`.
- This database batch defines the structural schema for parsing and processing bulk data imports cleanly.

## Accepted source boundaries

- Upload and staging isolation: files metadata is registered in `import_files` and raw staged records in `import_rows` before normalization or validation.
- RLS enabled on all five tables; positive grants revoked from public/anon/authenticated/service_role roles.
- No secrets in columns: any credentials or access tokens for file imports are managed out-of-band and never stored in the database.
- Integrity: Check constraints prevent negative file sizes (`file_size_bytes >= 0`), non-positive row numbers (`row_number >= 1`), score bounds (`match_score >= 0.00 AND match_score <= 100.00`), and enforce code categories.
- Optional profile linkages: `created_by_profile_id` references user profiles with RESTRICT updates/deletions.

## Verification result

- Exactly five `CREATE TABLE` + five `ENABLE ROW LEVEL SECURITY`.
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0; no float/real/double money-like columns.
- Unique constraints: jobs `idempotency_key` (partial scoped unique index), jobs `public_ref`.
- Check constraints: row number positive, file size non-negative, match score bounds, error severity enum.
- Read-only verifier checks schema presence, RLS settings, emptiness, constraint codes, column nullability, and unique constraints.
- Repository foundation validation compiles and passes cleanly.
- Migration SHA-256: `2804124F768641F439B3DC325220C5CF36F25FE1D1FBF3A16C874631B8CBE93D`
- Verifier SHA-256: `2FFAF72F036B9FB1716D78FA6B99D998A718F2F20F4FD1A546B53D2E4FB0DDB6`

## Production gate

This design PASS does not authorize apply. Production apply requires the full governed cycle: PR → CI PASS → review → merge → production preflight with linked read-only checks and `--dry-run` → independent user approval → single apply → post-apply verifier → closure (`BATCH_12 = APPLIED / VERIFIED PASS`).
