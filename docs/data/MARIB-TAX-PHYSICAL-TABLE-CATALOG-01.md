# MARIB-TAX-PHYSICAL-TABLE-CATALOG-01

**Document ID:** MARIB-TAX-PHYSICAL-TABLE-CATALOG-01
**Status:** PROPOSED application-owned physical table catalogue (documentation only)
**Companion:** `MARIB-TAX-PHYSICAL-SCHEMA-ARCHITECTURE-01`, `MARIB-TAX-LOGICAL-TO-PHYSICAL-MAPPING-01`

> Unresolved items are **يحتاج اعتماد لاحق**. Recommendations are **PROPOSED** only. No executable SQL. No secrets.
> **Not catalogued as application tables:** `auth.users`, `storage.objects` (Supabase-managed references).
> **Naming convention:** `lowercase_snake_case`, **plural** table names. **No** table named `cases`. Distinguish `request_*` vs `balagh_*`.

## Catalogue summary

| Metric | Value |
| --- | --- |
| TABLE ID range | **TABLE-001 … TABLE-094** |
| Catalogued TABLE IDs | **94** |
| Baseline proposed (`BASELINE_PROPOSED`) | **89** |
| Conditional/open (`CONDITIONAL_OPEN`) | **1** (TABLE-021) |
| Infrastructure (`INFRASTRUCTURE`) | **2** (TABLE-072, TABLE-094) |
| Derived/reporting (`DERIVED_REPORTING`) | **2** (TABLE-090, TABLE-091) |
| Application schemas covered | identity, registry, legal, masterdata, requests, balaghat, visits, dues, files, notify, imports, content, audit, reporting (14) |
| Managed schemas referenced (not in IDs) | auth, storage (2) |

Classification check: 89 + 1 + 2 + 2 = **94**.

### Classification legend

| Class | Meaning |
| --- | --- |
| `BASELINE_PROPOSED` | Application-owned table proposed as baseline physical design for a logical/workflow entity |
| `CONDITIONAL_OPEN` | Catalogued physical table whose adoption remains open (not a final business rule) |
| `DERIVED_REPORTING` | Supporting/derived reporting object; not transactional decision owner |
| `INFRASTRUCTURE` | Worker/outbox/platform plumbing; not a baseline logical business entity |

### Conventions applied in every row

| Field | Meaning |
| --- | --- |
| Mutation owner | NestJS owning module via server-only privileged DB role (never Flutter/Next; never client service-role) |
| RLS requirement | PROPOSED: defense-in-depth policies; **NestJS remains authorization authority**. Exact RLS model **يحتاج اعتماد لاحق** |
| Growth category | Low / Medium / High / Very High (operational expectation) |
| Reports | Whether typically feeds reporting/export pathways |

### Classification of every TABLE ID

