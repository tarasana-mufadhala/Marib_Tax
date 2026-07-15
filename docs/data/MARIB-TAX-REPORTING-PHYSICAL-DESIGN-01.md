# MARIB-TAX-REPORTING-PHYSICAL-DESIGN-01

**Document ID:** MARIB-TAX-REPORTING-PHYSICAL-DESIGN-01
**Status:** PROPOSED reporting physical design (documentation only)
**Companions:** `MARIB-TAX-REPORT-DATA-TRACEABILITY-01`, `MARIB-TAX-REPORTS-BASELINE-01`, `MARIB-TAX-PHYSICAL-TABLE-CATALOG-01`, `MARIB-TAX-INDEX-QUERY-ACCESS-PLAN-01`, `MARIB-TAX-HISTORY-EVENT-AUDIT-PHYSICAL-DESIGN-01`

> Unresolved items are **يحتاج اعتماد لاحق**. Recommendations are **PROPOSED** only. No executable SQL. No secrets.
> Analytical reports **4–29** each appear **once**. Reporting schema objects are **read-only / non-authoritative** for business outcomes.

## 1. Hard rules

| Rule | Requirement |
| --- | --- |
| Source of truth | Authoritative state lives in owning module tables (`requests`, `balaghat`, `visits`, `dues`, etc.). Reporting never mutates business aggregates. |
| Read-only reporting | NestJS Reporting and Analytics reads authorized projections/views; workers may refresh derived stores only. |
| Non-authoritative projections | Views, matviews, and `reporting.*` projections may lag and must be rebuildable from authoritative history + domain-event evidence (domain events enroll in TABLE-094; curated analytics history is TABLE-090). |
| Permissions | Separate `report.view` and `report.export`; export creates `reporting.report_export_records` (TABLE-093). |
| Masking | Report Reader receives masked phone/tax/sensitive fields where configured (DM-16 **يحتاج اعتماد لاحق**). |
| Payment model | Manual dues only; payment confirmation is not final case approval; Due–Receipt cardinality **يحتاج اعتماد لاحق** (DM-22). |
| Report 29 | Conditional only when an **approved** analytics tool is connected (FCR-03). **No** analytics provider is invented here. |

## 2. Shared reporting physical posture (**PROPOSED**)

| Concern | PROPOSED stance |
| --- | --- |
| Authoritative reads | Prefer status/history/decision/evidence tables over collapsing current-state only. |
| Derived view | Thin SQL **VIEW** when join/filter is stable and volume is moderate. |
| Materialized view / projection | Matview or projection table only when justified by repeated heavy aggregates (volume reports, SLA boards, storage rollups). Freshness **يحتاج اعتماد لاحق** (DM-15). |
| Domain event outbox | Authoritative enrollment of all **56** catalogued domain events is TABLE-094 `audit.domain_event_outbox` (infrastructure; not reporting SoT). |
| Domain event history | Optional curated analytics feed via TABLE-090 `reporting.domain_event_history_records` (56 catalogued events projected from TABLE-094 / module histories); never sole SoT. |
| Projection definitions | TABLE-091 `reporting.reporting_projection_definitions` versions rebuild recipes. |
| Saved filters | TABLE-092 `reporting.saved_report_filters` (preference only; BASELINE_PROPOSED). |
| Export evidence | TABLE-093 `report_export_records` for every export attempt (BASELINE_PROPOSED). |
| Indexes | Prefer report-path candidates from index plan section 17 (`IX-RPT-*`, `IX-CASE-RPT-SLA-01`, `IX-VISIT-RPT-01`, `IX-DUE-RPT-01`, `IX-IMP-RPT-01`) plus family-specific history indexes. |
| Refresh | On-demand NestJS query (default MVP) or scheduled rebuild jobs when matviews adopted; scheduling delivery of reports is future (DMOD-12 / FCR-01). |
| Rebuildability | Full rebuild from authoritative tables + append-only histories; reconcile against TABLE-090 and/or TABLE-094 event evidence when enabled. |

