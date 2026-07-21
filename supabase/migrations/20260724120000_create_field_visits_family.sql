-- MARIB-TAX-DB-FOUNDATION-BATCH-09-FIELD-VISITS-FAMILY
-- Create visits.field_visits through visit_evidences (TABLE-050…055).
-- Authoring only; do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No seed/backfill rows are introduced here.
-- No table named cases. No Storage schema mutation, buckets, policies, or bytes.
-- Exact-one parent context (request XOR balagh) per IR-29 / CK-T01.
-- No service-specific visit trigger defaults (DMOD-08 remains open).
-- Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

CREATE TABLE visits.field_visits (
  id uuid NOT NULL,
  public_ref text NULL,
  service_request_id uuid NULL,
  balagh_id uuid NULL,
  status_code text NOT NULL,
  actual_started_at timestamptz NULL,
  actual_ended_at timestamptz NULL,
  location_snapshot text NULL,
  notes text NULL,
  cancellation_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_staff_profile_id uuid NOT NULL,
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  archived_at timestamptz NULL,
  CONSTRAINT field_visits_pkey PRIMARY KEY (id),
  CONSTRAINT field_visits_public_ref_key UNIQUE (public_ref),
  CONSTRAINT field_visits_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT field_visits_exact_one_parent_check CHECK (
    (service_request_id IS NOT NULL AND balagh_id IS NULL)
    OR (service_request_id IS NULL AND balagh_id IS NOT NULL)
  ),
  CONSTRAINT field_visits_actual_time_order_check CHECK (
    actual_ended_at IS NULL
    OR actual_started_at IS NULL
    OR actual_ended_at >= actual_started_at
  ),
  CONSTRAINT field_visits_cancellation_reason_not_blank_check CHECK (
    cancellation_reason IS NULL OR btrim(cancellation_reason) <> ''
  ),
  CONSTRAINT field_visits_service_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT field_visits_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT field_visits_created_by_staff_fkey FOREIGN KEY (created_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT field_visits_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT field_visits_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX field_visits_service_request_id_idx
  ON visits.field_visits (service_request_id, created_at DESC)
  WHERE service_request_id IS NOT NULL;
CREATE INDEX field_visits_balagh_id_idx
  ON visits.field_visits (balagh_id, created_at DESC)
  WHERE balagh_id IS NOT NULL;
CREATE INDEX field_visits_status_code_idx ON visits.field_visits (status_code);
CREATE INDEX field_visits_created_by_staff_profile_id_idx
  ON visits.field_visits (created_by_staff_profile_id);
COMMENT ON TABLE visits.field_visits IS 'TABLE-050 field visit root; exactly one of service_request_id/balagh_id; not named cases; no silent visit triggers.';
COMMENT ON COLUMN visits.field_visits.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN visits.field_visits.public_ref IS 'Optional unique public business reference when issued.';
COMMENT ON COLUMN visits.field_visits.service_request_id IS 'Optional request parent; XOR with balagh_id (IR-29 / CK-T01).';
COMMENT ON COLUMN visits.field_visits.balagh_id IS 'Optional balagh parent; XOR with service_request_id (IR-29 / CK-T01).';
COMMENT ON COLUMN visits.field_visits.status_code IS 'Current visit lifecycle status code; application-constrained.';
COMMENT ON COLUMN visits.field_visits.actual_started_at IS 'Actual execution start; distinct from scheduled times on visit_schedules.';
COMMENT ON COLUMN visits.field_visits.actual_ended_at IS 'Actual execution end; distinct from scheduled times on visit_schedules.';
COMMENT ON COLUMN visits.field_visits.location_snapshot IS 'Opaque location/address snapshot; does not rewrite masterdata addresses.';
COMMENT ON COLUMN visits.field_visits.notes IS 'Optional operational notes.';
COMMENT ON COLUMN visits.field_visits.cancellation_reason IS 'Optional cancellation reason retained without hard delete; cancel authority remains open.';
COMMENT ON COLUMN visits.field_visits.created_by_staff_profile_id IS 'Required creating staff profile; taxpayer cannot create visits in this foundation.';
COMMENT ON COLUMN visits.field_visits.created_by_profile_id IS 'Optional creating application profile for NestJS actor chain.';
COMMENT ON COLUMN visits.field_visits.archived_at IS 'Optional soft-archive marker; no hard-delete or purge path in this source.';

CREATE TABLE visits.visit_schedules (
  id uuid NOT NULL,
  field_visit_id uuid NOT NULL,
  scheduled_start_at timestamptz NULL,
  scheduled_end_at timestamptz NULL,
  schedule_status_code text NOT NULL,
  revision_number integer NOT NULL,
  schedule_change_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT visit_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT visit_schedules_field_visit_revision_key UNIQUE (field_visit_id, revision_number),
  CONSTRAINT visit_schedules_status_not_blank_check CHECK (btrim(schedule_status_code) <> ''),
  CONSTRAINT visit_schedules_revision_positive_check CHECK (revision_number >= 1),
  CONSTRAINT visit_schedules_time_order_check CHECK (
    scheduled_end_at IS NULL
    OR scheduled_start_at IS NULL
    OR scheduled_end_at >= scheduled_start_at
  ),
  CONSTRAINT visit_schedules_change_reason_not_blank_check CHECK (
    schedule_change_reason IS NULL OR btrim(schedule_change_reason) <> ''
  ),
  CONSTRAINT visit_schedules_field_visit_fkey FOREIGN KEY (field_visit_id)
    REFERENCES visits.field_visits (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_schedules_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_schedules_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX visit_schedules_field_visit_id_idx ON visits.visit_schedules (field_visit_id);
CREATE INDEX visit_schedules_board_idx
  ON visits.visit_schedules (scheduled_start_at, schedule_status_code);
COMMENT ON TABLE visits.visit_schedules IS 'TABLE-051 schedule revisions retained for reschedule history; prior rows are not hard-deleted.';
COMMENT ON COLUMN visits.visit_schedules.revision_number IS 'Monotonic schedule revision for a visit; reschedule retains prior revisions.';
COMMENT ON COLUMN visits.visit_schedules.schedule_change_reason IS 'Optional non-blank reason when a schedule revision records a change.';

CREATE TABLE visits.visit_team_members (
  id uuid NOT NULL,
  field_visit_id uuid NOT NULL,
  staff_profile_id uuid NOT NULL,
  role_on_visit text NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT visit_team_members_pkey PRIMARY KEY (id),
  CONSTRAINT visit_team_members_effective_order_check CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT visit_team_members_role_not_blank_check CHECK (
    role_on_visit IS NULL OR btrim(role_on_visit) <> ''
  ),
  CONSTRAINT visit_team_members_history_key UNIQUE (field_visit_id, staff_profile_id, effective_from),
  CONSTRAINT visit_team_members_field_visit_fkey FOREIGN KEY (field_visit_id)
    REFERENCES visits.field_visits (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_team_members_staff_profile_fkey FOREIGN KEY (staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_team_members_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE UNIQUE INDEX visit_team_members_one_active_membership_idx
  ON visits.visit_team_members (field_visit_id, staff_profile_id)
  WHERE effective_to IS NULL;
CREATE INDEX visit_team_members_field_visit_id_idx ON visits.visit_team_members (field_visit_id);
CREATE INDEX visit_team_members_staff_profile_id_idx
  ON visits.visit_team_members (staff_profile_id, field_visit_id);
COMMENT ON TABLE visits.visit_team_members IS 'TABLE-052 visit team membership; active duplicate membership blocked; historical membership retained; masking deferred.';
COMMENT ON COLUMN visits.visit_team_members.role_on_visit IS 'Application team role code (e.g. lead/member); not a taxpayer-visible grant.';
COMMENT ON COLUMN visits.visit_team_members.effective_to IS 'NULL means currently active; setting effective_to ends membership without hard delete.';

CREATE TABLE visits.visit_results (
  id uuid NOT NULL,
  field_visit_id uuid NOT NULL,
  result_summary text NULL,
  result_code text NULL,
  recorded_at timestamptz NOT NULL,
  recorded_by_staff_profile_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT visit_results_pkey PRIMARY KEY (id),
  CONSTRAINT visit_results_field_visit_key UNIQUE (field_visit_id),
  CONSTRAINT visit_results_result_code_not_blank_check CHECK (
    result_code IS NULL OR btrim(result_code) <> ''
  ),
  CONSTRAINT visit_results_field_visit_fkey FOREIGN KEY (field_visit_id)
    REFERENCES visits.field_visits (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_results_recorded_by_staff_fkey FOREIGN KEY (recorded_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_results_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_results_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX visit_results_recorded_at_idx ON visits.visit_results (recorded_at);
CREATE INDEX visit_results_recorded_by_staff_profile_id_idx
  ON visits.visit_results (recorded_by_staff_profile_id);
COMMENT ON TABLE visits.visit_results IS 'TABLE-053 visit result; one row per visit; flexible findings text/code; corrections are additive children.';
COMMENT ON COLUMN visits.visit_results.result_summary IS 'Flexible narrative findings; no fixed form schema in this foundation batch.';
COMMENT ON COLUMN visits.visit_results.recorded_by_staff_profile_id IS 'Required recording staff; taxpayer cannot author results here.';

CREATE TABLE visits.visit_result_corrections (
  id uuid NOT NULL,
  visit_result_id uuid NOT NULL,
  correction_summary text NULL,
  corrected_at timestamptz NOT NULL,
  corrected_by_staff_profile_id uuid NOT NULL,
  reason text NOT NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visit_result_corrections_pkey PRIMARY KEY (id),
  CONSTRAINT visit_result_corrections_reason_not_blank_check CHECK (btrim(reason) <> ''),
  CONSTRAINT visit_result_corrections_visit_result_fkey FOREIGN KEY (visit_result_id)
    REFERENCES visits.visit_results (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_result_corrections_corrected_by_staff_fkey FOREIGN KEY (corrected_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX visit_result_corrections_visit_result_id_idx
  ON visits.visit_result_corrections (visit_result_id);
CREATE INDEX visit_result_corrections_corrected_at_idx
  ON visits.visit_result_corrections (corrected_at);
COMMENT ON TABLE visits.visit_result_corrections IS 'TABLE-054 append-only result corrections; original visit_results rows are retained; correction authority (OD-15) enforced in NestJS.';
COMMENT ON COLUMN visits.visit_result_corrections.reason IS 'Mandatory non-blank correction reason.';
COMMENT ON COLUMN visits.visit_result_corrections.corrected_by_staff_profile_id IS 'Mandatory correcting staff profile.';

CREATE TABLE visits.visit_evidences (
  id uuid NOT NULL,
  field_visit_id uuid NOT NULL,
  attachment_id uuid NOT NULL,
  evidence_role_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT visit_evidences_pkey PRIMARY KEY (id),
  CONSTRAINT visit_evidences_role_not_blank_check CHECK (
    evidence_role_code IS NULL OR btrim(evidence_role_code) <> ''
  ),
  CONSTRAINT visit_evidences_field_visit_fkey FOREIGN KEY (field_visit_id)
    REFERENCES visits.field_visits (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_evidences_attachment_fkey FOREIGN KEY (attachment_id)
    REFERENCES files.attachments (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT visit_evidences_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX visit_evidences_field_visit_id_idx ON visits.visit_evidences (field_visit_id);
CREATE INDEX visit_evidences_attachment_id_idx ON visits.visit_evidences (attachment_id);
COMMENT ON TABLE visits.visit_evidences IS 'TABLE-055 visit evidence link to Batch 08 attachment metadata only; reference never grants Storage access; no bytes/buckets here.';
COMMENT ON COLUMN visits.visit_evidences.attachment_id IS 'FK to files.attachments metadata; object bytes remain outside Postgres.';
COMMENT ON COLUMN visits.visit_evidences.evidence_role_code IS 'Optional application role distinguishing visit/result/correction evidence context.';

ALTER TABLE visits.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits.visit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits.visit_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits.visit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits.visit_result_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits.visit_evidences ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  visits.field_visits,
  visits.visit_schedules,
  visits.visit_team_members,
  visits.visit_results,
  visits.visit_result_corrections,
  visits.visit_evidences
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
