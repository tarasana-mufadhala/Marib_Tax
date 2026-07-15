# MARIB-TAX-INDEX-QUERY-ACCESS-PLAN-01

**Document ID:** MARIB-TAX-INDEX-QUERY-ACCESS-PLAN-01
**Status:** PROPOSED physical index/query access plan (documentation only; not executable DDL)
**Companion:** `MARIB-TAX-PHYSICAL-TABLE-CATALOG-01`, `MARIB-TAX-PHYSICAL-COLUMN-CONSTRAINT-CATALOG-01`

> Unresolved items are **يحتاج اعتماد لاحق**. Recommendations are **PROPOSED** only. No camelCase column names.

### Scope and discipline

This plan lists **candidate indexes** aligned to known access paths from the logical data model, workflows, reporting filters, and own-data authorization. It is not a final performance budget.

Rules:

- Index for **observed or specified query shapes**, not every foreign key.
- Prefer composite indexes that match filter + sort needs of a single dominant path.
- Partial / filtered candidates are preferred where lifecycle status dominates.
- Exact fillfactor and concurrency settings remain **يحتاج اعتماد لاحق**.
- Final latency, cardinality, and size thresholds remain **يحتاج اعتماد لاحق**.

Notation: `IX-*` = candidate identifier; `status=CANDIDATE` for every row below.

**Outbox separation:**

- Domain-event outbox indexes → `audit.domain_event_outbox` (**TABLE-094**)
- Notification delivery outbox indexes → `notify.notification_outbox_messages` (**TABLE-072**)

---

## Index candidates (IX-001 … IX-066)