| Table ID | schema.name | Class |
| --- | --- | --- |
| TABLE-001 | identity.user_profiles | BASELINE_PROPOSED |
| TABLE-002 | identity.staff_profiles | BASELINE_PROPOSED |
| TABLE-003 | identity.roles | BASELINE_PROPOSED |
| TABLE-004 | identity.permissions | BASELINE_PROPOSED |
| TABLE-005 | identity.role_assignments | BASELINE_PROPOSED |
| TABLE-006 | identity.role_permissions | BASELINE_PROPOSED |
| TABLE-007 | identity.sensitive_permission_changes | BASELINE_PROPOSED |
| TABLE-008 | registry.taxpayers | BASELINE_PROPOSED |
| TABLE-009 | registry.taxpayer_contacts | BASELINE_PROPOSED |
| TABLE-010 | registry.taxpayer_account_links | BASELINE_PROPOSED |
| TABLE-011 | registry.taxpayer_legal_entity_associations | BASELINE_PROPOSED |
| TABLE-012 | legal.legal_entities | BASELINE_PROPOSED |
| TABLE-013 | legal.tax_numbers | BASELINE_PROPOSED |
| TABLE-014 | masterdata.commercial_activities | BASELINE_PROPOSED |
| TABLE-015 | masterdata.branches | BASELINE_PROPOSED |
| TABLE-016 | masterdata.activity_addresses | BASELINE_PROPOSED |
| TABLE-017 | masterdata.activity_status_histories | BASELINE_PROPOSED |
| TABLE-018 | masterdata.properties | BASELINE_PROPOSED |
| TABLE-019 | masterdata.property_units | BASELINE_PROPOSED |
| TABLE-020 | masterdata.property_ownership_records | BASELINE_PROPOSED |
| TABLE-021 | masterdata.property_ownership_units | CONDITIONAL_OPEN |
| TABLE-022 | masterdata.property_ownership_histories | BASELINE_PROPOSED |
| TABLE-023 | requests.service_types | BASELINE_PROPOSED |
| TABLE-024 | requests.service_requests | BASELINE_PROPOSED |
| TABLE-025 | requests.request_selected_activities | BASELINE_PROPOSED |
| TABLE-026 | requests.request_selected_branches | BASELINE_PROPOSED |
| TABLE-027 | requests.request_form_snapshots | BASELINE_PROPOSED |
| TABLE-028 | requests.request_form_snapshot_payloads | BASELINE_PROPOSED |
| TABLE-029 | requests.request_status_histories | BASELINE_PROPOSED |
| TABLE-030 | requests.request_assignment_histories | BASELINE_PROPOSED |
| TABLE-031 | requests.request_completion_requests | BASELINE_PROPOSED |
| TABLE-032 | requests.request_completion_responses | BASELINE_PROPOSED |
| TABLE-033 | requests.request_decision_records | BASELINE_PROPOSED |
| TABLE-034 | requests.request_decision_revisions | BASELINE_PROPOSED |
| TABLE-035 | requests.request_close_archive_records | BASELINE_PROPOSED |
| TABLE-036 | requests.request_reopen_records | BASELINE_PROPOSED |
| TABLE-037 | balaghat.balaghs | BASELINE_PROPOSED |
| TABLE-038 | balaghat.balagh_selected_activities | BASELINE_PROPOSED |
| TABLE-039 | balaghat.balagh_selected_branches | BASELINE_PROPOSED |
| TABLE-040 | balaghat.balagh_form_snapshots | BASELINE_PROPOSED |
| TABLE-041 | balaghat.balagh_form_snapshot_payloads | BASELINE_PROPOSED |
| TABLE-042 | balaghat.balagh_status_histories | BASELINE_PROPOSED |
| TABLE-043 | balaghat.balagh_assignment_histories | BASELINE_PROPOSED |
| TABLE-044 | balaghat.balagh_completion_requests | BASELINE_PROPOSED |
| TABLE-045 | balaghat.balagh_completion_responses | BASELINE_PROPOSED |
| TABLE-046 | balaghat.balagh_decision_records | BASELINE_PROPOSED |
| TABLE-047 | balaghat.balagh_decision_revisions | BASELINE_PROPOSED |
| TABLE-048 | balaghat.balagh_close_archive_records | BASELINE_PROPOSED |
| TABLE-049 | balaghat.balagh_reopen_records | BASELINE_PROPOSED |
| TABLE-050 | visits.field_visits | BASELINE_PROPOSED |
| TABLE-051 | visits.visit_schedules | BASELINE_PROPOSED |
| TABLE-052 | visits.visit_team_members | BASELINE_PROPOSED |
| TABLE-053 | visits.visit_results | BASELINE_PROPOSED |
| TABLE-054 | visits.visit_result_corrections | BASELINE_PROPOSED |
| TABLE-055 | visits.visit_evidences | BASELINE_PROPOSED |
| TABLE-056 | dues.payment_dues | BASELINE_PROPOSED |
| TABLE-057 | dues.due_basis_document_references | BASELINE_PROPOSED |
| TABLE-058 | dues.due_corrections | BASELINE_PROPOSED |
| TABLE-059 | dues.payment_notices | BASELINE_PROPOSED |
| TABLE-060 | dues.payment_receipts | BASELINE_PROPOSED |
| TABLE-061 | dues.receipt_correction_replacements | BASELINE_PROPOSED |
| TABLE-062 | dues.payment_confirmations | BASELINE_PROPOSED |
| TABLE-063 | files.attachments | BASELINE_PROPOSED |
| TABLE-064 | files.attachment_links | BASELINE_PROPOSED |
| TABLE-065 | files.attachment_version_histories | BASELINE_PROPOSED |
| TABLE-066 | notify.notification_messages | BASELINE_PROPOSED |
| TABLE-067 | notify.delivery_attempts | BASELINE_PROPOSED |
| TABLE-068 | notify.delivery_retries | BASELINE_PROPOSED |
| TABLE-069 | notify.notification_templates | BASELINE_PROPOSED |
| TABLE-070 | notify.notification_channel_configurations | BASELINE_PROPOSED |
| TABLE-071 | notify.notification_read_states | BASELINE_PROPOSED |
| TABLE-072 | notify.notification_outbox_messages | INFRASTRUCTURE |
| TABLE-073 | imports.import_batches | BASELINE_PROPOSED |
| TABLE-074 | imports.import_previews | BASELINE_PROPOSED |
| TABLE-075 | imports.import_validation_results | BASELINE_PROPOSED |
| TABLE-076 | imports.import_row_results | BASELINE_PROPOSED |
| TABLE-077 | imports.import_errors | BASELINE_PROPOSED |
| TABLE-078 | imports.import_approvals | BASELINE_PROPOSED |
| TABLE-079 | imports.import_rejections | BASELINE_PROPOSED |
| TABLE-080 | imports.import_failures | BASELINE_PROPOSED |
| TABLE-081 | imports.import_commits | BASELINE_PROPOSED |
| TABLE-082 | content.content_items | BASELINE_PROPOSED |
| TABLE-083 | content.content_revisions | BASELINE_PROPOSED |
| TABLE-084 | content.publication_records | BASELINE_PROPOSED |
| TABLE-085 | content.withdrawal_records | BASELINE_PROPOSED |
| TABLE-086 | content.announcement_validity_periods | BASELINE_PROPOSED |
| TABLE-087 | audit.audit_events | BASELINE_PROPOSED |
| TABLE-088 | audit.sensitive_change_details | BASELINE_PROPOSED |
| TABLE-089 | audit.access_security_events | BASELINE_PROPOSED |
| TABLE-090 | reporting.domain_event_history_records | DERIVED_REPORTING |
| TABLE-091 | reporting.reporting_projection_definitions | DERIVED_REPORTING |
| TABLE-092 | reporting.saved_report_filters | BASELINE_PROPOSED |
| TABLE-093 | reporting.report_export_records | BASELINE_PROPOSED |
| TABLE-094 | audit.domain_event_outbox | INFRASTRUCTURE |

---

