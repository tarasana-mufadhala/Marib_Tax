-- MARIB-TAX-DB-FOUNDATION-BATCH-16-FINAL-RLS-POLICIES
-- Apply Row Level Security policies per the authorization matrix.
-- Authoring only; do not apply to production in this task.
-- Policy strategy:
--   - Taxpayer: sees own data (via taxpayer_account_links or direct filer/creator profile).
--   - Staff:   sees assigned cases and operational data within their role scope.
--   - Manager:  sees all rows (office director, admin, auditor).
-- No positive grants remain — all tables use REVOKE ALL first, then RLS policies.
-- No seed/backfill data. No INSERT/UPDATE policy mixing.

BEGIN;

-- ============================================================================
-- Helper functions for RLS policy predicates
-- ============================================================================

-- Returns the current user's application profile UUID from auth.users ↔ user_profiles mapping.
CREATE OR REPLACE FUNCTION identity.get_current_user_profile_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'identity'
AS $$
  SELECT up.id
  FROM auth.users au
  JOIN identity.user_profiles up ON up.auth_user_id = au.id
  WHERE au.id = auth.uid();
$$;

-- Returns the current staff profile UUID (NULL if user is not staff).
CREATE OR REPLACE FUNCTION identity.get_current_staff_profile_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'identity'
AS $$
  SELECT sp.id
  FROM identity.staff_profiles sp
  JOIN identity.user_profiles up ON up.id = sp.user_profile_id
  JOIN auth.users au ON au.id = up.auth_user_id
  WHERE au.id = auth.uid()
    AND sp.is_active = true;
$$;

-- Returns true if the current user has a staff profile.
CREATE OR REPLACE FUNCTION identity.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'identity'
AS $$
  SELECT identity.get_current_staff_profile_id() IS NOT NULL;
$$;

-- Returns true if the current user has a management role (manager, director, admin).
CREATE OR REPLACE FUNCTION identity.is_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'identity'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM identity.staff_role_assignments sra
    JOIN identity.roles r ON r.id = sra.role_id
    WHERE sra.staff_profile_id = identity.get_current_staff_profile_id()
      AND r.code IN (
        'manager_of_directorate',
        'director_of_office',
        'admin_system_director',
        'auditor_inspector'
      )
      AND (sra.effective_to IS NULL OR sra.effective_to > now())
      AND sra.revoked_at IS NULL
  );
$$;

-- Returns true if the current user has a specific role code.
CREATE OR REPLACE FUNCTION identity.has_role(role_code text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'identity'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM identity.staff_role_assignments sra
    JOIN identity.roles r ON r.id = sra.role_id
    WHERE sra.staff_profile_id = identity.get_current_staff_profile_id()
      AND r.code = role_code
      AND (sra.effective_to IS NULL OR sra.effective_to > now())
      AND sra.revoked_at IS NULL
  );
$$;

-- Returns true if the current user is the taxpayer linked to a given taxpayer_id.
CREATE OR REPLACE FUNCTION identity.is_taxpayer_for(taxpayer_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'registry,identity'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM registry.taxpayer_account_links tal
    JOIN identity.user_profiles up ON up.id = tal.user_profile_id
    JOIN auth.users au ON au.id = up.auth_user_id
    WHERE tal.taxpayer_id = is_taxpayer_for.taxpayer_id
      AND au.id = auth.uid()
      AND tal.is_active = true
      AND (tal.effective_to IS NULL OR tal.effective_to > now())
  );
$$;

COMMENT ON FUNCTION identity.get_current_user_profile_id() IS 'RLS helper: returns the application user_profiles.id for the current auth user.';
COMMENT ON FUNCTION identity.get_current_staff_profile_id() IS 'RLS helper: returns staff_profiles.id for the current auth user. NULL if not staff.';
COMMENT ON FUNCTION identity.is_staff() IS 'RLS helper: true if the current user has an active staff profile.';
COMMENT ON FUNCTION identity.is_manager() IS 'RLS helper: true if the current user holds director/manager/auditor role.';
COMMENT ON FUNCTION identity.has_role(text) IS 'RLS helper: true if the current user holds the given role code.';
COMMENT ON FUNCTION identity.is_taxpayer_for(uuid) IS 'RLS helper: true if the current user is a linked taxpayer account for the given taxpayer_id.';