| IX ID | TABLE ID | schema.table | exact ordered columns | include columns | uniqueness | partial predicate | equality/range/order | supported API/report/workflow | selectivity | write-cost | sensitivity | status | validation requirement | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IX-001 | TABLE-024 | requests.service_requests | public_ref | — | UNIQUE NULLS DISTINCT PROPOSED | public_ref IS NOT NULL | equality | Public request number lookup | High | Low | Conf | CANDIDATE | Confirm public_ref issuance rules | DM-01 |
| IX-002 | TABLE-037 | balaghat.balaghs | public_ref | — | UNIQUE NULLS DISTINCT PROPOSED | public_ref IS NOT NULL | equality | Public Balagh number lookup | High | Low | Conf | CANDIDATE | Confirm public_ref issuance rules | DM-01 |
| IX-003 | TABLE-024 | requests.service_requests | status_code, submitted_at DESC | — | non-unique | — | equality + order | Staff request queue by status | Medium | Medium | Conf | CANDIDATE | Status codeset stability | DM-06 |
| IX-004 | TABLE-037 | balaghat.balaghs | status_code, submitted_at DESC | — | non-unique | — | equality + order | Staff Balagh queue by status | Medium | Medium | Conf | CANDIDATE | Status codeset stability | — |
| IX-005 | TABLE-024 | requests.service_requests | taxpayer_id, status_code, submitted_at DESC | — | non-unique | — | equality + order | Own-data request list | High→Medium | Medium | HS | CANDIDATE | Own-data via active Account Link | — |
| IX-006 | TABLE-037 | balaghat.balaghs | taxpayer_id, status_code, submitted_at DESC | — | non-unique | — | equality + order | Own-data Balagh list | High→Medium | Medium | HS | CANDIDATE | Own-data via active Account Link | — |
| IX-007 | TABLE-024 | requests.service_requests | taxpayer_id, service_type_id, submitted_at DESC | — | non-unique | — | equality + order | Taxpayer filter by service type | High→Medium | Medium | HS | CANDIDATE | Service type catalogue | — |
| IX-008 | TABLE-011 | registry.taxpayer_legal_entity_associations | taxpayer_id, effective_from | — | non-unique | effective_to IS NULL | equality | Active legal-entity associations | High | Low | Conf | CANDIDATE | Effective-dating semantics | — |
| IX-009 | TABLE-010 | registry.taxpayer_account_links | user_profile_id | taxpayer_id, verification_status_code | non-unique | active_state_code = 'active' AND effective_to IS NULL | equality | Own-data path: profile → active link → taxpayer | High | Medium | HS | CANDIDATE | Active-state codeset | DM-21 |
| IX-010 | TABLE-010 | registry.taxpayer_account_links | taxpayer_id | user_profile_id, verification_status_code | non-unique | active_state_code = 'active' AND effective_to IS NULL | equality | Reverse active-link lookup (admin/support; audited) | High | Medium | HS | CANDIDATE | Audited access only | DM-21 |
| IX-011 | TABLE-010 | registry.taxpayer_account_links | verification_status_code, effective_from | user_profile_id, taxpayer_id | non-unique | active_state_code = 'active' AND verification_status_code = 'pending' | equality + order | Unverified link operational queue | Medium | Low | Conf | CANDIDATE | Verification codeset | DM-21 |
| IX-012 | TABLE-030 | requests.request_assignment_histories | service_request_id, assigned_at DESC | staff_profile_id, action_code | non-unique | — | equality + order | Latest assignment context for a request | High | Medium | Conf | CANDIDATE | No cross-type history join | — |
| IX-013 | TABLE-043 | balaghat.balagh_assignment_histories | balagh_id, assigned_at DESC | staff_profile_id, action_code | non-unique | — | equality + order | Latest assignment context for a Balagh | High | Medium | Conf | CANDIDATE | No cross-type history join | — |
| IX-014 | TABLE-030 | requests.request_assignment_histories | staff_profile_id, assigned_at DESC | service_request_id | non-unique | action_code IN open/current assignment set PROPOSED | equality + order | Reviewer personal request queue | Medium | Medium | Conf | CANDIDATE | Open/current action codeset | يحتاج اعتماد لاحق |
| IX-015 | TABLE-043 | balaghat.balagh_assignment_histories | staff_profile_id, assigned_at DESC | balagh_id | non-unique | action_code IN open/current assignment set PROPOSED | equality + order | Reviewer personal Balagh queue | Medium | Medium | Conf | CANDIDATE | Open/current action codeset | يحتاج اعتماد لاحق |
| IX-016 | TABLE-029 | requests.request_status_histories | service_request_id, changed_at ASC | from_status_code, to_status_code | non-unique | — | equality + order | Request status timeline | High | Medium (append-only) | Conf | CANDIDATE | Append-only write path | — |
| IX-017 | TABLE-042 | balaghat.balagh_status_histories | balagh_id, changed_at ASC | from_status_code, to_status_code | non-unique | — | equality + order | Balagh status timeline | High | Medium (append-only) | Conf | CANDIDATE | Append-only write path | — |
| IX-018 | TABLE-017 | masterdata.activity_status_histories | commercial_activity_id, changed_at ASC | from_status_code, to_status_code | non-unique | — | equality + order | Activity stop/reactivation lineage | High | Medium (append-only) | Conf | CANDIDATE | Append-only write path | — |
| IX-019 | TABLE-031 | requests.request_completion_requests | service_request_id, requested_at DESC | status_code | non-unique | status_code = 'pending_response' PROPOSED | equality + order | Open need-more-info for a request | High | Low | Conf | CANDIDATE | Pending status code | يحتاج اعتماد لاحق |
| IX-020 | TABLE-044 | balaghat.balagh_completion_requests | balagh_id, requested_at DESC | status_code | non-unique | status_code = 'pending_response' PROPOSED | equality + order | Open need-more-info for a Balagh | High | Low | Conf | CANDIDATE | Pending status code | يحتاج اعتماد لاحق |
| IX-021 | TABLE-031 | requests.request_completion_requests | requested_at ASC | service_request_id, status_code | non-unique | status_code = 'pending_response' PROPOSED | range + order | Staff SLA / aging of unanswered request completion items | Medium | Low | Conf | CANDIDATE | Parallel Balagh queue uses IX-022 | يحتاج اعتماد لاحق |
| IX-022 | TABLE-044 | balaghat.balagh_completion_requests | requested_at ASC | balagh_id, status_code | non-unique | status_code = 'pending_response' PROPOSED | range + order | Staff SLA / aging of unanswered Balagh completion items | Medium | Low | Conf | CANDIDATE | Parallel request queue uses IX-021 | يحتاج اعتماد لاحق |
| IX-023 | TABLE-024 | requests.service_requests | updated_at DESC | status_code, public_ref, taxpayer_id | non-unique | status_code IN recommendation-ready set PROPOSED | order + equality | Manager/director final-approval request queue | Medium | Medium | Conf | CANDIDATE | Ready-status membership | يحتاج اعتماد لاحق |
| IX-024 | TABLE-037 | balaghat.balaghs | updated_at DESC | status_code, public_ref, taxpayer_id | non-unique | status_code IN recommendation-ready set PROPOSED | order + equality | Manager/director final-approval Balagh queue | Medium | Medium | Conf | CANDIDATE | Ready-status membership | يحتاج اعتماد لاحق |
| IX-025 | TABLE-033 | requests.request_decision_records | decided_by_staff_profile_id, decided_at DESC | service_request_id, outcome_code | non-unique | — | equality + order | Manager decision history (requests); Balagh parallel IX-026 | Medium | Low | HS | CANDIDATE | Oversight report authz | — |
| IX-026 | TABLE-046 | balaghat.balagh_decision_records | decided_by_staff_profile_id, decided_at DESC | balagh_id, outcome_code | non-unique | — | equality + order | Manager decision history (Balaghs) | Medium | Low | HS | CANDIDATE | Oversight report authz | — |
| IX-027 | TABLE-025 | requests.request_selected_activities | service_request_id, commercial_activity_id | — | non-unique | — | equality | Selected activities for a request; IR-72 scope checks | High | Low | Conf | CANDIDATE | Selection immutability after submit | — |
| IX-028 | TABLE-026 | requests.request_selected_branches | request_selected_activity_id, branch_id | service_request_id | non-unique | — | equality | Selected branch belongs to selected activity (REL-028) | High | Low | Conf | CANDIDATE | REL-028 integrity | — |
| IX-029 | TABLE-038 | balaghat.balagh_selected_activities | balagh_id, commercial_activity_id | — | non-unique | — | equality | Multi-activity Balagh selection lookup | High | Low | Conf | CANDIDATE | Selection immutability after submit | — |
| IX-030 | TABLE-039 | balaghat.balagh_selected_branches | balagh_selected_activity_id, branch_id | balagh_id | non-unique | — | equality | Selected branch belongs to selected activity (REL-044) | High | Low | Conf | CANDIDATE | REL-044 / IR-72 | — |
| IX-031 | TABLE-015 | masterdata.branches | commercial_activity_id | public_ref, status_code | non-unique | — | equality | List branches under a commercial activity (filter/status via status_code; soft-archive via archived_at at query time) | High | Low | Conf | CANDIDATE | Soft-archive filter optional (archived_at); no is_active column on TABLE-015 | — |
| IX-032 | TABLE-020 | masterdata.property_ownership_records | property_id | taxpayer_id, party_role_code, effective_from | non-unique | is_current = true | equality | Authoritative current owners of a property | High | Medium | HS | CANDIDATE | is_current maintenance | DM-24 |
| IX-033 | TABLE-020 | masterdata.property_ownership_records | taxpayer_id | property_id, party_role_code, effective_from | non-unique | is_current = true | equality | Derived taxpayer→property navigation (feeds VIEW) | High | Medium | HS | CANDIDATE | VIEW v_taxpayer_properties | DM-24 |
| IX-034 | TABLE-022 | masterdata.property_ownership_histories | ownership_record_id, changed_at ASC | change_type_code | non-unique | — | equality + order | Ownership transfer lineage | High | Medium (append-only) | HS | CANDIDATE | Append-only write path | — |
| IX-035 | TABLE-051 | visits.visit_schedules | scheduled_start_at, schedule_status_code | field_visit_id | non-unique | — | range + equality | Daily/weekly field schedule boards | Medium | Medium | Conf | CANDIDATE | Schedule status codeset | — |
| IX-036 | TABLE-050 | visits.field_visits | service_request_id, created_at DESC | status_code, public_ref | non-unique | service_request_id IS NOT NULL | equality + order | Visits linked to a request (XOR case context) | High | Low | Conf | CANDIDATE | Parallel balagh path IX-037 | DMOD-08 |
| IX-037 | TABLE-050 | visits.field_visits | balagh_id, created_at DESC | status_code, public_ref | non-unique | balagh_id IS NOT NULL | equality + order | Visits linked to a Balagh (XOR case context) | High | Low | Conf | CANDIDATE | Parallel request path IX-036 | DMOD-08 |
| IX-038 | TABLE-052 | visits.visit_team_members | staff_profile_id, field_visit_id | effective_from | non-unique | effective_to IS NULL PROPOSED | equality | Officer personal visit list | Medium | Low | Conf | CANDIDATE | Eligibility window | — |
| IX-039 | TABLE-056 | dues.payment_dues | service_request_id, status_code | assessed_at, amount | non-unique | status_code IN unpaid/open set PROPOSED AND service_request_id IS NOT NULL | equality | Case-centric unpaid dues (request) | Medium | Medium | HS | CANDIDATE | No fixed Due–Receipt join shape | DM-09; DM-22 |
| IX-040 | TABLE-056 | dues.payment_dues | balagh_id, status_code | assessed_at, amount | non-unique | status_code IN unpaid/open set PROPOSED AND balagh_id IS NOT NULL | equality | Case-centric unpaid dues (Balagh) | Medium | Medium | HS | CANDIDATE | Taxpayer unpaid view joins via case taxpayer_id | DM-09; DM-22 |
| IX-041 | TABLE-059 | dues.payment_notices | payment_due_id, created_at DESC | public_ref, notice_amount | non-unique | — | equality + order | Notices issued for a due | High | Low | Conf | CANDIDATE | Notice lifecycle | — |
| IX-042 | TABLE-060 | dues.payment_receipts | public_ref | acceptance_status_code, amount | UNIQUE NULLS DISTINCT PROPOSED | public_ref IS NOT NULL | equality | Receipt evidence lookup for confirmation | High | Low | Conf | CANDIDATE | Access-path alignment with UQ-029 (UQ is uniqueness of record; IX not a second unique object); No Due–Receipt FK assumed | DM-22 |
| IX-043 | TABLE-062 | dues.payment_confirmations | payment_receipt_id, created_at DESC | confirmed_by_profile_id, amount_confirmed | non-unique | — | equality + order | Confirmations for a receipt (non-final for case outcome) | High | Low | HS | CANDIDATE | Confirmation ≠ case approval | — |
| IX-044 | TABLE-061 | dues.receipt_correction_replacements | payment_receipt_id, created_at ASC | replaces_receipt_id | non-unique | — | equality + order | Additive receipt correction lineage | High | Low | HS | CANDIDATE | Replacement vs multi-evidence | DM-22 |
| IX-045 | TABLE-072 | notify.notification_outbox_messages | publication_state, next_attempt_at | notification_message_id, attempt_count | non-unique | publication_state IN ('pending','retry') PROPOSED | equality + range | Notification delivery worker poll (TABLE-072 only) | Medium | High (hot path) | Conf | CANDIDATE | Distinct from TABLE-094 | ADR-007 |
| IX-046 | TABLE-066 | notify.notification_messages | service_request_id, created_at DESC | delivery_status_code | non-unique | service_request_id IS NOT NULL | equality + order | Case notification history (request) | Medium | Medium | Conf | CANDIDATE | Parallel balagh IX-047 | — |
| IX-047 | TABLE-066 | notify.notification_messages | balagh_id, created_at DESC | delivery_status_code | non-unique | balagh_id IS NOT NULL | equality + order | Case notification history (Balagh) | Medium | Medium | Conf | CANDIDATE | Parallel request IX-046 | — |
| IX-048 | TABLE-067 | notify.delivery_attempts | notification_message_id, attempt_number | attempt_status_code, attempted_at | non-unique | — | equality + order | Attempt/retry inspection | High | Medium (append-only) | Conf | CANDIDATE | Delivery ≠ read | — |
| IX-049 | TABLE-071 | notify.notification_read_states | recipient_profile_id, read_status_code, notification_message_id | first_read_at | non-unique | — | equality | Recipient unread/read inbox | Medium | Medium | Conf | CANDIDATE | Minimize PII in predicates | DM-25 |
| IX-050 | TABLE-073 | imports.import_batches | status_code, created_at DESC | public_ref, idempotency_key | non-unique | — | equality + order | Operator batch list by lifecycle state | Medium | Medium | Conf | CANDIDATE | Import status codeset | — |
| IX-051 | TABLE-077 | imports.import_errors | import_row_result_id | created_at | non-unique | — | equality | Error drill-down without full row dumps | High | Low | Conf | CANDIDATE | Error taxonomy | DM-12 |
| IX-052 | TABLE-076 | imports.import_row_results | import_batch_id, outcome_code | row_number | non-unique | — | equality | Accepted vs rejected filters for quality reports | Medium | Medium | Conf | CANDIDATE | Outcome codeset (outcome_code on TABLE-076) | — |
| IX-053 | TABLE-073 | imports.import_batches | idempotency_key | status_code, created_at | scoped UNIQUE PROPOSED | idempotency_key IS NOT NULL | equality | Duplicate upload/commit disposition | High | Low | Int | CANDIDATE | Scoped uniqueness | DM-20 |
| IX-054 | TABLE-087 | audit.audit_events | correlation_id, occurred_at ASC | event_category_code, action_code | non-unique | correlation_id IS NOT NULL | equality + order | Reconstruct operation chain across modules | Medium | High (append-only volume) | AR | CANDIDATE | Restricted audit readers | DM-20 |
| IX-055 | TABLE-087 | audit.audit_events | target_type, target_id, occurred_at DESC | action_code, outcome_code | non-unique | target_id IS NOT NULL | equality + order | Entity-centric audit trail (polymorphic target; no FK) | Medium | High | AR | CANDIDATE | Restricted audit readers | DM-13 |
| IX-056 | TABLE-087 | audit.audit_events | actor_user_profile_id, occurred_at DESC | action_code, target_type | non-unique | actor_user_profile_id IS NOT NULL | equality + order | Actor-centric security review | Medium | High | AR | CANDIDATE | Restricted audit readers | DM-13 |
| IX-057 | TABLE-088 | audit.sensitive_change_details | audit_event_id | field_name | non-unique | — | equality | Join before/after detail to parent audit event | High | Low | AR | CANDIDATE | Restricted sensitive detail | DM-13 |
| IX-058 | TABLE-094 | audit.domain_event_outbox | event_id | — | UNIQUE | — | equality | Domain-event outbox dedup / idempotent enrollment (TABLE-094) | High | Low | Int | CANDIDATE | Distinct from TABLE-072 | — |
| IX-059 | TABLE-094 | audit.domain_event_outbox | publication_state, next_attempt_at | event_name, aggregate_id, attempt_count | non-unique | publication_state IN ('pending','retry') PROPOSED | equality + range | Domain-event publication worker poll (TABLE-094) | Medium | High (hot path) | Int | CANDIDATE | Distinct from notification outbox | — |
| IX-060 | TABLE-094 | audit.domain_event_outbox | correlation_id, created_at | event_id, event_name | non-unique | correlation_id IS NOT NULL | equality + order | Correlate outbox rows with audit and notifications | Medium | Medium | Int | CANDIDATE | correlation_id policy | DM-20 |
| IX-061 | TABLE-082 | content.content_items | status_code, updated_at DESC | public_ref, content_type_code | non-unique | status_code = 'published' PROPOSED | equality + order | Published catalog for public site | Medium | Low | Int | CANDIDATE | Publication via TABLE-084 | DMOD-10 |
| IX-062 | TABLE-086 | content.announcement_validity_periods | content_item_id, valid_from, valid_to | — | non-unique | — | equality + range | Time-window validity checks for announcements | High | Low | Int | CANDIDATE | valid_to > valid_from | — |
| IX-063 | TABLE-085 | content.withdrawal_records | content_item_id, withdrawn_at DESC | reason | non-unique | — | equality + order | Withdrawal lineage for reclassification audit | High | Low | Int | CANDIDATE | Withdrawal ≠ erase | — |
| IX-064 | TABLE-092 | reporting.saved_report_filters | user_profile_id, report_key | name, updated_at | non-unique | archived_at IS NULL | equality | User-saved analytical filters (`report.view`) | High | Low | Conf | CANDIDATE | View ≠ export | DM-16 |
| IX-065 | TABLE-093 | reporting.report_export_records | requested_by_user_profile_id, requested_at DESC | projection_definition_id, outcome_code | non-unique | — | equality + order | Export audit trail (`report.export`) | Medium | Low | Conf | CANDIDATE | Separate export authorization | DM-16 |
| IX-066 | TABLE-091 | reporting.reporting_projection_definitions | code | is_active, version_label | UNIQUE | — | equality | Active projection definitions for rebuild jobs | High | Low | Int | CANDIDATE | Rebuild/reconcile strategy | DM-15 |