## identity (TABLE-001 … TABLE-007)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-001 | identity | user_profiles | ملف المستخدم التطبيقي | Identity and Access | Root | Authoritative | Identity NestJS | Identity; other modules via contracts | Activate/suspend/archive | Soft-archive preferred | Audit on material change | Confidential | Required (PROPOSED) | Medium | Yes (masked) | DM-14 **يحتاج اعتماد لاحق** |
| TABLE-002 | identity | staff_profiles | ملف الموظف | Identity and Access | Child of user_profiles | Authoritative | Identity NestJS | Visits/Requests/Balaghat eligibility readers | Activate/end-date | Soft-archive | Eligibility history | Confidential | Required | Low–Medium | Limited | Staff purpose **يحتاج اعتماد لاحق** |
| TABLE-003 | identity | roles | الأدوار | Identity and Access | Root (catalogue) | Authoritative | Identity NestJS | Authz readers | Catalogue lifecycle | Restrict hard-delete | Change audited | Internal | Required | Low | Limited | Catalogue evolution **يحتاج اعتماد لاحق** |
| TABLE-004 | identity | permissions | الصلاحيات | Identity and Access | Root (catalogue) | Authoritative | Identity NestJS | Authz readers | Catalogue lifecycle | Restrict hard-delete | Change audited | Internal | Required | Low | Limited | — |
| TABLE-005 | identity | role_assignments | إسناد الأدوار | Identity and Access | Child | Authoritative | Identity NestJS | Identity; Audit | Effective-dated grant/revoke | End-date; retain | Grant/revoke history | Highly Sensitive | Required | Medium | Audit reports | — |
| TABLE-006 | identity | role_permissions | صلاحيات الدور | Identity and Access | Child of roles | Authoritative | Identity NestJS | Identity | Grant/revoke | Retain | Audited | Highly Sensitive | Required | Low | Audit reports | — |
| TABLE-007 | identity | sensitive_permission_changes | سجل تغيير الصلاحيات الحساسة | Identity and Access | Evidence root/child | Authoritative (evidence) | Identity NestJS | Audit Restricted | Append-only | No hard-delete | Append-only | Audit Restricted | Required | Low–Medium | Yes | Sensitive threshold DM-13 **يحتاج اعتماد لاحق** |

## registry (TABLE-008 … TABLE-011)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-008 | registry | taxpayers | المكلّف | Taxpayer Registry | Root | Authoritative | Registry NestJS | Own-data path; staff via contracts | Register/verify/supersede | End-date/archive; no casual delete | Correction/merge audited | Highly Sensitive | Required | Medium–High | Yes (masked) | DM-03 **يحتاج اعتماد لاحق** |
| TABLE-009 | registry | taxpayer_contacts | جهات اتصال المكلّف | Taxpayer Registry | Child of taxpayers | Authoritative | Registry NestJS | Purpose-limited | Supersede/end-date | Soft-archive | Contact history | Confidential | Required | Medium | Masked | Masking **يحتاج اعتماد لاحق** |
| TABLE-010 | registry | taxpayer_account_links | ربط حساب المستخدم بملف المكلّف | Taxpayer Registry | Root (link) | Authoritative | Registry NestJS | Own-data authz; Audit | Grant/revoke/verify | Retain inactive; no silent delete | Full grant/revoke history | Highly Sensitive | Required | Medium | Yes | DM-21 **يحتاج اعتماد لاحق** |
| TABLE-011 | registry | taxpayer_legal_entity_associations | ارتباط المكلّف بالكيان القانوني | Taxpayer Registry | Root (association) | Authoritative | Registry NestJS | Registry; Legal readers | Effective-dated | End-date retain | Evidence-backed history | Highly Sensitive | Required | Medium | Yes | — |

## legal (TABLE-012 … TABLE-013)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-012 | legal | legal_entities | الكيان القانوني | Legal Entities | Root | Authoritative | Legal NestJS | Registry association; requests/balaghat via contracts | Register/replace/archive | Archive; retain lineage | Change audited | Highly Sensitive | Required | Medium | Yes | — |
| TABLE-013 | legal | tax_numbers | الرقم الضريبي | Legal Entities | Child of legal_entities | Authoritative | Legal NestJS | Display/read via contracts; not Registry-owned | Issue/verify/replace/invalidate | Invalidate retain | Issuance lineage | Highly Sensitive | Required | Medium | Yes (masked) | DM-04/DM-23 **يحتاج اعتماد لاحق** |