### Shared filters (physical binding)

| Filter | Typical physical binding |
| --- | --- |
| From / to date | `submitted_at` / `decided_at` / `scheduled_at` / `issued_at` / `created_at` / `exported_at` as applicable |
| Transaction type | Discriminator request vs balagh (parallel families; never a table named `cases`) |
| Service | `requests.service_types` / service type on request or balagh type |
| Status | Current `status_code` + history for transitions |
| Taxpayer / legal entity / activity / area | Registry, legal, masterdata joins; geo grain **يحتاج اعتماد لاحق** (DMOD-05) |
| Assigned employee | Assignment history → `identity.staff_profiles` |
| Visit / dues existence | Presence of `visits.field_visits` / `dues.payment_dues` for case refs |
| Channel / reference / tax / phone | Notify channel; `public_ref`; `legal.tax_numbers`; contacts (masked) |

---

## 3. Report catalogue physical mapping (reports 4–29)

Each row maps **one** report once.

### Report 4 — الطلبات المرفوضة والملغاة

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `requests.service_requests` (TABLE-024); `requests.request_decision_records` (TABLE-033); `requests.request_close_archive_records` (TABLE-035); `requests.service_types` (TABLE-023) |
| **History / evidence** | `request_status_histories` (TABLE-029); `request_decision_revisions` (TABLE-034); `request_assignment_histories` (TABLE-030) |
| **Views / matviews** | **PROPOSED** thin VIEW joining current rejected/closed rows to latest decision/close reason. Matview only if rejection-volume dashboards prove hot (**يحتاج اعتماد لاحق**). |
| **Primary filters** | Decision/close date; service; status; deciding staff; structured reason |
| **Index candidates** | `IX-REQ-STATUS-01`; `IX-REQ-STATHIST-01`; `IX-DEC-ACTOR-01`; `IX-CASE-RPT-SLA-01` |
| **Masking** | Taxpayer name/phone masked for Report Reader; decision basis may be restricted (DM-07) |
| **Export restrictions** | `report.export` required; reason catalogs completeness **يحتاج اعتماد لاحق** (DMOD-04); draft-deletion treatment **يحتاج اعتماد لاحق** (DMOD-06) — taxpayer cancel after submit remains prohibited |
| **Refresh / rebuild** | Live query preferred; rebuild from status + decision + close/archive histories |
| **Source of truth** | Request decision/close/archive records and status history — not reporting projections |

### Report 5 — طلبات استكمال النواقص

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `request_completion_requests` (TABLE-031); `request_completion_responses` (TABLE-032); `service_requests` (TABLE-024); `files.attachment_links` (TABLE-064) |
| **History / evidence** | Status/assignment histories; attachment version histories when docs rejected |
| **Views / matviews** | **PROPOSED** VIEW of open NMI cycles (pending response). Matview not required for MVP. |
| **Primary filters** | Requested/response date; service; assignee; document/classification type |
| **Index candidates** | `IX-REQ-NMI-OPEN-01`; `IX-NMI-QUEUE-01`; `IX-REQ-ASSIGN-STAFF-01` |
| **Masking** | Taxpayer identifiers masked; attachment content never inlined in report rows |
| **Export restrictions** | Export lists metadata/reasons only; no private file bytes |
| **Refresh / rebuild** | Live from completion cycle tables |
| **Source of truth** | Completion request/response rows |

