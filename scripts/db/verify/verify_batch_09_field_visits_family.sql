-- Batch 09 read-only structural verifier. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.

WITH dependency_presence AS (
  SELECT
    to_regclass('requests.service_requests') IS NOT NULL AS service_requests_present,
    to_regclass('balaghat.balaghs') IS NOT NULL AS balaghs_present,
    to_regclass('identity.staff_profiles') IS NOT NULL AS staff_profiles_present,
    to_regclass('identity.user_profiles') IS NOT NULL AS user_profiles_present,
    to_regclass('files.attachments') IS NOT NULL AS attachments_present,
    EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'visits'
    ) AS visits_schema_present
),
expected(table_name) AS (
  VALUES
    ('field_visits'),
    ('visit_schedules'),
    ('visit_team_members'),
    ('visit_results'),
    ('visit_result_corrections'),
    ('visit_evidences')
),
actual AS (
  SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'visits' AND c.relkind = 'r'
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
  WHERE table_schema = 'visits'
    AND table_name IN (SELECT table_name FROM expected)
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
policy_count AS (
  SELECT count(*)::integer AS value
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'visits'
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
required_constraints AS (
  SELECT
    count(*) FILTER (WHERE x.conname = 'field_visits_exact_one_parent_check') = 1
      AS exact_one_parent_check,
    count(*) FILTER (WHERE x.conname = 'visit_results_field_visit_key' AND x.contype = 'u') = 1
      AS one_result_per_visit,
    count(*) FILTER (
      WHERE x.conname = 'visit_result_corrections_reason_not_blank_check' AND x.contype = 'c'
    ) = 1 AS correction_reason_check,
    count(*) FILTER (
      WHERE x.conname = 'visit_team_members_history_key' AND x.contype = 'u'
    ) = 1 AS team_history_unique
  FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'visits'
),
required_columns AS (
  SELECT
    count(*) FILTER (
      WHERE table_name = 'field_visits'
        AND column_name = 'created_by_staff_profile_id'
        AND is_nullable = 'NO'
    ) = 1 AS created_by_staff_required,
    count(*) FILTER (
      WHERE table_name = 'visit_results'
        AND column_name = 'recorded_by_staff_profile_id'
        AND is_nullable = 'NO'
    ) = 1 AS recorded_by_staff_required,
    count(*) FILTER (
      WHERE table_name = 'visit_result_corrections'
        AND column_name = 'corrected_by_staff_profile_id'
        AND is_nullable = 'NO'
    ) = 1 AS corrected_by_staff_required,
    count(*) FILTER (
      WHERE table_name = 'visit_result_corrections'
        AND column_name = 'reason'
        AND is_nullable = 'NO'
    ) = 1 AS correction_reason_required,
    count(*) FILTER (
      WHERE table_name = 'visit_evidences'
        AND column_name = 'attachment_id'
        AND is_nullable = 'NO'
    ) = 1 AS evidence_attachment_required
  FROM information_schema.columns
  WHERE table_schema = 'visits'
    AND table_name IN (SELECT table_name FROM expected)
),
required_indexes AS (
  SELECT
    count(*) FILTER (
      WHERE indexname = 'visit_team_members_one_active_membership_idx'
        AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
        AND indexdef ILIKE '%(field_visit_id, staff_profile_id)%'
        AND indexdef ILIKE '%WHERE (effective_to IS NULL)%'
    ) = 1 AS one_active_team_membership,
    count(*) FILTER (
      WHERE indexname = 'field_visits_service_request_id_idx'
    ) = 1 AS request_parent_index,
    count(*) FILTER (
      WHERE indexname = 'field_visits_balagh_id_idx'
    ) = 1 AS balagh_parent_index
  FROM pg_catalog.pg_indexes
  WHERE schemaname = 'visits'
),
storage_fk_count AS (
  SELECT count(*)::integer AS value
  FROM pg_catalog.pg_constraint x
  JOIN pg_catalog.pg_class c ON c.oid = x.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_class rc ON rc.oid = x.confrelid
  JOIN pg_catalog.pg_namespace rn ON rn.oid = rc.relnamespace
  WHERE x.contype = 'f'
    AND n.nspname = 'visits'
    AND rn.nspname = 'storage'
),
row_counts AS (
  SELECT
    (SELECT count(*) FROM visits.field_visits) AS field_visits,
    (SELECT count(*) FROM visits.visit_schedules) AS visit_schedules,
    (SELECT count(*) FROM visits.visit_team_members) AS visit_team_members,
    (SELECT count(*) FROM visits.visit_results) AS visit_results,
    (SELECT count(*) FROM visits.visit_result_corrections) AS visit_result_corrections,
    (SELECT count(*) FROM visits.visit_evidences) AS visit_evidences
),
summaries AS (
  SELECT
    (SELECT count(*) FROM table_checks WHERE status <> 'OK') AS table_mismatch_count,
    (SELECT count(*) FROM forbidden_grants) AS forbidden_grant_count,
    (SELECT value FROM policy_count) AS policy_count,
    (SELECT value FROM storage_fk_count) AS storage_fk_count
)
SELECT
  d.service_requests_present,
  d.balaghs_present,
  d.staff_profiles_present,
  d.user_profiles_present,
  d.attachments_present,
  d.visits_schema_present,
  s.table_mismatch_count,
  s.forbidden_grant_count,
  s.policy_count,
  s.storage_fk_count,
  NOT cr.present AS cases_relation_absent,
  rc.exact_one_parent_check,
  rc.one_result_per_visit,
  rc.correction_reason_check,
  rc.team_history_unique,
  col.created_by_staff_required,
  col.recorded_by_staff_required,
  col.corrected_by_staff_required,
  col.correction_reason_required,
  col.evidence_attachment_required,
  ix.one_active_team_membership,
  ix.request_parent_index,
  ix.balagh_parent_index,
  r.field_visits,
  r.visit_schedules,
  r.visit_team_members,
  r.visit_results,
  r.visit_result_corrections,
  r.visit_evidences,
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
      AND d.visits_schema_present
      AND s.table_mismatch_count = 0
      AND s.forbidden_grant_count = 0
      AND s.policy_count = 0
      AND s.storage_fk_count = 0
      AND NOT cr.present
      AND rc.exact_one_parent_check
      AND rc.one_result_per_visit
      AND rc.correction_reason_check
      AND rc.team_history_unique
      AND col.created_by_staff_required
      AND col.recorded_by_staff_required
      AND col.corrected_by_staff_required
      AND col.correction_reason_required
      AND col.evidence_attachment_required
      AND ix.one_active_team_membership
      AND ix.request_parent_index
      AND ix.balagh_parent_index
      AND r.field_visits = 0
      AND r.visit_schedules = 0
      AND r.visit_team_members = 0
      AND r.visit_results = 0
      AND r.visit_result_corrections = 0
      AND r.visit_evidences = 0
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