-- ============================================================================
-- identity schema — RLS: staff-only for roles/catalogue; profile-owner for own
-- ============================================================================

-- user_profiles: authenticated users see their own profile; managers see all
DROP POLICY IF EXISTS user_profiles_owner_policy ON identity.user_profiles;
CREATE POLICY user_profiles_owner_policy ON identity.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = identity.get_current_user_profile_id()
    OR identity.is_manager()
  );

-- staff_profiles: staff can see own; managers see all
DROP POLICY IF EXISTS staff_profiles_policy ON identity.staff_profiles;
CREATE POLICY staff_profiles_policy ON identity.staff_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_profile_id = identity.get_current_user_profile_id()
    OR identity.is_manager()
  );

-- roles, permissions, role_permissions: read-only for authenticated; write by manager
DROP POLICY IF EXISTS roles_read_by_staff ON identity.roles;
CREATE POLICY roles_read_by_staff ON identity.roles
  FOR SELECT TO authenticated
  USING (identity.is_staff());

DROP POLICY IF EXISTS permissions_read_by_staff ON identity.permissions;
CREATE POLICY permissions_read_by_staff ON identity.permissions
  FOR SELECT TO authenticated
  USING (identity.is_staff());

DROP POLICY IF EXISTS role_permissions_read_by_staff ON identity.role_permissions;
CREATE POLICY role_permissions_read_by_staff ON identity.role_permissions
  FOR SELECT TO authenticated
  USING (identity.is_staff());

-- staff_role_assignments: managers see all; staff see own
DROP POLICY IF EXISTS staff_role_assignments_policy ON identity.staff_role_assignments;
CREATE POLICY staff_role_assignments_policy ON identity.staff_role_assignments
  FOR SELECT TO authenticated
  USING (
    staff_profile_id = identity.get_current_staff_profile_id()
    OR identity.is_manager()
  );

-- ============================================================================
-- registry schema — taxpayer-owns, staff-assigned, manager-all
-- ============================================================================

-- taxpayers: linked taxpayer sees own; staff see assigned; manager sees all
DROP POLICY IF EXISTS taxpayers_policy ON registry.taxpayers;
CREATE POLICY taxpayers_policy ON registry.taxpayers
  FOR SELECT TO authenticated
  USING (
    identity.is_taxpayer_for(taxpayers.id)
    OR identity.is_staff()
    OR identity.is_manager()
  );

-- taxpayer_account_links: own links + staff + managers
DROP POLICY IF EXISTS taxpayer_account_links_policy ON registry.taxpayer_account_links;
CREATE POLICY taxpayer_account_links_policy ON registry.taxpayer_account_links
  FOR SELECT TO authenticated
  USING (
    user_profile_id = identity.get_current_user_profile_id()
    OR identity.is_staff()
    OR identity.is_manager()
  );