### Report 6 — البلاغات حسب النوع

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `balaghat.balaghs` (TABLE-037); `balagh_selected_activities` (TABLE-038); `balagh_selected_branches` (TABLE-039) |
| **History / evidence** | `balagh_status_histories` (TABLE-042); assignment histories (TABLE-043) |
| **Views / matviews** | **PROPOSED** aggregate VIEW or matview by balagh type × status for volume charts if query cost warrants (DM-15 **يحتاج اعتماد لاحق**) |
| **Primary filters** | Date; balagh type; status; visit-required flag |
| **Index candidates** | `IX-BAL-STATUS-01`; `IX-BAL-STATHIST-01`; `IX-BAL-SEL-ACT-01`; `IX-CASE-RPT-SLA-01` |
| **Masking** | Taxpayer/contact masking; team details limited |
| **Export restrictions** | `report.export`; type taxonomy must match FR-201…206 catalogues |
| **Refresh / rebuild** | Live or scheduled aggregate refresh |
| **Source of truth** | Balagh root + selections + status history |

### Report 7 — نتائج البلاغات

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `balagh_decision_records` (TABLE-046); `balaghs` (TABLE-037); reopen/close records (TABLE-048, TABLE-049) |
| **History / evidence** | `balagh_decision_revisions` (TABLE-047); `balagh_status_histories` (TABLE-042); ownership records when FR-205 transfer effects apply (TABLE-020 / TABLE-022) |
| **Views / matviews** | **PROPOSED** VIEW outcome × type; no matview unless manager dashboards demand it |
| **Primary filters** | Decision date; type; outcome; deciding employee |
| **Index candidates** | `IX-DEC-ACTOR-01`; `IX-BAL-STATUS-01`; `IX-OWN-HIST-01` (transfer effects) |
| **Masking** | Restricted basis fields per DM-07; seller/buyer highly sensitive |
| **Export restrictions** | Restricted decision fields may be omitted from CSV/Excel unless elevated permission |
| **Refresh / rebuild** | Rebuild from decision + revision + status history |
| **Source of truth** | Balagh decision family (not payment, not reporting) |

### Report 8 — الأنشطة الموقوفة والمفعلة

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `masterdata.commercial_activities` (TABLE-014); `properties` / `property_units` (TABLE-018/019); `property_ownership_records` (TABLE-020) |
| **History / evidence** | `activity_status_histories` (TABLE-017); `property_ownership_histories` (TABLE-022); optional `property_ownership_units` (TABLE-021) if adopted |
| **Views / matviews** | Use derived VIEW `masterdata.v_taxpayer_properties` for taxpayer↔property context only (non-authoritative). Status timeline VIEW from TABLE-017. |
| **Primary filters** | Stop/reactivate date; temporary/final; taxpayer; area |
| **Index candidates** | `IX-ACT-STATHIST-01`; `IX-OWN-ACTIVE-TAX-01`; `IX-OWN-HIST-01` |
| **Masking** | Tax number / phone masked; ownership parties highly sensitive |
| **Export restrictions** | Unit-grain ownership columns only if TABLE-021 adopted (**PROPOSED/open**) |
| **Refresh / rebuild** | From activity status history after authorized effects |
| **Source of truth** | Activity + status history; ownership records for party context |

### Report 9 — مواعيد النزول الميداني

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `visits.field_visits` (TABLE-050); `visit_schedules` (TABLE-051); `visit_team_members` (TABLE-052); `identity.staff_profiles` (TABLE-002) |
| **History / evidence** | Schedule revision audit via visit/schedule change evidence; case refs to request/balagh |
| **Views / matviews** | **PROPOSED** operational VIEW “today/week/overdue”; matview optional for large boards |
| **Primary filters** | Schedule date; officer; visit status; request/balagh type |
| **Index candidates** | `IX-VISIT-SCHED-01`; `IX-VISIT-TEAM-01`; `IX-VISIT-CASE-01` |
| **Masking** | Team roster masking per DM-08 **يحتاج اعتماد لاحق** |
| **Export restrictions** | Address detail may require elevated role |
| **Refresh / rebuild** | Live schedule tables |
| **Source of truth** | Field visit + schedule + team membership |

