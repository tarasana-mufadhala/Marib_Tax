-- MARIB-TAX-DB-FOUNDATION-BATCH-01A — read-only verification
-- Does not mutate the database. Safe to run after Batch 01A is applied.
-- Does not print connection strings, passwords, or other secrets.

-- 1–3. Expected schema list with existence and owner
WITH expected(schema_name, sort_ord) AS (
  VALUES
    ('identity', 1),
    ('registry', 2),
    ('legal', 3),
    ('masterdata', 4),
    ('requests', 5),
    ('balaghat', 6),
    ('visits', 7),
    ('dues', 8),
    ('files', 9),
    ('notify', 10),
    ('imports', 11),
    ('content', 12),
    ('audit', 13),
    ('reporting', 14)
),
ns AS (
  SELECT
    n.nspname AS schema_name,
    pg_catalog.pg_get_userbyid(n.nspowner) AS schema_owner
  FROM pg_catalog.pg_namespace n
)
SELECT
  e.sort_ord AS ordinal,
  e.schema_name AS expected_schema,
  (ns.schema_name IS NOT NULL) AS exists,
  ns.schema_owner AS schema_owner,
  CASE
    WHEN ns.schema_name IS NULL THEN FALSE
    ELSE has_schema_privilege('public', e.schema_name, 'USAGE')
  END AS public_has_usage,
  CASE
    WHEN ns.schema_name IS NULL THEN FALSE
    ELSE has_schema_privilege('public', e.schema_name, 'CREATE')
  END AS public_has_create,
  CASE
    WHEN ns.schema_name IS NULL THEN 'MISSING'
    WHEN has_schema_privilege('public', e.schema_name, 'USAGE')
      OR has_schema_privilege('public', e.schema_name, 'CREATE')
      THEN 'WARN_PUBLIC_PRIVILEGE'
    ELSE 'OK_OWNER_ONLY_POSTURE'
  END AS privilege_posture
FROM expected e
LEFT JOIN ns ON ns.schema_name = e.schema_name
ORDER BY e.sort_ord;

-- 4. Missing expected schemas (empty result = none missing)
WITH expected(schema_name) AS (
  VALUES
    ('identity'), ('registry'), ('legal'), ('masterdata'),
    ('requests'), ('balaghat'), ('visits'), ('dues'),
    ('files'), ('notify'), ('imports'), ('content'),
    ('audit'), ('reporting')
)
SELECT e.schema_name AS missing_expected_schema
FROM expected e
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_catalog.pg_namespace n
  WHERE n.nspname = e.schema_name
)
ORDER BY e.schema_name;

-- 5–6. PUBLIC USAGE / CREATE summary across expected schemas
WITH expected(schema_name) AS (
  VALUES
    ('identity'), ('registry'), ('legal'), ('masterdata'),
    ('requests'), ('balaghat'), ('visits'), ('dues'),
    ('files'), ('notify'), ('imports'), ('content'),
    ('audit'), ('reporting')
),
present AS (
  SELECT e.schema_name
  FROM expected e
  JOIN pg_catalog.pg_namespace n ON n.nspname = e.schema_name
)
SELECT
  COUNT(*) FILTER (
    WHERE has_schema_privilege('public', schema_name, 'USAGE')
  ) AS expected_schemas_with_public_usage,
  COUNT(*) FILTER (
    WHERE has_schema_privilege('public', schema_name, 'CREATE')
  ) AS expected_schemas_with_public_create,
  COUNT(*) AS present_expected_schemas
FROM present;

-- 7–8. Managed auth / storage presence
SELECT
  'auth' AS managed_schema,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = 'auth'
  ) AS exists,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = 'auth'
    ) THEN 'OK'
    ELSE 'UNEXPECTED_ABSENCE'
  END AS status
UNION ALL
SELECT
  'storage',
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = 'storage'
  ),
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = 'storage'
    ) THEN 'OK'
    ELSE 'UNEXPECTED_ABSENCE'
  END;

-- 9–10. Count and final result
-- Precedence (authoritative overall decision):
--   1) FAIL_MISSING_APPLICATION_SCHEMA if any of the 14 expected schemas is missing
--   2) FAIL_MISSING_MANAGED_SCHEMA if auth or storage is missing
--   3) WARN_PUBLIC_PRIVILEGES if schemas exist but PUBLIC has USAGE or CREATE
--   4) PASS only when 14/14 + auth + storage and no unexpected PUBLIC privileges
-- PASS must never be returned when auth or storage is absent.
WITH expected(schema_name) AS (
  VALUES
    ('identity'), ('registry'), ('legal'), ('masterdata'),
    ('requests'), ('balaghat'), ('visits'), ('dues'),
    ('files'), ('notify'), ('imports'), ('content'),
    ('audit'), ('reporting')
),
found AS (
  SELECT e.schema_name
  FROM expected e
  JOIN pg_catalog.pg_namespace n ON n.nspname = e.schema_name
),
missing AS (
  SELECT e.schema_name
  FROM expected e
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_namespace n
    WHERE n.nspname = e.schema_name
  )
),
priv AS (
  SELECT
    COUNT(*) FILTER (
      WHERE has_schema_privilege('public', schema_name, 'USAGE')
    ) AS public_usage_hits,
    COUNT(*) FILTER (
      WHERE has_schema_privilege('public', schema_name, 'CREATE')
    ) AS public_create_hits,
    COUNT(*) FILTER (
      WHERE has_schema_privilege('public', schema_name, 'USAGE')
         OR has_schema_privilege('public', schema_name, 'CREATE')
    ) AS public_privilege_hits
  FROM found
),
managed AS (
  SELECT
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = 'auth'
    ) AS auth_present,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = 'storage'
    ) AS storage_present
)
SELECT
  (SELECT COUNT(*) FROM found) AS application_schemas_found,
  (SELECT COUNT(*) FROM missing) AS application_schemas_missing,
  (SELECT auth_present FROM managed) AS auth_present,
  (SELECT storage_present FROM managed) AS storage_present,
  (SELECT public_usage_hits FROM priv) AS unexpected_public_usage_count,
  (SELECT public_create_hits FROM priv) AS unexpected_public_create_count,
  CASE
    WHEN (SELECT COUNT(*) FROM missing) > 0 THEN 'FAIL_MISSING_APPLICATION_SCHEMA'
    WHEN NOT (SELECT auth_present FROM managed)
      OR NOT (SELECT storage_present FROM managed)
      THEN 'FAIL_MISSING_MANAGED_SCHEMA'
    WHEN (SELECT public_privilege_hits FROM priv) > 0 THEN 'WARN_PUBLIC_PRIVILEGES'
    ELSE 'PASS'
  END AS final_status,
  CASE
    WHEN (SELECT COUNT(*) FROM missing) > 0
      THEN 'One or more expected application schemas are missing'
    WHEN NOT (SELECT auth_present FROM managed)
      AND NOT (SELECT storage_present FROM managed)
      THEN 'Managed schemas auth and storage are missing'
    WHEN NOT (SELECT auth_present FROM managed)
      THEN 'Managed schema auth is missing'
    WHEN NOT (SELECT storage_present FROM managed)
      THEN 'Managed schema storage is missing'
    WHEN (SELECT public_privilege_hits FROM priv) > 0
      THEN 'PUBLIC has unexpected USAGE or CREATE on one or more application schemas'
    ELSE 'All 14 application schemas exist; auth and storage exist; PUBLIC has no USAGE or CREATE'
  END AS final_reason;