---

## Additional reporting slice candidates (folded into IX family notes)

The following access paths reuse existing candidates rather than adding new IX IDs:

| Access path | Served by |
| --- | --- |
| Request/Balagh SLA / volume slices `(submitted_at, status_code)` | IX-003 / IX-004 (and taxpayer composites IX-005 / IX-006) |
| Visit outcome reports | IX-036 / IX-037 plus TABLE-053 PK/UQ on `field_visit_id` |
| Dues/payment analytical reports | IX-039 / IX-040 |
| Import quality reports | IX-050 / IX-052 |
| Attachment polymorphic owner lookup `(owner_type, owner_id)` | Not default-indexed beyond case/visit/due paths (see non-candidates) |

---

## Indexes already implied by PK / UQ (not double-counted as IX)

These are **not** included in the IX-001…IX-066 candidate total. They are listed for audit completeness only.

| Constraint ID | TABLE ID | schema.table | columns | Kind |
| --- | --- | --- | --- | --- |
| PK-001…PK-094 | TABLE-001…TABLE-094 | (each table) | id | PK |
| UQ-001 | TABLE-001 | identity.user_profiles | auth_user_id | UNIQUE |
| UQ-002 | TABLE-002 | identity.staff_profiles | user_profile_id | UNIQUE |
| UQ-003 | TABLE-002 | identity.staff_profiles | staff_code | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-004 | TABLE-003 | identity.roles | code | UNIQUE |
| UQ-005 | TABLE-004 | identity.permissions | code | UNIQUE |
| UQ-006 | TABLE-008 | registry.taxpayers | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-007 | TABLE-010 | registry.taxpayer_account_links | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-008 | TABLE-012 | legal.legal_entities | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-009 | TABLE-013 | legal.tax_numbers | tax_number_value | uniqueness يحتاج اعتماد لاحق |
| UQ-010 | TABLE-014 | masterdata.commercial_activities | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-011 | TABLE-015 | masterdata.branches | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-012 | TABLE-018 | masterdata.properties | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-013 | TABLE-019 | masterdata.property_units | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-014 | TABLE-023 | requests.service_types | code | UNIQUE |
| UQ-015 | TABLE-024 | requests.service_requests | public_ref | UNIQUE NULLS DISTINCT PROPOSED (also IX-001 candidate aligns) |
| UQ-016 | TABLE-024 | requests.service_requests | idempotency_key | scoped UNIQUE PROPOSED |
| UQ-017 | TABLE-028 | requests.request_form_snapshot_payloads | request_form_snapshot_id | UNIQUE PROPOSED |
| UQ-018 | TABLE-032 | requests.request_completion_responses | completion_request_id | UNIQUE PROPOSED |
| UQ-019 | TABLE-033 | requests.request_decision_records | service_request_id | UNIQUE PROPOSED |
| UQ-020 | TABLE-037 | balaghat.balaghs | public_ref | UNIQUE NULLS DISTINCT PROPOSED (also IX-002) |
| UQ-021 | TABLE-037 | balaghat.balaghs | idempotency_key | scoped UNIQUE PROPOSED |
| UQ-022 | TABLE-041 | balaghat.balagh_form_snapshot_payloads | balagh_form_snapshot_id | UNIQUE PROPOSED |
| UQ-023 | TABLE-045 | balaghat.balagh_completion_responses | completion_request_id | UNIQUE PROPOSED |
| UQ-024 | TABLE-046 | balaghat.balagh_decision_records | balagh_id | UNIQUE PROPOSED |
| UQ-025 | TABLE-050 | visits.field_visits | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-026 | TABLE-053 | visits.visit_results | field_visit_id | UNIQUE PROPOSED |
| UQ-027 | TABLE-056 | dues.payment_dues | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-028 | TABLE-059 | dues.payment_notices | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-029 | TABLE-060 | dues.payment_receipts | public_ref | UNIQUE NULLS DISTINCT PROPOSED (also IX-042) |
| UQ-030 | TABLE-066 | notify.notification_messages | idempotency_key | scoped UNIQUE PROPOSED |
| UQ-031 | TABLE-069 | notify.notification_templates | code | UNIQUE |
| UQ-032 | TABLE-070 | notify.notification_channel_configurations | channel_code | UNIQUE PROPOSED |
| UQ-033 | TABLE-072 | notify.notification_outbox_messages | idempotency_key | scoped UNIQUE PROPOSED |
| UQ-034 | TABLE-073 | imports.import_batches | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-035 | TABLE-073 | imports.import_batches | idempotency_key | scoped UNIQUE PROPOSED (also IX-053) |
| UQ-036 | TABLE-081 | imports.import_commits | import_batch_id | UNIQUE PROPOSED |
| UQ-037 | TABLE-082 | content.content_items | public_ref | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-038 | TABLE-091 | reporting.reporting_projection_definitions | code | UNIQUE (also IX-066) |
| UQ-039 | TABLE-094 | audit.domain_event_outbox | event_id | UNIQUE (also IX-058) |
| UQ-040 | TABLE-094 | audit.domain_event_outbox | idempotency_key | scoped UNIQUE PROPOSED |
| UQ-C01 | TABLE-006 | identity.role_permissions | role_id, permission_id, effective_from | UNIQUE PROPOSED |
| UQ-C02 | TABLE-021 | masterdata.property_ownership_units | ownership_record_id, property_unit_id | UNIQUE PROPOSED CONDITIONAL |
| UQ-C03 | TABLE-052 | visits.visit_team_members | field_visit_id, staff_profile_id, effective_from | UNIQUE PROPOSED |
| UQ-C04 | TABLE-071 | notify.notification_read_states | notification_message_id, recipient_profile_id | UNIQUE PROPOSED |
| UQ-C05 | TABLE-076 | imports.import_row_results | import_batch_id, row_number | UNIQUE PROPOSED |

