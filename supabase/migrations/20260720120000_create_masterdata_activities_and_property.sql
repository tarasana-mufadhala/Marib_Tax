-- MARIB-TAX-DB-FOUNDATION-BATCH-05-MASTERDATA-ACTIVITIES-AND-PROPERTY
-- Create commercial activities, branches, addresses, properties, and authoritative ownership records.
-- Authoring batch: do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No seed rows are introduced in Batch 05. TABLE-021 is conditional and intentionally excluded.
-- Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

CREATE TABLE masterdata.commercial_activities (
  id uuid NOT NULL,
  public_ref text NULL,
  taxpayer_id uuid NOT NULL,
  name text NOT NULL,
  status_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  archived_at timestamptz NULL,
  CONSTRAINT commercial_activities_pkey PRIMARY KEY (id),
  CONSTRAINT commercial_activities_public_ref_key UNIQUE (public_ref),
  CONSTRAINT commercial_activities_name_not_blank_check CHECK (btrim(name) <> ''),
  CONSTRAINT commercial_activities_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT commercial_activities_taxpayer_id_fkey FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT commercial_activities_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT commercial_activities_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX commercial_activities_taxpayer_id_idx ON masterdata.commercial_activities (taxpayer_id);
COMMENT ON TABLE masterdata.commercial_activities IS 'TABLE-014 commercial activity root for a taxpayer.';
COMMENT ON COLUMN masterdata.commercial_activities.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN masterdata.commercial_activities.public_ref IS 'Optional unique public business reference.';
COMMENT ON COLUMN masterdata.commercial_activities.taxpayer_id IS 'Operating taxpayer registry root.';
COMMENT ON COLUMN masterdata.commercial_activities.name IS 'Activity or trade name.';
COMMENT ON COLUMN masterdata.commercial_activities.status_code IS 'Current activity lifecycle status code.';
COMMENT ON COLUMN masterdata.commercial_activities.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN masterdata.commercial_activities.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN masterdata.commercial_activities.updated_at IS 'Last application update timestamp.';
COMMENT ON COLUMN masterdata.commercial_activities.updated_by_profile_id IS 'Optional last-updating application profile.';
COMMENT ON COLUMN masterdata.commercial_activities.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN masterdata.commercial_activities.archived_at IS 'Optional soft-archive timestamp.';

CREATE TABLE masterdata.branches (
  id uuid NOT NULL,
  public_ref text NULL,
  commercial_activity_id uuid NOT NULL,
  name text NOT NULL,
  status_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  archived_at timestamptz NULL,
  CONSTRAINT branches_pkey PRIMARY KEY (id),
  CONSTRAINT branches_public_ref_key UNIQUE (public_ref),
  CONSTRAINT branches_name_not_blank_check CHECK (btrim(name) <> ''),
  CONSTRAINT branches_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT branches_commercial_activity_id_fkey FOREIGN KEY (commercial_activity_id)
    REFERENCES masterdata.commercial_activities (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT branches_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT branches_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX branches_commercial_activity_id_idx ON masterdata.branches (commercial_activity_id);
COMMENT ON TABLE masterdata.branches IS 'TABLE-015 branch under a commercial activity.';
COMMENT ON COLUMN masterdata.branches.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN masterdata.branches.public_ref IS 'Optional unique public business reference.';
COMMENT ON COLUMN masterdata.branches.commercial_activity_id IS 'Parent commercial activity; no silent reparenting.';
COMMENT ON COLUMN masterdata.branches.name IS 'Branch name.';
COMMENT ON COLUMN masterdata.branches.status_code IS 'Current branch lifecycle status code.';
COMMENT ON COLUMN masterdata.branches.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN masterdata.branches.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN masterdata.branches.updated_at IS 'Last application update timestamp.';
COMMENT ON COLUMN masterdata.branches.updated_by_profile_id IS 'Optional last-updating application profile.';
COMMENT ON COLUMN masterdata.branches.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN masterdata.branches.archived_at IS 'Optional soft-archive timestamp.';

CREATE TABLE masterdata.activity_addresses (
  id uuid NOT NULL,
  commercial_activity_id uuid NULL,
  branch_id uuid NULL,
  address_line text NULL,
  city_code text NULL,
  district_code text NULL,
  geo_payload jsonb NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT activity_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT activity_addresses_owner_present_check
    CHECK (commercial_activity_id IS NOT NULL OR branch_id IS NOT NULL),
  CONSTRAINT activity_addresses_effective_period_check
    CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT activity_addresses_activity_id_fkey FOREIGN KEY (commercial_activity_id)
    REFERENCES masterdata.commercial_activities (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT activity_addresses_branch_id_fkey FOREIGN KEY (branch_id)
    REFERENCES masterdata.branches (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT activity_addresses_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT activity_addresses_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
COMMENT ON TABLE masterdata.activity_addresses IS 'TABLE-016 effective-dated address for an activity or branch.';
COMMENT ON COLUMN masterdata.activity_addresses.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN masterdata.activity_addresses.commercial_activity_id IS 'Optional activity address scope.';
COMMENT ON COLUMN masterdata.activity_addresses.branch_id IS 'Optional branch address scope.';
COMMENT ON COLUMN masterdata.activity_addresses.address_line IS 'Optional address line text.';
COMMENT ON COLUMN masterdata.activity_addresses.city_code IS 'Optional city code.';
COMMENT ON COLUMN masterdata.activity_addresses.district_code IS 'Optional district code.';
COMMENT ON COLUMN masterdata.activity_addresses.geo_payload IS 'Optional supporting geo payload; not sole authoritative state.';
COMMENT ON COLUMN masterdata.activity_addresses.effective_from IS 'Address effectiveness start timestamp.';
COMMENT ON COLUMN masterdata.activity_addresses.effective_to IS 'Optional end timestamp later than effective_from.';
COMMENT ON COLUMN masterdata.activity_addresses.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN masterdata.activity_addresses.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN masterdata.activity_addresses.updated_at IS 'Last application update timestamp.';
COMMENT ON COLUMN masterdata.activity_addresses.updated_by_profile_id IS 'Optional last-updating application profile.';
COMMENT ON COLUMN masterdata.activity_addresses.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE masterdata.activity_status_histories (
  id uuid NOT NULL,
  commercial_activity_id uuid NOT NULL,
  changed_at timestamptz NOT NULL,
  changed_by_profile_id uuid NULL,
  from_status_code text NULL,
  to_status_code text NOT NULL,
  reason text NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_status_histories_pkey PRIMARY KEY (id),
  CONSTRAINT activity_status_histories_to_status_check CHECK (btrim(to_status_code) <> ''),
  CONSTRAINT activity_status_histories_activity_id_fkey FOREIGN KEY (commercial_activity_id)
    REFERENCES masterdata.commercial_activities (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT activity_status_histories_changed_by_fkey FOREIGN KEY (changed_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX activity_status_histories_activity_id_idx ON masterdata.activity_status_histories (commercial_activity_id);
COMMENT ON TABLE masterdata.activity_status_histories IS 'TABLE-017 append-only commercial activity status history.';
COMMENT ON COLUMN masterdata.activity_status_histories.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN masterdata.activity_status_histories.commercial_activity_id IS 'Parent commercial activity aggregate.';
COMMENT ON COLUMN masterdata.activity_status_histories.changed_at IS 'Status change occurrence timestamp.';
COMMENT ON COLUMN masterdata.activity_status_histories.changed_by_profile_id IS 'Optional profile that performed the change.';
COMMENT ON COLUMN masterdata.activity_status_histories.from_status_code IS 'Optional prior status code.';
COMMENT ON COLUMN masterdata.activity_status_histories.to_status_code IS 'New non-blank status code.';
COMMENT ON COLUMN masterdata.activity_status_histories.reason IS 'Optional change reason.';
COMMENT ON COLUMN masterdata.activity_status_histories.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN masterdata.activity_status_histories.created_at IS 'Database insertion timestamp.';

CREATE TABLE masterdata.properties (
  id uuid NOT NULL,
  public_ref text NULL,
  status_code text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  archived_at timestamptz NULL,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_public_ref_key UNIQUE (public_ref),
  CONSTRAINT properties_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT properties_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT properties_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
COMMENT ON TABLE masterdata.properties IS 'TABLE-018 property root; has no direct authoritative taxpayer_id (DM-24).';
COMMENT ON COLUMN masterdata.properties.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN masterdata.properties.public_ref IS 'Optional unique public business reference.';
COMMENT ON COLUMN masterdata.properties.status_code IS 'Current property lifecycle status code.';
COMMENT ON COLUMN masterdata.properties.description IS 'Optional property description.';
COMMENT ON COLUMN masterdata.properties.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN masterdata.properties.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN masterdata.properties.updated_at IS 'Last application update timestamp.';
COMMENT ON COLUMN masterdata.properties.updated_by_profile_id IS 'Optional last-updating application profile.';
COMMENT ON COLUMN masterdata.properties.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN masterdata.properties.archived_at IS 'Optional soft-archive timestamp.';

CREATE TABLE masterdata.property_units (
  id uuid NOT NULL,
  property_id uuid NOT NULL,
  public_ref text NULL,
  unit_label text NULL,
  status_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  archived_at timestamptz NULL,
  CONSTRAINT property_units_pkey PRIMARY KEY (id),
  CONSTRAINT property_units_public_ref_key UNIQUE (public_ref),
  CONSTRAINT property_units_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT property_units_property_id_fkey FOREIGN KEY (property_id)
    REFERENCES masterdata.properties (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT property_units_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT property_units_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX property_units_property_id_idx ON masterdata.property_units (property_id);
COMMENT ON TABLE masterdata.property_units IS 'TABLE-019 property unit child.';
COMMENT ON COLUMN masterdata.property_units.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN masterdata.property_units.property_id IS 'Parent property.';
COMMENT ON COLUMN masterdata.property_units.public_ref IS 'Optional unique public business reference.';
COMMENT ON COLUMN masterdata.property_units.unit_label IS 'Optional unit label.';
COMMENT ON COLUMN masterdata.property_units.status_code IS 'Current unit lifecycle status code.';
COMMENT ON COLUMN masterdata.property_units.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN masterdata.property_units.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN masterdata.property_units.updated_at IS 'Last application update timestamp.';
COMMENT ON COLUMN masterdata.property_units.updated_by_profile_id IS 'Optional last-updating application profile.';
COMMENT ON COLUMN masterdata.property_units.archived_at IS 'Optional soft-archive timestamp.';

CREATE TABLE masterdata.property_ownership_records (
  id uuid NOT NULL,
  property_id uuid NOT NULL,
  taxpayer_id uuid NOT NULL,
  party_role_code text NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  evidence_reference text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT property_ownership_records_pkey PRIMARY KEY (id),
  CONSTRAINT ownership_records_party_role_not_blank_check CHECK (btrim(party_role_code) <> ''),
  CONSTRAINT ownership_records_effective_period_check CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT ownership_records_property_id_fkey FOREIGN KEY (property_id)
    REFERENCES masterdata.properties (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT ownership_records_taxpayer_id_fkey FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT ownership_records_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT ownership_records_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX ownership_records_property_id_idx ON masterdata.property_ownership_records (property_id);
CREATE INDEX ownership_records_taxpayer_id_idx ON masterdata.property_ownership_records (taxpayer_id);
COMMENT ON TABLE masterdata.property_ownership_records IS 'TABLE-020 authoritative property ownership record (DM-24).';
COMMENT ON COLUMN masterdata.property_ownership_records.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN masterdata.property_ownership_records.property_id IS 'Owned property.';
COMMENT ON COLUMN masterdata.property_ownership_records.taxpayer_id IS 'Party taxpayer; ownership is authoritative here, not on properties.';
COMMENT ON COLUMN masterdata.property_ownership_records.party_role_code IS 'Non-blank ownership party role code.';
COMMENT ON COLUMN masterdata.property_ownership_records.is_current IS 'Current ownership flag.';
COMMENT ON COLUMN masterdata.property_ownership_records.effective_from IS 'Ownership effectiveness start timestamp.';
COMMENT ON COLUMN masterdata.property_ownership_records.effective_to IS 'Optional end timestamp later than effective_from.';
COMMENT ON COLUMN masterdata.property_ownership_records.evidence_reference IS 'Optional ownership evidence reference.';
COMMENT ON COLUMN masterdata.property_ownership_records.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN masterdata.property_ownership_records.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN masterdata.property_ownership_records.updated_at IS 'Last application update timestamp.';
COMMENT ON COLUMN masterdata.property_ownership_records.updated_by_profile_id IS 'Optional last-updating application profile.';
COMMENT ON COLUMN masterdata.property_ownership_records.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE masterdata.property_ownership_histories (
  id uuid NOT NULL,
  ownership_record_id uuid NOT NULL,
  change_type_code text NOT NULL,
  prior_snapshot jsonb NULL,
  new_snapshot jsonb NULL,
  changed_at timestamptz NOT NULL,
  changed_by_profile_id uuid NULL,
  reason text NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_ownership_histories_pkey PRIMARY KEY (id),
  CONSTRAINT ownership_histories_change_type_not_blank_check CHECK (btrim(change_type_code) <> ''),
  CONSTRAINT ownership_histories_record_id_fkey FOREIGN KEY (ownership_record_id)
    REFERENCES masterdata.property_ownership_records (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT ownership_histories_changed_by_fkey FOREIGN KEY (changed_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
COMMENT ON TABLE masterdata.property_ownership_histories IS 'TABLE-022 append-only ownership history; snapshots are supporting data.';
COMMENT ON COLUMN masterdata.property_ownership_histories.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN masterdata.property_ownership_histories.ownership_record_id IS 'Parent ownership record aggregate.';
COMMENT ON COLUMN masterdata.property_ownership_histories.change_type_code IS 'Non-blank transfer or revision type.';
COMMENT ON COLUMN masterdata.property_ownership_histories.prior_snapshot IS 'Optional supporting prior-state snapshot; not sole authority.';
COMMENT ON COLUMN masterdata.property_ownership_histories.new_snapshot IS 'Optional supporting new-state snapshot; not sole authority.';
COMMENT ON COLUMN masterdata.property_ownership_histories.changed_at IS 'Change occurrence timestamp.';
COMMENT ON COLUMN masterdata.property_ownership_histories.changed_by_profile_id IS 'Optional profile that performed the change.';
COMMENT ON COLUMN masterdata.property_ownership_histories.reason IS 'Optional change reason.';
COMMENT ON COLUMN masterdata.property_ownership_histories.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN masterdata.property_ownership_histories.created_at IS 'Database insertion timestamp.';

ALTER TABLE masterdata.commercial_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterdata.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterdata.activity_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterdata.activity_status_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterdata.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterdata.property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterdata.property_ownership_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterdata.property_ownership_histories ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  masterdata.commercial_activities,
  masterdata.branches,
  masterdata.activity_addresses,
  masterdata.activity_status_histories,
  masterdata.properties,
  masterdata.property_units,
  masterdata.property_ownership_records,
  masterdata.property_ownership_histories
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