### Report 10 — نتائج الزيارات

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `visit_results` (TABLE-053); `field_visits` (TABLE-050); `visit_evidences` (TABLE-055) |
| **History / evidence** | `visit_result_corrections` (TABLE-054); attachment links for evidence metadata |
| **Views / matviews** | Thin VIEW of latest result per visit (corrections additive) |
| **Primary filters** | Completion date; officer; result code; case type |
| **Index candidates** | `IX-VISIT-RPT-01`; `IX-VISIT-TEAM-01` |
| **Masking** | Evidence paths never authorize download; photos not embedded |
| **Export restrictions** | Notes may be truncated; correction authority **يحتاج اعتماد لاحق** (DMOD-15) |
| **Refresh / rebuild** | Latest result + correction lineage |
| **Source of truth** | Visit result family |

### Report 11 — أداء النزول الميداني

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | Same visit family as reports 9–10 (TABLE-050…054) |
| **History / evidence** | Schedules (on-time/delay), results, assignment of team members |
| **Views / matviews** | **PROPOSED** matview or projection for per-officer aggregates (visits/employee, on-time rate) — justified by repeated aggregation; freshness DM-15 **يحتاج اعتماد لاحق** |
| **Primary filters** | Period; officer; team |
| **Index candidates** | `IX-VISIT-SCHED-01`; `IX-VISIT-RPT-01`; `IX-VISIT-TEAM-01` |
| **Masking** | Officer identifiers per staff purpose policy |
| **Export restrictions** | Productivity exports audited via TABLE-093 |
| **Refresh / rebuild** | Rebuild aggregates from schedules + results; never write back to visits |
| **Source of truth** | Visit operational tables; aggregates are derived |

### Report 12 — المكلفون الجدد

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `registry.taxpayers` (TABLE-008); `taxpayer_contacts` (TABLE-009); `taxpayer_account_links` (TABLE-010); `legal.tax_numbers` (TABLE-013) |
| **History / evidence** | Registration channel/time; account-link grant evidence; tax-number issuance lineage |
| **Views / matviews** | Thin VIEW “registered in period”; no matview required for MVP |
| **Primary filters** | Registration date; channel; legal entity; area when organized |
| **Index candidates** | Taxpayer created-at path (deploy with late indexes); `IX-LINK-ACTIVE-01`; association indexes |
| **Masking** | Phone/tax highly sensitive — mask for Report Reader |
| **Export restrictions** | Full contact export requires elevated + audited export |
| **Refresh / rebuild** | Live registry/legal |
| **Source of truth** | Taxpayer registry + legal tax numbers |

### Report 13 — قاعدة المكلفين

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `taxpayers` (TABLE-008); `legal_entities` (TABLE-012); `tax_numbers` (TABLE-013); activities/branches (TABLE-014/015); `property_ownership_records` (TABLE-020) |
| **History / evidence** | Ownership histories for association quality; account links for linkage state |
| **Views / matviews** | **PROPOSED** use `v_taxpayer_properties` for property association counts; optional matview for base census if large |
| **Primary filters** | Status; entity; dues-existence flag; activity count |
| **Index candidates** | `IX-OWN-ACTIVE-TAX-01`; `IX-ASSOC-TAX-01`; `IX-DUE-TAX-UNPAID-01` (dues flag) |
| **Masking** | Names/phones/tax masked; ownership parties restricted |
| **Export restrictions** | Bulk base export is Highly Sensitive / Audit Restricted posture |
| **Refresh / rebuild** | Derived counts rebuildable; ownership grain OPEN (TABLE-021) |
| **Source of truth** | Registry/legal/masterdata ownership — Taxpayer↔Property is **derived** only (DM-24) |