Where an IX candidate restates a UQ (IX-001/UQ-015, IX-002/UQ-020, IX-042/UQ-029, IX-053/UQ-035, IX-058/UQ-039, IX-066/UQ-038), the **UQ remains the constraint of record**; the IX row documents the access-path rationale and is counted once in the IX total as a candidate alignment note, not as a second physical index object beyond the UQ.

---

## Explicit non-candidates

The following are **not** proposed as default indexes merely because they are foreign keys:

- Every Attachment Link → Attachment edge beyond case/visit/due access paths; polymorphic `(owner_type, owner_id)` remains application-validated (REL-072).
- Every Role Permission join edge beyond Role Assignment lookup by subject.
- Historical closed assignment rows for all-time assignee scans (use reporting projections if needed).
- Phone number or tax number as primary hot-path authorization indexes.
- Full-text indexes on free-form decision reasons without an approved search requirement.
- GIN on every JSONB snapshot column by default (see GIN count below).

---

## Exact candidate counts

| Metric | Exact count |
| --- | ---: |
| Total index candidates | 66 |
| Unique-index candidates | 6 |
| Partial-index candidates | 33 |
| Covering/include candidates | 54 |
| Expression-index candidates | 0 |
| GIN/JSONB candidates | 0 |
| PK constraints implied (listed separately; not IX) | 94 |
| UQ catalogue entries implied (listed separately; not double-counted as extra IX objects) | 45 |