## masterdata (TABLE-014 … TABLE-022)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-014 | masterdata | commercial_activities | النشاط التجاري | Activities and Branches | Root | Authoritative | Activities NestJS | Requests/Balaghat read-only via contracts | Effective-date/correct/archive | Archive; effects audited | Status/address history related | Confidential | Required | High | Yes | DM-05 **يحتاج اعتماد لاحق** |
| TABLE-015 | masterdata | branches | الفرع | Activities and Branches | Child of commercial_activities | Authoritative | Activities NestJS | Same as activity | Branch-scoped effects (IR-72) | Archive | Target-scope audited | Confidential | Required | High | Yes | — |
| TABLE-016 | masterdata | activity_addresses | عنوان النشاط/الفرع | Activities and Branches | Child | Authoritative | Activities NestJS | Purpose-limited | Effective-dated | Supersede retain | Address history | Confidential | Required | Medium–High | Yes | OD-05 geo **يحتاج اعتماد لاحق** |
| TABLE-017 | masterdata | activity_status_histories | تاريخ حالة النشاط | Activities and Branches | History child | Authoritative (history) | Activities NestJS | Audit/Reporting | Append-only | No hard-delete | Append-only | Confidential | Required | High | Yes | — |
| TABLE-018 | masterdata | properties | العقار | Activities and Branches | Root | Authoritative | Activities NestJS | Ownership; requests/balaghat via contracts | Survives transfer | Archive rare | Ownership history separate | Highly Sensitive | Required | Medium–High | Yes | — |
| TABLE-019 | masterdata | property_units | وحدة العقار | Activities and Branches | Child of properties | Authoritative | Activities NestJS | Same | Unit lifecycle | Soft-archive | Unit changes audited | Highly Sensitive | Required | Medium–High | Yes | — |
| TABLE-020 | masterdata | property_ownership_records | سجل ملكية العقار (مرجعي) | Activities and Branches | Root (ownership) | Authoritative | Activities NestJS | Derived Taxpayer↔Property VIEW readers | Current ownership | End-date; never erase prior | Via histories | Highly Sensitive | Required | Medium–High | Yes | Ownership grain OPEN |
| TABLE-021 | masterdata | property_ownership_units | ارتباط ملكية على مستوى الوحدة (اختياري) | Activities and Branches | Child/assoc of ownership_records | Authoritative if adopted — **CONDITIONAL_OPEN** | Activities NestJS | Same | Optional unit-level ownership | Soft end-date | Audited | Highly Sensitive | Required | Medium | Yes | **PROPOSED/OPEN** — alternatives property-only / unit-only / both **يحتاج اعتماد لاحق**; not final business rule |
| TABLE-022 | masterdata | property_ownership_histories | تاريخ ملكية العقار | Activities and Branches | History child | Authoritative (history) | Activities NestJS | Audit/Reporting | Append-only | No hard-delete | Append-only | Highly Sensitive | Required | High | Yes | DM-24 |

> Derived object (not a TABLE ID): PROPOSED view `masterdata.v_taxpayer_properties` — Taxpayer↔Property navigation only; not authoritative.

## requests (TABLE-023 … TABLE-036)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-023 | requests | service_types | أنواع الخدمة | Service Requests | Catalogue root | Authoritative (config) | Service Requests NestJS | Request creators | Config lifecycle | Restrict delete | Audited | Internal | Required | Low | Limited | ADR-008 versioning **يحتاج اعتماد لاحق** |
| TABLE-024 | requests | service_requests | طلب الخدمة | Service Requests | Root | Authoritative | Service Requests NestJS | Assigned staff; own-data where allowed | Draft→decision→close/reopen | Draft delete policy OPEN | Full family history | Confidential–Highly Sensitive | Required | Very High | Yes | DMOD-06 draft delete **يحتاج اعتماد لاحق** |
| TABLE-025 | requests | request_selected_activities | النشاط المختار للطلب | Service Requests | Child | Authoritative | Service Requests NestJS | Request readers | Retained with request | Retain | Snapshot retained | Confidential | Required | High | Yes | — |
| TABLE-026 | requests | request_selected_branches | الفرع المختار للطلب | Service Requests | Child of selected activity | Authoritative | Service Requests NestJS | Request readers | Retained | Retain | Snapshot retained | Confidential | Required | High | Yes | REL-028 |
| TABLE-027 | requests | request_form_snapshots | رأس لقطة نموذج الطلب | Service Requests | Child | Authoritative | Service Requests NestJS | Request readers | Append/new version | Retain | Versioned snapshots | Highly Sensitive | Required | High | Limited | Hybrid header |
| TABLE-028 | requests | request_form_snapshot_payloads | حمولة JSONB لنموذج الطلب | Service Requests | Child of snapshot header | Authoritative | Service Requests NestJS | Request readers | Immutable payload rows preferred | Retain | Payload versions | Highly Sensitive | Required | High | Limited | JSON schema version **يحتاج اعتماد لاحق** |
| TABLE-029 | requests | request_status_histories | تاريخ حالة الطلب | Service Requests | History child | Authoritative (history) | Service Requests NestJS | Request/Audit/Reporting | Append-only | No hard-delete | Append-only | Confidential | Required | Very High | Yes | DM-06 reasons **يحتاج اعتماد لاحق** |
| TABLE-030 | requests | request_assignment_histories | تاريخ إسناد الطلب | Service Requests | History child | Authoritative (history) | Service Requests NestJS | Request/Audit | Append-only | No hard-delete | Append-only | Confidential | Required | High | Yes | — |
| TABLE-031 | requests | request_completion_requests | طلب استكمال للطلب | Service Requests | Child | Authoritative | Service Requests NestJS | Request parties | Retained | Retain | Cycle retained | Confidential | Required | Medium–High | Yes | — |
| TABLE-032 | requests | request_completion_responses | رد الاستكمال للطلب | Service Requests | Child | Authoritative | Service Requests NestJS | Request parties | Retained | Retain | Cycle retained | Confidential | Required | Medium–High | Yes | — |
| TABLE-033 | requests | request_decision_records | سجل قرار الطلب (قيمة القرار مضمّنة) | Service Requests | Child | Authoritative | Service Requests NestJS | Restricted decision readers | Final decision retained | Retain | Revisions separate | Highly Sensitive | Required | High | Yes | DM-07 **يحتاج اعتماد لاحق** |
| TABLE-034 | requests | request_decision_revisions | مراجعة قرار الطلب | Service Requests | Child of decision | Authoritative (history) | Service Requests NestJS | Restricted | Append-only | No hard-delete | Append-only | Highly Sensitive | Required | Medium | Yes | DMOD-14 **يحتاج اعتماد لاحق** |
| TABLE-035 | requests | request_close_archive_records | إغلاق/أرشفة الطلب | Service Requests | Child | Authoritative | Service Requests NestJS | Request/Audit | Retained | Retain | Event retained | Confidential | Required | Medium | Yes | DMOD-01 **يحتاج اعتماد لاحق** |
| TABLE-036 | requests | request_reopen_records | إعادة فتح الطلب | Service Requests | Child | Authoritative | Service Requests NestJS | Request/Audit | Retained | Retain | Event retained | Confidential | Required | Low–Medium | Yes | DMOD-11 **يحتاج اعتماد لاحق** |

