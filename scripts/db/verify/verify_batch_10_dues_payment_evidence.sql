-- Batch 10 read-only structural verifier. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.

WITH dependency_presence AS (
  SELECT
    to_regclass('requests.service_requests') IS NOT NULL AS service_requests_present,
    to_regclass('balaghat.balaghs') IS NOT NULL AS balaghs_present,
    to_regclass('identity.staff_profiles') IS NOT NULL AS staff_profiles_present,
    to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    to_regclass('files.attachments') IS NOT NULL AS attachments_present,
    EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'dues'
    ) AS dues_schema_present
),
expected(table_name) AS (
  VALUES
    ('payment_dues'),
    ('due_basis_document_references'),
    ('due_corrections'),
    ('payment_notices'),
    ('payment_receipts'),
    ('receipt_correction_replacements'),
    ('payment_confirmations')
),
actual AS (
  SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'dues' AND c.relkind = 'r'
    AND c.relname IN (SELECT table_name FROM expected)
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
forbidden_grants AS (
  SELECT *
  FROM information_schema.role_table_grants
  WHERE table_schema = 'dues'
    AND table_name IN (SELECT table_name FROM expected)
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT count(*)::integer AS value
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'dues'
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
due_receipt_structure AS (
  SELECT
    to_regclass('dues.due_receipt_links') IS NULL AS due_receipt_links_absent,
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'dues'
        AND table_name = 'payment_receipts'
        AND column_name = 'payment_due_id'
        AND is_nullable = 'NO'
        AND data_type = 'uuid'
    ) AS receipt_due_id_required,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint x
      JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_catalog.pg_class rc ON rc.oid = x.confrelid
      JOIN pg_catalog.pg_namespace rn ON rn.oid = rc.relnamespace
      WHERE x.contype = 'f'
        AND x.conname = 'payment_receipts_payment_due_fkey'
        AND n.nspname = 'dues'
        AND c.relname = 'payment_receipts'
        AND rn.nspname = 'dues'
        AND rc.relname = 'payment_dues'
        AND x.confdeltype = 'r'
        AND x.confupdtype = 'a'
    ) AS receipt_due_fk_restrict,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_indexes
      WHERE schemaname = 'dues'
        AND tablename = 'payment_receipts'
        AND indexname = 'payment_receipts_payment_due_received_at_idx'
        AND indexdef ILIKE '%(payment_due_id%'
        AND indexdef ILIKE '%received_at%'
    ) AS receipt_due_history_index,
    NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint x
      JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE x.contype = 'u'
        AND n.nspname = 'dues'
        AND c.relname = 'payment_receipts'
        AND pg_catalog.pg_get_constraintdef(x.oid) ~* '\(payment_due_id\)'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_indexes
      WHERE schemaname = 'dues'
        AND tablename = 'payment_receipts'
        AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
        AND indexdef ~* '\(payment_due_id\)'
        AND indexdef !~* 'received_at'
        AND indexdef !~* ','
    ) AS receipt_due_id_not_unique
),
gateway_columns AS (
  SELECT count(*)::integer AS value
  FROM information_schema.columns
  WHERE table_schema = 'dues'
    AND table_name IN (SELECT table_name FROM expected)
    AND (
      column_name ILIKE '%gateway%'
      OR column_name ILIKE '%provider%'
      OR column_name ILIKE '%settlement%'
      OR column_name ILIKE '%checkout%'
      OR column_name ILIKE '%stripe%'
      OR column_name ILIKE '%psp%'
    )
),
storage_fk_count AS (
  SELECT count(*)::integer AS value
  FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_class rc ON rc.oid = x.confrelid
  JOIN pg_catalog.pg_namespace rn ON rn.oid = rc.relnamespace
  WHERE x.contype = 'f'
    AND n.nspname = 'dues'
    AND rn.nspname = 'storage'
),
required_constraints AS (
  SELECT
    count(*) FILTER (WHERE x.conname = 'payment_dues_case_xor_check') = 1
      AS case_xor_check,
    count(*) FILTER (WHERE x.conname = 'payment_dues_amount_non_negative_check') = 1
      AS due_amount_non_negative,
    count(*) FILTER (WHERE x.conname = 'due_corrections_reason_not_blank_check') = 1
      AS correction_reason_check,
    count(*) FILTER (
      WHERE x.conname = 'receipt_correction_replacements_reason_not_blank_check'
    ) = 1 AS replacement_reason_check,
    count(*) FILTER (
      WHERE x.conname = 'payment_receipts_replaces_receipt_fkey' AND x.contype = 'f'
    ) = 1 AS receipt_self_lineage_fk,
    count(*) FILTER (
      WHERE x.conname = 'payment_confirmations_receipt_fkey' AND x.contype = 'f'
    ) = 1 AS confirmation_receipt_fk,
    count(*) FILTER (
      WHERE x.conname = 'due_basis_document_references_attachment_fkey' AND x.contype = 'f'
    ) = 1 AS basis_attachment_fk
  FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'dues'
),
required_columns AS (
  SELECT
    count(*) FILTER (
      WHERE table_name = 'payment_dues'
        AND column_name = 'amount'
        AND data_type = 'numeric'
        AND numeric_precision = 18
        AND numeric_scale = 2
        AND is_nullable = 'NO'
    ) = 1 AS due_amount_numeric,
    count(*) FILTER (
      WHERE table_name = 'due_corrections'
        AND column_name = 'corrected_by_staff_profile_id'
        AND is_nullable = 'NO'
    ) = 1 AS correction_staff_required,
    count(*) FILTER (
      WHERE table_name = 'due_corrections'
        AND column_name = 'reason'
        AND is_nullable = 'NO'
    ) = 1 AS correction_reason_required,
    count(*) FILTER (
      WHERE table_name = 'receipt_correction_replacements'
        AND column_name = 'acted_by_staff_profile_id'
        AND is_nullable = 'NO'
    ) = 1 AS replacement_staff_required,
    count(*) FILTER (
      WHERE table_name = 'payment_confirmations'
        AND column_name = 'confirmed_by_profile_id'
        AND is_nullable = 'NO'
    ) = 1 AS confirmation_actor_required,
    count(*) FILTER (
      WHERE table_name = 'payment_receipts'
        AND column_name = 'amount'
        AND data_type = 'numeric'
        AND is_nullable = 'NO'
    ) = 1 AS receipt_amount_present
  FROM information_schema.columns
  WHERE table_schema = 'dues'
    AND table_name IN (SELECT table_name FROM expected)
),
row_counts AS (
  SELECT
    (SELECT count(*) FROM dues.payment_dues) AS payment_dues,
    (SELECT count(*) FROM dues.due_basis_document_references) AS due_basis_document_references,
    (SELECT count(*) FROM dues.due_corrections) AS due_corrections,
    (SELECT count(*) FROM dues.payment_notices) AS payment_notices,
    (SELECT count(*) FROM dues.payment_receipts) AS payment_receipts,
    (SELECT count(*) FROM dues.receipt_correction_replacements) AS receipt_correction_replacements,
    (SELECT count(*) FROM dues.payment_confirmations) AS payment_confirmations
),
summaries AS (
  SELECT
    (SELECT count(*) FROM table_checks WHERE status <> 'OK') AS table_mismatch_count,
    (SELECT count(*) FROM forbidden_grants) AS forbidden_grant_count,
    (SELECT value FROM policy_count) AS policy_count,
    (SELECT value FROM storage_fk_count) AS storage_fk_count,
    (SELECT value FROM gateway_columns) AS gateway_column_count
)
SELECT
  d.service_requests_present,
  d.balaghs_present,
  d.staff_profiles_present,
  d.user_profiles_present,
  d.attachments_present,
  d.dues_schema_present,
  s.table_mismatch_count,
  s.forbidden_grant_count,
  s.policy_count,
  s.storage_fk_count,
  s.gateway_column_count,
  NOT cr.present AS cases_relation_absent,
  drs.due_receipt_links_absent,
  drs.receipt_due_id_required,
  drs.receipt_due_fk_restrict,
  drs.receipt_due_history_index,
  drs.receipt_due_id_not_unique,
  rc.case_xor_check,
  rc.due_amount_non_negative,
  rc.correction_reason_check,
  rc.replacement_reason_check,
  rc.receipt_self_lineage_fk,
  rc.confirmation_receipt_fk,
  rc.basis_attachment_fk,
  col.due_amount_numeric,
  col.correction_staff_required,
  col.correction_reason_required,
  col.replacement_staff_required,
  col.confirmation_actor_required,
  col.receipt_amount_present,
  r.payment_dues,
  r.due_basis_document_references,
  r.due_corrections,
  r.payment_notices,
  r.payment_receipts,
  r.receipt_correction_replacements,
  r.payment_confirmations,
  COALESCE(
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.table_name)
     FROM table_checks t WHERE status <> 'OK'),
    '[]'::jsonb
  ) AS table_mismatches,
  CASE
    WHEN d.service_requests_present
      AND d.balaghs_present
      AND d.staff_profiles_present
      AND d.user_profiles_present
      AND d.attachments_present
      AND d.dues_schema_present
      AND s.table_mismatch_count = 0
      AND s.forbidden_grant_count = 0
      AND s.policy_count = 0
      AND s.storage_fk_count = 0
      AND s.gateway_column_count = 0
      AND NOT cr.present
      AND drs.due_receipt_links_absent
      AND drs.receipt_due_id_required
      AND drs.receipt_due_fk_restrict
      AND drs.receipt_due_history_index
      AND drs.receipt_due_id_not_unique
      AND rc.case_xor_check
      AND rc.due_amount_non_negative
      AND rc.correction_reason_check
      AND rc.replacement_reason_check
      AND rc.receipt_self_lineage_fk
      AND rc.confirmation_receipt_fk
      AND rc.basis_attachment_fk
      AND col.due_amount_numeric
      AND col.correction_staff_required
      AND col.correction_reason_required
      AND col.replacement_staff_required
      AND col.confirmation_actor_required
      AND col.receipt_amount_present
      AND r.payment_dues = 0
      AND r.due_basis_document_references = 0
      AND r.due_corrections = 0
      AND r.payment_notices = 0
      AND r.payment_receipts = 0
      AND r.receipt_correction_replacements = 0
      AND r.payment_confirmations = 0
    THEN 'PASS'
    ELSE 'FAIL'
  END AS final_status
FROM dependency_presence d
CROSS JOIN summaries s
CROSS JOIN cases_relation cr
CROSS JOIN due_receipt_structure drs
CROSS JOIN required_constraints rc
CROSS JOIN required_columns col
CROSS JOIN row_counts r;