### Report 14 — الأنشطة التجارية

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `commercial_activities` (TABLE-014); `branches` (TABLE-015); `activity_addresses` (TABLE-016) |
| **History / evidence** | `activity_status_histories` (TABLE-017) |
| **Views / matviews** | Aggregate VIEW by type/status/area; matview optional |
| **Primary filters** | Type; status; area |
| **Index candidates** | `IX-ACT-STATHIST-01`; `IX-ACT-BRANCH-01` |
| **Masking** | Address detail may be masked on export |
| **Export restrictions** | Geo structure completeness **يحتاج اعتماد لاحق** (DMOD-05) |
| **Refresh / rebuild** | From activity master + history |
| **Source of truth** | Activities and Branches module tables |

### Report 15 — الكيانات القانونية

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `legal.legal_entities` (TABLE-012); `registry.taxpayer_legal_entity_associations` (TABLE-011); `taxpayers` (TABLE-008) |
| **History / evidence** | Association effective-dating; entity archive lineage |
| **Views / matviews** | Thin classification VIEW by entity type |
| **Primary filters** | Entity type; status |
| **Index candidates** | `IX-ASSOC-TAX-01` |
| **Masking** | Linked taxpayer identifiers masked in staff-wide exports |
| **Export restrictions** | Classification catalogues must match Legal module codes |
| **Refresh / rebuild** | Live legal + association |
| **Source of truth** | Legal Entities owns entity/tax number; Registry owns association only |

### Report 16 — المعاملات المتوقفة بسبب السداد

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `dues.payment_dues` (TABLE-056); `due_basis_document_references` (TABLE-057); `payment_notices` (TABLE-059); `payment_receipts` (TABLE-060); `payment_confirmations` (TABLE-062); linked `service_requests` / `balaghs` status |
| **History / evidence** | `due_corrections` (TABLE-058); `receipt_correction_replacements` (TABLE-061) |
| **Views / matviews** | **PROPOSED** VIEW of open/unpaid dues with latest notice age. **No** fixed due↔receipt FK join shape until DM-22 resolved — join via approved application allocation rules only. |
| **Primary filters** | Notice/due date; payment status; amount range |
| **Index candidates** | `IX-DUE-UNPAID-01`; `IX-DUE-NOTICE-01`; `IX-DUE-RPT-01`; receipt indexes must not assume 1:1 |
| **Masking** | Amounts/taxpayer masked for general Report Reader as configured |
| **Export restrictions** | Confirmation ≠ final approval must remain visible in metadata; partial-payment semantics **يحتاج اعتماد لاحق** |
| **Refresh / rebuild** | From dues family + case status; rebuild without inventing allocation table |
| **Source of truth** | Dues and Payment Evidence tables; cardinality open (no `due_receipt_links` TABLE) |

### Report 17 — رسائل SMS وواتساب

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `notify.notification_messages` (TABLE-066); `delivery_attempts` (TABLE-067); `delivery_retries` (TABLE-068); `notification_templates` (TABLE-069); `notification_channel_configurations` (TABLE-070) |
| **History / evidence** | Attempt/retry append-only rows |
| **Views / matviews** | Aggregate VIEW by channel × status; WhatsApp = readiness/future until enabled (FCR-02) |
| **Primary filters** | Date; channel; delivery status; notification type |
| **Index candidates** | `IX-NOTIF-CASE-01`; `IX-NOTIF-ATTEMPT-01`; `IX-NOTIF-OUTBOX-01` |
| **Masking** | Destination addresses masked; OTP content minimized (DM-11) |
| **Export restrictions** | No provider secrets; cost estimates non-authoritative if present |
| **Refresh / rebuild** | From message + attempt tables |
| **Source of truth** | Notification Delivery module |

### Report 18 — رموز التحقق OTP

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `audit.access_security_events` (TABLE-089); related `notification_messages` / `delivery_attempts` for OTP channel sends |
| **History / evidence** | Access/security event append-only; delivery attempts |
| **Views / matviews** | Restricted VIEW for security ops; prefer no broad matview of raw OTP destinations |
| **Primary filters** | Date; channel; outcome |
| **Index candidates** | Access/security event time/outcome indexes (deploy with audit late indexes); `IX-NOTIF-ATTEMPT-01` |
| **Masking** | Phone/OTP codes never exported in clear; minimize PII in projections |
| **Export restrictions** | Audit Restricted; `report.export` + elevated security permission |
| **Refresh / rebuild** | From access_security_events (+ notify evidence) |
| **Source of truth** | Access/security events; notifications only as delivery evidence |

