-- MARIB-TAX-DB-FOUNDATION-BATCH-03-AUTHORIZATION-MODEL — read-only verification
-- Returns one authoritative result set with mismatch details.
-- Does not mutate data, privileges, policies, or schema objects.
-- Relation and index inventory is scoped to Batch 03 tables so Batch 02
-- prerequisite tables are not treated as unexpected objects.

WITH
dependency_presence AS (
  SELECT
    pg_catalog.to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    pg_catalog.to_regclass('identity.staff_profiles') IS NOT NULL AS staff_profiles_present
),
expected_tables(table_name) AS (
  VALUES
    ('roles'),
    ('permissions'),
    ('role_permissions'),
    ('staff_role_assignments')
),
actual_tables AS (
  SELECT
    c.relname AS table_name,
    c.relkind,
    c.relrowsecurity,
    c.relforcerowsecurity,
    pg_catalog.pg_get_userbyid(c.relowner) AS table_owner
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
  WHERE n.nspname = 'identity'
    AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
    AND c.relname IN (
      'roles',
      'permissions',
      'role_permissions',
      'staff_role_assignments'
    )
),
table_mismatches AS (
  SELECT
    e.table_name,
    a.relkind,
    a.relrowsecurity,
    a.relforcerowsecurity,
    a.table_owner,
    CASE
      WHEN a.table_name IS NULL THEN 'MISSING_TABLE'
      WHEN a.relkind <> 'r' THEN 'WRONG_RELKIND'
      WHEN NOT a.relrowsecurity THEN 'RLS_NOT_ENABLED'
      WHEN a.relforcerowsecurity THEN 'UNEXPECTED_FORCE_RLS'
      ELSE 'OK'
    END AS status
  FROM expected_tables e
  LEFT JOIN actual_tables a USING (table_name)

  UNION ALL

  SELECT
    a.table_name,
    a.relkind,
    a.relrowsecurity,
    a.relforcerowsecurity,
    a.table_owner,
    'UNEXPECTED_RELATION' AS status
  FROM actual_tables a
  LEFT JOIN expected_tables e USING (table_name)
  WHERE e.table_name IS NULL
),
expected_columns(
  table_name,
  ordinal,
  column_name,
  expected_type,
  expected_not_null,
  expected_default
) AS (
  VALUES
    ('roles', 1, 'id', 'uuid', true, NULL),
    ('roles', 2, 'code', 'text', true, NULL),
    ('roles', 3, 'name_ar', 'text', true, NULL),
    ('roles', 4, 'description', 'text', false, NULL),
    ('roles', 5, 'is_system', 'boolean', true, 'false'),
    ('roles', 6, 'is_active', 'boolean', true, 'true'),
    ('roles', 7, 'created_at', 'timestamp with time zone', true, 'now()'),
    ('roles', 8, 'created_by_profile_id', 'uuid', false, NULL),
    ('roles', 9, 'updated_at', 'timestamp with time zone', false, NULL),
    ('roles', 10, 'updated_by_profile_id', 'uuid', false, NULL),
    ('roles', 11, 'archived_at', 'timestamp with time zone', false, NULL),
    ('permissions', 1, 'id', 'uuid', true, NULL),
    ('permissions', 2, 'code', 'text', true, NULL),
    ('permissions', 3, 'resource', 'text', true, NULL),
    ('permissions', 4, 'action', 'text', true, NULL),
    ('permissions', 5, 'name_ar', 'text', true, NULL),
    ('permissions', 6, 'description', 'text', false, NULL),
    ('permissions', 7, 'is_active', 'boolean', true, 'true'),
    ('permissions', 8, 'created_at', 'timestamp with time zone', true, 'now()'),
    ('permissions', 9, 'created_by_profile_id', 'uuid', false, NULL),
    ('permissions', 10, 'updated_at', 'timestamp with time zone', false, NULL),
    ('permissions', 11, 'updated_by_profile_id', 'uuid', false, NULL),
    ('permissions', 12, 'archived_at', 'timestamp with time zone', false, NULL),
    ('role_permissions', 1, 'role_id', 'uuid', true, NULL),
    ('role_permissions', 2, 'permission_id', 'uuid', true, NULL),
    ('role_permissions', 3, 'granted_at', 'timestamp with time zone', true, 'now()'),
    ('role_permissions', 4, 'granted_by_profile_id', 'uuid', false, NULL),
    ('staff_role_assignments', 1, 'id', 'uuid', true, NULL),
    ('staff_role_assignments', 2, 'staff_profile_id', 'uuid', true, NULL),
    ('staff_role_assignments', 3, 'role_id', 'uuid', true, NULL),
    ('staff_role_assignments', 4, 'effective_from', 'timestamp with time zone', true, NULL),
    ('staff_role_assignments', 5, 'effective_to', 'timestamp with time zone', false, NULL),
    ('staff_role_assignments', 6, 'assigned_at', 'timestamp with time zone', true, 'now()'),
    ('staff_role_assignments', 7, 'assigned_by_profile_id', 'uuid', false, NULL),
    ('staff_role_assignments', 8, 'revoked_at', 'timestamp with time zone', false, NULL),
    ('staff_role_assignments', 9, 'revoked_by_profile_id', 'uuid', false, NULL),
    ('staff_role_assignments', 10, 'revocation_reason', 'text', false, NULL)
),
actual_columns AS (
  SELECT
    c.relname AS table_name,
    a.attnum AS ordinal,
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS actual_type,
    a.attnotnull AS actual_not_null,
    pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) AS actual_default
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c
    ON c.relnamespace = n.oid
   AND c.relkind = 'r'
  JOIN pg_catalog.pg_attribute a
    ON a.attrelid = c.oid
   AND a.attnum > 0
   AND NOT a.attisdropped
  LEFT JOIN pg_catalog.pg_attrdef ad
    ON ad.adrelid = a.attrelid
   AND ad.adnum = a.attnum
  WHERE n.nspname = 'identity'
    AND c.relname IN (
      'roles',
      'permissions',
      'role_permissions',
      'staff_role_assignments'
    )
),
column_mismatches AS (
  SELECT
    COALESCE(e.table_name, a.table_name) AS table_name,
    COALESCE(e.column_name, a.column_name) AS column_name,
    e.ordinal AS expected_ordinal,
    a.ordinal AS actual_ordinal,
    e.expected_type,
    a.actual_type,
    e.expected_not_null,
    a.actual_not_null,
    e.expected_default,
    a.actual_default,
    CASE
      WHEN e.column_name IS NULL THEN 'UNEXPECTED_COLUMN'
      WHEN a.column_name IS NULL THEN 'MISSING_COLUMN'
      WHEN a.ordinal <> e.ordinal THEN 'ORDINAL_MISMATCH'
      WHEN a.actual_type <> e.expected_type THEN 'TYPE_MISMATCH'
      WHEN a.actual_not_null <> e.expected_not_null THEN 'NULLABILITY_MISMATCH'
      WHEN a.actual_default IS DISTINCT FROM e.expected_default THEN 'DEFAULT_MISMATCH'
      ELSE 'OK'
    END AS status
  FROM expected_columns e
  FULL OUTER JOIN actual_columns a
    ON a.table_name = e.table_name
   AND a.column_name = e.column_name
),
expected_constraints(
  constraint_name,
  table_name,
  constraint_type,
  source_columns,
  target_table,
  target_columns,
  expected_check
) AS (
  VALUES
    ('roles_pkey', 'roles', 'p', ARRAY['id']::text[], NULL, NULL, NULL),
    ('roles_code_key', 'roles', 'u', ARRAY['code']::text[], NULL, NULL, NULL),
    ('roles_code_format_check', 'roles', 'c', NULL, NULL, NULL, 'code~''^[a-z][a-z0-9_]{2,63}$'''),
    ('roles_name_ar_not_blank_check', 'roles', 'c', NULL, NULL, NULL, 'btrimname_ar<>'''''),
    ('roles_created_by_profile_id_fkey', 'roles', 'f', ARRAY['created_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('roles_updated_by_profile_id_fkey', 'roles', 'f', ARRAY['updated_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('permissions_pkey', 'permissions', 'p', ARRAY['id']::text[], NULL, NULL, NULL),
    ('permissions_code_key', 'permissions', 'u', ARRAY['code']::text[], NULL, NULL, NULL),
    ('permissions_resource_action_key', 'permissions', 'u', ARRAY['resource', 'action']::text[], NULL, NULL, NULL),
    ('permissions_resource_format_check', 'permissions', 'c', NULL, NULL, NULL, 'resource~''^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*{0,3}$'''),
    ('permissions_action_format_check', 'permissions', 'c', NULL, NULL, NULL, 'action~''^[a-z][a-z0-9_]{0,63}$'''),
    ('permissions_code_match_check', 'permissions', 'c', NULL, NULL, NULL, 'code=resource||''.''||action'),
    ('permissions_name_ar_not_blank_check', 'permissions', 'c', NULL, NULL, NULL, 'btrimname_ar<>'''''),
    ('permissions_created_by_profile_id_fkey', 'permissions', 'f', ARRAY['created_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('permissions_updated_by_profile_id_fkey', 'permissions', 'f', ARRAY['updated_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('role_permissions_pkey', 'role_permissions', 'p', ARRAY['role_id', 'permission_id']::text[], NULL, NULL, NULL),
    ('role_permissions_role_id_fkey', 'role_permissions', 'f', ARRAY['role_id']::text[], 'identity.roles', ARRAY['id']::text[], NULL),
    ('role_permissions_permission_id_fkey', 'role_permissions', 'f', ARRAY['permission_id']::text[], 'identity.permissions', ARRAY['id']::text[], NULL),
    ('role_permissions_granted_by_profile_id_fkey', 'role_permissions', 'f', ARRAY['granted_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('staff_role_assignments_pkey', 'staff_role_assignments', 'p', ARRAY['id']::text[], NULL, NULL, NULL),
    ('staff_role_assignments_staff_role_effective_key', 'staff_role_assignments', 'u', ARRAY['staff_profile_id', 'role_id', 'effective_from']::text[], NULL, NULL, NULL),
    ('staff_role_assignments_staff_profile_id_fkey', 'staff_role_assignments', 'f', ARRAY['staff_profile_id']::text[], 'identity.staff_profiles', ARRAY['id']::text[], NULL),
    ('staff_role_assignments_role_id_fkey', 'staff_role_assignments', 'f', ARRAY['role_id']::text[], 'identity.roles', ARRAY['id']::text[], NULL),
    ('staff_role_assignments_assigned_by_profile_id_fkey', 'staff_role_assignments', 'f', ARRAY['assigned_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('staff_role_assignments_revoked_by_profile_id_fkey', 'staff_role_assignments', 'f', ARRAY['revoked_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('staff_role_assignments_effective_period_check', 'staff_role_assignments', 'c', NULL, NULL, NULL, 'effective_toISNULLOReffective_to>effective_from'),
    ('staff_role_assignments_revoked_at_check', 'staff_role_assignments', 'c', NULL, NULL, NULL, 'revoked_atISNULLORrevoked_at>=effective_from'),
    ('staff_role_assignments_revocation_consistency_check', 'staff_role_assignments', 'c', NULL, NULL, NULL, 'revoked_atISNULLANDrevoked_by_profile_idISNULLANDrevocation_reasonISNULLORrevoked_atISNOTNULLANDrevoked_by_profile_idISNOTNULL'),
    ('staff_role_assignments_revocation_reason_check', 'staff_role_assignments', 'c', NULL, NULL, NULL, 'revocation_reasonISNULLORbtrimrevocation_reason<>''''')
),
actual_constraints AS (
  SELECT
    con.conname AS constraint_name,
    c.relname AS table_name,
    con.contype::text AS constraint_type,
    ARRAY(
      SELECT a.attname
      FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
      JOIN pg_catalog.pg_attribute a
        ON a.attrelid = con.conrelid
       AND a.attnum = k.attnum
      ORDER BY k.ord
    )::text[] AS source_columns,
    CASE
      WHEN con.contype = 'f' THEN fn.nspname || '.' || fc.relname
      ELSE NULL
    END AS target_table,
    CASE
      WHEN con.contype = 'f' THEN ARRAY(
        SELECT a.attname
        FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_catalog.pg_attribute a
          ON a.attrelid = con.confrelid
         AND a.attnum = k.attnum
        ORDER BY k.ord
      )::text[]
      ELSE NULL
    END AS target_columns,
    con.confupdtype,
    con.confdeltype,
    con.condeferrable,
    con.condeferred,
    con.convalidated,
    pg_catalog.pg_get_constraintdef(con.oid, true) AS definition,
    CASE
      WHEN con.contype = 'c' THEN pg_catalog.regexp_replace(
        pg_catalog.regexp_replace(
          pg_catalog.pg_get_expr(con.conbin, con.conrelid),
          '::text',
          '',
          'g'
        ),
        '[[:space:]()]',
        '',
        'g'
      )
      ELSE NULL
    END AS normalized_check
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_catalog.pg_class fc ON fc.oid = con.confrelid
  LEFT JOIN pg_catalog.pg_namespace fn ON fn.oid = fc.relnamespace
  WHERE n.nspname = 'identity'
    AND c.relname IN (
      'roles',
      'permissions',
      'role_permissions',
      'staff_role_assignments'
    )
),
constraint_mismatches AS (
  SELECT
    COALESCE(e.table_name, a.table_name) AS table_name,
    COALESCE(e.constraint_name, a.constraint_name) AS constraint_name,
    e.constraint_type AS expected_type,
    a.constraint_type AS actual_type,
    e.source_columns AS expected_source_columns,
    a.source_columns AS actual_source_columns,
    e.target_table AS expected_target_table,
    a.target_table AS actual_target_table,
    e.target_columns AS expected_target_columns,
    a.target_columns AS actual_target_columns,
    a.definition,
    a.normalized_check,
    CASE
      WHEN e.constraint_name IS NULL THEN 'UNEXPECTED_CONSTRAINT'
      WHEN a.constraint_name IS NULL THEN 'MISSING_CONSTRAINT'
      WHEN a.constraint_type <> e.constraint_type THEN 'TYPE_MISMATCH'
      WHEN e.constraint_type <> 'c'
       AND a.source_columns IS DISTINCT FROM e.source_columns THEN 'SOURCE_COLUMN_MISMATCH'
      WHEN a.target_table IS DISTINCT FROM e.target_table THEN 'TARGET_TABLE_MISMATCH'
      WHEN a.target_columns IS DISTINCT FROM e.target_columns THEN 'TARGET_COLUMN_MISMATCH'
      WHEN a.constraint_type = 'f'
       AND (
         a.confupdtype <> 'a'
         OR a.confdeltype <> 'r'
         OR a.condeferrable
         OR a.condeferred
         OR NOT a.convalidated
       ) THEN 'FOREIGN_KEY_ACTION_MISMATCH'
      WHEN e.expected_check IS NOT NULL
       AND a.normalized_check <> e.expected_check THEN 'CHECK_DEFINITION_MISMATCH'
      WHEN a.condeferrable OR a.condeferred THEN 'UNEXPECTED_DEFERRABLE'
      ELSE 'OK'
    END AS status
  FROM expected_constraints e
  FULL OUTER JOIN actual_constraints a
    ON a.constraint_name = e.constraint_name
   AND a.table_name = e.table_name
),
expected_indexes(
  index_name,
  table_name,
  is_unique,
  expected_predicate
) AS (
  VALUES
    ('roles_pkey', 'roles', true, NULL),
    ('roles_code_key', 'roles', true, NULL),
    ('permissions_pkey', 'permissions', true, NULL),
    ('permissions_code_key', 'permissions', true, NULL),
    ('permissions_resource_action_key', 'permissions', true, NULL),
    ('role_permissions_pkey', 'role_permissions', true, NULL),
    ('role_permissions_permission_id_idx', 'role_permissions', false, NULL),
    ('staff_role_assignments_pkey', 'staff_role_assignments', true, NULL),
    ('staff_role_assignments_staff_role_effective_key', 'staff_role_assignments', true, NULL),
    ('staff_role_assignments_staff_profile_id_idx', 'staff_role_assignments', false, NULL),
    ('staff_role_assignments_role_id_idx', 'staff_role_assignments', false, NULL),
    (
      'staff_role_assignments_one_open_assignment_idx',
      'staff_role_assignments',
      true,
      'effective_toISNULLANDrevoked_atISNULL'
    )
),
actual_indexes AS (
  SELECT
    ic.relname AS index_name,
    tc.relname AS table_name,
    i.indisunique AS is_unique,
    CASE
      WHEN i.indpred IS NULL THEN NULL
      ELSE pg_catalog.regexp_replace(
        pg_catalog.pg_get_expr(i.indpred, i.indrelid),
        '[[:space:]()]',
        '',
        'g'
      )
    END AS normalized_predicate
  FROM pg_catalog.pg_index i
  JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid
  JOIN pg_catalog.pg_class tc ON tc.oid = i.indrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = tc.relnamespace
  WHERE n.nspname = 'identity'
    AND tc.relname IN (
      'roles',
      'permissions',
      'role_permissions',
      'staff_role_assignments'
    )
),
index_mismatches AS (
  SELECT
    COALESCE(e.index_name, a.index_name) AS index_name,
    COALESCE(e.table_name, a.table_name) AS table_name,
    e.is_unique AS expected_unique,
    a.is_unique AS actual_unique,
    e.expected_predicate,
    a.normalized_predicate AS actual_predicate,
    CASE
      WHEN e.index_name IS NULL THEN 'UNEXPECTED_INDEX'
      WHEN a.index_name IS NULL THEN 'MISSING_INDEX'
      WHEN a.is_unique IS DISTINCT FROM e.is_unique THEN 'UNIQUENESS_MISMATCH'
      WHEN e.expected_predicate IS NOT NULL
       AND a.normalized_predicate IS DISTINCT FROM e.expected_predicate
        THEN 'PREDICATE_MISMATCH'
      WHEN e.expected_predicate IS NULL
       AND a.normalized_predicate IS NOT NULL
        THEN 'UNEXPECTED_PREDICATE'
      ELSE 'OK'
    END AS status
  FROM expected_indexes e
  FULL OUTER JOIN actual_indexes a USING (index_name)
),
forbidden_grants AS (
  SELECT
    c.relname AS table_name,
    CASE
      WHEN acl.grantee = 0 THEN 'PUBLIC'
      ELSE pg_catalog.pg_get_userbyid(acl.grantee)
    END AS grantee,
    acl.privilege_type,
    acl.is_grantable
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c
    ON c.relnamespace = n.oid
   AND c.relkind = 'r'
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    COALESCE(c.relacl, '{}'::aclitem[])
  ) acl
  WHERE n.nspname = 'identity'
    AND c.relname IN (
      'roles',
      'permissions',
      'role_permissions',
      'staff_role_assignments'
    )
    AND acl.grantee IN (
      0::oid,
      pg_catalog.to_regrole('anon')::oid,
      pg_catalog.to_regrole('authenticated')::oid,
      pg_catalog.to_regrole('service_role')::oid
    )
),
seed_row_counts AS (
  SELECT
    (
      SELECT COUNT(*)::bigint
      FROM identity.roles
    ) AS roles_row_count,
    (
      SELECT COUNT(*)::bigint
      FROM identity.permissions
    ) AS permissions_row_count,
    (
      SELECT COUNT(*)::bigint
      FROM identity.role_permissions
    ) AS role_permissions_row_count,
    (
      SELECT COUNT(*)::bigint
      FROM identity.staff_role_assignments
    ) AS staff_role_assignments_row_count
  WHERE pg_catalog.to_regclass('identity.roles') IS NOT NULL
    AND pg_catalog.to_regclass('identity.permissions') IS NOT NULL
    AND pg_catalog.to_regclass('identity.role_permissions') IS NOT NULL
    AND pg_catalog.to_regclass('identity.staff_role_assignments') IS NOT NULL
),
security_object_counts AS (
  SELECT
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_policies p
      WHERE p.schemaname = 'identity'
        AND p.tablename IN (
          'roles',
          'permissions',
          'role_permissions',
          'staff_role_assignments'
        )
    ) AS policy_count,
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'identity'
        AND c.relkind IN ('v', 'm')
        AND c.relname IN (
          'roles',
          'permissions',
          'role_permissions',
          'staff_role_assignments'
        )
    ) AS view_count,
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'identity'
        AND p.proname ~ '^(roles|permissions|role_permissions|staff_role_assignments)'
    ) AS routine_count,
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_trigger t
      JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'identity'
        AND NOT t.tgisinternal
        AND c.relname IN (
          'roles',
          'permissions',
          'role_permissions',
          'staff_role_assignments'
        )
    ) AS non_internal_trigger_count,
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'identity'
        AND c.relkind = 'S'
        AND c.relname IN (
          'roles',
          'permissions',
          'role_permissions',
          'staff_role_assignments'
        )
    ) AS sequence_count,
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'identity'
        AND t.typtype IN ('d', 'e', 'r', 'm')
        AND t.typname IN (
          'roles',
          'permissions',
          'role_permissions',
          'staff_role_assignments'
        )
    ) AS custom_type_count
),
summary AS (
  SELECT
    COUNT(*) FILTER (WHERE status <> 'OK') AS table_mismatch_count
  FROM table_mismatches
),
column_summary AS (
  SELECT
    COUNT(*) FILTER (WHERE status <> 'OK') AS column_mismatch_count
  FROM column_mismatches
),
constraint_summary AS (
  SELECT
    COUNT(*) FILTER (WHERE status <> 'OK') AS constraint_mismatch_count
  FROM constraint_mismatches
),
index_summary AS (
  SELECT
    COUNT(*) FILTER (WHERE status <> 'OK') AS index_mismatch_count
  FROM index_mismatches
),
grant_summary AS (
  SELECT COUNT(*) AS forbidden_grant_count
  FROM forbidden_grants
),
seed_summary AS (
  SELECT
    COALESCE(s.roles_row_count, -1) AS roles_row_count,
    COALESCE(s.permissions_row_count, -1) AS permissions_row_count,
    COALESCE(s.role_permissions_row_count, -1) AS role_permissions_row_count,
    COALESCE(s.staff_role_assignments_row_count, -1) AS staff_role_assignments_row_count,
    CASE
      WHEN s.roles_row_count IS NULL THEN 1
      WHEN s.roles_row_count <> 0
        OR s.permissions_row_count <> 0
        OR s.role_permissions_row_count <> 0
        OR s.staff_role_assignments_row_count <> 0
        THEN 1
      ELSE 0
    END AS seed_mismatch_count
  FROM (SELECT 1) AS sentinel
  LEFT JOIN seed_row_counts s ON TRUE
)
SELECT
  dp.user_profiles_present,
  dp.staff_profiles_present,
  s.table_mismatch_count,
  cs.column_mismatch_count,
  ks.constraint_mismatch_count,
  ix.index_mismatch_count,
  gs.forbidden_grant_count,
  ss.seed_mismatch_count,
  ss.roles_row_count,
  ss.permissions_row_count,
  ss.role_permissions_row_count,
  ss.staff_role_assignments_row_count,
  soc.policy_count,
  soc.view_count,
  soc.routine_count,
  soc.non_internal_trigger_count,
  soc.sequence_count,
  soc.custom_type_count,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(t) ORDER BY t.table_name)
      FROM table_mismatches t
      WHERE t.status <> 'OK'
    ),
    '[]'::jsonb
  ) AS table_mismatches,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.table_name, c.column_name)
      FROM column_mismatches c
      WHERE c.status <> 'OK'
    ),
    '[]'::jsonb
  ) AS column_mismatches,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.table_name, c.constraint_name)
      FROM constraint_mismatches c
      WHERE c.status <> 'OK'
    ),
    '[]'::jsonb
  ) AS constraint_mismatches,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(i) ORDER BY i.index_name)
      FROM index_mismatches i
      WHERE i.status <> 'OK'
    ),
    '[]'::jsonb
  ) AS index_mismatches,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(g) ORDER BY g.table_name, g.grantee, g.privilege_type)
      FROM forbidden_grants g
    ),
    '[]'::jsonb
  ) AS forbidden_grants,
  CASE
    WHEN NOT dp.user_profiles_present
      OR NOT dp.staff_profiles_present
      THEN 'FAIL_DEPENDENCY_MISSING'
    WHEN s.table_mismatch_count <> 0 THEN 'FAIL_TABLE_OR_RLS_MISMATCH'
    WHEN cs.column_mismatch_count <> 0 THEN 'FAIL_COLUMN_MISMATCH'
    WHEN ks.constraint_mismatch_count <> 0 THEN 'FAIL_CONSTRAINT_MISMATCH'
    WHEN ix.index_mismatch_count <> 0 THEN 'FAIL_INDEX_MISMATCH'
    WHEN gs.forbidden_grant_count <> 0 THEN 'FAIL_FORBIDDEN_GRANT'
    WHEN soc.policy_count <> 0 THEN 'FAIL_UNEXPECTED_POLICY'
    WHEN soc.view_count <> 0
      OR soc.routine_count <> 0
      OR soc.non_internal_trigger_count <> 0
      OR soc.sequence_count <> 0
      OR soc.custom_type_count <> 0
      THEN 'FAIL_UNEXPECTED_OBJECT'
    WHEN ss.seed_mismatch_count <> 0 THEN 'FAIL_SEED_ROWS_PRESENT'
    ELSE 'PASS'
  END AS final_status
FROM dependency_presence dp
CROSS JOIN summary s
CROSS JOIN column_summary cs
CROSS JOIN constraint_summary ks
CROSS JOIN index_summary ix
CROSS JOIN grant_summary gs
CROSS JOIN seed_summary ss
CROSS JOIN security_object_counts soc;
