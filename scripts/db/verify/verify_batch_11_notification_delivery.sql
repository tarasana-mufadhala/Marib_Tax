-- Batch 11 read-only structural verifier. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.

WITH dependency_presence AS (
  SELECT
    to_regclass('requests.service_requests') IS NOT NULL AS service_requests_present,
    to_regclass('balaghat.balaghs') IS NOT NULL AS balaghs_present,
    to_regclass('dues.payment_notices') IS NOT NULL AS payment_notices_present,
    to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'notify'
    ) AS notify_schema_present
),
expected(table_name) AS (
  VALUES
    ('notification_templates'),
    ('notification_channel_configurations'),
    ('notification_messages'),
    ('delivery_attempts'),
    ('delivery_retries'),
    ('notification_read_states'),
    ('notification_outbox_messages')
),
actual AS (
  SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'notify' AND c.relkind = 'r'
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
  WHERE table_schema = 'notify'
    AND table_name IN (SELECT table_name FROM expected)
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT count(*)::integer AS value
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'notify'
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
  WHERE table_schema = 'notify'
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
    count(*) FILTER (WHERE x.conname = 'notification_templates_code_key' AND x.contype = 'u') = 1
      AS template_code_unique,
    count(*) FILTER (WHERE x.conname = 'notification_channel_configurations_channel_code_key' AND x.contype = 'u') = 1
      AS channel_code_unique,
    count(*) FILTER (WHERE x.conname = 'notification_read_states_message_recipient_key' AND x.contype = 'u') = 1
      AS read_state_message_recipient_unique,
    count(*) FILTER (WHERE x.conname = 'delivery_attempts_attempt_number_positive_check' AND x.contype = 'c') = 1
      AS attempt_number_check,
    count(*) FILTER (WHERE x.conname = 'delivery_retries_retry_number_positive_check' AND x.contype = 'c') = 1
      AS retry_number_check,
    count(*) FILTER (WHERE x.conname = 'notification_outbox_messages_attempt_count_non_negative_check' AND x.contype = 'c') = 1
      AS outbox_attempt_count_check
  FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'notify'
),
required_columns AS (
  SELECT
    count(*) FILTER (
      WHERE table_name = 'notification_messages'
        AND column_name = 'delivery_status_code'
        AND is_nullable = 'NO'
    ) = 1 AS delivery_status_required,
    count(*) FILTER (
      WHERE table_name = 'delivery_attempts'
        AND column_name = 'notification_message_id'
        AND is_nullable = 'NO'
    ) = 1 AS attempt_message_required,
    count(*) FILTER (
      WHERE table_name = 'delivery_attempts'
        AND column_name = 'attempt_status_code'
        AND is_nullable = 'NO'
    ) = 1 AS attempt_status_required,
    count(*) FILTER (
      WHERE table_name = 'delivery_retries'
        AND column_name = 'delivery_attempt_id'
        AND is_nullable = 'NO'
    ) = 1 AS retry_attempt_required,
    count(*) FILTER (
      WHERE table_name = 'notification_read_states'
        AND column_name = 'recipient_profile_id'
        AND is_nullable = 'NO'
    ) = 1 AS read_state_recipient_required,
    count(*) FILTER (
      WHERE table_name = 'notification_templates'
        AND column_name = 'code'
        AND is_nullable = 'NO'
    ) = 1 AS template_code_required,
    count(*) FILTER (
      WHERE table_name = 'notification_channel_configurations'
        AND column_name = 'channel_code'
        AND is_nullable = 'NO'
    ) = 1 AS channel_code_required,
    count(*) FILTER (
      WHERE table_name = 'notification_outbox_messages'
        AND column_name = 'publication_state'
        AND is_nullable = 'NO'
    ) = 1 AS publication_state_required,
    count(*) FILTER (
      WHERE table_name = 'notification_outbox_messages'
        AND column_name = 'attempt_count'
        AND is_nullable = 'NO'
        AND column_default = '0'
    ) = 1 AS attempt_count_default_zero
  FROM information_schema.columns
  WHERE table_schema = 'notify'
    AND table_name IN (SELECT table_name FROM expected)
),
required_indexes AS (
  SELECT
    count(*) FILTER (
      WHERE indexname = 'notification_messages_idempotency_key_key'
        AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
        AND indexdef ILIKE '%WHERE (idempotency_key IS NOT NULL)%'
    ) = 1 AS message_idempotency_scoped_unique,
    count(*) FILTER (
      WHERE indexname = 'notification_outbox_messages_idempotency_key_key'
        AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
        AND indexdef ILIKE '%WHERE (idempotency_key IS NOT NULL)%'
    ) = 1 AS outbox_idempotency_scoped_unique,
    count(*) FILTER (
      WHERE indexname = 'notification_outbox_messages_worker_poll_idx'
    ) = 1 AS outbox_worker_poll_index,
    count(*) FILTER (
      WHERE indexname = 'notification_read_states_recipient_inbox_idx'
    ) = 1 AS recipient_inbox_index,
    count(*) FILTER (
      WHERE indexname = 'notification_messages_service_request_id_idx'
    ) = 1 AS request_context_index,
    count(*) FILTER (
      WHERE indexname = 'notification_messages_balagh_id_idx'
    ) = 1 AS balagh_context_index
  FROM pg_catalog.pg_indexes
  WHERE schemaname = 'notify'
),
row_counts AS (
  SELECT
    (SELECT count(*) FROM notify.notification_templates) AS notification_templates,
    (SELECT count(*) FROM notify.notification_channel_configurations) AS notification_channel_configurations,
    (SELECT count(*) FROM notify.notification_messages) AS notification_messages,
    (SELECT count(*) FROM notify.delivery_attempts) AS delivery_attempts,
    (SELECT count(*) FROM notify.delivery_retries) AS delivery_retries,
    (SELECT count(*) FROM notify.notification_read_states) AS notification_read_states,
    (SELECT count(*) FROM notify.notification_outbox_messages) AS notification_outbox_messages
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
  d.service_requests_present,
  d.balaghs_present,
  d.payment_notices_present,
  d.user_profiles_present,
  d.notify_schema_present,
  s.table_mismatch_count,
  s.unexpected_table_count,
  s.forbidden_grant_count,
  s.secret_like_column_count,
  s.policy_count,
  NOT cr.present AS cases_relation_absent,
  rc.template_code_unique,
  rc.channel_code_unique,
  rc.read_state_message_recipient_unique,
  rc.attempt_number_check,
  rc.retry_number_check,
  rc.outbox_attempt_count_check,
  col.delivery_status_required,
  col.attempt_message_required,
  col.attempt_status_required,
  col.retry_attempt_required,
  col.read_state_recipient_required,
  col.template_code_required,
  col.channel_code_required,
  col.publication_state_required,
  col.attempt_count_default_zero,
  ix.message_idempotency_scoped_unique,
  ix.outbox_idempotency_scoped_unique,
  ix.outbox_worker_poll_index,
  ix.recipient_inbox_index,
  ix.request_context_index,
  ix.balagh_context_index,
  r.notification_templates,
  r.notification_channel_configurations,
  r.notification_messages,
  r.delivery_attempts,
  r.delivery_retries,
  r.notification_read_states,
  r.notification_outbox_messages,
  COALESCE(
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.table_name)
     FROM table_checks t WHERE status <> 'OK'),
    '[]'::jsonb
  ) AS table_mismatches,
  CASE
    WHEN d.service_requests_present
      AND d.balaghs_present
      AND d.payment_notices_present
      AND d.user_profiles_present
      AND d.notify_schema_present
      AND s.table_mismatch_count = 0
      AND s.unexpected_table_count = 0
      AND s.forbidden_grant_count = 0
      AND s.secret_like_column_count = 0
      AND s.policy_count = 0
      AND NOT cr.present
      AND rc.template_code_unique
      AND rc.channel_code_unique
      AND rc.read_state_message_recipient_unique
      AND rc.attempt_number_check
      AND rc.retry_number_check
      AND rc.outbox_attempt_count_check
      AND col.delivery_status_required
      AND col.attempt_message_required
      AND col.attempt_status_required
      AND col.retry_attempt_required
      AND col.read_state_recipient_required
      AND col.template_code_required
      AND col.channel_code_required
      AND col.publication_state_required
      AND col.attempt_count_default_zero
      AND ix.message_idempotency_scoped_unique
      AND ix.outbox_idempotency_scoped_unique
      AND ix.outbox_worker_poll_index
      AND ix.recipient_inbox_index
      AND ix.request_context_index
      AND ix.balagh_context_index
      AND r.notification_templates = 0
      AND r.notification_channel_configurations = 0
      AND r.notification_messages = 0
      AND r.delivery_attempts = 0
      AND r.delivery_retries = 0
      AND r.notification_read_states = 0
      AND r.notification_outbox_messages = 0
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
