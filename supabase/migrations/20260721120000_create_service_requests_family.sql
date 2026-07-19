-- MARIB-TAX-DB-FOUNDATION-BATCH-06-SERVICE-REQUESTS-FAMILY
-- Create requests.service_types through request_reopen_records (TABLE-023…036).
-- Authoring batch: do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No seed/backfill rows (including FR-201…206 service_types catalogue) are introduced here.
-- No table named cases. Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

CREATE TABLE requests.service_types (
  id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  version_label text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  CONSTRAINT service_types_pkey PRIMARY KEY (id),
  CONSTRAINT service_types_code_key UNIQUE (code),
  CONSTRAINT service_types_code_not_blank_check CHECK (btrim(code) <> ''),
  CONSTRAINT service_types_name_not_blank_check CHECK (btrim(name) <> ''),
  CONSTRAINT service_types_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT service_types_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
COMMENT ON TABLE requests.service_types IS 'TABLE-023 service type catalogue; seeds deferred.';
COMMENT ON COLUMN requests.service_types.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.service_types.code IS 'Stable unique service type code.';
COMMENT ON COLUMN requests.service_types.name IS 'Display name.';
COMMENT ON COLUMN requests.service_types.description IS 'Optional description.';
COMMENT ON COLUMN requests.service_types.is_active IS 'Catalogue active flag.';
COMMENT ON COLUMN requests.service_types.version_label IS 'Optional version label (ADR-008 deferred detail).';
COMMENT ON COLUMN requests.service_types.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN requests.service_types.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN requests.service_types.updated_at IS 'Last application update timestamp.';
COMMENT ON COLUMN requests.service_types.updated_by_profile_id IS 'Optional last-updating application profile.';

CREATE TABLE requests.service_requests (
  id uuid NOT NULL,
  public_ref text NULL,
  service_type_id uuid NOT NULL,
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
  CONSTRAINT service_requests_pkey PRIMARY KEY (id),
  CONSTRAINT service_requests_public_ref_key UNIQUE (public_ref),
  CONSTRAINT service_requests_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT service_requests_service_type_id_fkey FOREIGN KEY (service_type_id)
    REFERENCES requests.service_types (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT service_requests_taxpayer_id_fkey FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT service_requests_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT service_requests_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX service_requests_service_type_id_idx ON requests.service_requests (service_type_id);
CREATE INDEX service_requests_taxpayer_id_idx ON requests.service_requests (taxpayer_id);
CREATE INDEX service_requests_status_code_idx ON requests.service_requests (status_code);
COMMENT ON TABLE requests.service_requests IS 'TABLE-024 service request aggregate root; not named cases.';
COMMENT ON COLUMN requests.service_requests.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.service_requests.public_ref IS 'Optional unique public business reference when issued.';
COMMENT ON COLUMN requests.service_requests.service_type_id IS 'Service type catalogue reference.';
COMMENT ON COLUMN requests.service_requests.taxpayer_id IS 'Subject taxpayer registry root.';
COMMENT ON COLUMN requests.service_requests.status_code IS 'Current lifecycle status code.';
COMMENT ON COLUMN requests.service_requests.submitted_at IS 'Optional submit timestamp.';
COMMENT ON COLUMN requests.service_requests.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN requests.service_requests.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN requests.service_requests.updated_at IS 'Last application update timestamp.';
COMMENT ON COLUMN requests.service_requests.updated_by_profile_id IS 'Optional last-updating application profile.';
COMMENT ON COLUMN requests.service_requests.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN requests.service_requests.archived_at IS 'Optional soft-archive timestamp.';
COMMENT ON COLUMN requests.service_requests.idempotency_key IS 'Optional client idempotency key; scoped uniqueness deferred.';

CREATE TABLE requests.request_selected_activities (
  id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  commercial_activity_id uuid NOT NULL,
  selection_snapshot jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT request_selected_activities_pkey PRIMARY KEY (id),
  CONSTRAINT request_selected_activities_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_selected_activities_activity_fkey FOREIGN KEY (commercial_activity_id)
    REFERENCES masterdata.commercial_activities (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_selected_activities_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_selected_activities_request_id_idx
  ON requests.request_selected_activities (service_request_id);
CREATE INDEX request_selected_activities_activity_id_idx
  ON requests.request_selected_activities (commercial_activity_id);
COMMENT ON TABLE requests.request_selected_activities IS 'TABLE-025 selected commercial activity on a service request.';
COMMENT ON COLUMN requests.request_selected_activities.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_selected_activities.service_request_id IS 'Parent service request.';
COMMENT ON COLUMN requests.request_selected_activities.commercial_activity_id IS 'Selected commercial activity.';
COMMENT ON COLUMN requests.request_selected_activities.selection_snapshot IS 'Optional supporting snapshot; not sole authority.';
COMMENT ON COLUMN requests.request_selected_activities.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN requests.request_selected_activities.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN requests.request_selected_activities.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE requests.request_selected_branches (
  id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  request_selected_activity_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT request_selected_branches_pkey PRIMARY KEY (id),
  CONSTRAINT request_selected_branches_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_selected_branches_selected_activity_fkey FOREIGN KEY (request_selected_activity_id)
    REFERENCES requests.request_selected_activities (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_selected_branches_branch_fkey FOREIGN KEY (branch_id)
    REFERENCES masterdata.branches (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_selected_branches_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_selected_branches_request_id_idx
  ON requests.request_selected_branches (service_request_id);
CREATE INDEX request_selected_branches_selected_activity_id_idx
  ON requests.request_selected_branches (request_selected_activity_id);
CREATE INDEX request_selected_branches_branch_id_idx
  ON requests.request_selected_branches (branch_id);
COMMENT ON TABLE requests.request_selected_branches IS 'TABLE-026 selected branch under a selected activity (REL-028).';
COMMENT ON COLUMN requests.request_selected_branches.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_selected_branches.service_request_id IS 'Parent service request.';
COMMENT ON COLUMN requests.request_selected_branches.request_selected_activity_id IS 'Parent selected activity row; required when branch selected.';
COMMENT ON COLUMN requests.request_selected_branches.branch_id IS 'Selected branch.';
COMMENT ON COLUMN requests.request_selected_branches.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN requests.request_selected_branches.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN requests.request_selected_branches.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE requests.request_form_snapshots (
  id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  snapshot_version integer NOT NULL,
  captured_at timestamptz NOT NULL,
  captured_by_profile_id uuid NULL,
  schema_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NULL,
  CONSTRAINT request_form_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT request_form_snapshots_version_check CHECK (snapshot_version >= 1),
  CONSTRAINT request_form_snapshots_schema_not_blank_check CHECK (btrim(schema_version) <> ''),
  CONSTRAINT request_form_snapshots_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_form_snapshots_captured_by_fkey FOREIGN KEY (captured_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_form_snapshots_request_id_idx
  ON requests.request_form_snapshots (service_request_id);
CREATE INDEX request_form_snapshots_captured_at_idx
  ON requests.request_form_snapshots (captured_at);
COMMENT ON TABLE requests.request_form_snapshots IS 'TABLE-027 form snapshot header for a service request.';
COMMENT ON COLUMN requests.request_form_snapshots.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_form_snapshots.service_request_id IS 'Parent service request.';
COMMENT ON COLUMN requests.request_form_snapshots.snapshot_version IS 'Snapshot version number (>= 1).';
COMMENT ON COLUMN requests.request_form_snapshots.captured_at IS 'Capture timestamp.';
COMMENT ON COLUMN requests.request_form_snapshots.captured_by_profile_id IS 'Optional capturing profile.';
COMMENT ON COLUMN requests.request_form_snapshots.schema_version IS 'Form schema version label.';
COMMENT ON COLUMN requests.request_form_snapshots.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN requests.request_form_snapshots.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE requests.request_form_snapshot_payloads (
  id uuid NOT NULL,
  request_form_snapshot_id uuid NOT NULL,
  schema_version text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT request_form_snapshot_payloads_pkey PRIMARY KEY (id),
  CONSTRAINT request_form_snapshot_payloads_snapshot_key UNIQUE (request_form_snapshot_id),
  CONSTRAINT request_form_snapshot_payloads_schema_not_blank_check CHECK (btrim(schema_version) <> ''),
  CONSTRAINT request_form_snapshot_payloads_snapshot_fkey FOREIGN KEY (request_form_snapshot_id)
    REFERENCES requests.request_form_snapshots (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
COMMENT ON TABLE requests.request_form_snapshot_payloads IS 'TABLE-028 JSONB payload child of form snapshot header; supporting not sole authority.';
COMMENT ON COLUMN requests.request_form_snapshot_payloads.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_form_snapshot_payloads.request_form_snapshot_id IS 'Parent snapshot header; one payload row per header.';
COMMENT ON COLUMN requests.request_form_snapshot_payloads.schema_version IS 'Payload schema version label.';
COMMENT ON COLUMN requests.request_form_snapshot_payloads.payload IS 'Form payload snapshot JSONB.';
COMMENT ON COLUMN requests.request_form_snapshot_payloads.created_at IS 'Database insertion timestamp.';

CREATE TABLE requests.request_status_histories (
  id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  changed_at timestamptz NOT NULL,
  changed_by_profile_id uuid NULL,
  from_status_code text NULL,
  to_status_code text NOT NULL,
  reason text NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT request_status_histories_pkey PRIMARY KEY (id),
  CONSTRAINT request_status_histories_to_status_not_blank_check CHECK (btrim(to_status_code) <> ''),
  CONSTRAINT request_status_histories_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_status_histories_changed_by_fkey FOREIGN KEY (changed_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_status_histories_request_id_idx
  ON requests.request_status_histories (service_request_id);
CREATE INDEX request_status_histories_changed_at_idx
  ON requests.request_status_histories (changed_at);
COMMENT ON TABLE requests.request_status_histories IS 'TABLE-029 append-only status history.';
COMMENT ON COLUMN requests.request_status_histories.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_status_histories.service_request_id IS 'Parent service request.';
COMMENT ON COLUMN requests.request_status_histories.changed_at IS 'Change occurrence timestamp.';
COMMENT ON COLUMN requests.request_status_histories.changed_by_profile_id IS 'Optional actor profile.';
COMMENT ON COLUMN requests.request_status_histories.from_status_code IS 'Prior status code.';
COMMENT ON COLUMN requests.request_status_histories.to_status_code IS 'New status code.';
COMMENT ON COLUMN requests.request_status_histories.reason IS 'Optional change reason.';
COMMENT ON COLUMN requests.request_status_histories.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN requests.request_status_histories.created_at IS 'Database insertion timestamp.';

CREATE TABLE requests.request_assignment_histories (
  id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  action_code text NOT NULL,
  assigned_at timestamptz NOT NULL,
  staff_profile_id uuid NOT NULL,
  changed_at timestamptz NOT NULL,
  changed_by_staff_profile_id uuid NULL,
  reason text NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT request_assignment_histories_pkey PRIMARY KEY (id),
  CONSTRAINT request_assignment_histories_action_not_blank_check CHECK (btrim(action_code) <> ''),
  CONSTRAINT request_assignment_histories_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_assignment_histories_staff_fkey FOREIGN KEY (staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_assignment_histories_changed_by_fkey FOREIGN KEY (changed_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_assignment_histories_request_id_idx
  ON requests.request_assignment_histories (service_request_id);
CREATE INDEX request_assignment_histories_staff_profile_id_idx
  ON requests.request_assignment_histories (staff_profile_id);
CREATE INDEX request_assignment_histories_changed_at_idx
  ON requests.request_assignment_histories (changed_at);
COMMENT ON TABLE requests.request_assignment_histories IS 'TABLE-030 append-only assignment history.';
COMMENT ON COLUMN requests.request_assignment_histories.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_assignment_histories.service_request_id IS 'Parent service request.';
COMMENT ON COLUMN requests.request_assignment_histories.action_code IS 'Assignment action code.';
COMMENT ON COLUMN requests.request_assignment_histories.assigned_at IS 'Assignment timestamp.';
COMMENT ON COLUMN requests.request_assignment_histories.staff_profile_id IS 'Assigned staff profile.';
COMMENT ON COLUMN requests.request_assignment_histories.changed_at IS 'Change occurrence timestamp.';
COMMENT ON COLUMN requests.request_assignment_histories.changed_by_staff_profile_id IS 'Optional acting staff profile.';
COMMENT ON COLUMN requests.request_assignment_histories.reason IS 'Optional change reason.';
COMMENT ON COLUMN requests.request_assignment_histories.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN requests.request_assignment_histories.created_at IS 'Database insertion timestamp.';

CREATE TABLE requests.request_completion_requests (
  id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  request_text text NULL,
  requested_at timestamptz NOT NULL,
  requested_by_staff_profile_id uuid NULL,
  status_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NULL,
  CONSTRAINT request_completion_requests_pkey PRIMARY KEY (id),
  CONSTRAINT request_completion_requests_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT request_completion_requests_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_completion_requests_staff_fkey FOREIGN KEY (requested_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_completion_requests_request_id_idx
  ON requests.request_completion_requests (service_request_id);
CREATE INDEX request_completion_requests_requested_at_idx
  ON requests.request_completion_requests (requested_at);
COMMENT ON TABLE requests.request_completion_requests IS 'TABLE-031 completion-cycle request.';
COMMENT ON COLUMN requests.request_completion_requests.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_completion_requests.service_request_id IS 'Parent service request.';
COMMENT ON COLUMN requests.request_completion_requests.request_text IS 'Optional completion request text.';
COMMENT ON COLUMN requests.request_completion_requests.requested_at IS 'Request timestamp.';
COMMENT ON COLUMN requests.request_completion_requests.requested_by_staff_profile_id IS 'Optional requesting staff.';
COMMENT ON COLUMN requests.request_completion_requests.status_code IS 'Cycle status code.';
COMMENT ON COLUMN requests.request_completion_requests.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN requests.request_completion_requests.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE requests.request_completion_responses (
  id uuid NOT NULL,
  completion_request_id uuid NOT NULL,
  response_text text NULL,
  responded_at timestamptz NOT NULL,
  responded_by_profile_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NULL,
  CONSTRAINT request_completion_responses_pkey PRIMARY KEY (id),
  CONSTRAINT request_completion_responses_completion_key UNIQUE (completion_request_id),
  CONSTRAINT request_completion_responses_completion_fkey FOREIGN KEY (completion_request_id)
    REFERENCES requests.request_completion_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_completion_responses_responded_by_fkey FOREIGN KEY (responded_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_completion_responses_responded_at_idx
  ON requests.request_completion_responses (responded_at);
COMMENT ON TABLE requests.request_completion_responses IS 'TABLE-032 completion-cycle response; one per completion request.';
COMMENT ON COLUMN requests.request_completion_responses.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_completion_responses.completion_request_id IS 'Parent completion request.';
COMMENT ON COLUMN requests.request_completion_responses.response_text IS 'Optional response text.';
COMMENT ON COLUMN requests.request_completion_responses.responded_at IS 'Response timestamp.';
COMMENT ON COLUMN requests.request_completion_responses.responded_by_profile_id IS 'Optional responding profile.';
COMMENT ON COLUMN requests.request_completion_responses.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN requests.request_completion_responses.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE requests.request_decision_records (
  id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  outcome_code text NOT NULL,
  decision_summary text NULL,
  basis_text text NULL,
  decided_at timestamptz NOT NULL,
  decided_by_staff_profile_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT request_decision_records_pkey PRIMARY KEY (id),
  CONSTRAINT request_decision_records_request_key UNIQUE (service_request_id),
  CONSTRAINT request_decision_records_outcome_not_blank_check CHECK (btrim(outcome_code) <> ''),
  CONSTRAINT request_decision_records_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_decision_records_decided_by_fkey FOREIGN KEY (decided_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_decision_records_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_decision_records_outcome_code_idx
  ON requests.request_decision_records (outcome_code);
CREATE INDEX request_decision_records_decided_at_idx
  ON requests.request_decision_records (decided_at);
COMMENT ON TABLE requests.request_decision_records IS 'TABLE-033 decision record with embedded decision value; 0..1 per request; never overwrite.';
COMMENT ON COLUMN requests.request_decision_records.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_decision_records.service_request_id IS 'Parent service request; unique for 0..1 decision record.';
COMMENT ON COLUMN requests.request_decision_records.outcome_code IS 'Decision outcome code.';
COMMENT ON COLUMN requests.request_decision_records.decision_summary IS 'Optional decision summary.';
COMMENT ON COLUMN requests.request_decision_records.basis_text IS 'Optional decision basis.';
COMMENT ON COLUMN requests.request_decision_records.decided_at IS 'Decision timestamp.';
COMMENT ON COLUMN requests.request_decision_records.decided_by_staff_profile_id IS 'Optional deciding staff.';
COMMENT ON COLUMN requests.request_decision_records.created_at IS 'Database insertion timestamp.';
COMMENT ON COLUMN requests.request_decision_records.created_by_profile_id IS 'Optional creating application profile.';
COMMENT ON COLUMN requests.request_decision_records.correlation_id IS 'Optional application operation correlation identifier.';

CREATE TABLE requests.request_decision_revisions (
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
  CONSTRAINT request_decision_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT request_decision_revisions_number_check CHECK (revision_number >= 1),
  CONSTRAINT request_decision_revisions_decision_fkey FOREIGN KEY (decision_record_id)
    REFERENCES requests.request_decision_records (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_decision_revisions_revised_by_fkey FOREIGN KEY (revised_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_decision_revisions_decision_id_idx
  ON requests.request_decision_revisions (decision_record_id);
CREATE INDEX request_decision_revisions_revised_at_idx
  ON requests.request_decision_revisions (revised_at);
COMMENT ON TABLE requests.request_decision_revisions IS 'TABLE-034 append-only decision revisions.';
COMMENT ON COLUMN requests.request_decision_revisions.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_decision_revisions.decision_record_id IS 'Parent decision record.';
COMMENT ON COLUMN requests.request_decision_revisions.revision_number IS 'Revision sequence (>= 1).';
COMMENT ON COLUMN requests.request_decision_revisions.revised_outcome_code IS 'Optional revised outcome code.';
COMMENT ON COLUMN requests.request_decision_revisions.revision_summary IS 'Optional revision summary.';
COMMENT ON COLUMN requests.request_decision_revisions.revised_at IS 'Revision timestamp.';
COMMENT ON COLUMN requests.request_decision_revisions.revised_by_staff_profile_id IS 'Optional revising staff.';
COMMENT ON COLUMN requests.request_decision_revisions.reason IS 'Optional revision reason.';
COMMENT ON COLUMN requests.request_decision_revisions.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN requests.request_decision_revisions.created_at IS 'Database insertion timestamp.';

CREATE TABLE requests.request_close_archive_records (
  id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  action_code text NOT NULL,
  reason text NULL,
  acted_at timestamptz NOT NULL,
  acted_by_staff_profile_id uuid NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT request_close_archive_records_pkey PRIMARY KEY (id),
  CONSTRAINT request_close_archive_records_action_not_blank_check CHECK (btrim(action_code) <> ''),
  CONSTRAINT request_close_archive_records_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_close_archive_records_acted_by_fkey FOREIGN KEY (acted_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_close_archive_records_request_id_idx
  ON requests.request_close_archive_records (service_request_id);
CREATE INDEX request_close_archive_records_acted_at_idx
  ON requests.request_close_archive_records (acted_at);
COMMENT ON TABLE requests.request_close_archive_records IS 'TABLE-035 close or archive event; closed vs archived semantics remain open (DMOD-01).';
COMMENT ON COLUMN requests.request_close_archive_records.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_close_archive_records.service_request_id IS 'Parent service request.';
COMMENT ON COLUMN requests.request_close_archive_records.action_code IS 'Close or archive action code.';
COMMENT ON COLUMN requests.request_close_archive_records.reason IS 'Optional action reason.';
COMMENT ON COLUMN requests.request_close_archive_records.acted_at IS 'Action timestamp.';
COMMENT ON COLUMN requests.request_close_archive_records.acted_by_staff_profile_id IS 'Optional acting staff.';
COMMENT ON COLUMN requests.request_close_archive_records.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN requests.request_close_archive_records.created_at IS 'Database insertion timestamp.';

CREATE TABLE requests.request_reopen_records (
  id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  reason text NULL,
  reopened_at timestamptz NOT NULL,
  reopened_by_staff_profile_id uuid NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT request_reopen_records_pkey PRIMARY KEY (id),
  CONSTRAINT request_reopen_records_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT request_reopen_records_reopened_by_fkey FOREIGN KEY (reopened_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX request_reopen_records_request_id_idx
  ON requests.request_reopen_records (service_request_id);
CREATE INDEX request_reopen_records_reopened_at_idx
  ON requests.request_reopen_records (reopened_at);
COMMENT ON TABLE requests.request_reopen_records IS 'TABLE-036 reopen event; reopen authority remains open (DMOD-11).';
COMMENT ON COLUMN requests.request_reopen_records.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN requests.request_reopen_records.service_request_id IS 'Parent service request.';
COMMENT ON COLUMN requests.request_reopen_records.reason IS 'Optional reopen reason.';
COMMENT ON COLUMN requests.request_reopen_records.reopened_at IS 'Reopen timestamp.';
COMMENT ON COLUMN requests.request_reopen_records.reopened_by_staff_profile_id IS 'Optional reopening staff.';
COMMENT ON COLUMN requests.request_reopen_records.correlation_id IS 'Optional application operation correlation identifier.';
COMMENT ON COLUMN requests.request_reopen_records.created_at IS 'Database insertion timestamp.';

ALTER TABLE requests.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_selected_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_selected_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_form_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_form_snapshot_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_status_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_assignment_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_completion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_completion_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_decision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_decision_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_close_archive_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests.request_reopen_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  requests.service_types,
  requests.service_requests,
  requests.request_selected_activities,
  requests.request_selected_branches,
  requests.request_form_snapshots,
  requests.request_form_snapshot_payloads,
  requests.request_status_histories,
  requests.request_assignment_histories,
  requests.request_completion_requests,
  requests.request_completion_responses,
  requests.request_decision_records,
  requests.request_decision_revisions,
  requests.request_close_archive_records,
  requests.request_reopen_records
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
