-- Batch 12 read-only structural verifier. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.

WITH dependency_presence AS (
  SELECT
    to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'imports'
    ) AS imports_schema_present
),
expected(table_name) AS (
  VALUES
    ('import_jobs'),
    ('import_files'),
    ('import_rows'),
    ('import_errors'),
    ('import_matches')
),
actual AS (
  SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'imports' AND c.relkind = 'r'
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
  WHERE table_schema = 'imports'
    AND table_name IN (SELECT table_name FROM expected)
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT count(*)::integer AS value
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'imports'
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
  WHERE table_schema = 'imports'
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
    count(*) FILTER (WHERE x.conname = 'import_jobs_public_ref_key' AND x.contype = 'u') = 1
      AS public_ref_unique,
    count(*) FILTER (WHERE x.conname = 'import_files_file_size_non_negative_check' AND x.contype = 'c') = 1
      AS files_size_check,
    count(*) FILTER (WHERE x.conname = 'import_rows_row_number_positive_check' AND x.contype = 'c') = 1
      AS rows_number_check,
    count(*) FILTER (WHERE x.conname = 'import_errors_severity_check' AND x.contype = 'c') = 1
      AS errors_severity_check,
    count(*) FILTER (WHERE x.conname = 'import_matches_score_range_check' AND x.contype = 'c') = 1
      AS matches_score_check,
    count(*) FILTER (WHERE x.conname = 'import_matches_type_check' AND x.contype = 'c') = 1
      AS matches_type_check
  FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'imports'
),
required_columns AS (
  SELECT
    count(*) FILTER (
      WHERE table_name = 'import_jobs'
        AND column_name = 'status_code'
        AND is_nullable = 'NO'
    ) = 1 AS job_status_required,
    count(*) FILTER (
      WHERE table_name = 'import_files'
        AND column_name = 'import_job_id'
        AND is_nullable = 'NO'
    ) = 1 AS file_job_id_required,
    count(*) FILTER (
      WHERE table_name = 'import_rows'
        AND column_name = 'row_number'
        AND is_nullable = 'NO'
    ) = 1 AS row_number_required,
    count(*) FILTER (
      WHERE table_name = 'import_errors'
        AND column_name = 'severity'
        AND is_nullable = 'NO'
    ) = 1 AS error_severity_required,
    count(*) FILTER (
      WHERE table_name = 'import_matches'
        AND column_name = 'matched_entity_type'
        AND is_nullable = 'NO'
    ) = 1 AS match_entity_type_required
  FROM information_schema.columns
  WHERE table_schema = 'imports'
    AND table_name IN (SELECT table_name FROM expected)
),
required_indexes AS (
  SELECT
    count(*) FILTER (
      WHERE indexname = 'import_jobs_idempotency_key_key'
        AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
        AND indexdef ILIKE '%WHERE (idempotency_key IS NOT NULL)%'
    ) = 1 AS job_idempotency_scoped_unique
  FROM pg_catalog.pg_indexes
  WHERE schemaname = 'imports'
),
row_counts AS (
  SELECT
    (SELECT count(*) FROM imports.import_jobs) AS import_jobs_count,
    (SELECT count(*) FROM imports.import_files) AS import_files_count,
    (SELECT count(*) FROM imports.import_rows) AS import_rows_count,
    (SELECT count(*) FROM imports.import_errors) AS import_errors_count,
    (SELECT count(*) FROM imports.import_matches) AS import_matches_count
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
  d.imports_schema_present,
  s.table_mismatch_count,
  s.unexpected_table_count,
  s.forbidden_grant_count,
  s.secret_like_column_count,
  s.policy_count,
  NOT cr.present AS cases_relation_absent,
  rc.public_ref_unique,
  rc.files_size_check,
  rc.rows_number_check,
  rc.errors_severity_check,
  rc.matches_score_check,
  rc.matches_type_check,
  col.job_status_required,
  col.file_job_id_required,
  col.row_number_required,
  col.error_severity_required,
  col.match_entity_type_required,
  ix.job_idempotency_scoped_unique,
  r.import_jobs_count,
  r.import_files_count,
  r.import_rows_count,
  r.import_errors_count,
  r.import_matches_count,
  COALESCE(
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.table_name)
     FROM table_checks t WHERE status <> 'OK'),
    '[]'::jsonb
  ) AS table_mismatches,
  CASE
    WHEN d.user_profiles_present
      AND d.imports_schema_present
      AND s.table_mismatch_count = 0
      AND s.unexpected_table_count = 0
      AND s.forbidden_grant_count = 0
      AND s.secret_like_column_count = 0
      AND s.policy_count = 0
      AND NOT cr.present
      AND rc.public_ref_unique
      AND rc.files_size_check
      AND rc.rows_number_check
      AND rc.errors_severity_check
      AND rc.matches_score_check
      AND rc.matches_type_check
      AND col.job_status_required
      AND col.file_job_id_required
      AND col.row_number_required
      AND col.error_severity_required
      AND col.match_entity_type_required
      AND ix.job_idempotency_scoped_unique
      AND r.import_jobs_count = 0
      AND r.import_files_count = 0
      AND r.import_rows_count = 0
      AND r.import_errors_count = 0
      AND r.import_matches_count = 0
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