## balaghat (TABLE-037 … TABLE-049)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-037 | balaghat | balaghs | البلاغ | Business Notifications / Balaghat | Root | Authoritative | Balaghat NestJS | Assigned staff; restricted | Submit→decision→close/reopen | Retain; no subject mutation | Full family history | Confidential–Highly Sensitive | Required | Very High | Yes | — |
| TABLE-038 | balaghat | balagh_selected_activities | النشاط المختار للبلاغ | Business Notifications / Balaghat | Child | Authoritative | Balaghat NestJS | Balagh readers | Retained | Retain | Snapshot | Confidential | Required | High | Yes | Multi-activity |
| TABLE-039 | balaghat | balagh_selected_branches | الفرع المختار للبلاغ | Business Notifications / Balaghat | Child of selected activity | Authoritative | Balaghat NestJS | Balagh readers | Retained | Retain | Snapshot | Confidential | Required | High | Yes | REL-044 |
| TABLE-040 | balaghat | balagh_form_snapshots | رأس لقطة نموذج البلاغ | Business Notifications / Balaghat | Child | Authoritative | Balaghat NestJS | Balagh readers | Append/new version | Retain | Versioned | Highly Sensitive | Required | High | Limited | Hybrid header |
| TABLE-041 | balaghat | balagh_form_snapshot_payloads | حمولة JSONB لنموذج البلاغ | Business Notifications / Balaghat | Child of snapshot header | Authoritative | Balaghat NestJS | Balagh readers | Immutable payload preferred | Retain | Payload versions | Highly Sensitive | Required | High | Limited | JSON schema version **يحتاج اعتماد لاحق** |
| TABLE-042 | balaghat | balagh_status_histories | تاريخ حالة البلاغ | Business Notifications / Balaghat | History child | Authoritative (history) | Balaghat NestJS | Balagh/Audit/Reporting | Append-only | No hard-delete | Append-only | Confidential | Required | Very High | Yes | DM-06 **يحتاج اعتماد لاحق** |
| TABLE-043 | balaghat | balagh_assignment_histories | تاريخ إسناد البلاغ | Business Notifications / Balaghat | History child | Authoritative (history) | Balaghat NestJS | Balagh/Audit | Append-only | No hard-delete | Append-only | Confidential | Required | High | Yes | — |
| TABLE-044 | balaghat | balagh_completion_requests | طلب استكمال للبلاغ | Business Notifications / Balaghat | Child | Authoritative | Balaghat NestJS | Balagh parties | Retained | Retain | Cycle retained | Confidential | Required | Medium–High | Yes | — |
| TABLE-045 | balaghat | balagh_completion_responses | رد الاستكمال للبلاغ | Business Notifications / Balaghat | Child | Authoritative | Balaghat NestJS | Balagh parties | Retained | Retain | Cycle retained | Confidential | Required | Medium–High | Yes | — |
| TABLE-046 | balaghat | balagh_decision_records | سجل قرار البلاغ (قيمة القرار مضمّنة) | Business Notifications / Balaghat | Child | Authoritative | Balaghat NestJS | Restricted | Final decision retained | Retain | Revisions separate | Highly Sensitive | Required | High | Yes | DM-07 **يحتاج اعتماد لاحق** |
| TABLE-047 | balaghat | balagh_decision_revisions | مراجعة قرار البلاغ | Business Notifications / Balaghat | Child of decision | Authoritative (history) | Balaghat NestJS | Restricted | Append-only | No hard-delete | Append-only | Highly Sensitive | Required | Medium | Yes | DMOD-14 **يحتاج اعتماد لاحق** |
| TABLE-048 | balaghat | balagh_close_archive_records | إغلاق/أرشفة البلاغ | Business Notifications / Balaghat | Child | Authoritative | Balaghat NestJS | Balagh/Audit | Retained | Retain | Event retained | Confidential | Required | Medium | Yes | DMOD-01 **يحتاج اعتماد لاحق** |
| TABLE-049 | balaghat | balagh_reopen_records | إعادة فتح البلاغ | Business Notifications / Balaghat | Child | Authoritative | Balaghat NestJS | Balagh/Audit | Retained | Retain | Event retained | Confidential | Required | Low–Medium | Yes | DMOD-11 **يحتاج اعتماد لاحق** |