> **Category overlap:** unique / partial / covering / expression / GIN counts **overlap** and **must not be summed** to derive the total of **66**.

### Unique-index candidates (exact 6)

IX-001, IX-002, IX-042, IX-053, IX-058, IX-066.

### Partial-index candidates (exact 33)

IX-001, IX-002, IX-008, IX-009, IX-010, IX-011, IX-014, IX-015, IX-019, IX-020, IX-021, IX-022, IX-023, IX-024, IX-032, IX-033, IX-036, IX-037, IX-038, IX-039, IX-040, IX-042, IX-045, IX-046, IX-047, IX-053, IX-054, IX-055, IX-056, IX-059, IX-060, IX-061, IX-064.

### Covering/include candidates (exact 54)

All IX rows whose `include columns` cell is not `—`:
IX-009–IX-026, IX-028, IX-030–IX-057, IX-059–IX-061, IX-063–IX-066.

### Expression-index candidates (exact 0)

None proposed.

### GIN/JSONB candidates (exact 0)

None proposed as default indexes. JSONB snapshot/payload columns remain supporting (not sole authoritative state); GIN adoption remains **يحتاج اعتماد لاحق** if an approved search requirement appears.

### Outbox index pointing (exact)

| Outbox | TABLE ID | schema.table | IX IDs |
| --- | --- | --- | --- |
| Domain event outbox | TABLE-094 | audit.domain_event_outbox | IX-058, IX-059, IX-060 |
| Notification delivery outbox | TABLE-072 | notify.notification_outbox_messages | IX-045 |

Deployment consolidation and performance thresholds remain **يحتاج اعتماد لاحق**.
