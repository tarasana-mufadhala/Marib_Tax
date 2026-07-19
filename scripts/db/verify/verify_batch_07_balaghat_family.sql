-- MARIB-TAX-DB-FOUNDATION-BATCH-07-BALAGHAT-FAMILY — read-only verification
-- Returns one authoritative result set with mismatch details.
-- Does not mutate data, privileges, policies, or schema objects.
-- Requires no table named cases; no seed/backfill rows in this source batch.

WITH
dependency_presence AS (
  SELECT
    pg_catalog.to_regclass('registry.taxpayers') IS NOT NULL AS taxpayers_present,
    pg_catalog.to_regclass('masterdata.commercial_activities') IS NOT NULL AS commercial_activities_present,
    pg_catalog.to_regclass('masterdata.branches') IS NOT NULL AS branches_present,
    pg_catalog.to_regclass('masterdata.properties') IS NOT NULL AS properties_present,
    pg_catalog.to_regclass('masterdata.property_units') IS NOT NULL AS property_units_present,
    pg_catalog.to_regclass('masterdata.property_ownership_records') IS NOT NULL AS property_ownership_records_present,
    pg_catalog.to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    pg_catalog.to_regclass('identity.staff_profiles') IS NOT NULL AS staff_profiles_present
),
expected_tables(schema_name, table_name) AS (
  VALUES
    ('balaghat', 'balaghs'),
    ('balaghat', 'balagh_selected_targets'),
    ('balaghat', 'balagh_selected_properties'),
    ('balaghat', 'balagh_selected_property_units'),
    ('balaghat', 'balagh_selected_activities'),
    ('balaghat', 'balagh_selected_branches'),
    ('balaghat', 'balagh_form_snapshots'),
    ('balaghat', 'balagh_form_snapshot_payloads'),
    ('balaghat', 'balagh_status_histories'),
    ('balaghat', 'balagh_assignment_histories'),
    ('balaghat', 'balagh_completion_requests'),
    ('balaghat', 'balagh_completion_responses'),
    ('balaghat', 'balagh_decision_records'),
    ('balaghat', 'balagh_decision_revisions'),
    ('balaghat', 'balagh_close_archive_records'),
    ('balaghat', 'balagh_reopen_records')
),
actual_tables AS (
  SELECT n.nspname AS schema_name, c.relname AS table_name, c.relkind,
    c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
  WHERE n.nspname = 'balaghat'
    AND c.relname IN (
      'balaghs', 'balagh_selected_targets', 'balagh_selected_properties',
      'balagh_selected_property_units', 'balagh_selected_activities',
      'balagh_selected_branches', 'balagh_form_snapshots',
      'balagh_form_snapshot_payloads', 'balagh_status_histories',
      'balagh_assignment_histories', 'balagh_completion_requests',
      'balagh_completion_responses', 'balagh_decision_records',
      'balagh_decision_revisions', 'balagh_close_archive_records',
      'balagh_reopen_records'
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
    ('balaghs_balagh_type_code_idx'),
    ('balaghs_filer_profile_id_idx'),
    ('balaghs_taxpayer_id_idx'),
    ('balaghs_status_code_idx'),
    ('balagh_selected_targets_balagh_id_idx'),
    ('balagh_selected_targets_taxpayer_id_idx'),
    ('balagh_selected_properties_balagh_id_idx'),
    ('balagh_selected_properties_property_id_idx'),
    ('balagh_selected_properties_ownership_record_id_idx'),
    ('balagh_selected_property_units_balagh_id_idx'),
    ('balagh_selected_property_units_selected_property_id_idx'),
    ('balagh_selected_property_units_property_unit_id_idx'),
    ('balagh_selected_activities_balagh_id_idx'),
    ('balagh_selected_activities_activity_id_idx'),
    ('balagh_selected_branches_balagh_id_idx'),
    ('balagh_selected_branches_selected_activity_id_idx'),
    ('balagh_selected_branches_branch_id_idx'),
    ('balagh_form_snapshots_balagh_id_idx'),
    ('balagh_form_snapshots_captured_at_idx'),
    ('balagh_status_histories_balagh_id_idx'),
    ('balagh_status_histories_changed_at_idx'),
    ('balagh_assignment_histories_balagh_id_idx'),
    ('balagh_assignment_histories_staff_profile_id_idx'),
    ('balagh_assignment_histories_changed_at_idx'),
    ('balagh_completion_requests_balagh_id_idx'),
    ('balagh_completion_requests_requested_at_idx'),
    ('balagh_completion_responses_responded_at_idx'),
    ('balagh_decision_records_outcome_code_idx'),
    ('balagh_decision_records_decided_at_idx'),
    ('balagh_decision_revisions_decision_id_idx'),
    ('balagh_decision_revisions_revised_at_idx'),
    ('balagh_close_archive_records_balagh_id_idx'),
    ('balagh_close_archive_records_acted_at_idx'),
    ('balagh_reopen_records_balagh_id_idx'),
    ('balagh_reopen_records_reopened_at_idx')
),
index_mismatches AS (
  SELECT e.index_name,
    CASE WHEN c.oid IS NULL THEN 'MISSING_INDEX' ELSE 'OK' END AS status
  FROM expected_indexes e
  LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'balaghat'
  LEFT JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid AND c.relname = e.index_name
),
forbidden_grants AS (
  SELECT a.table_schema AS schema_name, a.table_name, a.grantee, a.privilege_type
  FROM information_schema.role_table_grants a
  WHERE a.table_schema = 'balaghat'
    AND a.table_name IN (
      'balaghs', 'balagh_selected_targets', 'balagh_selected_properties',
      'balagh_selected_property_units', 'balagh_selected_activities',
      'balagh_selected_branches', 'balagh_form_snapshots',
      'balagh_form_snapshot_payloads', 'balagh_status_histories',
      'balagh_assignment_histories', 'balagh_completion_requests',
      'balagh_completion_responses', 'balagh_decision_records',
      'balagh_decision_revisions', 'balagh_close_archive_records',
      'balagh_reopen_records'
    )
    AND a.grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT COUNT(*)::integer AS policy_count
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'balaghat'
    AND c.relname IN (
      'balaghs', 'balagh_selected_targets', 'balagh_selected_properties',
      'balagh_selected_property_units', 'balagh_selected_activities',
      'balagh_selected_branches', 'balagh_form_snapshots',
      'balagh_form_snapshot_payloads', 'balagh_status_histories',
      'balagh_assignment_histories', 'balagh_completion_requests',
      'balagh_completion_responses', 'balagh_decision_records',
      'balagh_decision_revisions', 'balagh_close_archive_records',
      'balagh_reopen_records'
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
    ) AS cases_relation_present,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'masterdata'
        AND c.relname = 'property_ownership_units'
        AND c.relkind IN ('r', 'p', 'v', 'm')
    ) AS property_ownership_units_present
),
reopen_constraints AS (
  SELECT
    EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'balaghat'
        AND c.table_name = 'balagh_reopen_records'
        AND c.column_name = 'reason'
        AND c.is_nullable = 'NO'
    ) AS reopen_reason_not_null,
    EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'balaghat'
        AND c.table_name = 'balagh_reopen_records'
        AND c.column_name = 'reopened_by_staff_profile_id'
        AND c.is_nullable = 'NO'
    ) AS reopen_staff_not_null,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint x
      JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'balaghat'
        AND c.relname = 'balagh_reopen_records'
        AND x.contype = 'c'
        AND x.conname = 'balagh_reopen_records_reason_not_blank_check'
    ) AS reopen_reason_not_blank_check_present
),
filer_or_type_constraints AS (
  SELECT
    EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'balaghat'
        AND c.table_name = 'balaghs'
        AND c.column_name = 'balagh_type_code'
        AND c.is_nullable = 'NO'
    ) AS balagh_type_code_not_null,
    EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'balaghat'
        AND c.table_name = 'balaghs'
        AND c.column_name = 'filer_profile_id'
        AND c.is_nullable = 'NO'
    ) AS filer_profile_id_not_null
),
selection_unique_constraints AS (
  SELECT
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint x
      JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'balaghat' AND c.relname = 'balagh_selected_targets'
        AND x.contype = 'u' AND x.conname = 'balagh_selected_targets_balagh_taxpayer_role_key'
    ) AS targets_unique_present,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint x
      JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'balaghat' AND c.relname = 'balagh_selected_properties'
        AND x.contype = 'u' AND x.conname = 'balagh_selected_properties_balagh_property_key'
    ) AS properties_unique_present,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint x
      JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'balaghat' AND c.relname = 'balagh_selected_property_units'
        AND x.contype = 'u' AND x.conname = 'balagh_selected_property_units_selected_property_unit_key'
    ) AS property_units_unique_present,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint x
      JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'balaghat' AND c.relname = 'balagh_selected_activities'
        AND x.contype = 'u' AND x.conname = 'balagh_selected_activities_balagh_activity_key'
    ) AS activities_unique_present,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint x
      JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'balaghat' AND c.relname = 'balagh_selected_branches'
        AND x.contype = 'u' AND x.conname = 'balagh_selected_branches_selected_activity_branch_key'
    ) AS branches_unique_present
),
seed_row_counts AS (
  SELECT
    (SELECT COUNT(*)::integer FROM balaghat.balaghs) AS balaghs_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_selected_targets) AS balagh_selected_targets_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_selected_properties) AS balagh_selected_properties_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_selected_property_units) AS balagh_selected_property_units_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_selected_activities) AS balagh_selected_activities_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_selected_branches) AS balagh_selected_branches_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_form_snapshots) AS balagh_form_snapshots_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_form_snapshot_payloads) AS balagh_form_snapshot_payloads_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_status_histories) AS balagh_status_histories_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_assignment_histories) AS balagh_assignment_histories_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_completion_requests) AS balagh_completion_requests_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_completion_responses) AS balagh_completion_responses_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_decision_records) AS balagh_decision_records_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_decision_revisions) AS balagh_decision_revisions_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_close_archive_records) AS balagh_close_archive_records_row_count,
    (SELECT COUNT(*)::integer FROM balaghat.balagh_reopen_records) AS balagh_reopen_records_row_count
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
    CASE WHEN balaghs_row_count <> 0 OR balagh_selected_targets_row_count <> 0
      OR balagh_selected_properties_row_count <> 0 OR balagh_selected_property_units_row_count <> 0
      OR balagh_selected_activities_row_count <> 0 OR balagh_selected_branches_row_count <> 0
      OR balagh_form_snapshots_row_count <> 0 OR balagh_form_snapshot_payloads_row_count <> 0
      OR balagh_status_histories_row_count <> 0 OR balagh_assignment_histories_row_count <> 0
      OR balagh_completion_requests_row_count <> 0 OR balagh_completion_responses_row_count <> 0
      OR balagh_decision_records_row_count <> 0 OR balagh_decision_revisions_row_count <> 0
      OR balagh_close_archive_records_row_count <> 0 OR balagh_reopen_records_row_count <> 0
      THEN 1 ELSE 0 END AS seed_mismatch_count
  FROM seed_row_counts s
)
SELECT
  dp.taxpayers_present,
  dp.commercial_activities_present,
  dp.branches_present,
  dp.properties_present,
  dp.property_units_present,
  dp.property_ownership_records_present,
  dp.user_profiles_present,
  dp.staff_profiles_present,
  s.table_mismatch_count,
  ix.index_mismatch_count,
  gs.forbidden_grant_count,
  pc.policy_count,
  eo.cases_relation_present,
  eo.property_ownership_units_present,
  rc.reopen_reason_not_null,
  rc.reopen_staff_not_null,
  rc.reopen_reason_not_blank_check_present,
  ft.balagh_type_code_not_null,
  ft.filer_profile_id_not_null,
  su.targets_unique_present,
  su.properties_unique_present,
  su.property_units_unique_present,
  su.activities_unique_present,
  su.branches_unique_present,
  ss.seed_mismatch_count,
  ss.balaghs_row_count,
  ss.balagh_selected_targets_row_count,
  ss.balagh_selected_properties_row_count,
  ss.balagh_selected_property_units_row_count,
  ss.balagh_selected_activities_row_count,
  ss.balagh_selected_branches_row_count,
  ss.balagh_form_snapshots_row_count,
  ss.balagh_form_snapshot_payloads_row_count,
  ss.balagh_status_histories_row_count,
  ss.balagh_assignment_histories_row_count,
  ss.balagh_completion_requests_row_count,
  ss.balagh_completion_responses_row_count,
  ss.balagh_decision_records_row_count,
  ss.balagh_decision_revisions_row_count,
  ss.balagh_close_archive_records_row_count,
  ss.balagh_reopen_records_row_count,
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
      OR NOT dp.branches_present OR NOT dp.properties_present
      OR NOT dp.property_units_present OR NOT dp.property_ownership_records_present
      OR NOT dp.user_profiles_present OR NOT dp.staff_profiles_present
      THEN 'FAIL_DEPENDENCY_MISSING'
    WHEN s.table_mismatch_count <> 0 THEN 'FAIL_TABLE_OR_RLS_MISMATCH'
    WHEN ix.index_mismatch_count <> 0 THEN 'FAIL_INDEX_MISMATCH'
    WHEN eo.cases_relation_present THEN 'FAIL_CASES_RELATION_PRESENT'
    WHEN eo.property_ownership_units_present THEN 'FAIL_TABLE_021_PRESENT'
    WHEN NOT rc.reopen_reason_not_null
      OR NOT rc.reopen_staff_not_null
      OR NOT rc.reopen_reason_not_blank_check_present
      THEN 'FAIL_REOPEN_CONSTRAINT_MISSING'
    WHEN NOT ft.balagh_type_code_not_null
      OR NOT ft.filer_profile_id_not_null
      THEN 'FAIL_FILER_OR_TYPE_CONSTRAINT_MISSING'
    WHEN NOT su.targets_unique_present
      OR NOT su.properties_unique_present
      OR NOT su.property_units_unique_present
      OR NOT su.activities_unique_present
      OR NOT su.branches_unique_present
      THEN 'FAIL_SELECTION_UNIQUE_MISSING'
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
CROSS JOIN filer_or_type_constraints ft
CROSS JOIN selection_unique_constraints su
CROSS JOIN seed_summary ss;
