-- MARIB-TAX-DB-FOUNDATION-BATCH-15-PERFORMANCE-INDEXES
-- Add missing performance columns and create composite indexes across all schemas.
-- All added columns are nullable — backwards-compatible, no data migration.
-- Authoring only; do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No seed/backfill rows are introduced here.
-- Detailed RLS policies remain deferred to Batch 16.

BEGIN;

-- ============================================================================
-- Column additions — missing performance/assignment columns
-- ============================================================================

-- requests.service_requests: add assignee_id (current assigned staff)
-- MIG-15-COL-01
ALTER TABLE requests.service_requests
  ADD COLUMN IF NOT EXISTS assignee_id uuid NULL;

ALTER TABLE requests.service_requests
  ADD CONSTRAINT service_requests_assignee_fkey
  FOREIGN KEY (assignee_id)
  REFERENCES identity.staff_profiles (id)
  ON UPDATE NO ACTION
  ON DELETE RESTRICT
  NOT DEFERRABLE
  NOT VALID;

COMMENT ON COLUMN requests.service_requests.assignee_id IS
  'Currently assigned staff profile; updated by NestJS on assignment.';

-- visits.field_visits: scheduled_at and team_lead_id
-- MIG-15-COL-02
ALTER TABLE visits.field_visits
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NULL;

COMMENT ON COLUMN visits.field_visits.scheduled_at IS
  'Planned visit date, distinct from actual_started_at/actual_ended_at.';

ALTER TABLE visits.field_visits
  ADD COLUMN IF NOT EXISTS team_lead_id uuid NULL;

ALTER TABLE visits.field_visits
  ADD CONSTRAINT field_visits_team_lead_fkey
  FOREIGN KEY (team_lead_id)
  REFERENCES identity.staff_profiles (id)
  ON UPDATE NO ACTION
  ON DELETE RESTRICT
  NOT DEFERRABLE
  NOT VALID;

COMMENT ON COLUMN visits.field_visits.team_lead_id IS
  'Designated team lead staff profile for this visit.';

-- ============================================================================
-- Performance Indexes — requests schema
-- ============================================================================

-- Specific user-requested indexes: idx_requests_status_submitted_at
CREATE INDEX IF NOT EXISTS idx_requests_status_submitted_at
  ON requests.service_requests (status_code, submitted_at)
  WHERE submitted_at IS NOT NULL;

-- idx_requests_service_id_assignee_id
CREATE INDEX IF NOT EXISTS idx_requests_service_id_assignee_id
  ON requests.service_requests (service_type_id, assignee_id)
  WHERE assignee_id IS NOT NULL;

-- Composite: taxpayer + status (dashboard/inbox queries)
CREATE INDEX IF NOT EXISTS idx_requests_taxpayer_status
  ON requests.service_requests (taxpayer_id, status_code);

-- Composite: taxpayer + service type (lookups)
CREATE INDEX IF NOT EXISTS idx_requests_taxpayer_service_type
  ON requests.service_requests (taxpayer_id, service_type_id);

-- Partial: public_ref lookup for idempotent lookups
CREATE INDEX IF NOT EXISTS idx_requests_public_ref_partial
  ON requests.service_requests (public_ref)
  WHERE public_ref IS NOT NULL;

-- Assignment timeline
CREATE INDEX IF NOT EXISTS idx_request_assignment_histories_timeline
  ON requests.request_assignment_histories (service_request_id, changed_at);

-- Status timeline
CREATE INDEX IF NOT EXISTS idx_request_status_histories_timeline
  ON requests.request_status_histories (service_request_id, changed_at);

-- Selected activities: aggregate lookup
CREATE INDEX IF NOT EXISTS idx_request_selected_activities_agg
  ON requests.request_selected_activities (service_request_id, commercial_activity_id);

-- ============================================================================
-- Performance Indexes — balaghat schema
-- ============================================================================

-- Status + submission time
CREATE INDEX IF NOT EXISTS idx_balaghs_status_submitted_at
  ON balaghat.balaghs (status_code, submitted_at)
  WHERE submitted_at IS NOT NULL;

-- Taxpayer timeline
CREATE INDEX IF NOT EXISTS idx_balaghs_taxpayer_submitted_at
  ON balaghat.balaghs (taxpayer_id, submitted_at)
  WHERE submitted_at IS NOT NULL;

-- Public ref partial lookup
CREATE INDEX IF NOT EXISTS idx_balaghs_public_ref
  ON balaghat.balaghs (public_ref)
  WHERE public_ref IS NOT NULL;

-- Balagh type + status
CREATE INDEX IF NOT EXISTS idx_balaghs_type_status
  ON balaghat.balaghs (balagh_type_code, status_code);

-- ============================================================================
-- Performance Indexes — visits schema
-- ============================================================================

-- idx_field_visits_scheduled_at_team_lead
CREATE INDEX IF NOT EXISTS idx_field_visits_scheduled_at_team_lead
  ON visits.field_visits (scheduled_at, team_lead_id)
  WHERE scheduled_at IS NOT NULL;

-- Status + actual execution time
CREATE INDEX IF NOT EXISTS idx_field_visits_status_started_at
  ON visits.field_visits (status_code, actual_started_at)
  WHERE actual_started_at IS NOT NULL;

-- Staff dashboard: my visits
CREATE INDEX IF NOT EXISTS idx_field_visits_staff_status
  ON visits.field_visits (created_by_staff_profile_id, status_code);

