# MARIB Tax DB Foundation — Batch 12 Imports Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_12_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-12 = NOT_STARTED` (requires the governed cycle and independent user approval)

## Artifacts

- Migration: `supabase/migrations/20260727120000_create_imports_schema_tables.sql`
- Migration SHA-256: `2804124F768641F439B3DC325220C5CF36F25FE1D1FBF3A16C874631B8CBE93D`
- Read-only verifier: `scripts/db/verify/verify_batch_12_imports.sql`
- Verifier SHA-256: `2FFAF72F036B9FB1716D78FA6B99D998A718F2F20F4FD1A546B53D2E4FB0DDB6`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-12-IMPORTS-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_12_IMPORTS_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main`

## Scope and boundaries

The source defines five tables only in schema `imports`:

1. `import_jobs`
2. `import_files`
3. `import_rows`
4. `import_errors`
5. `import_matches`

- Physical names follow the user-request and plan-aligned names: `import_jobs`, `import_files`, `import_rows`, `import_errors`, `import_matches`.
- Staged records are loaded in `import_rows` before validation and matches are performed.
- RLS enabled on all five tables; positive grants revoked; no seeds; no Storage mutation; no secrets stored.
- Constraints protect data integrity (row number >= 1, file size >= 0, match score bounds, and checks on enums).

## Structural review (source)

- Schema: `imports`
- Exactly five `CREATE TABLE` + five `ENABLE ROW LEVEL SECURITY`
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0
- Checks: row number positive, file size >= 0, score bounds, error severity check.
- Repository foundation validation compiles cleanly.

## Non-actions

This source report authorizes no apply. It did not apply Batch 12 anywhere, store provider secrets, mutate Storage, or use real taxpayer data. Local execution is pending a running Docker daemon on the maintainer machine and does not replace the governed production preflight.