### Report 19 — الإشعارات غير المقروءة

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `notification_messages` (TABLE-066); `notification_read_states` (TABLE-071) |
| **History / evidence** | Delivery attempts prove delivery ≠ read; first-read timestamp on read state when available |
| **Views / matviews** | **PROPOSED** VIEW unread by recipient (read_status unread); matview optional for aging queues |
| **Primary filters** | Date; type; taxpayer/recipient |
| **Index candidates** | `IX-NOTIF-READ-01` |
| **Masking** | Recipient contact masked |
| **Export restrictions** | Read-definition channels retention **يحتاج اعتماد لاحق** (DM-25) |
| **Refresh / rebuild** | From read-state table |
| **Source of truth** | Notification Read State (not delivery status alone) |

### Report 20 — المستندات الناقصة أو المرفوضة

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `files.attachments` (TABLE-063); `attachment_links` (TABLE-064); completion requests (TABLE-031/044); `visit_evidences` (TABLE-055) |
| **History / evidence** | `attachment_version_histories` (TABLE-065); classification columns on attachments |
| **Views / matviews** | VIEW of missing/rejected document reasons by service |
| **Primary filters** | Date; service; rejection reason |
| **Index candidates** | Attachment link owner-type/parent path; NMI indexes |
| **Masking** | Filenames may leak PII — mask/redact on export as configured |
| **Export restrictions** | No storage bytes; reference ≠ download grant |
| **Refresh / rebuild** | From attachments + links + completion cycles |
| **Source of truth** | Attachments metadata + owning transaction links |

### Report 21 — التخزين والمرفقات

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `files.attachments` (TABLE-063); `attachment_links` (TABLE-064); `attachment_version_histories` (TABLE-065) |
| **History / evidence** | Version/replacement lineage; storage status / deletion/retention status columns |
| **Views / matviews** | **PROPOSED** matview or projection for storage rollups (count, logical bytes by service/category) — justified by aggregation over Very High growth table; metrics source DM-26 **يحتاج اعتماد لاحق** |
| **Primary filters** | Date; service; size/category |
| **Index candidates** | Storage status/category paths (late indexes); link owner paths |
| **Masking** | Object keys treated as sensitive locators |
| **Export restrictions** | Accounting exports audited; retention periods **يحتاج اعتماد لاحق** (DMOD-09) |
| **Refresh / rebuild** | Rebuild from attachment logical sizes + status; Storage platform bytes are supporting, not app SoT |
| **Source of truth** | Application attachment metadata (logical size, classification, version, storage status) |

### Report 22 — عمليات الاستيراد

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `imports.import_batches` (TABLE-073); `import_previews` (TABLE-074); `import_validation_results` (TABLE-075); `import_approvals` (TABLE-078); `import_rejections` (TABLE-079); `import_failures` (TABLE-080); `import_commits` (TABLE-081) |
| **History / evidence** | Full lifecycle retained as separate outcome records |
| **Views / matviews** | Thin VIEW batch list with outcome; matview not required |
| **Primary filters** | Import date; operator; status |
| **Index candidates** | `IX-IMP-BATCH-01`; `IX-IMP-RPT-01`; `IX-IMP-IDEM-01` |
| **Masking** | Source filenames may be sensitive; row dumps excluded |
| **Export restrictions** | Audit Restricted posture; two-person approval policy **يحتاج اعتماد لاحق** (DMOD-13) |
| **Refresh / rebuild** | From import lifecycle tables |
| **Source of truth** | Imports module batch/outcome family |

