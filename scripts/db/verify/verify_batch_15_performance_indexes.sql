-- Batch 15 read-only structural verifier for performance indexes. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.
-- Verifies added columns + the complete set of composite indexes from migration 20260801120000.

WITH column_presence AS (
  SELECT
    count(*) FILTER (
      WHERE table_schema = 'requests'  AND table_name = 'service_requests' AND column_name = 'assignee_id'
    ) = 1 AS assignee_id_present,
    count(*) FILTER (
      WHERE table_schema = 'visits'    AND table_name = 'field_visits'     AND column_name = 'scheduled_at'
    ) = 1 AS scheduled_at_present,
    count(*) FILTER (
      WHERE table_schema = 'visits'    AND table_name = 'field_visits'     AND column_name = 'team_lead_id'
    ) = 1 AS team_lead_id_present
  FROM information_schema.columns
),
required_indexes AS (
  SELECT
    -- requests
    count(*) FILTER (WHERE indexname = 'idx_requests_status_submitted_at'             ) = 1 AS idx01,
    count(*) FILTER (WHERE indexname = 'idx_requests_service_id_assignee_id'          ) = 1 AS idx02,
    count(*) FILTER (WHERE indexname = 'idx_requests_taxpayer_status'                 ) = 1 AS idx03,
    count(*) FILTER (WHERE indexname = 'idx_requests_taxpayer_service_type'           ) = 1 AS idx04,
    count(*) FILTER (WHERE indexname = 'idx_requests_public_ref_partial'              ) = 1 AS idx05,
    -- balaghat
    count(*) FILTER (WHERE indexname = 'idx_balaghs_status_submitted_at'              ) = 1 AS idx06,
    count(*) FILTER (WHERE indexname = 'idx_balaghs_taxpayer_submitted_at'            ) = 1 AS idx07,
    count(*) FILTER (WHERE indexname = 'idx_balaghs_public_ref'                       ) = 1 AS idx08,
    count(*) FILTER (WHERE indexname = 'idx_balaghs_type_status'                      ) = 1 AS idx09,
    -- visits
    count(*) FILTER (WHERE indexname = 'idx_field_visits_scheduled_at_team_lead'      ) = 1 AS idx10,
    count(*) FILTER (WHERE indexname = 'idx_field_visits_status_started_at'           ) = 1 AS idx11,
    count(*) FILTER (WHERE indexname = 'idx_field_visits_staff_status'                ) = 1 AS idx12,
    count(*) FILTER (WHERE indexname = 'idx_visit_team_members_visit_staff'           ) = 1 AS idx13,
    count(*) FILTER (WHERE indexname = 'idx_visit_team_members_active_partial'        ) = 1 AS idx14,
    -- dues
    count(*) FILTER (WHERE indexname = 'idx_payment_dues_status_assessed_at'          ) = 1 AS idx15,
    count(*) FILTER (WHERE indexname = 'idx_payment_receipts_due_date'                ) = 1 AS idx16,
    count(*) FILTER (WHERE indexname = 'idx_payment_receipts_public_ref'              ) = 1 AS idx17,
    -- files
    count(*) FILTER (WHERE indexname = 'idx_attachments_category_created'             ) = 1 AS idx18,
    count(*) FILTER (WHERE indexname = 'idx_attachments_storage_status'               ) = 1 AS idx19,
    count(*) FILTER (WHERE indexname = 'idx_attachment_links_owner_active'            ) = 1 AS idx20,
    -- notify
    count(*) FILTER (WHERE indexname = 'idx_notification_messages_recipient'          ) = 1 AS idx21,
    count(*) FILTER (WHERE indexname = 'idx_notification_messages_request_status'     ) = 1 AS idx22,
    count(*) FILTER (WHERE indexname = 'idx_notification_outbox_worker_poll'          ) = 1 AS idx23,
    -- imports
    count(*) FILTER (WHERE indexname = 'idx_import_rows_job_validation'               ) = 1 AS idx24,
    count(*) FILTER (WHERE indexname = 'idx_import_errors_job_severity'               ) = 1 AS idx25,
    count(*) FILTER (WHERE indexname = 'idx_import_jobs_status_created_desc'          ) = 1 AS idx26,
    -- audit
    count(*) FILTER (WHERE indexname = 'idx_audit_logs_entity_timeline'               ) = 1 AS idx27,
    count(*) FILTER (WHERE indexname = 'idx_log_events_aggregate_time'                ) = 1 AS idx28,
    -- registry
    count(*) FILTER (WHERE indexname = 'idx_taxpayers_status_created'                 ) = 1 AS idx29,
    -- identity
    count(*) FILTER (WHERE indexname = 'idx_staff_role_assignments_active'            ) = 1 AS idx30,
    -- masterdata
    count(*) FILTER (WHERE indexname = 'idx_property_ownership_records_taxpayer'      ) = 1 AS idx31,
    count(*) FILTER (WHERE indexname = 'idx_commercial_activities_category'           ) = 1 AS idx32,
    -- content
    count(*) FILTER (WHERE indexname = 'idx_content_pages_status_published'           ) = 1 AS idx33,
    count(*) FILTER (WHERE indexname = 'idx_announcements_active_window'              ) = 1 AS idx34,
    -- history tables
    count(*) FILTER (WHERE indexname = 'idx_request_assignment_histories_timeline'    ) = 1 AS idx35,
    count(*) FILTER (WHERE indexname = 'idx_request_status_histories_timeline'        ) = 1 AS idx36,
    count(*) FILTER (WHERE indexname = 'idx_request_selected_activities_agg'          ) = 1 AS idx37,
    count(*) FILTER (WHERE indexname = 'idx_field_visits_visit_schedule_range'        ) = 1 AS idx38
  FROM pg_catalog.pg_indexes
),
duplicate_index_check AS (
  SELECT count(*) > 0 AS has_duplicates
  FROM (
    SELECT indexname, count(*) AS cnt
    FROM pg_catalog.pg_indexes
    GROUP BY indexname
    HAVING count(*) > 1
  ) d
)
SELECT
  c.assignee_id_present,
  c.scheduled_at_present,
  c.team_lead_id_present,
  r.idx01, r.idx02, r.idx03, r.idx04, r.idx05,
  r.idx06, r.idx07, r.idx08, r.idx09, r.idx10,
  r.idx11, r.idx12, r.idx13, r.idx14, r.idx15,
  r.idx16, r.idx17, r.idx18, r.idx19, r.idx20,
  r.idx21, r.idx22, r.idx23, r.idx24, r.idx25,
  r.idx26, r.idx27, r.idx28, r.idx29, r.idx30,
  r.idx31, r.idx32, r.idx33, r.idx34, r.idx35,
  r.idx36, r.idx37, r.idx38,
  d.has_duplicates,
  CASE
    WHEN c.assignee_id_present
      AND c.scheduled_at_present
      AND c.team_lead_id_present
      AND r.idx01 AND r.idx02 AND r.idx03 AND r.idx04 AND r.idx05
      AND r.idx06 AND r.idx07 AND r.idx08 AND r.idx09 AND r.idx10
      AND r.idx11 AND r.idx12 AND r.idx13 AND r.idx14 AND r.idx15
      AND r.idx16 AND r.idx17 AND r.idx18 AND r.idx19 AND r.idx20
      AND r.idx21 AND r.idx22 AND r.idx23 AND r.idx24 AND r.idx25
      AND r.idx26 AND r.idx27 AND r.idx28 AND r.idx29 AND r.idx30
      AND r.idx31 AND r.idx32 AND r.idx33 AND r.idx34 AND r.idx35
      AND r.idx36 AND r.idx37
      AND NOT d.has_duplicates
    THEN 'PASS'
    ELSE 'FAIL'
  END AS final_status
FROM column_presence c
CROSS JOIN required_indexes r
CROSS JOIN duplicate_index_check d;