## visits (TABLE-050 … TABLE-055)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-050 | visits | field_visits | الزيارة الميدانية | Field Visits | Root | Authoritative | Field Visits NestJS | Request/Balagh via contracts | Plan→conduct→archive | Archive | Full visit family | Highly Sensitive | Required | High | Yes | DMOD-08 **يحتاج اعتماد لاحق** |
| TABLE-051 | visits | visit_schedules | جدولة الزيارة | Field Visits | Child | Authoritative | Field Visits NestJS | Visit team/ops | Schedule revisions | Retain | Audited | Confidential | Required | High | Yes | — |
| TABLE-052 | visits | visit_team_members | أعضاء فريق الزيارة | Field Visits | Child | Authoritative | Field Visits NestJS | Masked per policy | Membership changes | Retain | Eligibility trace | Confidential | Required | High | Limited | DM-08 masking **يحتاج اعتماد لاحق** |
| TABLE-053 | visits | visit_results | نتيجة الزيارة | Field Visits | Child | Authoritative | Field Visits NestJS | Restricted | Corrections additive | Retain | Via corrections | Highly Sensitive | Required | High | Yes | Result structure **يحتاج اعتماد لاحق** |
| TABLE-054 | visits | visit_result_corrections | تصحيح نتيجة الزيارة | Field Visits | Child of result | Authoritative (history) | Field Visits NestJS | Restricted | Append-only | No hard-delete | Append-only | Highly Sensitive | Required | Medium | Yes | DMOD-15 **يحتاج اعتماد لاحق** |
| TABLE-055 | visits | visit_evidences | أدلة الزيارة | Field Visits | Child | Authoritative | Field Visits NestJS | Restricted | Link retain | Retain links | Via attachments history | Highly Sensitive | Required | High | Limited | — |

## dues (TABLE-056 … TABLE-062)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-056 | dues | payment_dues | المستحق المالي | Dues and Payment Evidence | Root | Authoritative | Dues NestJS | Case modules via contracts | Assess/correct/archive | Archive | Corrections retained | Highly Sensitive | Required | High | Yes | DM-09/DM-22 **يحتاج اعتماد لاحق** |
| TABLE-057 | dues | due_basis_document_references | مرجع مستند أساس المستحق | Dues and Payment Evidence | Child | Authoritative | Dues NestJS | Restricted | Retained | Retain | Audited | Highly Sensitive | Required | Medium–High | Limited | — |
| TABLE-058 | dues | due_corrections | تصحيح المستحق | Dues and Payment Evidence | Child | Authoritative (history) | Dues NestJS | Restricted | Append-only | No hard-delete | Append-only | Highly Sensitive | Required | Medium | Yes | DM-09 **يحتاج اعتماد لاحق** |
| TABLE-059 | dues | payment_notices | إشعار السداد | Dues and Payment Evidence | Child / notice | Authoritative | Dues NestJS | Notify context; recipient limited | Issue/archive | Retain | Audited | Confidential–Highly Sensitive | Required | High | Yes | — |
| TABLE-060 | dues | payment_receipts | إيصال السداد | Dues and Payment Evidence | Root (receipt) | Authoritative | Dues NestJS | Restricted | Accept/replace | Retain lineage | Via replacements | Highly Sensitive | Required | High | Yes | **No due_receipt_links TABLE** pending DM-22 **يحتاج اعتماد لاحق** |
| TABLE-061 | dues | receipt_correction_replacements | تصحيح/استبدال الإيصال | Dues and Payment Evidence | Child of receipt | Authoritative (history) | Dues NestJS | Restricted | Append-only | No hard-delete | Append-only | Highly Sensitive | Required | Medium | Yes | DM-22 **يحتاج اعتماد لاحق** |
| TABLE-062 | dues | payment_confirmations | تأكيد السداد | Dues and Payment Evidence | Child (confirmation) | Authoritative | Dues NestJS | Restricted | Requires accepted receipt | Retain | Audited | Highly Sensitive | Required | Medium–High | Yes | Not final case approval |

> Explicit exclusion: no `due_receipt_links` (or equivalent allocation) TABLE ID until DM-22 is resolved. Optional future object remains non-approved.

## files (TABLE-063 … TABLE-065)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-063 | files | attachments | المرفق (بيانات وصفية + تصنيف الوصول كأعمدة) | Attachments and Private Files | Root | Authoritative | Attachments NestJS | Via NestJS mediation only | Receive/classify/version/withdraw | Soft deletion/retention status | Version histories | Highly Sensitive (ops metadata too) | Required | Very High | Aggregate only | DM-10/DM-26 **يحتاج اعتماد لاحق**; access classification is COLUMN not table |
| TABLE-064 | files | attachment_links | ربط المرفق بالكيان | Attachments and Private Files | Child | Authoritative | Attachments NestJS | Owning modules via contracts | Link/unlink audited | Retain | Audited | Highly Sensitive | Required | Very High | Limited | Reference ≠ authorization |
| TABLE-065 | files | attachment_version_histories | تاريخ إصدارات/استبدال المرفق | Attachments and Private Files | History child | Authoritative (history) | Attachments NestJS | Restricted | Append-only | No hard-delete of lineage | Append-only | Highly Sensitive | Required | High | Limited | DMOD-09 retention **يحتاج اعتماد لاحق** |

