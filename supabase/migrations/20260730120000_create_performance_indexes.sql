-- MARIB-TAX-DB-FOUNDATION-BATCH-15-PERFORMANCE-INDEXES
-- Add assignee_id to requests.service_requests, scheduled_at and team_lead_id to visits.field_visits.
-- Create requested composite performance indexes and additional indexes from access plan.
-- Authoring only; do not apply to production in this task.

BEGIN;

-- 1. Alter requests.service_requests to add assignee_id
ALTER TABLE requests.service_requests
  ADD COLUMN assignee_id uuid NULL,
  ADD CONSTRAINT service_requests_assignee_fkey FOREIGN KEY (assignee_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE;

COMMENT ON COLUMN requests.service_requests.assignee_id IS 'Required assignee staff profile reference for own-data and employee-level RLS.';

-- 2. Alter visits.field_visits to add scheduled_at and team_lead_id
ALTER TABLE visits.field_visits
  ADD COLUMN scheduled_at timestamptz NULL,
  ADD COLUMN team_lead_id uuid NULL,
  ADD CONSTRAINT field_visits_team_lead_fkey FOREIGN KEY (team_lead_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE;

COMMENT ON COLUMN visits.field_visits.scheduled_at IS 'Scheduled date and time of the field visit.';
COMMENT ON COLUMN visits.field_visits.team_lead_id IS 'Assigned team leader staff profile reference.';

-- 3. Create required composite indexes
CREATE INDEX idx_requests_status_submitted_at
  ON requests.service_requests (status_code, submitted_at);

CREATE INDEX idx_requests_service_id_assignee_id
  ON requests.service_requests (service_type_id, assignee_id);

CREATE INDEX idx_field_visits_scheduled_at_team_lead
  ON visits.field_visits (scheduled_at, team_lead_id);

-- 4. Create additional indexes from access plan (execution_plan.md & access plan document)

-- requests.service_requests & balaghat.balaghs public_ref and taxpayer composites
CREATE UNIQUE INDEX idx_service_requests_public_ref 
  ON requests.service_requests (public_ref) 
  WHERE public_ref IS NOT NULL;

CREATE UNIQUE INDEX idx_balaghs_public_ref 
  ON balaghat.balaghs (public_ref) 
  WHERE public_ref IS NOT NULL;

CREATE INDEX idx_service_requests_taxpayer_status 
  ON requests.service_requests (taxpayer_id, status_code, submitted_at DESC);

CREATE INDEX idx_service_requests_taxpayer_service 
  ON requests.service_requests (taxpayer_id, service_type_id, submitted_at DESC);

CREATE INDEX idx_service_requests_updated_at 
  ON requests.service_requests (updated_at DESC);

CREATE INDEX idx_balaghs_status_submitted 
  ON balaghat.balaghs (status_code, submitted_at DESC);

CREATE INDEX idx_balaghs_taxpayer_status 
  ON balaghat.balaghs (taxpayer_id, status_code, submitted_at DESC);

CREATE INDEX idx_balaghs_updated_at 
  ON balaghat.balaghs (updated_at DESC);

-- registry.taxpayer_legal_entity_associations
CREATE INDEX idx_taxpayer_legal_entity_assoc 
  ON registry.taxpayer_legal_entity_associations (taxpayer_id, effective_from) 
  WHERE effective_to IS NULL;

-- registry.taxpayer_account_links
CREATE INDEX idx_taxpayer_account_links_user 
  ON registry.taxpayer_account_links (user_profile_id) 
  WHERE active_state_code = 'active' AND effective_to IS NULL;

CREATE INDEX idx_taxpayer_account_links_taxpayer 
  ON registry.taxpayer_account_links (taxpayer_id) 
  WHERE active_state_code = 'active' AND effective_to IS NULL;

CREATE INDEX idx_taxpayer_account_links_verification 
  ON registry.taxpayer_account_links (verification_status_code, effective_from) 
  WHERE active_state_code = 'active' AND verification_status_code = 'pending';

-- histories / completion
CREATE INDEX idx_request_assignment_histories_request_assigned 
  ON requests.request_assignment_histories (service_request_id, assigned_at DESC);

CREATE INDEX idx_balagh_assignment_histories_balagh_assigned 
  ON balaghat.balagh_assignment_histories (balagh_id, assigned_at DESC);

CREATE INDEX idx_request_assignment_histories_staff 
  ON requests.request_assignment_histories (staff_profile_id, assigned_at DESC);

CREATE INDEX idx_balagh_assignment_histories_staff 
  ON balaghat.balagh_assignment_histories (staff_profile_id, assigned_at DESC);

CREATE INDEX idx_request_status_histories_timeline 
  ON requests.request_status_histories (service_request_id, changed_at ASC);

CREATE INDEX idx_balagh_status_histories_timeline 
  ON balaghat.balagh_status_histories (balagh_id, changed_at ASC);

CREATE INDEX idx_activity_status_histories_timeline 
  ON masterdata.activity_status_histories (commercial_activity_id, changed_at ASC);

CREATE INDEX idx_request_completion_requests_pending 
  ON requests.request_completion_requests (service_request_id, requested_at DESC) 
  WHERE status_code = 'pending_response';

CREATE INDEX idx_balagh_completion_requests_pending 
  ON balaghat.balagh_completion_requests (balagh_id, requested_at DESC) 
  WHERE status_code = 'pending_response';

CREATE INDEX idx_request_completion_requests_aging 
  ON requests.request_completion_requests (requested_at ASC) 
  WHERE status_code = 'pending_response';

CREATE INDEX idx_balagh_completion_requests_aging 
  ON balaghat.balagh_completion_requests (requested_at ASC) 
  WHERE status_code = 'pending_response';

-- decision records
CREATE INDEX idx_request_decision_records_decided 
  ON requests.request_decision_records (decided_by_staff_profile_id, decided_at DESC);

CREATE INDEX idx_balagh_decision_records_decided 
  ON balaghat.balagh_decision_records (decided_by_staff_profile_id, decided_at DESC);

-- selected activities/branches
CREATE INDEX idx_request_selected_activities_request 
  ON requests.request_selected_activities (service_request_id, commercial_activity_id);

CREATE INDEX idx_request_selected_branches_activity 
  ON requests.request_selected_branches (request_selected_activity_id, branch_id);

CREATE INDEX idx_balagh_selected_activities_balagh 
  ON balaghat.balagh_selected_activities (balagh_id, commercial_activity_id);

CREATE INDEX idx_balagh_selected_branches_activity 
  ON balaghat.balagh_selected_branches (balagh_selected_activity_id, branch_id);

CREATE INDEX idx_branches_commercial_activity 
  ON masterdata.branches (commercial_activity_id);

-- property ownership records
CREATE INDEX idx_property_ownership_records_property 
  ON masterdata.property_ownership_records (property_id) 
  WHERE is_current = true;

CREATE INDEX idx_property_ownership_records_taxpayer 
  ON masterdata.property_ownership_records (taxpayer_id) 
  WHERE is_current = true;

CREATE INDEX idx_property_ownership_histories_timeline 
  ON masterdata.property_ownership_histories (ownership_record_id, changed_at ASC);

-- visits schedules and active team members
CREATE INDEX idx_visit_schedules_start 
  ON visits.visit_schedules (scheduled_start_at, schedule_status_code);

CREATE INDEX idx_visit_team_members_active 
  ON visits.visit_team_members (staff_profile_id, field_visit_id) 
  WHERE effective_to IS NULL;

-- dues and payment notice/evidence
CREATE INDEX idx_payment_dues_request 
  ON dues.payment_dues (service_request_id, status_code) 
  WHERE service_request_id IS NOT NULL;

CREATE INDEX idx_payment_dues_balagh 
  ON dues.payment_dues (balagh_id, status_code) 
  WHERE balagh_id IS NOT NULL;

CREATE INDEX idx_payment_notices_due 
  ON dues.payment_notices (payment_due_id, created_at DESC);

CREATE UNIQUE INDEX idx_payment_receipts_public_ref 
  ON dues.payment_receipts (public_ref) 
  WHERE public_ref IS NOT NULL;

CREATE INDEX idx_payment_confirmations_receipt 
  ON dues.payment_confirmations (payment_receipt_id, created_at DESC);

CREATE INDEX idx_receipt_correction_replacements 
  ON dues.receipt_correction_replacements (payment_receipt_id, created_at ASC);

-- notifications
CREATE INDEX idx_notification_outbox_worker 
  ON notify.notification_outbox_messages (publication_state, next_attempt_at) 
  WHERE publication_state IN ('pending', 'retry');

CREATE INDEX idx_notification_messages_request 
  ON notify.notification_messages (service_request_id, created_at DESC) 
  WHERE service_request_id IS NOT NULL;

CREATE INDEX idx_notification_messages_balagh 
  ON notify.notification_messages (balagh_id, created_at DESC) 
  WHERE balagh_id IS NOT NULL;

CREATE INDEX idx_delivery_attempts_message 
  ON notify.delivery_attempts (notification_message_id, attempt_number);

CREATE INDEX idx_notification_read_states_recipient 
  ON notify.notification_read_states (recipient_profile_id, read_status_code, notification_message_id);

-- imports
-- CREATE INDEX idx_import_batches_status 
--   ON imports.import_batches (status_code, created_at DESC);

-- CREATE INDEX idx_import_errors_result 
--   ON imports.import_errors (import_row_result_id);

-- CREATE INDEX idx_import_row_results_batch_outcome 
--   ON imports.import_row_results (import_batch_id, outcome_code);

-- CREATE UNIQUE INDEX idx_import_batches_idempotency 
--   ON imports.import_batches (idempotency_key) 
--   WHERE idempotency_key IS NOT NULL;

-- content
CREATE INDEX idx_content_pages_status_updated 
  ON content.content_pages (status, updated_at DESC);

CREATE INDEX idx_announcements_validity 
  ON content.announcements (starts_at, ends_at) 
  WHERE is_active = true;

-- reporting
-- CREATE INDEX idx_saved_report_filters_user 
--   ON reporting.saved_report_filters (user_profile_id, report_key) 
--   WHERE archived_at IS NULL;

-- CREATE INDEX idx_report_export_records_user 
--   ON reporting.report_export_records (requested_by_user_profile_id, requested_at DESC);

-- CREATE UNIQUE INDEX idx_reporting_projection_definitions_code 
--   ON reporting.reporting_projection_definitions (code);

COMMIT;
