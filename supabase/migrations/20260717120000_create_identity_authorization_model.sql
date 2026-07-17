-- MARIB-TAX-DB-FOUNDATION-BATCH-03-AUTHORIZATION-MODEL
-- Create the application roles, permissions, role-permission grants, and staff role assignments only.
-- Authoring batch: do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No role/permission seed rows are introduced in Batch 03.
-- Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

CREATE TABLE identity.roles (
  id uuid NOT NULL,
  code text NOT NULL,
  name_ar text NOT NULL,
  description text NULL,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  archived_at timestamptz NULL,

  CONSTRAINT roles_pkey
    PRIMARY KEY (id),
  CONSTRAINT roles_code_key
    UNIQUE (code),
  CONSTRAINT roles_code_format_check
    CHECK (code ~ '^[a-z][a-z0-9_]{2,63}$'),
  CONSTRAINT roles_name_ar_not_blank_check
    CHECK (btrim(name_ar) <> ''),
  CONSTRAINT roles_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT roles_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

COMMENT ON TABLE identity.roles IS
  'Application role catalogue. code is a stable programmatic key, not the display name. Role codes are treated as immutable by NestJS. No role seed rows are introduced in Batch 03. No passwords, OTP secrets, or Auth credentials are stored.';

COMMENT ON COLUMN identity.roles.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN identity.roles.code IS
  'Stable programmatic role key (not a display name). Treated as immutable by NestJS after creation.';
COMMENT ON COLUMN identity.roles.name_ar IS
  'Arabic display name for operational UI; not the authorization key.';
COMMENT ON COLUMN identity.roles.description IS
  'Optional human-readable role description.';
COMMENT ON COLUMN identity.roles.is_system IS
  'Marks system-managed roles; NestJS enforces immutability rules for system roles.';
COMMENT ON COLUMN identity.roles.is_active IS
  'Catalogue active flag; authorization still requires backend checks.';
COMMENT ON COLUMN identity.roles.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN identity.roles.created_by_profile_id IS
  'Optional creating application profile; nullable only for controlled bootstrap.';
COMMENT ON COLUMN identity.roles.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN identity.roles.updated_by_profile_id IS
  'Optional application profile that performed the last update.';
COMMENT ON COLUMN identity.roles.archived_at IS
  'Soft-archive timestamp; hard deletion is not the normal lifecycle.';

CREATE TABLE identity.permissions (
  id uuid NOT NULL,
  code text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  name_ar text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  archived_at timestamptz NULL,

  CONSTRAINT permissions_pkey
    PRIMARY KEY (id),
  CONSTRAINT permissions_code_key
    UNIQUE (code),
  CONSTRAINT permissions_resource_action_key
    UNIQUE (resource, action),
  CONSTRAINT permissions_resource_format_check
    CHECK (resource ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){0,3}$'),
  CONSTRAINT permissions_action_format_check
    CHECK (action ~ '^[a-z][a-z0-9_]{0,63}$'),
  CONSTRAINT permissions_code_match_check
    CHECK (code = resource || '.' || action),
  CONSTRAINT permissions_name_ar_not_blank_check
    CHECK (btrim(name_ar) <> ''),
  CONSTRAINT permissions_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT permissions_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

COMMENT ON TABLE identity.permissions IS
  'Application permission catalogue. code is a stable programmatic key equal to resource.action, not the display name. Permission codes are treated as immutable by NestJS. No permission seed rows are introduced in Batch 03. No passwords, OTP secrets, or Auth credentials are stored.';

COMMENT ON COLUMN identity.permissions.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN identity.permissions.code IS
  'Stable programmatic permission key equal to resource || ''.'' || action. Treated as immutable by NestJS after creation.';
COMMENT ON COLUMN identity.permissions.resource IS
  'Permission resource segment used to compose code; not a display name.';
COMMENT ON COLUMN identity.permissions.action IS
  'Permission action segment used to compose code; not a display name.';
COMMENT ON COLUMN identity.permissions.name_ar IS
  'Arabic display name for operational UI; not the authorization key.';
COMMENT ON COLUMN identity.permissions.description IS
  'Optional human-readable permission description.';
COMMENT ON COLUMN identity.permissions.is_active IS
  'Catalogue active flag; authorization still requires backend checks.';
COMMENT ON COLUMN identity.permissions.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN identity.permissions.created_by_profile_id IS
  'Optional creating application profile; nullable only for controlled bootstrap.';
COMMENT ON COLUMN identity.permissions.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN identity.permissions.updated_by_profile_id IS
  'Optional application profile that performed the last update.';
COMMENT ON COLUMN identity.permissions.archived_at IS
  'Soft-archive timestamp; hard deletion is not the normal lifecycle.';

CREATE TABLE identity.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by_profile_id uuid NULL,

  CONSTRAINT role_permissions_pkey
    PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey
    FOREIGN KEY (role_id)
    REFERENCES identity.roles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT role_permissions_permission_id_fkey
    FOREIGN KEY (permission_id)
    REFERENCES identity.permissions (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT role_permissions_granted_by_profile_id_fkey
    FOREIGN KEY (granted_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

CREATE INDEX role_permissions_permission_id_idx
  ON identity.role_permissions (permission_id);

COMMENT ON TABLE identity.role_permissions IS
  'Direct grant mapping between a role and a permission. Does not auto-create permissions. No seed grants are introduced in Batch 03. No passwords, OTP secrets, or Auth credentials are stored.';

COMMENT ON COLUMN identity.role_permissions.role_id IS
  'Granted role; references identity.roles.';
COMMENT ON COLUMN identity.role_permissions.permission_id IS
  'Granted permission; references identity.permissions.';
COMMENT ON COLUMN identity.role_permissions.granted_at IS
  'Timestamp when the direct role-permission grant was recorded.';
COMMENT ON COLUMN identity.role_permissions.granted_by_profile_id IS
  'Optional granting application profile; nullable only for controlled bootstrap.';

CREATE TABLE identity.staff_role_assignments (
  id uuid NOT NULL,
  staff_profile_id uuid NOT NULL,
  role_id uuid NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by_profile_id uuid NULL,
  revoked_at timestamptz NULL,
  revoked_by_profile_id uuid NULL,
  revocation_reason text NULL,

  CONSTRAINT staff_role_assignments_pkey
    PRIMARY KEY (id),
  CONSTRAINT staff_role_assignments_staff_role_effective_key
    UNIQUE (staff_profile_id, role_id, effective_from),
  CONSTRAINT staff_role_assignments_staff_profile_id_fkey
    FOREIGN KEY (staff_profile_id)
    REFERENCES identity.staff_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT staff_role_assignments_role_id_fkey
    FOREIGN KEY (role_id)
    REFERENCES identity.roles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT staff_role_assignments_assigned_by_profile_id_fkey
    FOREIGN KEY (assigned_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT staff_role_assignments_revoked_by_profile_id_fkey
    FOREIGN KEY (revoked_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT staff_role_assignments_effective_period_check
    CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT staff_role_assignments_revoked_at_check
    CHECK (revoked_at IS NULL OR revoked_at >= effective_from),
  CONSTRAINT staff_role_assignments_revocation_consistency_check
    CHECK (
      (
        revoked_at IS NULL
        AND revoked_by_profile_id IS NULL
        AND revocation_reason IS NULL
      )
      OR
      (
        revoked_at IS NOT NULL
        AND revoked_by_profile_id IS NOT NULL
      )
    ),
  CONSTRAINT staff_role_assignments_revocation_reason_check
    CHECK (revocation_reason IS NULL OR btrim(revocation_reason) <> '')
);

CREATE INDEX staff_role_assignments_staff_profile_id_idx
  ON identity.staff_role_assignments (staff_profile_id);

CREATE INDEX staff_role_assignments_role_id_idx
  ON identity.staff_role_assignments (role_id);

-- Partial unique index: prevents more than one open assignment of the same role
-- to the same staff profile (effective_to IS NULL AND revoked_at IS NULL).
-- Broader temporal-overlap prevention remains NestJS responsibility in this batch.
CREATE UNIQUE INDEX staff_role_assignments_one_open_assignment_idx
  ON identity.staff_role_assignments (staff_profile_id, role_id)
  WHERE effective_to IS NULL
    AND revoked_at IS NULL;

COMMENT ON TABLE identity.staff_role_assignments IS
  'Internal staff role assignments only; does not apply to taxpayers. revoked_at is explicit revocation and differs from effective_to period end. Hard deletion is not the normal lifecycle. No passwords, OTP secrets, or Auth credentials are stored. No assignment seed rows are introduced in Batch 03.';

COMMENT ON COLUMN identity.staff_role_assignments.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN identity.staff_role_assignments.staff_profile_id IS
  'Assigned staff profile; taxpayers are out of scope for this table.';
COMMENT ON COLUMN identity.staff_role_assignments.role_id IS
  'Assigned role from identity.roles.';
COMMENT ON COLUMN identity.staff_role_assignments.effective_from IS
  'Assignment effectiveness start timestamp supplied explicitly by NestJS.';
COMMENT ON COLUMN identity.staff_role_assignments.effective_to IS
  'Optional planned effectiveness end; differs from revoked_at explicit revocation.';
COMMENT ON COLUMN identity.staff_role_assignments.assigned_at IS
  'Timestamp when the assignment row was recorded.';
COMMENT ON COLUMN identity.staff_role_assignments.assigned_by_profile_id IS
  'Optional assigning application profile; nullable only for controlled bootstrap.';
COMMENT ON COLUMN identity.staff_role_assignments.revoked_at IS
  'Explicit revocation timestamp; differs from effective_to period end.';
COMMENT ON COLUMN identity.staff_role_assignments.revoked_by_profile_id IS
  'Application profile that revoked the assignment; required when revoked_at is set.';
COMMENT ON COLUMN identity.staff_role_assignments.revocation_reason IS
  'Optional non-blank reason recorded with revocation.';

ALTER TABLE identity.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.staff_role_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  identity.roles,
  identity.permissions,
  identity.role_permissions,
  identity.staff_role_assignments
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
