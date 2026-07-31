-- Batch 16 read-only structural verifier for final RLS policies. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.

WITH functions_presence AS (
  SELECT
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_user_profile_id') AS user_profile_fn,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_staff_profile_id') AS staff_profile_fn,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_staff') AS is_staff_fn,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_manager') AS is_manager_fn,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') AS has_role_fn
  FROM pg_namespace n
  WHERE n.nspname = 'identity'
),
rls_enabled_tables AS (
  -- Verify a sample of tables across schemas have RLS enabled
  SELECT
    count(*) FILTER (WHERE c.relname = 'service_requests' AND c.relrowsecurity) = 1 AS requests_rls,
    count(*) FILTER (WHERE c.relname = 'field_visits' AND c.relrowsecurity) = 1 AS visits_rls,
    count(*) FILTER (WHERE c.relname = 'payment_dues' AND c.relrowsecurity) = 1 AS dues_rls,
    count(*) FILTER (WHERE c.relname = 'user_profiles' AND c.relrowsecurity) = 1 AS identity_rls,
    count(*) FILTER (WHERE c.relname = 'content_pages' AND c.relrowsecurity) = 1 AS content_rls
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
),
policies_presence AS (
  -- Verify that policies exist on major tables
  SELECT
    count(*) FILTER (WHERE c.relname = 'service_requests') >= 1 AS requests_policies,
    count(*) FILTER (WHERE c.relname = 'field_visits') >= 1 AS visits_policies,
    count(*) FILTER (WHERE c.relname = 'payment_dues') >= 1 AS dues_policies,
    count(*) FILTER (WHERE c.relname = 'user_profiles') >= 1 AS identity_policies
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
)
SELECT
  f.user_profile_fn,
  f.staff_profile_fn,
  f.is_staff_fn,
  f.is_manager_fn,
  f.has_role_fn,
  r.requests_rls,
  r.visits_rls,
  r.dues_rls,
  r.identity_rls,
  r.content_rls,
  p.requests_policies,
  p.visits_policies,
  p.dues_policies,
  p.identity_policies,
  CASE
    WHEN f.user_profile_fn
      AND f.staff_profile_fn
      AND f.is_staff_fn
      AND f.is_manager_fn
      AND f.has_role_fn
      AND r.requests_rls
      AND r.visits_rls
      AND r.dues_rls
      AND r.identity_rls
      AND r.content_rls
      AND p.requests_policies
      AND p.visits_policies
      AND p.dues_policies
      AND p.identity_policies
    THEN 'PASS'
    ELSE 'FAIL'
  END AS final_status
FROM functions_presence f
CROSS JOIN rls_enabled_tables r
CROSS JOIN policies_presence p;
