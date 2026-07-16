-- MARIB-TAX-DB-FOUNDATION-BATCH-02-IDENTITY-PROFILES
-- Create the application user-profile and staff-profile tables only.
-- Authoring batch: do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

CREATE TABLE identity.user_profiles (
  id uuid NOT NULL,
  auth_user_id uuid NOT NULL,
  display_name text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  archived_at timestamptz NULL,

  CONSTRAINT user_profiles_pkey
    PRIMARY KEY (id),
  CONSTRAINT user_profiles_auth_user_id_key
    UNIQUE (auth_user_id),
  CONSTRAINT user_profiles_auth_user_id_fkey
    FOREIGN KEY (auth_user_id)
    REFERENCES auth.users (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT user_profiles_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT user_profiles_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

COMMENT ON TABLE identity.user_profiles IS
  'Application user profiles linked one-to-one to Supabase Auth users. No application password or OTP storage.';

COMMENT ON COLUMN identity.user_profiles.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN identity.user_profiles.auth_user_id IS
  'Unique reference to the managed auth.users identity.';
COMMENT ON COLUMN identity.user_profiles.display_name IS
  'Optional display name; not an authentication or authorization key.';
COMMENT ON COLUMN identity.user_profiles.is_active IS
  'Application-profile active flag; authorization still requires backend checks.';
COMMENT ON COLUMN identity.user_profiles.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN identity.user_profiles.created_by_profile_id IS
  'Optional creating application profile; nullable for controlled bootstrap.';
COMMENT ON COLUMN identity.user_profiles.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN identity.user_profiles.updated_by_profile_id IS
  'Optional application profile that performed the last update.';
COMMENT ON COLUMN identity.user_profiles.archived_at IS
  'Soft-archive timestamp; hard deletion is not the normal lifecycle.';

CREATE TABLE identity.staff_profiles (
  id uuid NOT NULL,
  user_profile_id uuid NOT NULL,
  staff_code text NULL,
  title text NULL,
  is_active boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  archived_at timestamptz NULL,

  CONSTRAINT staff_profiles_pkey
    PRIMARY KEY (id),
  CONSTRAINT staff_profiles_user_profile_id_key
    UNIQUE (user_profile_id),
  CONSTRAINT staff_profiles_staff_code_key
    UNIQUE (staff_code),
  CONSTRAINT staff_profiles_user_profile_id_fkey
    FOREIGN KEY (user_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT staff_profiles_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT staff_profiles_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT staff_profiles_effective_period_check
    CHECK (effective_to IS NULL OR effective_to > effective_from)
);

COMMENT ON TABLE identity.staff_profiles IS
  'Staff eligibility profiles used for assignments and field-work attribution; not a full human-resources record.';

COMMENT ON COLUMN identity.staff_profiles.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN identity.staff_profiles.user_profile_id IS
  'Unique backing application user profile.';
COMMENT ON COLUMN identity.staff_profiles.staff_code IS
  'Optional unique staff code; multiple NULL values remain permitted.';
COMMENT ON COLUMN identity.staff_profiles.title IS
  'Optional job title for operational display.';
COMMENT ON COLUMN identity.staff_profiles.is_active IS
  'Current staff-eligibility flag.';
COMMENT ON COLUMN identity.staff_profiles.effective_from IS
  'Eligibility start timestamp supplied explicitly by the backend.';
COMMENT ON COLUMN identity.staff_profiles.effective_to IS
  'Optional eligibility end timestamp; must be later than effective_from.';
COMMENT ON COLUMN identity.staff_profiles.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN identity.staff_profiles.created_by_profile_id IS
  'Optional creating application profile; nullable for controlled bootstrap.';
COMMENT ON COLUMN identity.staff_profiles.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN identity.staff_profiles.updated_by_profile_id IS
  'Optional application profile that performed the last update.';
COMMENT ON COLUMN identity.staff_profiles.archived_at IS
  'Soft-archive timestamp; historical attribution must remain preserved.';

ALTER TABLE identity.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.staff_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  identity.user_profiles,
  identity.staff_profiles
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
