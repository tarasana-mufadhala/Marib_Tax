-- MARIB-TAX-DB-FOUNDATION-BATCH-02-IDENTITY-PROFILES — read-only verification
-- Returns one authoritative result set with mismatch details.
-- Does not mutate data, privileges, policies, or schema objects.

WITH
expected_tables(table_name) AS (
  VALUES ('user_profiles'), ('staff_profiles')
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
    ('user_profiles', 1, 'id', 'uuid', true, NULL),
    ('user_profiles', 2, 'auth_user_id', 'uuid', true, NULL),
    ('user_profiles', 3, 'display_name', 'text', false, NULL),
    ('user_profiles', 4, 'is_active', 'boolean', true, 'true'),
    ('user_profiles', 5, 'created_at', 'timestamp with time zone', true, 'now()'),
    ('user_profiles', 6, 'created_by_profile_id', 'uuid', false, NULL),
    ('user_profiles', 7, 'updated_at', 'timestamp with time zone', false, NULL),
    ('user_profiles', 8, 'updated_by_profile_id', 'uuid', false, NULL),
    ('user_profiles', 9, 'archived_at', 'timestamp with time zone', false, NULL),
    ('staff_profiles', 1, 'id', 'uuid', true, NULL),
    ('staff_profiles', 2, 'user_profile_id', 'uuid', true, NULL),
    ('staff_profiles', 3, 'staff_code', 'text', false, NULL),
    ('staff_profiles', 4, 'title', 'text', false, NULL),
    ('staff_profiles', 5, 'is_active', 'boolean', true, 'true'),
    ('staff_profiles', 6, 'effective_from', 'timestamp with time zone', true, NULL),
    ('staff_profiles', 7, 'effective_to', 'timestamp with time zone', false, NULL),
    ('staff_profiles', 8, 'created_at', 'timestamp with time zone', true, 'now()'),
    ('staff_profiles', 9, 'created_by_profile_id', 'uuid', false, NULL),
    ('staff_profiles', 10, 'updated_at', 'timestamp with time zone', false, NULL),
    ('staff_profiles', 11, 'updated_by_profile_id', 'uuid', false, NULL),
    ('staff_profiles', 12, 'archived_at', 'timestamp with time zone', false, NULL)
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
    AND c.relname IN ('user_profiles', 'staff_profiles')
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
    ('user_profiles_pkey', 'user_profiles', 'p', ARRAY['id']::text[], NULL, NULL, NULL),
    ('user_profiles_auth_user_id_key', 'user_profiles', 'u', ARRAY['auth_user_id']::text[], NULL, NULL, NULL),
    ('user_profiles_auth_user_id_fkey', 'user_profiles', 'f', ARRAY['auth_user_id']::text[], 'auth.users', ARRAY['id']::text[], NULL),
    ('user_profiles_created_by_profile_id_fkey', 'user_profiles', 'f', ARRAY['created_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('user_profiles_updated_by_profile_id_fkey', 'user_profiles', 'f', ARRAY['updated_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('staff_profiles_pkey', 'staff_profiles', 'p', ARRAY['id']::text[], NULL, NULL, NULL),
    ('staff_profiles_user_profile_id_key', 'staff_profiles', 'u', ARRAY['user_profile_id']::text[], NULL, NULL, NULL),
    ('staff_profiles_staff_code_key', 'staff_profiles', 'u', ARRAY['staff_code']::text[], NULL, NULL, NULL),
    ('staff_profiles_user_profile_id_fkey', 'staff_profiles', 'f', ARRAY['user_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('staff_profiles_created_by_profile_id_fkey', 'staff_profiles', 'f', ARRAY['created_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('staff_profiles_updated_by_profile_id_fkey', 'staff_profiles', 'f', ARRAY['updated_by_profile_id']::text[], 'identity.user_profiles', ARRAY['id']::text[], NULL),
    ('staff_profiles_effective_period_check', 'staff_profiles', 'c', NULL, NULL, NULL, 'effective_toISNULLOReffective_to>effective_from')
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
    pg_catalog.pg_get_constraintdef(con.oid, true) AS definition,
    CASE
      WHEN con.contype = 'c' THEN pg_catalog.regexp_replace(
        pg_catalog.pg_get_expr(con.conbin, con.conrelid),
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
    AND c.relname IN ('user_profiles', 'staff_profiles')
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
expected_indexes(index_name) AS (
  VALUES
    ('user_profiles_pkey'),
    ('user_profiles_auth_user_id_key'),
    ('staff_profiles_pkey'),
    ('staff_profiles_user_profile_id_key'),
    ('staff_profiles_staff_code_key')
),
actual_indexes AS (
  SELECT c.relname AS index_name
  FROM pg_catalog.pg_namespace n
  JOIN pg_catalog.pg_class c
    ON c.relnamespace = n.oid
   AND c.relkind = 'i'
  WHERE n.nspname = 'identity'
),
index_mismatches AS (
  SELECT
    COALESCE(e.index_name, a.index_name) AS index_name,
    CASE
      WHEN e.index_name IS NULL THEN 'UNEXPECTED_INDEX'
      WHEN a.index_name IS NULL THEN 'MISSING_INDEX'
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
    AND c.relname IN ('user_profiles', 'staff_profiles')
    AND acl.grantee IN (
      0::oid,
      pg_catalog.to_regrole('anon')::oid,
      pg_catalog.to_regrole('authenticated')::oid,
      pg_catalog.to_regrole('service_role')::oid
    )
),
security_object_counts AS (
  SELECT
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_policies p
      WHERE p.schemaname = 'identity'
        AND p.tablename IN ('user_profiles', 'staff_profiles')
    ) AS policy_count,
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'identity'
    ) AS routine_count,
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_trigger t
      JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'identity'
        AND NOT t.tgisinternal
    ) AS non_internal_trigger_count,
    (
      SELECT COUNT(*)
      FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'identity'
        AND t.typtype IN ('d', 'e', 'r', 'm')
    ) AS custom_type_count,
    pg_catalog.to_regclass('auth.users') IS NOT NULL AS auth_users_present
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
)
SELECT
  s.table_mismatch_count,
  cs.column_mismatch_count,
  ks.constraint_mismatch_count,
  ix.index_mismatch_count,
  gs.forbidden_grant_count,
  soc.policy_count,
  soc.routine_count,
  soc.non_internal_trigger_count,
  soc.custom_type_count,
  soc.auth_users_present,
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
    WHEN NOT soc.auth_users_present THEN 'FAIL_AUTH_USERS_MISSING'
    WHEN s.table_mismatch_count <> 0 THEN 'FAIL_TABLE_OR_RLS_MISMATCH'
    WHEN cs.column_mismatch_count <> 0 THEN 'FAIL_COLUMN_MISMATCH'
    WHEN ks.constraint_mismatch_count <> 0 THEN 'FAIL_CONSTRAINT_MISMATCH'
    WHEN ix.index_mismatch_count <> 0 THEN 'FAIL_INDEX_MISMATCH'
    WHEN gs.forbidden_grant_count <> 0 THEN 'FAIL_FORBIDDEN_GRANT'
    WHEN soc.policy_count <> 0 THEN 'FAIL_UNEXPECTED_POLICY'
    WHEN soc.routine_count <> 0
      OR soc.non_internal_trigger_count <> 0
      OR soc.custom_type_count <> 0
      THEN 'FAIL_UNEXPECTED_OBJECT'
    ELSE 'PASS'
  END AS final_status
FROM summary s
CROSS JOIN column_summary cs
CROSS JOIN constraint_summary ks
CROSS JOIN index_summary ix
CROSS JOIN grant_summary gs
CROSS JOIN security_object_counts soc;
