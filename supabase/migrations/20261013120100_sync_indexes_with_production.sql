-- Brings the migration chain in line with the indexes that actually exist in
-- production, so `supabase db reset` reproduces the production schema.
-- Every statement uses IF NOT EXISTS: on production this migration is a no-op.

-- 1. Content-schema indexes moved out of 20260730120000_create_performance_indexes.sql.
--    They referenced content.content_pages and content.announcements before those
--    tables existed (created in 20260731120000), which aborted that whole migration
--    on a fresh database. Production already has both (applied out of order).
CREATE INDEX IF NOT EXISTS idx_content_pages_status_updated
  ON content.content_pages (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_validity
  ON content.announcements (starts_at, ends_at)
  WHERE is_active = true;

-- 2. Index created in production by a hand-edited version of 20260730120000 that
--    was never committed to the repository.
CREATE INDEX IF NOT EXISTS idx_import_errors_job_row
  ON imports.import_errors (import_job_id, import_row_id);