## notify (TABLE-066 … TABLE-072)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-066 | notify | notification_messages | رسالة الإشعار | Notification Delivery | Root | Authoritative | Notification NestJS | Recipient; ops limited | Request→archive | Archive | Attempts/read retained | Confidential | Required | Very High | Limited | DM-11 OTP minimize **يحتاج اعتماد لاحق** |
| TABLE-067 | notify | delivery_attempts | محاولة التسليم | Notification Delivery | Child | Authoritative (history) | Notification NestJS | Ops/Audit | Append-only | No hard-delete | Append-only | Confidential | Required | Very High | Limited | — |
| TABLE-068 | notify | delivery_retries | إعادة محاولة التسليم | Notification Delivery | Child | Authoritative (history) | Notification NestJS | Ops/Audit | Append-only | No hard-delete | Append-only | Confidential | Required | High | Limited | Retry policy **يحتاج اعتماد لاحق** |
| TABLE-069 | notify | notification_templates | قوالب/أنواع الإشعار | Notification Delivery | Catalogue root | Authoritative (config) | Notification NestJS | Notify services | Config lifecycle | Restrict delete | Audited | Internal | Required | Low | No | — |
| TABLE-070 | notify | notification_channel_configurations | إعداد قنوات الإشعار | Notification Delivery | Config root | Authoritative (config) | Notification NestJS | Notify services | Config lifecycle | Restrict delete | Audited | Internal (secrets out-of-band) | Required | Low | No | Secrets never in DB docs |
| TABLE-071 | notify | notification_read_states | حالة قراءة الإشعار | Notification Delivery | Child (message × recipient) | Authoritative | Notification NestJS | Recipient; justified ops | First-read/ack | Retain | Append-oriented updates audited | Confidential | Required | Very High | Limited | DM-25 **يحتاج اعتماد لاحق** |
| TABLE-072 | notify | notification_outbox_messages | صندوق الصادر لتسليم الإشعارات فقط | Notification Delivery (+ worker) | Outbox root (notification delivery queue only) | Authoritative (infra) — **INFRASTRUCTURE** | Notification NestJS enroll; worker claim/update | Worker; ops | Pending→processed/dead | Retain per policy | Processing outcomes | Internal–Confidential | Required | Very High | Ops only | **NOT domain events** — delivery queue only (see TABLE-094 for domain event outbox); ADR-007 alignment; retention **يحتاج اعتماد لاحق** |

## imports (TABLE-073 … TABLE-081)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-073 | imports | import_batches | دفعة الاستيراد | Imports and Data Quality | Root | Authoritative | Imports NestJS | Imports; Audit Restricted | Preview→commit/fail | Retain outcomes | Full lifecycle | Highly Sensitive / Audit Restricted | Required | Medium–High | Yes | DM-12 **يحتاج اعتماد لاحق** |
| TABLE-074 | imports | import_previews | معاينة الاستيراد | Imports and Data Quality | Child | Authoritative | Imports NestJS | Imports staff | Retained | Retain | Separate record | Highly Sensitive | Required | Medium | Limited | — |
| TABLE-075 | imports | import_validation_results | نتيجة التحقق | Imports and Data Quality | Child | Authoritative | Imports NestJS | Imports staff | Retained | Retain | Separate record | Highly Sensitive | Required | Medium–High | Yes | Taxonomy **يحتاج اعتماد لاحق** |
| TABLE-076 | imports | import_row_results | نتيجة صف الاستيراد | Imports and Data Quality | Child | Authoritative | Imports NestJS | Imports staff | Retained | Retain | Row evidence | Highly Sensitive | Required | Very High | Limited | — |
| TABLE-077 | imports | import_errors | أخطاء الاستيراد | Imports and Data Quality | Child | Authoritative | Imports NestJS | Imports staff | Retained | Retain | Error catalogue | Highly Sensitive | Required | High | Yes | — |
| TABLE-078 | imports | import_approvals | اعتماد الاستيراد | Imports and Data Quality | Child | Authoritative | Imports NestJS | Audit Restricted | Retained | Retain | Actors retained | Audit Restricted | Required | Medium | Yes | DMOD-13 **يحتاج اعتماد لاحق** |
| TABLE-079 | imports | import_rejections | رفض الاستيراد | Imports and Data Quality | Child | Authoritative | Imports NestJS | Imports/Audit | Retained | Retain | Separate outcome | Audit Restricted | Required | Medium | Yes | — |
| TABLE-080 | imports | import_failures | فشل الاستيراد | Imports and Data Quality | Child | Authoritative | Imports NestJS | Imports/Audit | Retained | Retain | Separate outcome | Audit Restricted | Required | Medium | Yes | — |
| TABLE-081 | imports | import_commits | تنفيذ الاستيراد | Imports and Data Quality | Child | Authoritative | Imports NestJS | Imports/Audit; target modules via contracts | Retained | Retain | Idempotency disposition | Audit Restricted | Required | Medium | Yes | DM-20 **يحتاج اعتماد لاحق** |

## content (TABLE-082 … TABLE-086)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-082 | content | content_items | عنصر المحتوى | Content Management | Root | Authoritative | Content NestJS | Public only when published | Draft→publish→withdraw | Soft-archive | Revision lineage | Internal→Public under rules | Required | Medium | Limited | DMOD-10 **يحتاج اعتماد لاحق** |
| TABLE-083 | content | content_revisions | مراجعة المحتوى | Content Management | Child | Authoritative | Content NestJS | Editors; public published revision | Append revisions | Retain | Append | Internal | Required | Medium | Limited | — |
| TABLE-084 | content | publication_records | سجل النشر | Content Management | Child | Authoritative | Content NestJS | Content/Audit | Retained | Retain | Publication evidence | Internal | Required | Low–Medium | Yes | Required before Public attachment |
| TABLE-085 | content | withdrawal_records | سجل السحب | Content Management | Child | Authoritative | Content NestJS | Content/Audit | Retained | Retain | Withdrawal evidence | Internal | Required | Low | Yes | — |
| TABLE-086 | content | announcement_validity_periods | فترة صلاحية الإعلان | Content Management | Child | Authoritative | Content NestJS | Content/public surfaces | Effective periods | Retain | Period history | Internal/Public | Required | Low–Medium | Limited | — |

