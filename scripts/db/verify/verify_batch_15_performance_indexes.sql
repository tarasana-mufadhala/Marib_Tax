-- Batch 15 read-only structural verifier for performance indexes. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.

WITH column_presence AS (
  SELECT
    count(*) FILTER (WHERE table_schema = 'requests' AND table_name = 'service_requests' AND column_name = 'assignee_id') = 1 AS assignee_id_present,
    count(*) FILTER (WHERE table_schema = 'visits' AND table_name = 'field_visits' AND column_name = 'scheduled_at') = 1 AS scheduled_at_present,
    count(*) FILTER (WHERE table_schema = 'visits' AND table_name = 'field_visits' AND column_name = 'team_lead_id') = 1 AS team_lead_id_present
  FROM information_schema.columns
),
required_indexes AS (
  SELECT
    count(*) FILTER (WHERE indexname = 'idx_requests_status_submitted_at') = 1 AS status_submitted_at_idx,
    count(*) FILTER (WHERE indexname = 'idx_requests_service_id_assignee_id') = 1 AS service_id_assignee_id_idx,
    count(*) FILTER (WHERE indexname = 'idx_field_visits_scheduled_at_team_lead') = 1 AS scheduled_at_team_lead_idx,
    count(*) FILTER (WHERE indexname = 'idx_service_requests_public_ref') = 1 AS service_requests_public_ref_idx,
    count(*) FILTER (WHERE indexname = 'idx_balaghs_public_ref') = 1 AS balaghs_public_ref_idx,
    count(*) FILTER (WHERE indexname = 'idx_service_requests_taxpayer_status') = 1 AS taxpayer_status_idx,
    count(*) FILTER (WHERE indexname = 'idx_service_requests_taxpayer_service') = 1 AS taxpayer_service_idx,
    count(*) FILTER (WHERE indexname = 'idx_visit_team_members_active') = 1 AS visit_team_members_active_idx,
    count(*) FILTER (WHERE indexname = 'idx_payment_receipts_public_ref') = 1 AS payment_receipts_public_ref_idx,
    count(*) FILTER (WHERE indexname = 'idx_notification_outbox_worker') = 1 AS notification_outbox_worker_idx
  FROM pg_catalog.pg_indexes
)
SELECT
  cp.assignee_id_present,
  cp.scheduled_at_present,
  cp.team_lead_id_present,
  ri.status_submitted_at_idx,
  ri.service_id_assignee_id_idx,
  ri.scheduled_at_team_lead_idx,
  ri.service_requests_public_ref_idx,
  ri.balaghs_public_ref_idx,
  ri.taxpayer_status_idx,
  ri.taxpayer_service_idx,
  ri.visit_team_members_active_idx,
  ri.payment_receipts_public_ref_idx,
  ri.notification_outbox_worker_idx,
  CASE
    WHEN cp.assignee_id_present
      AND cp.scheduled_at_present
      AND cp.team_lead_id_present
      AND ri.status_submitted_at_idx
      AND ri.service_id_assignee_id_idx
      AND ri.scheduled_at_team_lead_idx
      AND ri.service_requests_public_ref_idx
      AND ri.balaghs_public_ref_idx
      AND ri.taxpayer_status_idx
      AND ri.taxpayer_service_idx
      AND ri.visit_team_members_active_idx
      AND ri.payment_receipts_public_ref_idx
      AND ri.notification_outbox_worker_idx
    THEN 'PASS'
    ELSE 'FAIL'
  END AS final_status
FROM column_presence cp
CROSS JOIN required_indexes ri;
