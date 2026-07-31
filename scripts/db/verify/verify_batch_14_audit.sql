-- Batch 14 read-only structural verifier. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.

WITH dependency_presence AS (
  SELECT
    to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'audit'
    ) AS audit_schema_present
),
expected(table_name) AS (
  VALUES
    ('audit_logs'),
    ('log_events'),
    ('event_outbox')
),
actual AS (
  SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'audit' AND c.relkind = 'r'
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
  WHERE table_schema = 'audit'
    AND table_name IN (SELECT table_name FROM expected)
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT count(*)::integer AS value
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'audit'
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
  WHERE table_schema = 'audit'
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
    count(*) FILTER (WHERE x.conname = 'audit_logs_action_not_blank_check' AND x.contype = 'c') = 1
      AS audit_logs_action_check,
    count(*) FILTER (WHERE x.conname = 'audit_logs_before_snapshot_valid_check' AND x.contype = 'c') = 1
      AS audit_logs_before_snapshot_check,
    count(*) FILTER (WHERE x.conname = 'log_events_event_type_not_blank_check' AND x.contype = 'c') = 1
      AS log_events_type_check,
    count(*) FILTER (WHERE x.conname = 'log_events_payload_valid_check' AND x.contype = 'c') = 1
      AS log_events_payload_check,
    count(*) FILTER (WHERE x.conname = 'event_outbox_status_check' AND x.contype = 'c') = 1
      AS outbox_status_check,
    count(*) FILTER (WHERE x.conname = 'event_outbox_retry_non_negative_check' AND x.contype = 'c') = 1
      AS outbox_retry_check
  FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'audit'
),
required_columns AS (
  SELECT
    count(*) FILTER (
      WHERE table_name = 'audit_logs'
        AND column_name = 'action'
        AND is_nullable = 'NO'
    ) = 1 AS audit_logs_action_required,
    count(*) FILTER (
      WHERE table_name = 'log_events'
        AND column_name = 'payload'
        AND is_nullable = 'NO'
    ) = 1 AS log_events_payload_required,
    count(*) FILTER (
      WHERE table_name = 'event_outbox'
        AND column_name = 'domain_event_id'
        AND is_nullable = 'NO'
    ) = 1 AS outbox_event_id_required
  FROM information_schema.columns
  WHERE table_schema = 'audit'
    AND table_name IN (SELECT table_name FROM expected)
),
row_counts AS (
  SELECT
    (SELECT count(*) FROM audit.audit_logs) AS audit_logs_count,
    (SELECT count(*) FROM audit.log_events) AS log_events_count,
    (SELECT count(*) FROM audit.event_outbox) AS outbox_count
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
  d.audit_schema_present,
  s.table_mismatch_count,
  s.unexpected_table_count,
  s.forbidden_grant_count,
  s.secret_like_column_count,
  s.policy_count,
  NOT cr.present AS cases_relation_absent,
  rc.audit_logs_action_check,
  rc.audit_logs_before_snapshot_check,
  rc.log_events_type_check,
  rc.log_events_payload_check,
  rc.outbox_status_check,
  rc.outbox_retry_check,
  col.audit_logs_action_required,
  col.log_events_payload_required,
  col.outbox_event_id_required,
  r.audit_logs_count,
  r.log_events_count,
  r.outbox_count,
  COALESCE(
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.table_name)
     FROM table_checks t WHERE status <> 'OK'),
    '[]'::jsonb
  ) AS table_mismatches,
  CASE
    WHEN d.user_profiles_present
      AND d.audit_schema_present
      AND s.table_mismatch_count = 0
      AND s.unexpected_table_count = 0
      AND s.forbidden_grant_count = 0
      AND s.secret_like_column_count = 0
      AND s.policy_count = 0
      AND NOT cr.present
      AND rc.audit_logs_action_check
      AND rc.audit_logs_before_snapshot_check
      AND rc.log_events_type_check
      AND rc.log_events_payload_check
      AND rc.outbox_status_check
      AND rc.outbox_retry_check
      AND col.audit_logs_action_required
      AND col.log_events_payload_required
      AND col.outbox_event_id_required
      AND r.audit_logs_count = 0
      AND r.log_events_count = 0
      AND r.outbox_count = 0
    THEN 'PASS'
    ELSE 'FAIL'
  END AS final_status
FROM dependency_presence d
CROSS JOIN summaries s
CROSS JOIN cases_relation cr
CROSS JOIN required_constraints rc
CROSS JOIN required_columns col
CROSS JOIN row_counts r;