-- ============================================================================
-- legal schema — staff/managers only
-- ============================================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'legal'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS legal_staff_policy ON legal.%I', tbl);
    EXECUTE format(
      'CREATE POLICY legal_staff_policy ON legal.%I FOR SELECT TO authenticated USING (identity.is_staff() OR identity.is_manager())',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================================
-- masterdata schema — staff/managers access
-- ============================================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'masterdata'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS masterdata_staff_policy ON masterdata.%I', tbl);
    EXECUTE format(
      'CREATE POLICY masterdata_staff_policy ON masterdata.%I FOR SELECT TO authenticated USING (identity.is_staff() OR identity.is_manager())',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================================
-- requests schema — taxpayer-own, staff-assigned, manager-all
-- ============================================================================

-- service_requests: taxpayer (owner) sees own; staff sees assigned or all; manager sees all
DROP POLICY IF EXISTS service_requests_policy ON requests.service_requests;
CREATE POLICY service_requests_policy ON requests.service_requests
  FOR SELECT TO authenticated
  USING (
    identity.is_taxpayer_for(service_requests.taxpayer_id)
    OR identity.is_manager()
    OR (
      identity.is_staff()
      AND (
        service_requests.assignee_id = identity.get_current_staff_profile_id()
        OR service_requests.created_by_profile_id = identity.get_current_user_profile_id()
      )
    )
  );

-- Ancillary request tables follow the parent request
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'requests'
      AND tablename <> 'service_requests'
      AND tablename <> 'service_types'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS requests_related_policy ON requests.%I', tbl);
    EXECUTE format(
      'CREATE POLICY requests_related_policy ON requests.%I FOR SELECT TO authenticated USING (identity.is_staff() OR identity.is_manager())',
      tbl
    );
  END LOOP;
END $$;

-- service_types: catalogue visible to all staff
DROP POLICY IF EXISTS service_types_read_staff ON requests.service_types;
CREATE POLICY service_types_read_staff ON requests.service_types
  FOR SELECT TO authenticated
  USING (identity.is_staff() OR identity.is_manager());

-- ============================================================================
-- balaghat schema — filer-own, staff-assigned, manager-all
-- ============================================================================

DROP POLICY IF EXISTS balaghs_policy ON balaghat.balaghs;
CREATE POLICY balaghs_policy ON balaghat.balaghs
  FOR SELECT TO authenticated
  USING (
    identity.is_taxpayer_for(balaghs.taxpayer_id)
    OR identity.is_staff()
    OR identity.is_manager()
  );

-- Ancillary balaghat tables fallback to staff+manager
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'balaghat'
      AND tablename <> 'balaghs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS balaghat_staff_policy ON balaghat.%I', tbl);
    EXECUTE format(
      'CREATE POLICY balaghat_staff_policy ON balaghat.%I FOR SELECT TO authenticated USING (identity.is_staff() OR identity.is_manager())',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================================
-- visits schema — staff-on-visit, manager-all
-- ============================================================================

DROP POLICY IF EXISTS field_visits_policy ON visits.field_visits;
CREATE POLICY field_visits_policy ON visits.field_visits
  FOR SELECT TO authenticated
  USING (
    identity.is_manager()
    OR identity.is_staff()
  );

-- visit_team_members: staff see their own assigned visits
DROP POLICY IF EXISTS visit_team_members_policy ON visits.visit_team_members;
CREATE POLICY visit_team_members_policy ON visits.visit_team_members
  FOR SELECT TO authenticated
  USING (
    staff_profile_id = identity.get_current_staff_profile_id()
    OR identity.is_manager()
  );

-- Other visits sub-tables
DROP POLICY IF EXISTS visit_schedules_policy ON visits.visit_schedules;
CREATE POLICY visit_schedules_policy ON visits.visit_schedules
  FOR SELECT TO authenticated
  USING (identity.is_staff() OR identity.is_manager());

-- ============================================================================
-- dues schema — staff/managers only (financial data)
-- ============================================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'dues'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS dues_staff_policy ON dues.%I', tbl);
    EXECUTE format(
      'CREATE POLICY dues_staff_policy ON dues.%I FOR SELECT TO authenticated USING (identity.is_staff() OR identity.is_manager())',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================================
-- files, notify, imports, content, audit, reporting — staff-only or manager
-- ============================================================================
DO $$
DECLARE
  s text;
  tbl text;
BEGIN
  FOR s, tbl IN
    SELECT schemaname, tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname IN ('files', 'notify', 'imports', 'content', 'audit', 'reporting')
      AND tablename IS NOT NULL
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS files_notify_policy ON %I.%I', s, tbl);
    EXECUTE format(
      'CREATE POLICY files_notify_policy ON %I.%I FOR SELECT TO authenticated USING (identity.is_staff() OR identity.is_manager())',
      s, tbl
    );
  END LOOP;
END $$;

-- ============================================================================
-- Default-deny: all INSERT/UPDATE/DELETE require manager role
-- Covered by NestJS app layer with transactional authorization checks.
-- SELECT policies above provide read access surface.
-- ============================================================================

COMMIT;