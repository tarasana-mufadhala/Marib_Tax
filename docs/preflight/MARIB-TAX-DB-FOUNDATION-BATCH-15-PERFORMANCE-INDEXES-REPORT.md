# MARIB Tax DB Foundation — Batch 15 Performance Indexes Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_15_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-15 = NOT_STARTED` (requires the governed cycle and independent user approval)

## Artifacts

| Artifact | Path | SHA-256 |
|---|---|---|
| Migration | `supabase/migrations/20260801120000_create_performance_indexes.sql` | `7FC75EB59844EAB66175C0B034EFCB14F9CD33605AE4B4F51C00288D012D6F53` |
| Verifier | `scripts/db/verify/verify_batch_15_performance_indexes.sql` | `25CDC75049B6ECDBEE02617AF5D729E41493DA87CF148E392253052EA343A6AC` |
| Design Gate | `docs/reviews/MARIB-TAX-BATCH-15-PERFORMANCE-INDEXES-DESIGN-DECISION-GATE-01.md` | **PASS — BATCH_15_PERFORMANCE_INDEXES_DESIGN_APPROVED_FOR_SOURCE** |
| Baseline | `origin/main` | Latest |

## Scope and boundaries

The source adds 3 nullable backward-compatible columns and creates 38 composite indexes across these schemas:
- `requests` — service requests, assignment histories, status histories, selected activities
- `visits` — field visits, visit schedules, visit team members
- `balaghat` — balaghs aggregate root and type/status lookups
- `dues` — payment dues, payment receipts
- `files` — attachment metadata and links
- `notify` — notification messages, outbox messages
- `imports` — import jobs, rows, errors
- `audit` — audit logs, domain events
- `registry` — taxpayers
- `identity` — staff role assignments (active partial)
- `masterdata` — property ownership, commercial activities
- `content` — content pages (published), announcements (active window)

### Added columns (all nullable, backward-compatible):
1. `requests.service_requests.assignee_id` — uuid FK → `identity.staff_profiles`
2. `visits.field_visits.scheduled_at` — timestamptz
3. `visits.field_visits.team_lead_id` — uuid FK → `identity.staff_profiles`

### Missing index names (exhaustive):
1. `idx_requests_status_submitted_at` (partial: submitted_at IS NOT NULL)
2. `idx_requests_service_id_assignee_id` (partial: assignee_id IS NOT NULL)
3. `idx_requests_taxpayer_status`
4. `idx_requests_taxpayer_service_type`
5. `idx_requests_public_ref_partial` (partial: public_ref IS NOT NULL)
6. `idx_request_assignment_histories_timeline`
7. `idx_request_status_histories_timeline`
8. `idx_request_selected_activities_agg`
9. `idx_balaghs_status_submitted_at` (partial: submitted_at IS NOT NULL)
10. `idx_balaghs_taxpayer_submitted_at` (partial)
11. `idx_balaghs_public_ref` (partial)
12. `idx_balaghs_type_status`
13. `idx_field_visits_scheduled_at_team_lead` (partial)
14. `idx_field_visits_status_started_at` (partial)
15. `idx_field_visits_staff_status`
16. `idx_visit_schedules_range` (partial)
17. `idx_visit_team_members_visit_staff`
18. `idx_visit_team_members_active_partial` (partial)
19. `idx_payment_dues_status_assessed_at` (partial)
20. `idx_payment_receipts_due_date`
21. `idx_payment_receipts_public_ref` (partial)
22. `idx_attachments_category_created`
23. `idx_attachments_storage_status`
24. `idx_attachment_links_owner_active` (partial)
25. `idx_notification_messages_recipient` (partial)
26. `idx_notification_messages_messages_request_status` (partial)
27. `idx_notification_outbox_worker_poll` (partial)
28. `idx_import_rows_job_validation`
29. `idx_import_errors_job_severity`
30. `idx_import_jobs_status_created_desc`
31. `idx_audit_logs_entity_timeline`
32. `idx_log_events_aggregate_time`
33. `idx_taxpayers_status_created`
34. `idx_staff_role_assignments_active` (partial)
35. `idx_property_ownership_records_taxpayer` (partial)
36. `idx_commercial_activities_category`
37. `idx_content_pages_status_published` (partial)
38. `idx_announcements_active_window` (partial)

No new tables, no seeds, no positive grants, no RLS policy creation. All indexes use `IF NOT EXISTS` for idempotent re-run safety.

## Structural review (source)

- 3 `ALTER TABLE ADD COLUMN` → nullable backward-compatible
- 2 new FK constraints (`NOT VALID`, to avoid blocking)
- 38 `CREATE INDEX IF NOT EXISTS` statements
- All composite indexes cover column pairs used in expected query patterns
- Partial indexes use WHERE clauses to minimize index footprint
- No index duplicates existing single-column indexes (extends them with composite patterns)

## Non-actions

This source report authorizes no apply. It did not apply. Batch 15 anywhere, mutate Storage, seed data, or connect to production. Local execution is pending a running database connection and does not replace the governed production preflight.