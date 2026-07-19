-- MARIB-TAX-DB-FOUNDATION-BATCH-07-BALAGHAT-FAMILY
-- Create balaghat.balaghs through balagh_reopen_records (TABLE-037…049) plus selected target/property/unit tables.
-- Authoring only; do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No seed/backfill rows are introduced here.
-- No table named cases; TABLE-021 is not introduced.
-- ADR-016 lifecycle parallels: close vs archive independent; staff-only reopen with mandatory reason.
-- ADR-017 balaghat party/property selection boundaries.
-- Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

CREATE TABLE balaghat.balaghs (
  id uuid NOT NULL,
  public_ref text NULL,
  balagh_type_code text NOT NULL,
  filer_profile_id uuid NOT NULL,
  taxpayer_id uuid NOT NULL,
  status_code text NOT NULL,
  submitted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  archived_at timestamptz NULL,
  idempotency_key text NULL,
  CONSTRAINT balaghs_pkey PRIMARY KEY (id),
  CONSTRAINT balaghs_public_ref_key UNIQUE (public_ref),
  CONSTRAINT balaghs_balagh_type_not_blank_check CHECK (btrim(balagh_type_code) <> ''),
  CONSTRAINT balaghs_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT balaghs_filer_profile_id_fkey FOREIGN KEY (filer_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balaghs_taxpayer_id_fkey FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balaghs_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balaghs_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balaghs_balagh_type_code_idx ON balaghat.balaghs (balagh_type_code);
CREATE INDEX balaghs_filer_profile_id_idx ON balaghat.balaghs (filer_profile_id);
CREATE INDEX balaghs_taxpayer_id_idx ON balaghat.balaghs (taxpayer_id);
CREATE INDEX balaghs_status_code_idx ON balaghat.balaghs (status_code);
COMMENT ON TABLE balaghat.balaghs IS 'TABLE-037 balagh aggregate root; not named cases.';
COMMENT ON COLUMN balaghat.balaghs.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balaghs.public_ref IS 'Optional unique public business reference when issued.';
COMMENT ON COLUMN balaghat.balaghs.balagh_type_code IS 'Balagh type code (FR-201…206); free code without catalogue seed table.';
COMMENT ON COLUMN balaghat.balaghs.filer_profile_id IS 'Submitter identity profile (property-owner filer).';
COMMENT ON COLUMN balaghat.balaghs.taxpayer_id IS 'Notifying / property-owner taxpayer for the balagh; not a multi-target substitute.';
COMMENT ON COLUMN balaghat.balaghs.status_code IS 'Current lifecycle status code.';
COMMENT ON COLUMN balaghat.balaghs.submitted_at IS 'Set on submit; after submit, hard delete and direct cancel are forbidden (NestJS); draft cancel is pre-submit only.';
COMMENT ON COLUMN balaghat.balaghs.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balaghs.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN balaghat.balaghs.updated_at IS 'Last application update timestamp.';
COMMENT ON COLUMN balaghat.balaghs.updated_by_profile_id IS 'Optional last-updating application profile.';
COMMENT ON COLUMN balaghat.balaghs.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN balaghat.balaghs.archived_at IS 'Optional soft-archive marker complementary to independent archive events in balagh_close_archive_records.';
COMMENT ON COLUMN balaghat.balaghs.idempotency_key IS 'Optional client idempotency key; scoped uniqueness deferred.';

CREATE TABLE balaghat.balagh_selected_targets (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  taxpayer_id uuid NOT NULL,
  target_profile_id uuid NULL,
  target_role_code text NOT NULL,
  selection_snapshot jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT balagh_selected_targets_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_selected_targets_target_role_not_blank_check CHECK (btrim(target_role_code) <> ''),
  CONSTRAINT balagh_selected_targets_balagh_taxpayer_role_key
    UNIQUE (balagh_id, taxpayer_id, target_role_code),
  CONSTRAINT balagh_selected_targets_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_targets_taxpayer_fkey FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_targets_target_profile_fkey FOREIGN KEY (target_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_targets_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_selected_targets_balagh_id_idx
  ON balaghat.balagh_selected_targets (balagh_id);
CREATE INDEX balagh_selected_targets_taxpayer_id_idx
  ON balaghat.balagh_selected_targets (taxpayer_id);
COMMENT ON TABLE balaghat.balagh_selected_targets IS 'Multi-value balagh targets (ADR-017); one balagh may reference many taxpayers/users.';
COMMENT ON COLUMN balaghat.balagh_selected_targets.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_selected_targets.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_selected_targets.taxpayer_id IS 'Selected target taxpayer.';
COMMENT ON COLUMN balaghat.balagh_selected_targets.target_profile_id IS 'Optional selected user profile target.';
COMMENT ON COLUMN balaghat.balagh_selected_targets.target_role_code IS 'Target role code (e.g. seller/buyer/subject/other); free code without seed.';
COMMENT ON COLUMN balaghat.balagh_selected_targets.selection_snapshot IS 'Optional supporting snapshot; not sole authority.';
COMMENT ON COLUMN balaghat.balagh_selected_targets.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balagh_selected_targets.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN balaghat.balagh_selected_targets.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE balaghat.balagh_selected_properties (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  property_id uuid NOT NULL,
  ownership_record_id uuid NULL,
  selection_snapshot jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT balagh_selected_properties_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_selected_properties_balagh_property_key UNIQUE (balagh_id, property_id),
  CONSTRAINT balagh_selected_properties_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_properties_property_fkey FOREIGN KEY (property_id)
    REFERENCES masterdata.properties (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_properties_ownership_fkey FOREIGN KEY (ownership_record_id)
    REFERENCES masterdata.property_ownership_records (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_properties_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_selected_properties_balagh_id_idx
  ON balaghat.balagh_selected_properties (balagh_id);
CREATE INDEX balagh_selected_properties_property_id_idx
  ON balaghat.balagh_selected_properties (property_id);
CREATE INDEX balagh_selected_properties_ownership_record_id_idx
  ON balaghat.balagh_selected_properties (ownership_record_id);
COMMENT ON TABLE balaghat.balagh_selected_properties IS 'Selected property on a balagh (ADR-017); optional ownership evidence link.';
COMMENT ON COLUMN balaghat.balagh_selected_properties.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_selected_properties.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_selected_properties.property_id IS 'Selected property.';
COMMENT ON COLUMN balaghat.balagh_selected_properties.ownership_record_id IS 'Optional ownership record linking filer/owner capacity.';
COMMENT ON COLUMN balaghat.balagh_selected_properties.selection_snapshot IS 'Optional supporting snapshot; not sole authority.';
COMMENT ON COLUMN balaghat.balagh_selected_properties.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balagh_selected_properties.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN balaghat.balagh_selected_properties.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE balaghat.balagh_selected_property_units (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  balagh_selected_property_id uuid NOT NULL,
  property_unit_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT balagh_selected_property_units_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_selected_property_units_selected_property_unit_key
    UNIQUE (balagh_selected_property_id, property_unit_id),
  CONSTRAINT balagh_selected_property_units_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_property_units_selected_property_fkey FOREIGN KEY (balagh_selected_property_id)
    REFERENCES balaghat.balagh_selected_properties (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_property_units_property_unit_fkey FOREIGN KEY (property_unit_id)
    REFERENCES masterdata.property_units (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_property_units_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_selected_property_units_balagh_id_idx
  ON balaghat.balagh_selected_property_units (balagh_id);
CREATE INDEX balagh_selected_property_units_selected_property_id_idx
  ON balaghat.balagh_selected_property_units (balagh_selected_property_id);
CREATE INDEX balagh_selected_property_units_property_unit_id_idx
  ON balaghat.balagh_selected_property_units (property_unit_id);
COMMENT ON TABLE balaghat.balagh_selected_property_units IS 'Selected property units on a balagh; NOT TABLE-021; case selection only (ADR-017).';
COMMENT ON COLUMN balaghat.balagh_selected_property_units.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_selected_property_units.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_selected_property_units.balagh_selected_property_id IS 'Parent selected property row.';
COMMENT ON COLUMN balaghat.balagh_selected_property_units.property_unit_id IS 'Selected property unit.';
COMMENT ON COLUMN balaghat.balagh_selected_property_units.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balagh_selected_property_units.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN balaghat.balagh_selected_property_units.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE balaghat.balagh_selected_activities (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  commercial_activity_id uuid NOT NULL,
  selection_snapshot jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT balagh_selected_activities_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_selected_activities_balagh_activity_key UNIQUE (balagh_id, commercial_activity_id),
  CONSTRAINT balagh_selected_activities_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_activities_activity_fkey FOREIGN KEY (commercial_activity_id)
    REFERENCES masterdata.commercial_activities (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_activities_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_selected_activities_balagh_id_idx
  ON balaghat.balagh_selected_activities (balagh_id);
CREATE INDEX balagh_selected_activities_activity_id_idx
  ON balaghat.balagh_selected_activities (commercial_activity_id);
COMMENT ON TABLE balaghat.balagh_selected_activities IS 'TABLE-038 optional selected commercial activity on a balagh (0..N); property-type balaghs need not select activity/branch.';
COMMENT ON COLUMN balaghat.balagh_selected_activities.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_selected_activities.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_selected_activities.commercial_activity_id IS 'Selected commercial activity.';
COMMENT ON COLUMN balaghat.balagh_selected_activities.selection_snapshot IS 'Optional supporting snapshot; not sole authority.';
COMMENT ON COLUMN balaghat.balagh_selected_activities.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balagh_selected_activities.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN balaghat.balagh_selected_activities.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE balaghat.balagh_selected_branches (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  balagh_selected_activity_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT balagh_selected_branches_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_selected_branches_selected_activity_branch_key
    UNIQUE (balagh_selected_activity_id, branch_id),
  CONSTRAINT balagh_selected_branches_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_branches_selected_activity_fkey FOREIGN KEY (balagh_selected_activity_id)
    REFERENCES balaghat.balagh_selected_activities (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_branches_branch_fkey FOREIGN KEY (branch_id)
    REFERENCES masterdata.branches (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_selected_branches_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_selected_branches_balagh_id_idx
  ON balaghat.balagh_selected_branches (balagh_id);
CREATE INDEX balagh_selected_branches_selected_activity_id_idx
  ON balaghat.balagh_selected_branches (balagh_selected_activity_id);
CREATE INDEX balagh_selected_branches_branch_id_idx
  ON balaghat.balagh_selected_branches (branch_id);
COMMENT ON TABLE balaghat.balagh_selected_branches IS 'TABLE-039 optional selected branch under a selected activity (REL-044, 0..N); NestJS must ensure branch.commercial_activity_id matches the selected activity commercial_activity_id.';
COMMENT ON COLUMN balaghat.balagh_selected_branches.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_selected_branches.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_selected_branches.balagh_selected_activity_id IS 'Parent selected activity row; required when branch selected (REL-044).';
COMMENT ON COLUMN balaghat.balagh_selected_branches.branch_id IS 'Selected branch.';
COMMENT ON COLUMN balaghat.balagh_selected_branches.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balagh_selected_branches.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN balaghat.balagh_selected_branches.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE balaghat.balagh_form_snapshots (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  snapshot_version integer NOT NULL,
  captured_at timestamptz NOT NULL,
  captured_by_profile_id uuid NULL,
  schema_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NULL,
  CONSTRAINT balagh_form_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_form_snapshots_version_check CHECK (snapshot_version >= 1),
  CONSTRAINT balagh_form_snapshots_schema_not_blank_check CHECK (btrim(schema_version) <> ''),
  CONSTRAINT balagh_form_snapshots_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_form_snapshots_captured_by_fkey FOREIGN KEY (captured_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_form_snapshots_balagh_id_idx
  ON balaghat.balagh_form_snapshots (balagh_id);
CREATE INDEX balagh_form_snapshots_captured_at_idx
  ON balaghat.balagh_form_snapshots (captured_at);
COMMENT ON TABLE balaghat.balagh_form_snapshots IS 'TABLE-040 form snapshot header; submitted snapshot is immutable (NestJS); balagh remains bound to its original schema_version.';
COMMENT ON COLUMN balaghat.balagh_form_snapshots.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_form_snapshots.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_form_snapshots.snapshot_version IS 'Snapshot version number (>= 1).';
COMMENT ON COLUMN balaghat.balagh_form_snapshots.captured_at IS 'Capture timestamp.';
COMMENT ON COLUMN balaghat.balagh_form_snapshots.captured_by_profile_id IS 'Optional capturing profile.';
COMMENT ON COLUMN balaghat.balagh_form_snapshots.schema_version IS 'Fixed form schema version for this snapshot/balagh binding.';
COMMENT ON COLUMN balaghat.balagh_form_snapshots.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balagh_form_snapshots.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE balaghat.balagh_form_snapshot_payloads (
  id uuid NOT NULL,
  balagh_form_snapshot_id uuid NOT NULL,
  schema_version text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT balagh_form_snapshot_payloads_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_form_snapshot_payloads_snapshot_key UNIQUE (balagh_form_snapshot_id),
  CONSTRAINT balagh_form_snapshot_payloads_schema_not_blank_check CHECK (btrim(schema_version) <> ''),
  CONSTRAINT balagh_form_snapshot_payloads_snapshot_fkey FOREIGN KEY (balagh_form_snapshot_id)
    REFERENCES balaghat.balagh_form_snapshots (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
COMMENT ON TABLE balaghat.balagh_form_snapshot_payloads IS 'TABLE-041 JSONB payload child of form snapshot header; flexible for evacuation/minutes content without fixed formal minute columns; supporting not sole authority.';
COMMENT ON COLUMN balaghat.balagh_form_snapshot_payloads.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_form_snapshot_payloads.balagh_form_snapshot_id IS 'Parent snapshot header; one payload row per header.';
COMMENT ON COLUMN balaghat.balagh_form_snapshot_payloads.schema_version IS 'Payload schema version label.';
COMMENT ON COLUMN balaghat.balagh_form_snapshot_payloads.payload IS 'Form payload snapshot JSONB.';
COMMENT ON COLUMN balaghat.balagh_form_snapshot_payloads.created_at IS 'Database insertion timestamp.';

CREATE TABLE balaghat.balagh_status_histories (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  changed_at timestamptz NOT NULL,
  changed_by_profile_id uuid NULL,
  from_status_code text NULL,
  to_status_code text NOT NULL,
  reason text NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT balagh_status_histories_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_status_histories_to_status_not_blank_check CHECK (btrim(to_status_code) <> ''),
  CONSTRAINT balagh_status_histories_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_status_histories_changed_by_fkey FOREIGN KEY (changed_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_status_histories_balagh_id_idx
  ON balaghat.balagh_status_histories (balagh_id);
CREATE INDEX balagh_status_histories_changed_at_idx
  ON balaghat.balagh_status_histories (changed_at);
COMMENT ON TABLE balaghat.balagh_status_histories IS 'TABLE-042 append-only status history; used for draft cancel (actor/time/reason) and later transitions; NestJS forbids UPDATE/DELETE.';
COMMENT ON COLUMN balaghat.balagh_status_histories.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_status_histories.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_status_histories.changed_at IS 'Change occurrence timestamp.';
COMMENT ON COLUMN balaghat.balagh_status_histories.changed_by_profile_id IS 'Actor profile; required by NestJS for draft cancel.';
COMMENT ON COLUMN balaghat.balagh_status_histories.from_status_code IS 'Prior status code.';
COMMENT ON COLUMN balaghat.balagh_status_histories.to_status_code IS 'New status code.';
COMMENT ON COLUMN balaghat.balagh_status_histories.reason IS 'Change reason; required by NestJS for draft cancel.';
COMMENT ON COLUMN balaghat.balagh_status_histories.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN balaghat.balagh_status_histories.created_at IS 'Database insertion timestamp.';

CREATE TABLE balaghat.balagh_assignment_histories (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  action_code text NOT NULL,
  assigned_at timestamptz NOT NULL,
  staff_profile_id uuid NOT NULL,
  changed_at timestamptz NOT NULL,
  changed_by_staff_profile_id uuid NULL,
  reason text NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT balagh_assignment_histories_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_assignment_histories_action_not_blank_check CHECK (btrim(action_code) <> ''),
  CONSTRAINT balagh_assignment_histories_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_assignment_histories_staff_fkey FOREIGN KEY (staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_assignment_histories_changed_by_fkey FOREIGN KEY (changed_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_assignment_histories_balagh_id_idx
  ON balaghat.balagh_assignment_histories (balagh_id);
CREATE INDEX balagh_assignment_histories_staff_profile_id_idx
  ON balaghat.balagh_assignment_histories (staff_profile_id);
CREATE INDEX balagh_assignment_histories_changed_at_idx
  ON balaghat.balagh_assignment_histories (changed_at);
COMMENT ON TABLE balaghat.balagh_assignment_histories IS 'TABLE-043 append-only assignment history.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.action_code IS 'Assignment action code.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.assigned_at IS 'Assignment timestamp.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.staff_profile_id IS 'Assigned staff profile.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.changed_at IS 'Change occurrence timestamp.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.changed_by_staff_profile_id IS 'Optional acting staff profile.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.reason IS 'Optional change reason.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN balaghat.balagh_assignment_histories.created_at IS 'Database insertion timestamp.';

CREATE TABLE balaghat.balagh_completion_requests (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  request_text text NULL,
  requested_at timestamptz NOT NULL,
  requested_by_staff_profile_id uuid NULL,
  status_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NULL,
  CONSTRAINT balagh_completion_requests_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_completion_requests_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT balagh_completion_requests_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_completion_requests_staff_fkey FOREIGN KEY (requested_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_completion_requests_balagh_id_idx
  ON balaghat.balagh_completion_requests (balagh_id);
CREATE INDEX balagh_completion_requests_requested_at_idx
  ON balaghat.balagh_completion_requests (requested_at);
COMMENT ON TABLE balaghat.balagh_completion_requests IS 'TABLE-044 completion-cycle request.';
COMMENT ON COLUMN balaghat.balagh_completion_requests.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_completion_requests.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_completion_requests.request_text IS 'Optional completion request text.';
COMMENT ON COLUMN balaghat.balagh_completion_requests.requested_at IS 'Request timestamp.';
COMMENT ON COLUMN balaghat.balagh_completion_requests.requested_by_staff_profile_id IS 'Optional requesting staff.';
COMMENT ON COLUMN balaghat.balagh_completion_requests.status_code IS 'Cycle status code.';
COMMENT ON COLUMN balaghat.balagh_completion_requests.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balagh_completion_requests.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE balaghat.balagh_completion_responses (
  id uuid NOT NULL,
  completion_request_id uuid NOT NULL,
  response_text text NULL,
  responded_at timestamptz NOT NULL,
  responded_by_profile_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NULL,
  CONSTRAINT balagh_completion_responses_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_completion_responses_completion_key UNIQUE (completion_request_id),
  CONSTRAINT balagh_completion_responses_completion_fkey FOREIGN KEY (completion_request_id)
    REFERENCES balaghat.balagh_completion_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_completion_responses_responded_by_fkey FOREIGN KEY (responded_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_completion_responses_responded_at_idx
  ON balaghat.balagh_completion_responses (responded_at);
COMMENT ON TABLE balaghat.balagh_completion_responses IS 'TABLE-045 completion-cycle response; one per completion request.';
COMMENT ON COLUMN balaghat.balagh_completion_responses.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_completion_responses.completion_request_id IS 'Parent completion request.';
COMMENT ON COLUMN balaghat.balagh_completion_responses.response_text IS 'Optional response text.';
COMMENT ON COLUMN balaghat.balagh_completion_responses.responded_at IS 'Response timestamp.';
COMMENT ON COLUMN balaghat.balagh_completion_responses.responded_by_profile_id IS 'Optional responding profile.';
COMMENT ON COLUMN balaghat.balagh_completion_responses.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balagh_completion_responses.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE balaghat.balagh_decision_records (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  outcome_code text NOT NULL,
  decision_summary text NULL,
  basis_text text NULL,
  decided_at timestamptz NOT NULL,
  decided_by_staff_profile_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT balagh_decision_records_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_decision_records_balagh_key UNIQUE (balagh_id),
  CONSTRAINT balagh_decision_records_outcome_not_blank_check CHECK (btrim(outcome_code) <> ''),
  CONSTRAINT balagh_decision_records_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_decision_records_decided_by_fkey FOREIGN KEY (decided_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_decision_records_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_decision_records_outcome_code_idx
  ON balaghat.balagh_decision_records (outcome_code);
CREATE INDEX balagh_decision_records_decided_at_idx
  ON balaghat.balagh_decision_records (decided_at);
COMMENT ON TABLE balaghat.balagh_decision_records IS 'TABLE-046 decision record with embedded decision value; 0..1 per balagh; never overwrite.';
COMMENT ON COLUMN balaghat.balagh_decision_records.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_decision_records.balagh_id IS 'Parent balagh; unique for 0..1 decision record.';
COMMENT ON COLUMN balaghat.balagh_decision_records.outcome_code IS 'Decision outcome code.';
COMMENT ON COLUMN balaghat.balagh_decision_records.decision_summary IS 'Optional decision summary.';
COMMENT ON COLUMN balaghat.balagh_decision_records.basis_text IS 'Optional decision basis.';
COMMENT ON COLUMN balaghat.balagh_decision_records.decided_at IS 'Decision timestamp.';
COMMENT ON COLUMN balaghat.balagh_decision_records.decided_by_staff_profile_id IS 'Optional deciding staff.';
COMMENT ON COLUMN balaghat.balagh_decision_records.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN balaghat.balagh_decision_records.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN balaghat.balagh_decision_records.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE balaghat.balagh_decision_revisions (
  id uuid NOT NULL,
  decision_record_id uuid NOT NULL,
  revision_number integer NOT NULL,
  revised_outcome_code text NULL,
  revision_summary text NULL,
  revised_at timestamptz NOT NULL,
  revised_by_staff_profile_id uuid NULL,
  reason text NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT balagh_decision_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_decision_revisions_number_check CHECK (revision_number >= 1),
  CONSTRAINT balagh_decision_revisions_decision_fkey FOREIGN KEY (decision_record_id)
    REFERENCES balaghat.balagh_decision_records (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_decision_revisions_revised_by_fkey FOREIGN KEY (revised_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_decision_revisions_decision_id_idx
  ON balaghat.balagh_decision_revisions (decision_record_id);
CREATE INDEX balagh_decision_revisions_revised_at_idx
  ON balaghat.balagh_decision_revisions (revised_at);
COMMENT ON TABLE balaghat.balagh_decision_revisions IS 'TABLE-047 append-only decision revisions.';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.decision_record_id IS 'Parent decision record.';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.revision_number IS 'Revision sequence (>= 1).';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.revised_outcome_code IS 'Optional revised outcome code.';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.revision_summary IS 'Optional revision summary.';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.revised_at IS 'Revision timestamp.';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.revised_by_staff_profile_id IS 'Optional revising staff.';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.reason IS 'Optional revision reason.';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN balaghat.balagh_decision_revisions.created_at IS 'Database insertion timestamp.';

CREATE TABLE balaghat.balagh_close_archive_records (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  action_code text NOT NULL,
  reason text NULL,
  acted_at timestamptz NOT NULL,
  acted_by_staff_profile_id uuid NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT balagh_close_archive_records_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_close_archive_records_action_not_blank_check CHECK (btrim(action_code) <> ''),
  CONSTRAINT balagh_close_archive_records_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_close_archive_records_acted_by_fkey FOREIGN KEY (acted_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_close_archive_records_balagh_id_idx
  ON balaghat.balagh_close_archive_records (balagh_id);
CREATE INDEX balagh_close_archive_records_acted_at_idx
  ON balaghat.balagh_close_archive_records (acted_at);
COMMENT ON TABLE balaghat.balagh_close_archive_records IS 'TABLE-048 independent close or archive events (ADR-016): close ends processing with a final decision; archive is a later administrative retention action.';
COMMENT ON COLUMN balaghat.balagh_close_archive_records.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_close_archive_records.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_close_archive_records.action_code IS 'Independent action code distinguishing close versus archive.';
COMMENT ON COLUMN balaghat.balagh_close_archive_records.reason IS 'Optional action reason.';
COMMENT ON COLUMN balaghat.balagh_close_archive_records.acted_at IS 'Action timestamp.';
COMMENT ON COLUMN balaghat.balagh_close_archive_records.acted_by_staff_profile_id IS 'Optional acting staff.';
COMMENT ON COLUMN balaghat.balagh_close_archive_records.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN balaghat.balagh_close_archive_records.created_at IS 'Database insertion timestamp.';

CREATE TABLE balaghat.balagh_reopen_records (
  id uuid NOT NULL,
  balagh_id uuid NOT NULL,
  reason text NOT NULL,
  reopened_at timestamptz NOT NULL,
  reopened_by_staff_profile_id uuid NOT NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT balagh_reopen_records_pkey PRIMARY KEY (id),
  CONSTRAINT balagh_reopen_records_reason_not_blank_check CHECK (btrim(reason) <> ''),
  CONSTRAINT balagh_reopen_records_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT balagh_reopen_records_reopened_by_fkey FOREIGN KEY (reopened_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX balagh_reopen_records_balagh_id_idx
  ON balaghat.balagh_reopen_records (balagh_id);
CREATE INDEX balagh_reopen_records_reopened_at_idx
  ON balaghat.balagh_reopen_records (reopened_at);
COMMENT ON TABLE balaghat.balagh_reopen_records IS 'TABLE-049 staff-only reopen event (ADR-016); taxpayer cannot reopen directly; prior statuses and decisions remain retained.';
COMMENT ON COLUMN balaghat.balagh_reopen_records.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN balaghat.balagh_reopen_records.balagh_id IS 'Parent balagh.';
COMMENT ON COLUMN balaghat.balagh_reopen_records.reason IS 'Mandatory non-blank reopen reason.';
COMMENT ON COLUMN balaghat.balagh_reopen_records.reopened_at IS 'Reopen timestamp.';
COMMENT ON COLUMN balaghat.balagh_reopen_records.reopened_by_staff_profile_id IS 'Authorized staff actor; required.';
COMMENT ON COLUMN balaghat.balagh_reopen_records.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN balaghat.balagh_reopen_records.created_at IS 'Database insertion timestamp.';

ALTER TABLE balaghat.balaghs ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_selected_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_selected_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_selected_property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_selected_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_selected_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_form_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_form_snapshot_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_status_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_assignment_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_completion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_completion_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_decision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_decision_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_close_archive_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE balaghat.balagh_reopen_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  balaghat.balaghs,
  balaghat.balagh_selected_targets,
  balaghat.balagh_selected_properties,
  balaghat.balagh_selected_property_units,
  balaghat.balagh_selected_activities,
  balaghat.balagh_selected_branches,
  balaghat.balagh_form_snapshots,
  balaghat.balagh_form_snapshot_payloads,
  balaghat.balagh_status_histories,
  balaghat.balagh_assignment_histories,
  balaghat.balagh_completion_requests,
  balaghat.balagh_completion_responses,
  balaghat.balagh_decision_records,
  balaghat.balagh_decision_revisions,
  balaghat.balagh_close_archive_records,
  balaghat.balagh_reopen_records
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