## audit (TABLE-087 … TABLE-089; TABLE-094)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-087 | audit | audit_events | حدث التدقيق (يشمل Actor Context مضمّناً) | Audit and Security | Root | Authoritative (evidence) | Audit NestJS (append) | Audit Restricted | Append-only | No hard-delete | Append-only; actor_context JSONB ± columns | Audit Restricted | Required | Very High | Yes (restricted) | Actor shape DM-13 **يحتاج اعتماد لاحق** |
| TABLE-088 | audit | sensitive_change_details | تفاصيل التغيير الحساس | Audit and Security | Child of audit_events | Authoritative (evidence) | Audit NestJS | Audit Restricted | Append-only | No hard-delete | Append-only | Audit Restricted | Required | High | Yes (restricted) | Threshold **يحتاج اعتماد لاحق** |
| TABLE-089 | audit | access_security_events | أحداث الوصول/الأمن | Audit and Security | Root | Authoritative (evidence) | Audit NestJS | Audit Restricted | Append-only | No hard-delete | Append-only | Audit Restricted | Required | Very High | Yes (restricted) | DM-18 **يحتاج اعتماد لاحق** |
| TABLE-094 | audit | domain_event_outbox | صندوق أحداث النطاق | NestJS Audit / worker infrastructure | Outbox root (domain events) | Authoritative (infra) — **INFRASTRUCTURE** | Audit NestJS enroll; worker claim/publish | Worker; ops; projection consumers via contracts | Append-oriented Pending→published/dead | Retain per policy | Processing outcomes; not case state | Internal–Confidential | Required | Very High | Via event history (TABLE-090) | Dual outbox: domain events here; notification delivery is TABLE-072 only; retention **يحتاج اعتماد لاحق** |

> Actor Context: **not** a separate table in this catalogue (EMBEDDED on TABLE-087).
> Dual outbox: `audit.domain_event_outbox` (TABLE-094) holds business domain events; `notify.notification_outbox_messages` (TABLE-072) is the **notification delivery** queue only.

## reporting (TABLE-090 … TABLE-093)

| Table ID | Schema | Name | Arabic purpose | NestJS module | Aggregate | Auth/Derived | Mutation owner | Readers | Lifecycle | Deletion/archive | History | Sensitivity | RLS | Growth | Reports | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-090 | reporting | domain_event_history_records | سجل أحداث النطاق للتحليلات | Reporting and Analytics | Supporting root | Derived/supporting — **DERIVED_REPORTING** | Reporting NestJS / projection jobs | Reporting under permission | Append-oriented | Retain per policy | Analytics history | Confidential–Highly Sensitive | Required | Very High | Yes | DM-15 freshness **يحتاج اعتماد لاحق** |
| TABLE-091 | reporting | reporting_projection_definitions | تعريف إسقاطات التقارير | Reporting and Analytics | Definition root | Authoritative definition / derived materialization — **DERIVED_REPORTING** | Reporting NestJS | Reporting admins | Version definitions | Restrict delete | Definition versions | Internal | Required | Low | Meta | Rebuild/reconcile **يحتاج اعتماد لاحق** |
| TABLE-092 | reporting | saved_report_filters | عوامل تصفية التقارير المحفوظة | Reporting and Analytics | User preference root | Authoritative (preference) — **BASELINE_PROPOSED** | Reporting NestJS | Owning profile | Soft-delete OPEN | Soft-delete/archive OPEN | Limited | Confidential | Required | Medium | No | DM-16 masking **يحتاج اعتماد لاحق** |
| TABLE-093 | reporting | report_export_records | سجل تصدير التقرير | Reporting and Analytics | Export evidence root | Authoritative (evidence) — **BASELINE_PROPOSED** | Reporting NestJS | Export auditors; owning requester | Retained with requester Profile | Retain | Export evidence | Highly Sensitive / Audit Restricted | Required | Medium–High | Yes | DMOD-12 scheduling **يحتاج اعتماد لاحق** |

---

## ID index by schema

| Schema | TABLE IDs | Count |
| --- | --- | ---: |
| identity | TABLE-001 … TABLE-007 | 7 |
| registry | TABLE-008 … TABLE-011 | 4 |
| legal | TABLE-012 … TABLE-013 | 2 |
| masterdata | TABLE-014 … TABLE-022 | 9 |
| requests | TABLE-023 … TABLE-036 | 14 |
| balaghat | TABLE-037 … TABLE-049 | 13 |
| visits | TABLE-050 … TABLE-055 | 6 |
| dues | TABLE-056 … TABLE-062 | 7 |
| files | TABLE-063 … TABLE-065 | 3 |
| notify | TABLE-066 … TABLE-072 | 7 |
| imports | TABLE-073 … TABLE-081 | 9 |
| content | TABLE-082 … TABLE-086 | 5 |
| audit | TABLE-087 … TABLE-089; TABLE-094 | 4 |
| reporting | TABLE-090 … TABLE-093 | 4 |
| **Total** | **TABLE-001 … TABLE-094** | **94** |

## Explicit non-tables (for clarity)

| Logical / platform item | Physical disposition |
| --- | --- |
| Authentication Identity / `auth.users` | Supabase-managed; not TABLE-xxx |
| `storage.objects` | Supabase-managed; not TABLE-xxx |
| Attachment Access Classification | Columns on TABLE-063 |
| Actor Context | Embedded on TABLE-087 |
| Decision Value Object | Embedded columns on TABLE-033 / TABLE-046 (and revisions) |
| Taxpayer↔Property | Derived VIEW only (no TABLE ID) |
| Due–Receipt allocation | No TABLE pending DM-22 |

## Related documents

- `MARIB-TAX-PHYSICAL-SCHEMA-ARCHITECTURE-01.md`
- `MARIB-TAX-LOGICAL-TO-PHYSICAL-MAPPING-01.md`
- `docs/governance/MARIB-TAX-DATA-MODEL-OPEN-DECISIONS-01.md`
