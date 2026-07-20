-- Batch 08 read-only structural verifier. Success requires final_status = PASS.
WITH expected(table_name) AS (
  VALUES ('attachments'), ('attachment_links'), ('attachment_version_histories')
), actual AS (
  SELECT c.relname AS table_name, c.relrowsecurity
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'files' AND c.relkind = 'r'
), table_checks AS (
  SELECT e.table_name,
    CASE WHEN a.table_name IS NULL THEN 'MISSING'
         WHEN NOT a.relrowsecurity THEN 'RLS_DISABLED' ELSE 'OK' END AS status
  FROM expected e LEFT JOIN actual a USING (table_name)
), forbidden_grants AS (
  SELECT * FROM information_schema.role_table_grants
  WHERE table_schema = 'files'
    AND table_name IN (SELECT table_name FROM expected)
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
), policy_count AS (
  SELECT count(*)::integer AS value FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'files' AND c.relname IN (SELECT table_name FROM expected)
), storage_fk_count AS (
  SELECT count(*)::integer AS value FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_class rc ON rc.oid = x.confrelid
  JOIN pg_catalog.pg_namespace rn ON rn.oid = rc.relnamespace
  WHERE x.contype = 'f' AND n.nspname = 'files' AND rn.nspname = 'storage'
), metadata_columns AS (
  SELECT
    count(*) FILTER (WHERE column_name = 'original_filename' AND is_nullable = 'NO') = 1 AS filename_required,
    count(*) FILTER (WHERE column_name = 'mime_type' AND is_nullable = 'NO') = 1 AS mime_required,
    count(*) FILTER (WHERE column_name = 'checksum_sha256' AND is_nullable = 'YES') = 1 AS checksum_conditionally_nullable,
    count(*) FILTER (WHERE column_name = 'document_category_code' AND is_nullable = 'NO') = 1 AS document_category_required,
    count(*) FILTER (WHERE column_name = 'storage_accounting_category_code' AND is_nullable = 'NO') = 1 AS accounting_category_required
  FROM information_schema.columns
  WHERE table_schema = 'files' AND table_name = 'attachments'
), required_checks AS (
  SELECT
    count(*) FILTER (WHERE x.conname = 'attachments_checksum_sha256_check') = 1 AS checksum_format_check,
    count(*) FILTER (WHERE x.conname = 'attachments_document_category_not_blank_check') = 1 AS document_category_nonblank_check,
    count(*) FILTER (WHERE x.conname = 'attachments_accounting_category_not_blank_check') = 1 AS accounting_category_nonblank_check
  FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'files' AND c.relname = 'attachments' AND x.contype = 'c'
), row_counts AS (
  SELECT
    (SELECT count(*) FROM files.attachments) AS attachments,
    (SELECT count(*) FROM files.attachment_links) AS links,
    (SELECT count(*) FROM files.attachment_version_histories) AS versions
), summaries AS (
  SELECT
    (SELECT count(*) FROM table_checks WHERE status <> 'OK') AS table_mismatch_count,
    (SELECT count(*) FROM forbidden_grants) AS forbidden_grant_count,
    (SELECT value FROM policy_count) AS policy_count,
    (SELECT value FROM storage_fk_count) AS storage_fk_count
)
SELECT s.*, mc.filename_required, mc.mime_required, mc.checksum_conditionally_nullable,
  mc.document_category_required, mc.accounting_category_required,
  rc.checksum_format_check, rc.document_category_nonblank_check, rc.accounting_category_nonblank_check,
  r.attachments, r.links, r.versions,
  COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM table_checks t WHERE status <> 'OK'), '[]'::jsonb) AS table_mismatches,
  CASE WHEN s.table_mismatch_count = 0
      AND s.forbidden_grant_count = 0
      AND s.policy_count = 0
      AND s.storage_fk_count = 0
      AND mc.filename_required AND mc.mime_required AND mc.checksum_conditionally_nullable
      AND mc.document_category_required AND mc.accounting_category_required
      AND rc.checksum_format_check AND rc.document_category_nonblank_check AND rc.accounting_category_nonblank_check
      AND r.attachments = 0 AND r.links = 0 AND r.versions = 0
    THEN 'PASS' ELSE 'FAIL' END AS final_status
FROM summaries s CROSS JOIN metadata_columns mc CROSS JOIN required_checks rc CROSS JOIN row_counts r;
