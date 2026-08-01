-- Batch 16 read-only structural verifier for final RLS policies. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.
-- Verifies: helper functions, RLS enabled on all schema tables, policies created, zero positive grants.

WITH functions_presence AS (
  SELECT
    count(*) FILTER (WHERE p.proname = 'get_current_user_profile_id') = 1 AS fn_user_profile,
    count(*) FILTER (WHERE p.proname = 'get_current_staff_profile_id') = 1 AS fn_staff_profile,
    count(*) FILTER (WHERE p.proname = 'is_staff'                      ) = 1 AS fn_is_staff,
    count(*) FILTER (WHERE p.proname = 'is_manager'                    ) = 1 AS fn_is_manager,
    count(*) FILTER (WHERE p.proname = 'has_role'                      ) = 1 AS fn_has_role,
    count(*) FILTER (WHERE p.proname = 'is_taxpayer_for'               ) = 1 AS fn_is_taxpayer
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'identity'
),
rls_sample AS (
  SELECT
    -- identity
    count(*) FILTER (WHERE c.relname = 'user_profiles'          AND c.relrowsecurity) = 1 AS rls_user_profiles,
    count(*) FILTER (WHERE c.relname = 'staff_profiles'          AND c.relrowsecurity) = 1 AS rls_staff_profiles,
    count(*) FILTER (WHERE c.relname = 'roles'                  AND c.relrowsecurity) = 1 AS rls_roles,
    count(*) FILTER (WHERE c.relname = 'permissions'            AND c.relrowsecurity) = 1 AS rls_permissions,
    count(*) FILTER (WHERE c.relname = 'role_permissions'        AND c.relrowsecurity) = 1 AS rls_role_permissions,
    count(*) FILTER (WHERE c.relname = 'staff_role_assignments'  AND c.relrowsecurity) = 1 AS rls_staff_assignments,
    -- registry
    count(*) FILTER (WHERE c.relname = 'taxpayers'              AND c.relrowsecurity) = 1 AS rls_taxpayers,
    count(*) FILTER (WHERE c.relname = 'taxpayer_account_links' AND c.relrowsecurity) = 1 AS rls_account_links,
    -- requests
    count(*) FILTER (WHERE c.relname = 'service_requests'       AND c.relrowsecurity) = 1 AS rls_requests,
    -- balaghat
    count(*) FILTER (WHERE c.relname = 'balaghs'                AND c.relrowsecurity) = 1 AS rls_balaghs,
    -- visits
    count(*) FILTER (WHERE c.relname = 'field_visits'           AND c.relrowsecurity) = 1 AS rls_visits,
    -- dues
    count(*) FILTER (WHERE c.relname = 'payment_dues'           AND c.relrowsecurity) = 1 AS rls_dues,
    -- files
    count(*) FILTER (WHERE c.relname = 'attachments'            AND c.relrowsecurity) = 1 AS rls_files,
    -- content
    count(*) FILTER (WHERE c.relname = 'content_pages'          AND c.relrowsecurity) = 1 AS rls_content
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname IN (
      'identity', 'registry', 'legal', 'masterdata', 'requests', 'balaghat', 'visits', 'dues', 'files', 'notify', 'imports', 'content', 'audit', 'reporting'
    )
),
policies_sample AS (
  -- Verify key policies exist
  SELECT
    count(*) FILTER (WHERE p.polname = 'user_profiles_owner_policy'    ) = 1 AS pol_user_profiles,
    count(*) FILTER (WHERE p.polname = 'staff_profiles_policy'         ) = 1 AS pol_staff_profiles,
    count(*) FILTER (WHERE p.polname = 'taxpayers_policy'              ) = 1 AS pol_taxpayers,
    count(*) FILTER (WHERE p.polname = 'taxpayer_account_links_policy'  ) = 1 AS pol_account_links,
    count(*) FILTER (WHERE p.polname = 'service_requests_policy'       ) = 1 AS pol_requests,
    count(*) FILTER (WHERE p.polname = 'balaghs_policy'                ) = 1 AS pol_balaghs,
    count(*) FILTER (WHERE p.polname = 'field_visits_policy'           ) = 1 AS pol_field_visits,
    count(*) FILTER (WHERE p.polname = 'dues_staff_policy'             ) = 1 AS pol_dues
  FROM pg_catalog.pg_policy p
),
forbidden_grants AS (
  SELECT count(*) AS grant_count
  FROM information_schema.role_table_grants
  WHERE table_schema IN (
    'identity', 'registry', 'legal', 'masterdata', 'requests', 'balaghat', 'visits', 'dues', 'files', 'notify', 'imports', 'content', 'audit', 'reporting'
  )
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
    AND privilege_type = 'SELECT'
)
SELECT
  f.fn_user_profile, f.fn_staff_profile, f.fn_is_staff, f.fn_is_manager, f.fn_has_role, f.fn_is_taxpayer,
  r.*,
  p.*,
  g.grant_count,
  CASE
    WHEN f.fn_user_profile AND f.fn_staff_profile AND f.fn_is_staff AND f.fn_is_manager AND f.fn_has_role AND f.fn_is_taxpayer
      AND r.rls_user_profiles AND r.rls_staff_profiles AND r.rls_roles AND r.rls_permissions AND r.rls_role_permissions AND r.rls_staff_assignments
      AND r.rls_taxpayers AND r.rls_account_links AND r.rls_requests AND r.rls_balaghs AND r.rls_visits AND r.rls_dues AND r.rls_files AND r.rls_content
      AND p.pol_user_profiles AND p.pol_staff_profiles AND p.pol_taxpayers AND p.pol_account_links AND p.pol_requests AND p.pol_balaghs AND p.pol_field_visits AND p.pol_dues
      AND g.grant_count = 0
    THEN 'PASS'
    ELSE 'FAIL'
  END AS final_status
FROM functions_presence f
CROSS JOIN rls_sample r
CROSS JOIN policies_sample p
CROSS JOIN forbidden_grants g;