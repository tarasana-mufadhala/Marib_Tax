# MARIB Tax DB Foundation — Batch 13 Content Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_13_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-13 = NOT_STARTED` (requires the governed cycle and independent user approval)

## Artifacts

- Migration: `supabase/migrations/20260731120000_create_content_schema_tables.sql`
- Migration SHA-256: `D5295F1825E10C36522FD79E0548912CA0A0F0B7E635C9FEAFECAE4DFF20FE90`
- Read-only verifier: `scripts/db/verify/verify_batch_13_content.sql`
- Verifier SHA-256: `5FEE75D0FD4B9EEB03D005FDBCAE8C17FFC795C69171A87664E752CE5D21D845`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-13-CONTENT-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_13_CONTENT_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main`

## Scope and boundaries

The source defines five tables in schema `content`:

1. `content_pages`
2. `content_versions`
3. `announcements`
4. `library_documents`
5. `faqs`

- Physical names match the catalog schema definitions: `content_pages`, `content_versions`, `announcements`, `library_documents`, `faqs`.
- RLS enabled on all five tables; positive client grants revoked; no seeds; no Storage schema mutation.
- Security constraints validate fields and limit ranges (priority, display order).

## Structural review (source)

- Schema: `content`
- Exactly five `CREATE TABLE` + five `ENABLE ROW LEVEL SECURITY`
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0
- Unique index on FAQs display order by active state to prevent overlap conflicts.
- Blank/empty value checks protect string fields.

## Non-actions

This source report authorizes no apply. It did not apply Batch 13 anywhere, mutate Storage, or use real data. Local execution is pending a running database connection and does not replace the governed production preflight.
