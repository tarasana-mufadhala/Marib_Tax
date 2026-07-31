-- Batch 13 read-only structural verifier. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.

WITH dependency_presence AS (
  SELECT
    to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'content'
    ) AS content_schema_present
),
expected(table_name) AS (
  VALUES
    ('content_pages'),
    ('content_versions'),
    ('announcements'),
    ('library_documents'),
    ('faqs')
),
actual AS (
  SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'content' AND c.relkind = 'r'
),
table_checks AS (
  SELECT e.table_name,
    CASE
      WHEN a.table_name IS NULL THEN 'MISSING'
      WHEN NOT a.relrowsecurity THEN 'RLS_DISABLED'
      WHEN a.relforcerowsecurity THEN 'UNEXPECTED_FORCE_RLS'
      ELSE 'OK'
    END AS status
  FROM expected e
  LEFT JOIN actual a USING (table_name)
),
unexpected_tables AS (
  SELECT a.table_name
  FROM actual a
  LEFT JOIN expected e USING (table_name)
  WHERE e.table_name IS NULL
),
forbidden_grants AS (
  SELECT *
  FROM information_schema.role_table_grants
  WHERE table_schema = 'content'
    AND table_name IN (SELECT table_name FROM expected)
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT count(*)::integer AS value
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'content'
    AND c.relname IN (SELECT table_name FROM expected)
),
cases_relation AS (
  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'v', 'm', 'f', 'p')
      AND c.relname = 'cases'
  ) AS present
),
secret_like_columns AS (
  SELECT *
  FROM information_schema.columns
  WHERE table_schema = 'content'
    AND (
      column_name ILIKE '%secret%'
      OR column_name ILIKE '%token%'
      OR column_name ILIKE '%password%'
      OR column_name ILIKE '%api_key%'
      OR column_name ILIKE '%credential%'
    )
),
required_constraints AS (
  SELECT
    count(*) FILTER (WHERE x.conname = 'content_pages_key_key' AND x.contype = 'u') = 1
      AS pages_key_unique,
    count(*) FILTER (WHERE x.conname = 'content_pages_status_check' AND x.contype = 'c') = 1
      AS pages_status_check,
    count(*) FILTER (WHERE x.conname = 'content_versions_number_positive_check' AND x.contype = 'c') = 1
      AS versions_number_check,
    count(*) FILTER (WHERE x.conname = 'announcements_priority_range_check' AND x.contype = 'c') = 1
      AS announcements_priority_check,
    count(*) FILTER (WHERE x.conname = 'library_documents_status_check' AND x.contype = 'c') = 1
      AS library_status_check,
    count(*) FILTER (WHERE x.conname = 'faqs_display_order_non_negative_check' AND x.contype = 'c') = 1
      AS faqs_order_check
  FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'content'
),
required_columns AS (
  SELECT
    count(*) FILTER (
      WHERE table_name = 'content_pages'
        AND column_name = 'key'
        AND is_nullable = 'NO'
    ) = 1 AS page_key_required,
    count(*) FILTER (
      WHERE table_name = 'content_versions'
        AND column_name = 'content_page_id'
        AND is_nullable = 'NO'
    ) = 1 AS version_page_id_required,
    count(*) FILTER (
      WHERE table_name = 'announcements'
        AND column_name = 'title'
        AND is_nullable = 'NO'
    ) = 1 AS announcement_title_required,
    count(*) FILTER (
      WHERE table_name = 'library_documents'
        AND column_name = 'file_path'
        AND is_nullable = 'NO'
    ) = 1 AS library_file_path_required,
    count(*) FILTER (
      WHERE table_name = 'faqs'
        AND column_name = 'question'
        AND is_nullable = 'NO'
    ) = 1 AS faq_question_required
  FROM information_schema.columns
  WHERE table_schema = 'content'
    AND table_name IN (SELECT table_name FROM expected)
),
required_indexes AS (
  SELECT
    count(*) FILTER (
      WHERE indexname = 'idx_faqs_category_order'
        AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
        AND indexdef ILIKE '%WHERE (is_active = true)%'
    ) = 1 AS faqs_scoped_unique
  FROM pg_catalog.pg_indexes
  WHERE schemaname = 'content'
),
row_counts AS (
  SELECT
    (SELECT count(*) FROM content.content_pages) AS pages_count,
    (SELECT count(*) FROM content.content_versions) AS versions_count,
    (SELECT count(*) FROM content.announcements) AS announcements_count,
    (SELECT count(*) FROM content.library_documents) AS library_count,
    (SELECT count(*) FROM content.faqs) AS faqs_count
),
summaries AS (
  SELECT
    (SELECT count(*) FROM table_checks WHERE status <> 'OK') AS table_mismatch_count,
    (SELECT count(*) FROM unexpected_tables) AS unexpected_table_count,
    (SELECT count(*) FROM forbidden_grants) AS forbidden_grant_count,
    (SELECT count(*) FROM secret_like_columns) AS secret_like_column_count,
    (SELECT value FROM policy_count) AS policy_count
)
SELECT
  d.user_profiles_present,
  d.content_schema_present,
  s.table_mismatch_count,
  s.unexpected_table_count,
  s.forbidden_grant_count,
  s.secret_like_column_count,
  s.policy_count,
  NOT cr.present AS cases_relation_absent,
  rc.pages_key_unique,
  rc.pages_status_check,
  rc.versions_number_check,
  rc.announcements_priority_check,
  rc.library_status_check,
  rc.faqs_order_check,
  col.page_key_required,
  col.version_page_id_required,
  col.announcement_title_required,
  col.library_file_path_required,
  col.faq_question_required,
  ix.faqs_scoped_unique,
  r.pages_count,
  r.versions_count,
  r.announcements_count,
  r.library_count,
  r.faqs_count,
  COALESCE(
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.table_name)
     FROM table_checks t WHERE status <> 'OK'),
    '[]'::jsonb
  ) AS table_mismatches,
  CASE
    WHEN d.user_profiles_present
      AND d.content_schema_present
      AND s.table_mismatch_count = 0
      AND s.unexpected_table_count = 0
      AND s.forbidden_grant_count = 0
      AND s.secret_like_column_count = 0
      AND s.policy_count = 0
      AND NOT cr.present
      AND rc.pages_key_unique
      AND rc.pages_status_check
      AND rc.versions_number_check
      AND rc.announcements_priority_check
      AND rc.library_status_check
      AND rc.faqs_order_check
      AND col.page_key_required
      AND col.version_page_id_required
      AND col.announcement_title_required
      AND col.library_file_path_required
      AND col.faq_question_required
      AND ix.faqs_scoped_unique
      AND r.pages_count = 0
      AND r.versions_count = 0
      AND r.announcements_count = 0
      AND r.library_count = 0
      AND r.faqs_count = 0
    THEN 'PASS'
    ELSE 'FAIL'
  END AS final_status
FROM dependency_presence d
CROSS JOIN summaries s
CROSS JOIN cases_relation cr
CROSS JOIN required_constraints rc
CROSS JOIN required_columns col
CROSS JOIN required_indexes ix
CROSS JOIN row_counts r;
