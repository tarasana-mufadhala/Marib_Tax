-- MARIB-TAX-DB-FOUNDATION-BATCH-04-TAXPAYER-REGISTRY-AND-LEGAL-ENTITIES — read-only verification
-- Returns one authoritative result set with mismatch details.
-- Does not mutate data, privileges, policies, or schema objects.
-- Inventory is scoped to Batch 04 tables so earlier identity objects are not unexpected.

WITH
dependency_presence AS (
  SELECT
    pg_catalog.to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    pg_catalog.to_regclass('identity.staff_profiles') IS NOT NULL AS staff_profiles_present,
    pg_catalog.to_regclass('identity.roles') IS NOT NULL AS roles_present
),
expected_tables(schema_name, table_name) AS (
  VALUES
    ('registry', 'taxpayers'),
    ('registry', 'taxpayer_contacts'),
    ('registry', 'taxpayer_account_links'),
    ('registry', 'taxpayer_legal_entity_associations'),
    ('legal', 'legal_entities'),
    ('legal', 'tax_numbers')
),
actual_tables AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.relkind,
    c.relrowsecurity,
    c.relforcerowsecurity
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
  WHERE n.nspname IN ('registry', 'legal')
    AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
    AND c.relname IN (
      'taxpayers',
      'taxpayer_contacts',
      'taxpayer_account_links',
      'taxpayer_legal_entity_associations',
      'legal_entities',
      'tax_numbers'
    )
),
table_mismatches AS (
  SELECT
    e.schema_name,
    e.table_name,
    a.relkind,
    a.relrowsecurity,
    a.relforcerowsecurity,
    CASE
      WHEN a.table_name IS NULL THEN 'MISSING_TABLE'
      WHEN a.relkind <> 'r' THEN 'WRONG_RELKIND'
      WHEN NOT a.relrowsecurity THEN 'RLS_NOT_ENABLED'
      WHEN a.relforcerowsecurity THEN 'UNEXPECTED_FORCE_RLS'
      ELSE 'OK'
    END AS status
  FROM expected_tables e
  LEFT JOIN actual_tables a
    ON a.schema_name = e.schema_name
   AND a.table_name = e.table_name

  UNION ALL

  SELECT
    a.schema_name,
    a.table_name,
    a.relkind,
    a.relrowsecurity,
    a.relforcerowsecurity,
    'UNEXPECTED_RELATION' AS status
  FROM actual_tables a
  LEFT JOIN expected_tables e
    ON e.schema_name = a.schema_name
   AND e.table_name = a.table_name
  WHERE e.table_name IS NULL
),
expected_columns(schema_name, table_name, column_name, expected_type, expected_not_null) AS (
  VALUES
    ('registry', 'taxpayers', 'id', 'uuid', true),
    ('registry', 'taxpayers', 'public_ref', 'text', false),
    ('registry', 'taxpayers', 'display_name', 'text', true),
    ('registry', 'taxpayers', 'status_code', 'text', true),
    ('registry', 'taxpayers', 'created_at', 'timestamp with time zone', true),
    ('registry', 'taxpayers', 'created_by_profile_id', 'uuid', false),
    ('registry', 'taxpayers', 'updated_at', 'timestamp with time zone', false),
    ('registry', 'taxpayers', 'updated_by_profile_id', 'uuid', false),
    ('registry', 'taxpayers', 'correlation_id', 'uuid', false),
    ('registry', 'taxpayers', 'archived_at', 'timestamp with time zone', false),
    ('legal', 'legal_entities', 'id', 'uuid', true),
    ('legal', 'legal_entities', 'public_ref', 'text', false),
    ('legal', 'legal_entities', 'legal_name', 'text', true),
    ('legal', 'legal_entities', 'classification_code', 'text', false),
    ('legal', 'legal_entities', 'is_active', 'boolean', true),
    ('legal', 'legal_entities', 'created_at', 'timestamp with time zone', true),
    ('legal', 'legal_entities', 'created_by_profile_id', 'uuid', false),
    ('legal', 'legal_entities', 'updated_at', 'timestamp with time zone', false),
    ('legal', 'legal_entities', 'updated_by_profile_id', 'uuid', false),
    ('legal', 'legal_entities', 'correlation_id', 'uuid', false),
    ('legal', 'legal_entities', 'archived_at', 'timestamp with time zone', false),
    ('registry', 'taxpayer_contacts', 'id', 'uuid', true),
    ('registry', 'taxpayer_contacts', 'taxpayer_id', 'uuid', true),
    ('registry', 'taxpayer_contacts', 'contact_type_code', 'text', true),
    ('registry', 'taxpayer_contacts', 'contact_value', 'text', true),
    ('registry', 'taxpayer_contacts', 'is_primary', 'boolean', true),
    ('registry', 'taxpayer_contacts', 'is_active', 'boolean', true),
    ('registry', 'taxpayer_contacts', 'effective_from', 'timestamp with time zone', true),
    ('registry', 'taxpayer_contacts', 'effective_to', 'timestamp with time zone', false),
    ('registry', 'taxpayer_contacts', 'created_at', 'timestamp with time zone', true),
    ('registry', 'taxpayer_contacts', 'created_by_profile_id', 'uuid', false),
    ('registry', 'taxpayer_contacts', 'updated_at', 'timestamp with time zone', false),
    ('registry', 'taxpayer_contacts', 'updated_by_profile_id', 'uuid', false),
    ('registry', 'taxpayer_account_links', 'id', 'uuid', true),
    ('registry', 'taxpayer_account_links', 'public_ref', 'text', false),
    ('registry', 'taxpayer_account_links', 'user_profile_id', 'uuid', true),
    ('registry', 'taxpayer_account_links', 'taxpayer_id', 'uuid', true),
    ('registry', 'taxpayer_account_links', 'relationship_type_code', 'text', true),
    ('registry', 'taxpayer_account_links', 'active_state_code', 'text', true),
    ('registry', 'taxpayer_account_links', 'verification_status_code', 'text', true),
    ('registry', 'taxpayer_account_links', 'effective_from', 'timestamp with time zone', true),
    ('registry', 'taxpayer_account_links', 'effective_to', 'timestamp with time zone', false),
    ('registry', 'taxpayer_account_links', 'approved_by_profile_id', 'uuid', false),
    ('registry', 'taxpayer_account_links', 'revoked_by_profile_id', 'uuid', false),
    ('registry', 'taxpayer_account_links', 'reason_reference', 'text', false),
    ('registry', 'taxpayer_account_links', 'created_at', 'timestamp with time zone', true),
    ('registry', 'taxpayer_account_links', 'created_by_profile_id', 'uuid', false),
    ('registry', 'taxpayer_account_links', 'updated_at', 'timestamp with time zone', false),
    ('registry', 'taxpayer_account_links', 'updated_by_profile_id', 'uuid', false),
    ('registry', 'taxpayer_account_links', 'correlation_id', 'uuid', false),
    ('registry', 'taxpayer_legal_entity_associations', 'id', 'uuid', true),
    ('registry', 'taxpayer_legal_entity_associations', 'taxpayer_id', 'uuid', true),
    ('registry', 'taxpayer_legal_entity_associations', 'legal_entity_id', 'uuid', true),
    ('registry', 'taxpayer_legal_entity_associations', 'association_type_code', 'text', true),
    ('registry', 'taxpayer_legal_entity_associations', 'effective_from', 'timestamp with time zone', true),
    ('registry', 'taxpayer_legal_entity_associations', 'effective_to', 'timestamp with time zone', false),
    ('registry', 'taxpayer_legal_entity_associations', 'evidence_reference', 'text', false),
    ('registry', 'taxpayer_legal_entity_associations', 'created_at', 'timestamp with time zone', true),
    ('registry', 'taxpayer_legal_entity_associations', 'created_by_profile_id', 'uuid', false),
    ('registry', 'taxpayer_legal_entity_associations', 'updated_at', 'timestamp with time zone', false),
    ('registry', 'taxpayer_legal_entity_associations', 'updated_by_profile_id', 'uuid', false),
    ('registry', 'taxpayer_legal_entity_associations', 'correlation_id', 'uuid', false),
    ('legal', 'tax_numbers', 'id', 'uuid', true),
    ('legal', 'tax_numbers', 'legal_entity_id', 'uuid', true),
    ('legal', 'tax_numbers', 'taxpayer_id', 'uuid', false),
    ('legal', 'tax_numbers', 'tax_number_value', 'text', true),
    ('legal', 'tax_numbers', 'status_code', 'text', true),
    ('legal', 'tax_numbers', 'issued_at', 'timestamp with time zone', false),
    ('legal', 'tax_numbers', 'superseded_by_id', 'uuid', false),
    ('legal', 'tax_numbers', 'correction_reason', 'text', false),
    ('legal', 'tax_numbers', 'created_at', 'timestamp with time zone', true),
    ('legal', 'tax_numbers', 'created_by_profile_id', 'uuid', false),
    ('legal', 'tax_numbers', 'updated_at', 'timestamp with time zone', false),
    ('legal', 'tax_numbers', 'updated_by_profile_id', 'uuid', false),
    ('legal', 'tax_numbers', 'correlation_id', 'uuid', false)
),
actual_columns AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS actual_type,
    a.attnotnull AS actual_not_null
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c
    ON c.relnamespace = n.oid
   AND c.relkind = 'r'
  JOIN pg_catalog.pg_attribute a
    ON a.attrelid = c.oid
   AND a.attnum > 0
   AND NOT a.attisdropped
  WHERE n.nspname IN ('registry', 'legal')
    AND c.relname IN (
      'taxpayers',
      'taxpayer_contacts',
      'taxpayer_account_links',
      'taxpayer_legal_entity_associations',
      'legal_entities',
      'tax_numbers'
    )
),
column_mismatches AS (
  SELECT
    e.schema_name,
    e.table_name,
    e.column_name,
    e.expected_type,
    e.expected_not_null,
    a.actual_type,
    a.actual_not_null,
    CASE
      WHEN a.column_name IS NULL THEN 'MISSING_COLUMN'
      WHEN a.actual_type <> e.expected_type THEN 'WRONG_TYPE'
      WHEN a.actual_not_null IS DISTINCT FROM e.expected_not_null THEN 'WRONG_NULLABILITY'
      ELSE 'OK'
    END AS status
  FROM expected_columns e
  LEFT JOIN actual_columns a
    ON a.schema_name = e.schema_name
   AND a.table_name = e.table_name
   AND a.column_name = e.column_name

  UNION ALL

  SELECT
    a.schema_name,
    a.table_name,
    a.column_name,
    NULL::text,
    NULL::boolean,
    a.actual_type,
    a.actual_not_null,
    'UNEXPECTED_COLUMN' AS status
  FROM actual_columns a
  LEFT JOIN expected_columns e
    ON e.schema_name = a.schema_name
   AND e.table_name = a.table_name
   AND e.column_name = a.column_name
  WHERE e.column_name IS NULL
),
expected_indexes(schema_name, index_name) AS (
  VALUES
    ('registry', 'taxpayer_account_links_one_active_taxpayer_per_profile_idx'),
    ('legal', 'tax_numbers_issued_value_uidx')
),
actual_indexes AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS index_name,
    i.indisunique
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
  JOIN pg_catalog.pg_index i ON i.indexrelid = c.oid
  WHERE n.nspname IN ('registry', 'legal')
    AND c.relname IN (
      'taxpayer_account_links_one_active_taxpayer_per_profile_idx',
      'tax_numbers_issued_value_uidx'
    )
),
index_mismatches AS (
  SELECT
    e.schema_name,
    e.index_name,
    a.indisunique,
    CASE
      WHEN a.index_name IS NULL THEN 'MISSING_INDEX'
      WHEN NOT a.indisunique THEN 'NOT_UNIQUE'
      ELSE 'OK'
    END AS status
  FROM expected_indexes e
  LEFT JOIN actual_indexes a
    ON a.schema_name = e.schema_name
   AND a.index_name = e.index_name
),
forbidden_grants AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    a.grantee,
    a.privilege_type
  FROM information_schema.role_table_grants a
  JOIN pg_catalog.pg_namespace n ON n.nspname = a.table_schema
  JOIN pg_catalog.pg_class c
    ON c.relnamespace = n.oid
   AND c.relname = a.table_name
  WHERE a.table_schema IN ('registry', 'legal')
    AND a.table_name IN (
      'taxpayers',
      'taxpayer_contacts',
      'taxpayer_account_links',
      'taxpayer_legal_entity_associations',
      'legal_entities',
      'tax_numbers'
    )
    AND a.grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT COUNT(*)::integer AS policy_count
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('registry', 'legal')
    AND c.relname IN (
      'taxpayers',
      'taxpayer_contacts',
      'taxpayer_account_links',
      'taxpayer_legal_entity_associations',
      'legal_entities',
      'tax_numbers'
    )
),
seed_row_counts AS (
  SELECT
    (SELECT COUNT(*)::integer FROM registry.taxpayers) AS taxpayers_row_count,
    (SELECT COUNT(*)::integer FROM registry.taxpayer_contacts) AS taxpayer_contacts_row_count,
    (SELECT COUNT(*)::integer FROM registry.taxpayer_account_links) AS taxpayer_account_links_row_count,
    (SELECT COUNT(*)::integer FROM registry.taxpayer_legal_entity_associations) AS taxpayer_legal_entity_associations_row_count,
    (SELECT COUNT(*)::integer FROM legal.legal_entities) AS legal_entities_row_count,
    (SELECT COUNT(*)::integer FROM legal.tax_numbers) AS tax_numbers_row_count
),
digits_check_present AS (
  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_class rel ON rel.oid = c.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'legal'
      AND rel.relname = 'tax_numbers'
      AND c.conname = 'tax_numbers_value_digits_only_check'
  ) AS tax_number_digits_check_present
),
summary AS (
  SELECT COUNT(*) FILTER (WHERE status <> 'OK') AS table_mismatch_count
  FROM table_mismatches
),
column_summary AS (
  SELECT COUNT(*) FILTER (WHERE status <> 'OK') AS column_mismatch_count
  FROM column_mismatches
),
index_summary AS (
  SELECT COUNT(*) FILTER (WHERE status <> 'OK') AS index_mismatch_count
  FROM index_mismatches
),
grant_summary AS (
  SELECT COUNT(*) AS forbidden_grant_count
  FROM forbidden_grants
),
seed_summary AS (
  SELECT
    s.*,
    CASE
      WHEN s.taxpayers_row_count <> 0
        OR s.taxpayer_contacts_row_count <> 0
        OR s.taxpayer_account_links_row_count <> 0
        OR s.taxpayer_legal_entity_associations_row_count <> 0
        OR s.legal_entities_row_count <> 0
        OR s.tax_numbers_row_count <> 0
        THEN 1
      ELSE 0
    END AS seed_mismatch_count
  FROM seed_row_counts s
)
SELECT
  dp.user_profiles_present,
  dp.staff_profiles_present,
  dp.roles_present,
  s.table_mismatch_count,
  cs.column_mismatch_count,
  ix.index_mismatch_count,
  gs.forbidden_grant_count,
  ss.seed_mismatch_count,
  ss.taxpayers_row_count,
  ss.taxpayer_contacts_row_count,
  ss.taxpayer_account_links_row_count,
  ss.taxpayer_legal_entity_associations_row_count,
  ss.legal_entities_row_count,
  ss.tax_numbers_row_count,
  pc.policy_count,
  d.tax_number_digits_check_present,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(t) ORDER BY t.schema_name, t.table_name)
      FROM table_mismatches t
      WHERE t.status <> 'OK'
    ),
    '[]'::jsonb
  ) AS table_mismatches,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.schema_name, c.table_name, c.column_name)
      FROM column_mismatches c
      WHERE c.status <> 'OK'
    ),
    '[]'::jsonb
  ) AS column_mismatches,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(i) ORDER BY i.schema_name, i.index_name)
      FROM index_mismatches i
      WHERE i.status <> 'OK'
    ),
    '[]'::jsonb
  ) AS index_mismatches,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(g) ORDER BY g.schema_name, g.table_name, g.grantee, g.privilege_type)
      FROM forbidden_grants g
    ),
    '[]'::jsonb
  ) AS forbidden_grants,
  CASE
    WHEN NOT dp.user_profiles_present
      OR NOT dp.staff_profiles_present
      OR NOT dp.roles_present
      THEN 'FAIL_DEPENDENCY_MISSING'
    WHEN s.table_mismatch_count <> 0 THEN 'FAIL_TABLE_OR_RLS_MISMATCH'
    WHEN cs.column_mismatch_count <> 0 THEN 'FAIL_COLUMN_MISMATCH'
    WHEN ix.index_mismatch_count <> 0 THEN 'FAIL_INDEX_MISMATCH'
    WHEN NOT d.tax_number_digits_check_present THEN 'FAIL_TAX_NUMBER_DIGITS_CHECK'
    WHEN gs.forbidden_grant_count <> 0 THEN 'FAIL_FORBIDDEN_GRANT'
    WHEN pc.policy_count <> 0 THEN 'FAIL_UNEXPECTED_POLICY'
    WHEN ss.seed_mismatch_count <> 0 THEN 'FAIL_SEED_ROWS_PRESENT'
    ELSE 'PASS'
  END AS final_status
FROM dependency_presence dp
CROSS JOIN summary s
CROSS JOIN column_summary cs
CROSS JOIN index_summary ix
CROSS JOIN grant_summary gs
CROSS JOIN seed_summary ss
CROSS JOIN policy_count pc
CROSS JOIN digits_check_present d;
