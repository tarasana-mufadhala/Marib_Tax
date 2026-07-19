-- MARIB-TAX-DB-FOUNDATION-BATCH-06-SERVICE-REQUESTS-FAMILY — read-only verification
-- Returns one authoritative result set with mismatch details.
-- Does not mutate data, privileges, policies, or schema objects.
-- Requires no table named cases; catalogue seeds must remain absent in this source batch.

WITH
dependency_presence AS (
  SELECT
    pg_catalog.to_regclass('registry.taxpayers') IS NOT NULL AS taxpayers_present,
    pg_catalog.to_regclass('masterdata.commercial_activities') IS NOT NULL AS commercial_activities_present,
    pg_catalog.to_regclass('masterdata.branches') IS NOT NULL AS branches_present,
    pg_catalog.to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    pg_catalog.to_regclass('identity.staff_profiles') IS NOT NULL AS staff_profiles_present
),
expected_tables(schema_name, table_name) AS (
  VALUES
    ('requests', 'service_types'),
    ('requests', 'service_requests'),
    ('requests', 'request_selected_activities'),
    ('requests', 'request_selected_branches'),
    ('requests', 'request_form_snapshots'),
    ('requests', 'request_form_snapshot_payloads'),
    ('requests', 'request_status_histories'),
    ('requests', 'request_assignment_histories'),
    ('requests', 'request_completion_requests'),
    ('requests', 'request_completion_responses'),
    ('requests', 'request_decision_records'),
    ('requests', 'request_decision_revisions'),
    ('requests', 'request_close_archive_records'),
    ('requests', 'request_reopen_records')
),
actual_tables AS (
  SELECT n.nspname AS schema_name, c.relname AS table_name, c.relkind,
    c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
  WHERE n.nspname = 'requests'
    AND c.relname IN (
      'service_types', 'service_requests', 'request_selected_activities',
      'request_selected_branches', 'request_form_snapshots',
      'request_form_snapshot_payloads', 'request_status_histories',
      'request_assignment_histories', 'request_completion_requests',
      'request_completion_responses', 'request_decision_records',
      'request_decision_revisions', 'request_close_archive_records',
      'request_reopen_records'
    )
),
table_mismatches AS (
  SELECT e.schema_name, e.table_name, a.relkind, a.relrowsecurity, a.relforcerowsecurity,
    CASE
      WHEN a.table_name IS NULL THEN 'MISSING_TABLE'
      WHEN a.relkind <> 'r' THEN 'WRONG_RELKIND'
      WHEN NOT a.relrowsecurity THEN 'RLS_NOT_ENABLED'
      WHEN a.relforcerowsecurity THEN 'UNEXPECTED_FORCE_RLS'
      ELSE 'OK'
    END AS status
  FROM expected_tables e
  LEFT JOIN actual_tables a ON a.schema_name = e.schema_name AND a.table_name = e.table_name
),
expected_indexes(index_name) AS (
  VALUES
    ('service_requests_service_type_id_idx'),
    ('service_requests_taxpayer_id_idx'),
    ('service_requests_status_code_idx'),
    ('request_selected_activities_request_id_idx'),
    ('request_selected_activities_activity_id_idx'),
    ('request_selected_branches_request_id_idx'),
    ('request_selected_branches_selected_activity_id_idx'),
    ('request_selected_branches_branch_id_idx'),
    ('request_form_snapshots_request_id_idx'),
    ('request_form_snapshots_captured_at_idx'),
    ('request_status_histories_request_id_idx'),
    ('request_status_histories_changed_at_idx'),
    ('request_assignment_histories_request_id_idx'),
    ('request_assignment_histories_staff_profile_id_idx'),
    ('request_assignment_histories_changed_at_idx'),
    ('request_completion_requests_request_id_idx'),
    ('request_completion_requests_requested_at_idx'),
    ('request_completion_responses_responded_at_idx'),
    ('request_decision_records_outcome_code_idx'),
    ('request_decision_records_decided_at_idx'),
    ('request_decision_revisions_decision_id_idx'),
    ('request_decision_revisions_revised_at_idx'),
    ('request_close_archive_records_request_id_idx'),
    ('request_close_archive_records_acted_at_idx'),
    ('request_reopen_records_request_id_idx'),
    ('request_reopen_records_reopened_at_idx')
),
index_mismatches AS (
  SELECT e.index_name,
    CASE WHEN c.oid IS NULL THEN 'MISSING_INDEX' ELSE 'OK' END AS status
  FROM expected_indexes e
  LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'requests'
  LEFT JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid AND c.relname = e.index_name
),
forbidden_grants AS (
  SELECT a.table_schema AS schema_name, a.table_name, a.grantee, a.privilege_type
  FROM information_schema.role_table_grants a
  WHERE a.table_schema = 'requests'
    AND a.table_name IN (
      'service_types', 'service_requests', 'request_selected_activities',
      'request_selected_branches', 'request_form_snapshots',
      'request_form_snapshot_payloads', 'request_status_histories',
      'request_assignment_histories', 'request_completion_requests',
      'request_completion_responses', 'request_decision_records',
      'request_decision_revisions', 'request_close_archive_records',
      'request_reopen_records'
    )
    AND a.grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT COUNT(*)::integer AS policy_count
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'requests'
    AND c.relname IN (
      'service_types', 'service_requests', 'request_selected_activities',
      'request_selected_branches', 'request_form_snapshots',
      'request_form_snapshot_payloads', 'request_status_histories',
      'request_assignment_histories', 'request_completion_requests',
      'request_completion_responses', 'request_decision_records',
      'request_decision_revisions', 'request_close_archive_records',
      'request_reopen_records'
    )
),
excluded_objects AS (
  SELECT
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'cases'
        AND c.relkind IN ('r', 'p', 'v', 'm')
    ) AS cases_relation_present
),
reopen_constraints AS (
  SELECT
    EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'requests'
        AND c.table_name = 'request_reopen_records'
        AND c.column_name = 'reason'
        AND c.is_nullable = 'NO'
    ) AS reopen_reason_not_null,
    EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'requests'
        AND c.table_name = 'request_reopen_records'
        AND c.column_name = 'reopened_by_staff_profile_id'
        AND c.is_nullable = 'NO'
    ) AS reopen_staff_not_null,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint x
      JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'requests'
        AND c.relname = 'request_reopen_records'
        AND x.contype = 'c'
        AND x.conname = 'request_reopen_records_reason_not_blank_check'
    ) AS reopen_reason_not_blank_check_present
),
seed_row_counts AS (
  SELECT
    (SELECT COUNT(*)::integer FROM requests.service_types) AS service_types_row_count,
    (SELECT COUNT(*)::integer FROM requests.service_requests) AS service_requests_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_selected_activities) AS request_selected_activities_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_selected_branches) AS request_selected_branches_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_form_snapshots) AS request_form_snapshots_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_form_snapshot_payloads) AS request_form_snapshot_payloads_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_status_histories) AS request_status_histories_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_assignment_histories) AS request_assignment_histories_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_completion_requests) AS request_completion_requests_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_completion_responses) AS request_completion_responses_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_decision_records) AS request_decision_records_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_decision_revisions) AS request_decision_revisions_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_close_archive_records) AS request_close_archive_records_row_count,
    (SELECT COUNT(*)::integer FROM requests.request_reopen_records) AS request_reopen_records_row_count
),
summary AS (
  SELECT COUNT(*) FILTER (WHERE status <> 'OK') AS table_mismatch_count FROM table_mismatches
),
index_summary AS (
  SELECT COUNT(*) FILTER (WHERE status <> 'OK') AS index_mismatch_count FROM index_mismatches
),
grant_summary AS (
  SELECT COUNT(*) AS forbidden_grant_count FROM forbidden_grants
),
seed_summary AS (
  SELECT s.*,
    CASE WHEN service_types_row_count <> 0 OR service_requests_row_count <> 0
      OR request_selected_activities_row_count <> 0 OR request_selected_branches_row_count <> 0
      OR request_form_snapshots_row_count <> 0 OR request_form_snapshot_payloads_row_count <> 0
      OR request_status_histories_row_count <> 0 OR request_assignment_histories_row_count <> 0
      OR request_completion_requests_row_count <> 0 OR request_completion_responses_row_count <> 0
      OR request_decision_records_row_count <> 0 OR request_decision_revisions_row_count <> 0
      OR request_close_archive_records_row_count <> 0 OR request_reopen_records_row_count <> 0
      THEN 1 ELSE 0 END AS seed_mismatch_count
  FROM seed_row_counts s
)
SELECT
  dp.taxpayers_present,
  dp.commercial_activities_present,
  dp.branches_present,
  dp.user_profiles_present,
  dp.staff_profiles_present,
  s.table_mismatch_count,
  ix.index_mismatch_count,
  gs.forbidden_grant_count,
  pc.policy_count,
  eo.cases_relation_present,
  rc.reopen_reason_not_null,
  rc.reopen_staff_not_null,
  rc.reopen_reason_not_blank_check_present,
  ss.seed_mismatch_count,
  ss.service_types_row_count,
  ss.service_requests_row_count,
  ss.request_selected_activities_row_count,
  ss.request_selected_branches_row_count,
  ss.request_form_snapshots_row_count,
  ss.request_form_snapshot_payloads_row_count,
  ss.request_status_histories_row_count,
  ss.request_assignment_histories_row_count,
  ss.request_completion_requests_row_count,
  ss.request_completion_responses_row_count,
  ss.request_decision_records_row_count,
  ss.request_decision_revisions_row_count,
  ss.request_close_archive_records_row_count,
  ss.request_reopen_records_row_count,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(t) ORDER BY t.table_name)
    FROM table_mismatches t WHERE t.status <> 'OK'
  ), '[]'::jsonb) AS table_mismatches,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(i) ORDER BY i.index_name)
    FROM index_mismatches i WHERE i.status <> 'OK'
  ), '[]'::jsonb) AS index_mismatches,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(g) ORDER BY g.table_name, g.grantee, g.privilege_type)
    FROM forbidden_grants g
  ), '[]'::jsonb) AS forbidden_grants,
  CASE
    WHEN NOT dp.taxpayers_present OR NOT dp.commercial_activities_present
      OR NOT dp.branches_present OR NOT dp.user_profiles_present
      OR NOT dp.staff_profiles_present
      THEN 'FAIL_DEPENDENCY_MISSING'
    WHEN s.table_mismatch_count <> 0 THEN 'FAIL_TABLE_OR_RLS_MISMATCH'
    WHEN ix.index_mismatch_count <> 0 THEN 'FAIL_INDEX_MISMATCH'
    WHEN eo.cases_relation_present THEN 'FAIL_CASES_RELATION_PRESENT'
    WHEN NOT rc.reopen_reason_not_null
      OR NOT rc.reopen_staff_not_null
      OR NOT rc.reopen_reason_not_blank_check_present
      THEN 'FAIL_REOPEN_CONSTRAINT_MISSING'
    WHEN gs.forbidden_grant_count <> 0 THEN 'FAIL_FORBIDDEN_GRANT'
    WHEN pc.policy_count <> 0 THEN 'FAIL_UNEXPECTED_POLICY'
    WHEN ss.seed_mismatch_count <> 0 THEN 'FAIL_SEED_ROWS_PRESENT'
    ELSE 'PASS'
  END AS final_status
FROM dependency_presence dp
CROSS JOIN summary s
CROSS JOIN index_summary ix
CROSS JOIN grant_summary gs
CROSS JOIN policy_count pc
CROSS JOIN excluded_objects eo
CROSS JOIN reopen_constraints rc
CROSS JOIN seed_summary ss;