### Report 23 — أخطاء الاستيراد

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `import_errors` (TABLE-077); `import_row_results` (TABLE-076); parent `import_batches` (TABLE-073) |
| **History / evidence** | Row disposition retained; error catalogue |
| **Views / matviews** | VIEW errors by batch/field; downloadable error file is Storage object mediated by NestJS |
| **Primary filters** | Date; batch; field |
| **Index candidates** | `IX-IMP-ERR-BATCH-01`; `IX-IMP-ROW-DISP-01` |
| **Masking** | Invalid values may contain PII — mask on general export |
| **Export restrictions** | Error file download audited; no full rejected-row dumps in domain events |
| **Refresh / rebuild** | From error/row result tables |
| **Source of truth** | Import error and row result records |

### Report 24 — جودة البيانات

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `taxpayers` / contacts / `tax_numbers`; activities/branches/addresses/properties; ownership records; import validation/errors |
| **History / evidence** | Import validation results; ownership histories; post-import change audits |
| **Views / matviews** | **PROPOSED** quality-check VIEWs (duplicate phone candidates, missing tax number, activities without address, orphan attachment links). Matview optional for scheduled quality runs. Duplicate uniqueness rules **يحتاج اعتماد لاحق** (DM-04/DM-23). |
| **Primary filters** | Date; quality category |
| **Index candidates** | Ownership/active link indexes; import validation indexes; contact/tax lookup paths (not auth indexes) |
| **Masking** | Duplicate-phone displays must mask values for Report Reader |
| **Export restrictions** | Highly Sensitive bulk quality extracts audited |
| **Refresh / rebuild** | Recompute from masters + import evidence; property association via ownership (DM-24) |
| **Source of truth** | Master/registry/legal/import tables — quality flags are derived |

### Report 25 — سجل التدقيق

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `audit.audit_events` (TABLE-087); `identity.user_profiles` / `staff_profiles`; `role_assignments` / `sensitive_permission_changes` (TABLE-005/007) |
| **History / evidence** | Append-only audit events with embedded Actor Context; permission-change evidence |
| **Views / matviews** | Restricted VIEW only; avoid materializing unmasked before/after globally |
| **Primary filters** | Date; actor; operation/target |
| **Index candidates** | `IX-AUDIT-CORR-01`; `IX-AUDIT-TARGET-01`; `IX-AUDIT-ACTOR-01` |
| **Masking** | Highly sensitive fields masked; device/IP only at approved logical level |
| **Export restrictions** | Audit Restricted; separate export permission; before/after policy **يحتاج اعتماد لاحق** (DM-13) |
| **Refresh / rebuild** | Append-only; projections rebuild from audit_events |
| **Source of truth** | `audit.audit_events` (+ identity evidence tables) |

### Report 26 — العمليات الحساسة

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `audit.sensitive_change_details` (TABLE-088); parent `audit_events` (TABLE-087); decision revisions; due/receipt/visit corrections; import approvals/commits; `report_export_records` (TABLE-093); `sensitive_permission_changes` (TABLE-007) |
| **History / evidence** | Previous/new masked values; correlation identifiers |
| **Views / matviews** | Restricted VIEW joining sensitive details to actor context |
| **Primary filters** | Date; operation family; actor |
| **Index candidates** | `IX-SENS-AUDIT-01`; `IX-AUDIT-CORR-01`; `IX-RPT-EXPORT-01` |
| **Masking** | Prefer `previous_value_masked` / `new_value_masked`; raw storage restricted |
| **Export restrictions** | Audit Restricted; threshold catalogue **يحتاج اعتماد لاحق** |
| **Refresh / rebuild** | From sensitive_change_details + correlated evidence |
| **Source of truth** | Sensitive change detail + originating module evidence |

