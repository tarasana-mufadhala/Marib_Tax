# MARIB Tax Batch 13 Content Design Decision Gate

## Decision

**PASS — BATCH_13_CONTENT_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- TABLES in the `content` schema (5 tables):
  1. `content_pages` (TABLE-078)
  2. `content_versions` (TABLE-079)
  3. `announcements` (TABLE-080)
  4. `library_documents` (TABLE-081)
  5. `faqs` (TABLE-082)
- Physical names match the catalog schema definitions: `content_pages`, `content_versions`, `announcements`, `library_documents`, `faqs`.

## Accepted source boundaries

- Content management boundaries: public and administrative pages are isolated in `content_pages`, with historic audit trails captured in `content_versions` per modification.
- RLS enabled on all five tables; positive client grants revoked; no seeds; no Storage schema mutation.
- Security constraints: blank/empty keys/titles/questions/answers are rejected. Priority is bounded (0-100), and display order is non-negative.
- No secrets in content fields: files are referenced via abstract logical paths (`file_path`, `image_path`) and never contain plain access tokens or credentials.

## Verification result

- Exactly five `CREATE TABLE` + five `ENABLE ROW LEVEL SECURITY`.
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0; no float/real/double columns.
- Unique constraints: pages `key` (stable identifier), faqs `(category_code, display_order) WHERE is_active = true` (scoped layout order).
- Checks: blank check constraints, display order constraints, priority ranges, date order validations.
- Repository foundation validation compiles and passes cleanly.
- Migration SHA-256: `D5295F1825E10C36522FD79E0548912CA0A0F0B7E635C9FEAFECAE4DFF20FE90`
- Verifier SHA-256: `5FEE75D0FD4B9EEB03D005FDBCAE8C17FFC795C69171A87664E752CE5D21D845`

## Production gate

This design PASS does not authorize apply. Production apply requires the full governed cycle: PR → CI PASS → review → merge → production preflight with linked read-only checks and `--dry-run` → independent user approval → single apply → post-apply verifier → closure (`BATCH_13 = APPLIED / VERIFIED PASS`).