-- Schedule board
CREATE INDEX IF NOT EXISTS idx_visit_schedules_range
  ON visits.visit_schedules (scheduled_start_at, scheduled_end_at)
  WHERE scheduled_start_at IS NOT NULL;

-- Team members: get all members per visit
CREATE INDEX IF NOT EXISTS idx_visit_team_members_visit_staff
  ON visits.visit_team_members (field_visit_id, staff_profile_id);

-- Active team members (partial)
CREATE INDEX IF NOT EXISTS idx_visit_team_members_active_partial
  ON visits.visit_team_members (staff_profile_id, field_visit_id)
  WHERE effective_to IS NULL;

-- ============================================================================
-- Performance Indexes — dues schema
-- ============================================================================

-- Status + assessment time
CREATE INDEX IF NOT EXISTS idx_payment_dues_status_assessed_at
  ON dues.payment_dues (status_code, assessed_at)
  WHERE assessed_at IS NOT NULL;

-- Receipts: due + receipt date
CREATE INDEX IF NOT EXISTS idx_payment_receipts_due_date
  ON dues.payment_receipts (payment_due_id, receipt_date);

-- public_ref partial lookup on receipts
CREATE INDEX IF NOT EXISTS idx_payment_receipts_public_ref
  ON dues.payment_receipts (public_ref)
  WHERE public_ref IS NOT NULL;

-- ============================================================================
-- Performance Indexes — files schema
-- ============================================================================

-- Category + creation time
CREATE INDEX IF NOT EXISTS idx_attachments_category_created
  ON files.attachments (document_category_code, created_at);

-- Storage status filter
CREATE INDEX IF NOT EXISTS idx_attachments_storage_status
  ON files.attachments (storage_status_code);

-- Attachment links: find currently linked files per entity
CREATE INDEX IF NOT EXISTS idx_attachment_links_owner_active
  ON files.attachment_links (owner_type, owner_id, linked_at)
  WHERE unlinked_at IS NULL;

-- ============================================================================
-- Performance Indexes — notify schema
-- ============================================================================

-- Recipient inbox: recent notifications
CREATE INDEX IF NOT EXISTS idx_notification_messages_recipient
  ON notify.notification_messages (recipient_profile_id, created_at DESC)
  WHERE recipient_profile_id IS NOT NULL;

-- Notifications linked to a specific request
CREATE INDEX IF NOT EXISTS idx_notification_messages_request_status
  ON notify.notification_messages (service_request_id, delivery_status_code)
  WHERE service_request_id IS NOT NULL;

-- Worker poll: pending/failed outbox items
CREATE INDEX IF NOT EXISTS idx_notification_outbox_worker_poll
  ON notify.notification_outbox_messages (status_code, next_retry_at)
  WHERE status_code IN ('pending', 'failed');

-- ============================================================================
-- Performance Indexes — imports schema
-- ============================================================================

-- Validation dashboard: rows by job + validation status
CREATE INDEX IF NOT EXISTS idx_import_rows_job_validation
  ON imports.import_rows (import_job_id, validation_status);

-- Error-by-job severity breakdown
CREATE INDEX IF NOT EXISTS idx_import_errors_job_severity
  ON imports.import_errors (import_job_id, severity);

-- Job status + creation for dashboard
CREATE INDEX IF NOT EXISTS idx_import_jobs_status_created_desc
  ON imports.import_jobs (status_code, created_at DESC);

-- ============================================================================
-- Performance Indexes — audit schema
-- ============================================================================

-- Entity audit timeline
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timeline
  ON audit.audit_logs (entity_type, entity_id, created_at DESC);

-- Domain events aggregate timeline
CREATE INDEX IF NOT EXISTS idx_log_events_aggregate_time
  ON audit.log_events (aggregate_type, aggregate_id, occurred_at DESC);

-- ============================================================================
-- Performance Indexes — registry schema
-- ============================================================================

-- Taxpayer listing
CREATE INDEX IF NOT EXISTS idx_taxpayers_status_created
  ON registry.taxpayers (status_code, created_at);

-- ============================================================================
-- Performance Indexes — identity schema
-- ============================================================================

-- Active role assignments (fast lookup)
CREATE INDEX IF NOT EXISTS idx_staff_role_assignments_active
  ON identity.staff_role_assignments (staff_profile_id, role_id)
  WHERE effective_to IS NULL AND revoked_at IS NULL;

-- ============================================================================
-- Performance Indexes — masterdata schema
-- ============================================================================

-- Properties by taxpayer owner
CREATE INDEX IF NOT EXISTS idx_property_ownership_records_taxpayer
  ON masterdata.property_ownership_records (taxpayer_id, property_id)
  WHERE taxpayer_id IS NOT NULL;

-- Commercial activities lookup
CREATE INDEX IF NOT EXISTS idx_commercial_activities_category
  ON masterdata.commercial_activities (category_code, is_active);

-- ============================================================================
-- Performance Indexes — content schema
-- ============================================================================

-- Published content
CREATE INDEX IF NOT EXISTS idx_content_pages_status_published
  ON content.content_pages (status, published_at DESC)
  WHERE status = 'published';

-- Announcements active window
CREATE INDEX IF NOT EXISTS idx_announcements_active_window
  ON content.announcements (is_active, starts_at, ends_at)
  WHERE is_active = true;

-- ============================================================================
-- Performance Indexes — reporting schema
-- ============================================================================

-- Report jobs: status tracking (if reporting schema has tables in future batches)
-- Indexed once the schema tables are created; no-op if schema is empty for now.

COMMIT;