### Report 27 — الدخول والأمان

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `audit.access_security_events` (TABLE-089); `identity.user_profiles` / `staff_profiles`; `taxpayer_account_links` (TABLE-010); `sensitive_permission_changes` (TABLE-007); Auth identity referenced via `auth.users` (managed) |
| **History / evidence** | Successful/failed access outcomes; OTP-related security events; permission changes |
| **Views / matviews** | Restricted security VIEW; no public matview |
| **Primary filters** | Date; outcome; account |
| **Index candidates** | Access event time/outcome; actor correlation indexes |
| **Masking** | Mask phone/account identifiers; minimize client context (DM-18) |
| **Export restrictions** | Audit Restricted; login retention policy **يحتاج اعتماد لاحق** |
| **Refresh / rebuild** | From access_security_events |
| **Source of truth** | Access/security events (Auth platform for credential material — not reported as app tables) |

### Report 28 — المحتوى المنشور

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | `content.content_items` (TABLE-082); `content_revisions` (TABLE-083); `publication_records` (TABLE-084); `withdrawal_records` (TABLE-085); `announcement_validity_periods` (TABLE-086) |
| **History / evidence** | Revision + publication/withdrawal lineage |
| **Views / matviews** | VIEW of published/active/expired announcements |
| **Primary filters** | Date; content type; status |
| **Index candidates** | `IX-CONTENT-PUB-01`; `IX-CONTENT-VALID-01`; `IX-CONTENT-WITHDRAW-01` |
| **Masking** | Internal drafts not exposed to public report consumers |
| **Export restrictions** | Publication approval flow **يحتاج اعتماد لاحق** (DMOD-10) |
| **Refresh / rebuild** | From content family |
| **Source of truth** | Content Management tables |

### Report 29 — استخدام الموقع (conditional analytics)

| Aspect | Mapping |
| --- | --- |
| **Authoritative tables** | **None invented.** Conditional external approved analytics source only when connected (FCR-03). Optional correlating context: `content.content_items` (TABLE-082) for published pages/forms metadata. |
| **History / evidence** | Provider-owned analytics history when approved; app does not fabricate visit streams |
| **Views / matviews** | **No** application matview of website traffic unless an approved integration defines a non-authoritative import landing area later (out of scope here) |
| **Primary filters** | Date; page; device — **only if** provider supplies them |
| **Index candidates** | None for invented traffic tables |
| **Masking** | Consent/minimization **يحتاج اعتماد لاحق** (DM-19) |
| **Export restrictions** | Disabled until approved analytics integration; then `report.view` / `report.export` still apply |
| **Refresh / rebuild** | Provider-defined; application reporting must label data as conditional/non-authoritative for tax outcomes |
| **Source of truth** | Approved analytics tool (when connected); Content items only for content metadata context — **no provider named or assumed** |

---

## 4. Cross-cutting refresh, rebuild, and SoT summary

| Topic | PROPOSED rule |
| --- | --- |
| Default query mode | NestJS authorized read against authoritative tables and thin VIEWs |
| When to add matview/projection | Repeated heavy aggregates (reports 6/11/13/21/24) after measured need; record recipe in TABLE-091 |
| Freshness SLO | **يحتاج اعتماد لاحق** (DM-15) |
| Rebuild | Truncate/rebuild derived objects from histories + roots; reconcile optionally to TABLE-090; domain-event enrollment source is TABLE-094 |
| Reconciliation failure | Stop publishing derived numbers; fall back to authoritative live queries; do not “fix” business tables from projections |
| Export | Always record TABLE-093; masking profile bound to exporter role |
| Scheduling | Manager scheduled delivery is future (DMOD-12 / FCR-01) — not required for this physical design |

## 5. Counts

| Metric | Count |
| --- | ---: |
| Reports mapped (4–29) | **26** |
| Reporting schema tables referenced | **4** (TABLE-090…093) |
| Domain-event outbox (enrollment source) | **1** (TABLE-094) |
| Conditional report (no invented provider) | **1** (Report 29) |

**End of MARIB-TAX-REPORTING-PHYSICAL-DESIGN-01**
