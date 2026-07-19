-- MARIB-TAX-DB-FOUNDATION-BATCH-05-MASTERDATA-ACTIVITIES-AND-PROPERTY — read-only verification
-- Returns one authoritative result set with mismatch details.
-- Does not mutate data, privileges, policies, or schema objects.
-- TABLE-021 and the proposed v_taxpayer_properties view must remain absent in this source-only batch.

WITH
dependency_presence AS (
  SELECT
    pg_catalog.to_regclass('registry.taxpayers') IS NOT NULL AS taxpayers_present,
    pg_catalog.to_regclass('legal.legal_entities') IS NOT NULL AS legal_entities_present,
    pg_catalog.to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present
),
expected_tables(schema_name, table_name) AS (
  VALUES
    ('masterdata', 'commercial_activities'),
    ('masterdata', 'branches'),
    ('masterdata', 'activity_addresses'),
    ('masterdata', 'activity_status_histories'),
    ('masterdata', 'properties'),
    ('masterdata', 'property_units'),
    ('masterdata', 'property_ownership_records'),
    ('masterdata', 'property_ownership_histories')
),
actual_tables AS (
  SELECT n.nspname AS schema_name, c.relname AS table_name, c.relkind,
    c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
  WHERE n.nspname = 'masterdata'
    AND c.relname IN (
      'commercial_activities', 'branches', 'activity_addresses',
      'activity_status_histories', 'properties', 'property_units',
      'property_ownership_records', 'property_ownership_histories'
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
    ('commercial_activities_taxpayer_id_idx'),
    ('branches_commercial_activity_id_idx'),
    ('activity_status_histories_activity_id_idx'),
    ('property_units_property_id_idx'),
    ('ownership_records_property_id_idx'),
    ('ownership_records_taxpayer_id_idx')
),
index_mismatches AS (
  SELECT e.index_name,
    CASE WHEN c.oid IS NULL THEN 'MISSING_INDEX' ELSE 'OK' END AS status
  FROM expected_indexes e
  LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'masterdata'
  LEFT JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid AND c.relname = e.index_name
),
forbidden_grants AS (
  SELECT a.table_schema AS schema_name, a.table_name, a.grantee, a.privilege_type
  FROM information_schema.role_table_grants a
  WHERE a.table_schema = 'masterdata'
    AND a.table_name IN (
      'commercial_activities', 'branches', 'activity_addresses',
      'activity_status_histories', 'properties', 'property_units',
      'property_ownership_records', 'property_ownership_histories'
    )
    AND a.grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT COUNT(*)::integer AS policy_count
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'masterdata'
    AND c.relname IN (
      'commercial_activities', 'branches', 'activity_addresses',
      'activity_status_histories', 'properties', 'property_units',
      'property_ownership_records', 'property_ownership_histories'
    )
),
excluded_objects AS (
  SELECT
    pg_catalog.to_regclass('masterdata.property_ownership_units') IS NOT NULL
      AS property_ownership_units_present,
    pg_catalog.to_regclass('masterdata.v_taxpayer_properties') IS NOT NULL
      AS taxpayer_properties_view_present
),
properties_taxpayer_column AS (
  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'masterdata'
      AND c.relname = 'properties'
      AND a.attname = 'taxpayer_id'
      AND a.attnum > 0
      AND NOT a.attisdropped
  ) AS properties_taxpayer_id_present
),
seed_row_counts AS (
  SELECT
    (SELECT COUNT(*)::integer FROM masterdata.commercial_activities) AS commercial_activities_row_count,
    (SELECT COUNT(*)::integer FROM masterdata.branches) AS branches_row_count,
    (SELECT COUNT(*)::integer FROM masterdata.activity_addresses) AS activity_addresses_row_count,
    (SELECT COUNT(*)::integer FROM masterdata.activity_status_histories) AS activity_status_histories_row_count,
    (SELECT COUNT(*)::integer FROM masterdata.properties) AS properties_row_count,
    (SELECT COUNT(*)::integer FROM masterdata.property_units) AS property_units_row_count,
    (SELECT COUNT(*)::integer FROM masterdata.property_ownership_records) AS property_ownership_records_row_count,
    (SELECT COUNT(*)::integer FROM masterdata.property_ownership_histories) AS property_ownership_histories_row_count
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
    CASE WHEN commercial_activities_row_count <> 0 OR branches_row_count <> 0
      OR activity_addresses_row_count <> 0 OR activity_status_histories_row_count <> 0
      OR properties_row_count <> 0 OR property_units_row_count <> 0
      OR property_ownership_records_row_count <> 0 OR property_ownership_histories_row_count <> 0
      THEN 1 ELSE 0 END AS seed_mismatch_count
  FROM seed_row_counts s
)
SELECT
  dp.taxpayers_present,
  dp.legal_entities_present,
  dp.user_profiles_present,
  s.table_mismatch_count,
  ix.index_mismatch_count,
  gs.forbidden_grant_count,
  pc.policy_count,
  eo.property_ownership_units_present,
  eo.taxpayer_properties_view_present,
  ptc.properties_taxpayer_id_present,
  ss.seed_mismatch_count,
  ss.commercial_activities_row_count,
  ss.branches_row_count,
  ss.activity_addresses_row_count,
  ss.activity_status_histories_row_count,
  ss.properties_row_count,
  ss.property_units_row_count,
  ss.property_ownership_records_row_count,
  ss.property_ownership_histories_row_count,
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
    WHEN NOT dp.taxpayers_present OR NOT dp.legal_entities_present OR NOT dp.user_profiles_present
      THEN 'FAIL_DEPENDENCY_MISSING'
    WHEN s.table_mismatch_count <> 0 THEN 'FAIL_TABLE_OR_RLS_MISMATCH'
    WHEN ix.index_mismatch_count <> 0 THEN 'FAIL_INDEX_MISMATCH'
    WHEN eo.property_ownership_units_present OR eo.taxpayer_properties_view_present
      THEN 'FAIL_EXCLUDED_OBJECT_PRESENT'
    WHEN ptc.properties_taxpayer_id_present THEN 'FAIL_PROPERTIES_TAXPAYER_ID_PRESENT'
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
CROSS JOIN properties_taxpayer_column ptc
CROSS JOIN seed_summary ss;
