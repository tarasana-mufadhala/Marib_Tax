# MARIB-TAX-PHYSICAL-RELATIONAL-INTEGRITY-01

**Document ID:** MARIB-TAX-PHYSICAL-RELATIONAL-INTEGRITY-01
**Status:** PROPOSED physical relational integrity mapping for REL-001–REL-100 (documentation only). No executable SQL.
**Companion:** `MARIB-TAX-PHYSICAL-COLUMN-CONSTRAINT-CATALOG-01` (FK-001…), `MARIB-TAX-PHYSICAL-TABLE-CATALOG-01`, `MARIB-TAX-LOGICAL-RELATIONSHIPS-01`

> Unresolved items are **يحتاج اعتماد لاحق**. Recommendations are **PROPOSED** only.

## Enforcement classes

Exactly one class per REL:

| Class | Meaning |
| --- | --- |
| `PHYSICAL_FK` | Application-schema foreign key (FK-*) |
| `MANAGED_SCHEMA_FK` | FK into Supabase-managed schema (`auth.users`) |
| `APPLICATION_VALIDATED` | NestJS (+ optional CHECKs); optional supporting FKs listed |
| `DERIVED_VIEW` | Non-authoritative derived VIEW; no second authoritative FK |
| `EMBEDDED` | Logical child stored as columns/JSONB on parent |
| `UNRESOLVED_NO_FK` | No fixed FK pending open decision |
| `POLYMORPHIC_VALIDATED` | Discriminator + id; NestJS validates target |
| `NO_PHYSICAL_ENFORCEMENT` | No FK and no other class applies |

## ON DELETE / ON UPDATE defaults (PROPOSED)

- **ON DELETE:** `RESTRICT` / `NO ACTION` for submitted cases, decisions, receipts, visits, audit, imports, and ownership evidence. **Zero** CASCADE delete proposals for those families.
- **ON UPDATE:** `NO ACTION` (uuid PKs treated as immutable).
- **Deferrable:** `NOT DEFERRABLE` unless a later workflow decision requires deferred checks (**يحتاج اعتماد لاحق**).
- **Request/Balagh:** No cross-type history FKs (REL-031/032 vs REL-047/048 and parallel children).

## REL-001 … REL-100

| REL ID | enforcement class | FK constraint ID (if any) | source TABLE ID.column | target object.column | nullability | delete action | update action | deferrable | validation owner | history preservation | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REL-001 | MANAGED_SCHEMA_FK | FK-001 | TABLE-001.auth_user_id | auth.users.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Identity and Access | Retain profile link; identity end does not erase profile | — |
| REL-002 | PHYSICAL_FK | FK-004 | TABLE-002.user_profile_id | TABLE-001.id / identity.user_profiles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Identity and Access | Retain effective periods | — |
| REL-003 | PHYSICAL_FK | FK-011 | TABLE-005.user_profile_id | TABLE-001.id / identity.user_profiles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Identity and Access | Append-only grant/revoke via effective_to | — |
| REL-004 | PHYSICAL_FK | FK-012 | TABLE-005.role_id | TABLE-003.id / identity.roles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Identity and Access | Role retire preserves historic assignments | — |
| REL-005 | PHYSICAL_FK | FK-015 | TABLE-006.role_id | TABLE-003.id / identity.roles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Identity and Access | Mapping change retains history via dating | — |
| REL-006 | PHYSICAL_FK | FK-016 | TABLE-006.permission_id | TABLE-004.id / identity.permissions.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Identity and Access | Permission retire preserves mappings | — |
| REL-007 | PHYSICAL_FK | FK-018 | TABLE-007.role_assignment_id | TABLE-005.id / identity.role_assignments.id | NULL | RESTRICT; never hard-delete | NO ACTION | NOT DEFERRABLE | Identity and Access | Append-only | — |
| REL-008 | MANAGED_SCHEMA_FK | FK-229 | TABLE-089.auth_user_id | auth.users.id | NULL | RESTRICT; never hard-delete | NO ACTION | NOT DEFERRABLE | Audit and Security | Append-only | — |
| REL-009 | PHYSICAL_FK | FK-026 | TABLE-010.user_profile_id | TABLE-001.id / identity.user_profiles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Taxpayer Registry | Grant/revoke history via effective dating | DM-21 |
| REL-010 | PHYSICAL_FK | FK-027 | TABLE-010.taxpayer_id | TABLE-008.id / registry.taxpayers.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Taxpayer Registry | End-date retains history | DM-21 |
| REL-011 | PHYSICAL_FK | FK-023 | TABLE-009.taxpayer_id | TABLE-008.id / registry.taxpayers.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Taxpayer Registry | Reassignment preserves history | — |
| REL-012 | PHYSICAL_FK | FK-032 | TABLE-011.taxpayer_id | TABLE-008.id / registry.taxpayers.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Taxpayer Registry | Effective history retained | — |
| REL-013 | PHYSICAL_FK | FK-033 | TABLE-011.legal_entity_id | TABLE-012.id / legal.legal_entities.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Taxpayer Registry | Entity retire preserves meaning | — |
| REL-014 | PHYSICAL_FK | FK-039 | TABLE-013.taxpayer_id | TABLE-008.id / registry.taxpayers.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Legal Entities | Invalidate/replace retains lineage; also FK-038 legal_entity_id; FK-040 superseded_by_id | DM-04; DM-23 |
| REL-015 | PHYSICAL_FK | FK-043 | TABLE-014.taxpayer_id | TABLE-008.id / registry.taxpayers.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Activities and Branches | Status history retained | — |
| REL-016 | PHYSICAL_FK | FK-046 | TABLE-015.commercial_activity_id | TABLE-014.id / masterdata.commercial_activities.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Activities and Branches | Branch end retains history | — |
| REL-017 | APPLICATION_VALIDATED | FK-049; FK-050 (optional) | TABLE-016.commercial_activity_id / TABLE-016.branch_id | TABLE-014.id and/or TABLE-015.id | NULL each | RESTRICT | NO ACTION | NOT DEFERRABLE | Activities and Branches / NestJS | Address change preserves prior rows; NestJS enforces activity and/or branch applicability | DMOD-05 |
| REL-018 | PHYSICAL_FK | FK-053 | TABLE-017.commercial_activity_id | TABLE-014.id / masterdata.commercial_activities.id | NOT NULL | RESTRICT; no CASCADE | NO ACTION | NOT DEFERRABLE | Activities and Branches | Append-only; never overwrite prior | — |
| REL-019 | PHYSICAL_FK | FK-057 | TABLE-019.property_id | TABLE-018.id / masterdata.properties.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Activities and Branches | Unit history retained | — |
| REL-020 | PHYSICAL_FK | FK-060 | TABLE-020.property_id | TABLE-018.id / masterdata.properties.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Activities and Branches | Prior ownership via history; party FK-061 co-located on TABLE-020 (supports REL-022 derived navigation) | DM-24 |
| REL-021 | PHYSICAL_FK | FK-067 | TABLE-022.ownership_record_id | TABLE-020.id / masterdata.property_ownership_records.id | NOT NULL | RESTRICT; never overwrite | NO ACTION | NOT DEFERRABLE | Activities and Branches | Append-only | — |
| REL-022 | DERIVED_VIEW | — (party support FK-061 on TABLE-020) | VIEW masterdata.v_taxpayer_properties (taxpayer_id, property_id) | Derived from TABLE-020 property_ownership_records WHERE current/effective | N/A (VIEW) | N/A (VIEW; no CASCADE path) | N/A | N/A | Activities and Branches | Non-authoritative Taxpayer↔Property navigation only; no second authoritative Taxpayer↔Property table/FK | DM-24 |
| REL-023 | PHYSICAL_FK | FK-071 | TABLE-024.service_type_id | TABLE-023.id / requests.service_types.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Historic type retained on retirement | — |
| REL-024 | PHYSICAL_FK | FK-072 | TABLE-024.taxpayer_id | TABLE-008.id / registry.taxpayers.id | NOT NULL | RESTRICT; submitted not taxpayer-deleted | NO ACTION | NOT DEFERRABLE | Service Requests | Origin retained | — |
| REL-025 | PHYSICAL_FK | FK-075 | TABLE-025.service_request_id | TABLE-024.id / requests.service_requests.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Selection retained | — |
| REL-026 | PHYSICAL_FK | FK-076 | TABLE-025.commercial_activity_id | TABLE-014.id / masterdata.commercial_activities.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Selection snapshot retained | — |
| REL-027 | PHYSICAL_FK | FK-078 | TABLE-026.service_request_id | TABLE-024.id / requests.service_requests.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Selection history | — |
| REL-028 | PHYSICAL_FK | FK-079 | TABLE-026.request_selected_activity_id | TABLE-025.id / requests.request_selected_activities.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Eligibility retained | — |
| REL-029 | PHYSICAL_FK | FK-080 | TABLE-026.branch_id | TABLE-015.id / masterdata.branches.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Selection snapshot retained | — |
| REL-030 | PHYSICAL_FK | FK-082 | TABLE-027.service_request_id | TABLE-024.id / requests.service_requests.id | NOT NULL | RESTRICT; never overwrite prior | NO ACTION | NOT DEFERRABLE | Service Requests | Append/version retained | — |
| REL-031 | PHYSICAL_FK | FK-085 | TABLE-029.service_request_id | TABLE-024.id / requests.service_requests.id | NOT NULL | RESTRICT; never overwrite | NO ACTION | NOT DEFERRABLE | Service Requests | Append-only; no FK to Balagh status history | — |
| REL-032 | PHYSICAL_FK | FK-087 | TABLE-030.service_request_id | TABLE-024.id / requests.service_requests.id | NOT NULL | RESTRICT; never overwrite | NO ACTION | NOT DEFERRABLE | Service Requests | Append-only; no cross-type history FKs | — |
| REL-033 | PHYSICAL_FK | FK-088 | TABLE-030.staff_profile_id | TABLE-002.id / identity.staff_profiles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Actor/staff retained | — |
| REL-034 | PHYSICAL_FK | FK-090 | TABLE-031.service_request_id | TABLE-024.id / requests.service_requests.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Cycle history retained | — |
| REL-035 | PHYSICAL_FK | FK-092 | TABLE-032.completion_request_id | TABLE-031.id / requests.request_completion_requests.id | NOT NULL | RESTRICT; never erase earlier snapshots | NO ACTION | NOT DEFERRABLE | Service Requests | Additive | — |
| REL-036 | PHYSICAL_FK | FK-094 | TABLE-033.service_request_id | TABLE-024.id / requests.service_requests.id | NOT NULL | RESTRICT; never overwrite | NO ACTION | NOT DEFERRABLE | Service Requests | Revisions additive | DMOD-14 |
| REL-037 | PHYSICAL_FK | FK-097 | TABLE-034.decision_record_id | TABLE-033.id / requests.request_decision_records.id | NOT NULL | RESTRICT; prior retained | NO ACTION | NOT DEFERRABLE | Service Requests | Append-only | DMOD-14 |
| REL-038 | PHYSICAL_FK | FK-099 | TABLE-035.service_request_id | TABLE-024.id / requests.service_requests.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Reason retained | DMOD-01 |
| REL-039 | PHYSICAL_FK | FK-101 | TABLE-036.service_request_id | TABLE-024.id / requests.service_requests.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Service Requests | Actor/reason retained | DMOD-11 |
| REL-040 | PHYSICAL_FK | FK-103 | TABLE-037.taxpayer_id | TABLE-008.id / registry.taxpayers.id | NOT NULL | RESTRICT; submitted retained | NO ACTION | NOT DEFERRABLE | Balaghat | Origin retained | — |
| REL-041 | PHYSICAL_FK | FK-106 | TABLE-038.balagh_id | TABLE-037.id / balaghat.balaghs.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Selection retained | — |
| REL-042 | PHYSICAL_FK | FK-107 | TABLE-038.commercial_activity_id | TABLE-014.id / masterdata.commercial_activities.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Snapshot retained | — |
| REL-043 | PHYSICAL_FK | FK-109 | TABLE-039.balagh_id | TABLE-037.id / balaghat.balaghs.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Selection history | — |
| REL-044 | PHYSICAL_FK | FK-110 | TABLE-039.balagh_selected_activity_id | TABLE-038.id / balaghat.balagh_selected_activities.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Eligibility retained | IR-56; IR-72 |
| REL-045 | PHYSICAL_FK | FK-111 | TABLE-039.branch_id | TABLE-015.id / masterdata.branches.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Snapshot retained | IR-72 |
| REL-046 | PHYSICAL_FK | FK-113 | TABLE-040.balagh_id | TABLE-037.id / balaghat.balaghs.id | NOT NULL | RESTRICT; never overwrite prior | NO ACTION | NOT DEFERRABLE | Balaghat | Append/version | — |
| REL-047 | PHYSICAL_FK | FK-116 | TABLE-042.balagh_id | TABLE-037.id / balaghat.balaghs.id | NOT NULL | RESTRICT; never overwrite | NO ACTION | NOT DEFERRABLE | Balaghat | Append-only; no FK to request status history | — |
| REL-048 | PHYSICAL_FK | FK-118 | TABLE-043.balagh_id | TABLE-037.id / balaghat.balaghs.id | NOT NULL | RESTRICT; never overwrite | NO ACTION | NOT DEFERRABLE | Balaghat | Append-only; no cross-type history FKs | — |
| REL-049 | PHYSICAL_FK | FK-119 | TABLE-043.staff_profile_id | TABLE-002.id / identity.staff_profiles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Actor/staff retained | — |
| REL-050 | PHYSICAL_FK | FK-121 | TABLE-044.balagh_id | TABLE-037.id / balaghat.balaghs.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Cycle history | — |
| REL-051 | PHYSICAL_FK | FK-123 | TABLE-045.completion_request_id | TABLE-044.id / balaghat.balagh_completion_requests.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Additive | — |
| REL-052 | PHYSICAL_FK | FK-125 | TABLE-046.balagh_id | TABLE-037.id / balaghat.balaghs.id | NOT NULL | RESTRICT; never overwrite | NO ACTION | NOT DEFERRABLE | Balaghat | Revisions additive | DMOD-14 |
| REL-053 | PHYSICAL_FK | FK-128 | TABLE-047.decision_record_id | TABLE-046.id / balaghat.balagh_decision_records.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Append-only | DMOD-14 |
| REL-054 | PHYSICAL_FK | FK-130 | TABLE-048.balagh_id | TABLE-037.id / balaghat.balaghs.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Reason retained | DMOD-01 |
| REL-055 | PHYSICAL_FK | FK-132 | TABLE-049.balagh_id | TABLE-037.id / balaghat.balaghs.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Balaghat | Actor/reason retained | DMOD-11 |
| REL-056 | PHYSICAL_FK | FK-134 | TABLE-050.service_request_id | TABLE-024.id / requests.service_requests.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Field Visits | Visit retained; XOR with REL-057 (NestJS + CK-T01) | DMOD-08 |
| REL-057 | PHYSICAL_FK | FK-135 | TABLE-050.balagh_id | TABLE-037.id / balaghat.balaghs.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Field Visits | Visit retained; XOR with REL-056 (NestJS + CK-T01) | DMOD-08 |
| REL-058 | PHYSICAL_FK | FK-138 | TABLE-051.field_visit_id | TABLE-050.id / visits.field_visits.id | NOT NULL | RESTRICT; prior schedule retained | NO ACTION | NOT DEFERRABLE | Field Visits | Schedule history | — |
| REL-059 | PHYSICAL_FK | FK-141 | TABLE-052.field_visit_id | TABLE-050.id / visits.field_visits.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Field Visits | Membership retained | — |
| REL-060 | PHYSICAL_FK | FK-142 | TABLE-052.staff_profile_id | TABLE-002.id / identity.staff_profiles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Field Visits | Eligibility retained | — |
| REL-061 | PHYSICAL_FK | FK-144 | TABLE-053.field_visit_id | TABLE-050.id / visits.field_visits.id | NOT NULL | RESTRICT; corrections additive | NO ACTION | NOT DEFERRABLE | Field Visits | Result retained | DMOD-15 |
| REL-062 | PHYSICAL_FK | FK-148 | TABLE-054.visit_result_id | TABLE-053.id / visits.visit_results.id | NOT NULL | RESTRICT; prior retained | NO ACTION | NOT DEFERRABLE | Field Visits | Append-only | DMOD-15 |
| REL-063 | PHYSICAL_FK | FK-150 | TABLE-055.field_visit_id | TABLE-050.id / visits.field_visits.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Field Visits | Evidence retained; optional FK-151 attachment_id | — |
| REL-064 | PHYSICAL_FK | FK-153 | TABLE-056.service_request_id | TABLE-024.id / requests.service_requests.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Dues | Basis/correction history; case XOR with REL-065 (CK-T02) | DM-09 |
| REL-065 | PHYSICAL_FK | FK-154 | TABLE-056.balagh_id | TABLE-037.id / balaghat.balaghs.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Dues | Basis/correction history; case XOR with REL-064 (CK-T02) | DM-09 |
| REL-066 | PHYSICAL_FK | FK-157 | TABLE-057.payment_due_id | TABLE-056.id / dues.payment_dues.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Dues | Basis retained; NestJS enforces ≥1 basis | — |
| REL-067 | PHYSICAL_FK | FK-160 | TABLE-058.payment_due_id | TABLE-056.id / dues.payment_dues.id | NOT NULL | RESTRICT; prior retained | NO ACTION | NOT DEFERRABLE | Dues | Reason/basis retained | — |
| REL-068 | PHYSICAL_FK | FK-162 | TABLE-059.payment_due_id | TABLE-056.id / dues.payment_dues.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Dues | Notice history | — |
| REL-069 | UNRESOLVED_NO_FK | — | TABLE-056 payment_dues allocation context | TABLE-060 payment_receipts — no fixed FK | N/A | N/A (no CASCADE path) | N/A | N/A | Dues / NestJS | Receipt lineage retained independently; no Due–Receipt FK or allocation table | DM-22 |
| REL-070 | PHYSICAL_FK | FK-168 | TABLE-061.payment_receipt_id | TABLE-060.id / dues.payment_receipts.id | NOT NULL | RESTRICT; original retained | NO ACTION | NOT DEFERRABLE | Dues | Lineage retained; optional FK-169 replaces_receipt_id | DM-22 |
| REL-071 | PHYSICAL_FK | FK-171 | TABLE-062.payment_receipt_id | TABLE-060.id / dues.payment_receipts.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Dues | Actor/time retained | — |
| REL-072 | POLYMORPHIC_VALIDATED | FK-176 | TABLE-064.attachment_id (+ owner_type, owner_id) | TABLE-063.id / files.attachments.id; owners polymorphic | attachment_id NOT NULL; owner_type/owner_id NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Attachments / NestJS | Link retained; owner_type+owner_id NestJS-validated; no single-target owner FK | — |
| REL-073 | EMBEDDED | — | TABLE-063.access_classification_code (and related columns) | Embedded on files.attachments (not a child table) | NOT NULL | N/A (embedded on parent) | N/A | N/A | Attachments | Reclass audited on parent | DM-10 |
| REL-074 | PHYSICAL_FK | FK-178 | TABLE-065.attachment_id | TABLE-063.id / files.attachments.id | NOT NULL | RESTRICT; prior retained | NO ACTION | NOT DEFERRABLE | Attachments | Version lineage | DM-26 |
| REL-075 | PHYSICAL_FK | FK-180 | TABLE-066.service_request_id | TABLE-024.id / requests.service_requests.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Notification Delivery | Delivery history | — |
| REL-076 | PHYSICAL_FK | FK-181 | TABLE-066.balagh_id | TABLE-037.id / balaghat.balaghs.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Notification Delivery | Delivery history | — |
| REL-077 | PHYSICAL_FK | FK-182 | TABLE-066.payment_notice_id | TABLE-059.id / dues.payment_notices.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Notification Delivery | Optional link retained | — |
| REL-078 | PHYSICAL_FK | FK-187 | TABLE-067.notification_message_id | TABLE-066.id / notify.notification_messages.id | NOT NULL | RESTRICT; never overwrite | NO ACTION | NOT DEFERRABLE | Notification Delivery | Attempt outcomes retained | — |
| REL-079 | PHYSICAL_FK | FK-188 | TABLE-068.delivery_attempt_id | TABLE-067.id / notify.delivery_attempts.id | NOT NULL | RESTRICT; prior retained | NO ACTION | NOT DEFERRABLE | Notification Delivery | Retry outcomes retained | — |
| REL-080 | PHYSICAL_FK | FK-183 | TABLE-066.template_id | TABLE-069.id / notify.notification_templates.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Notification Delivery | Historical template context | — |
| REL-081 | PHYSICAL_FK | FK-184 | TABLE-066.channel_config_id | TABLE-070.id / notify.notification_channel_configurations.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Notification Delivery | Historical channel context | DM-25 |
| REL-082 | PHYSICAL_FK | FK-193 | TABLE-071.notification_message_id | TABLE-066.id / notify.notification_messages.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Notification Delivery | First-read/ack retained; also FK-194 recipient_profile_id | DM-25 |
| REL-083 | PHYSICAL_FK | FK-198 | TABLE-074.import_batch_id | TABLE-073.id / imports.import_batches.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Imports | Preview retained | — |
| REL-084 | PHYSICAL_FK | FK-200 | TABLE-075.import_batch_id | TABLE-073.id / imports.import_batches.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Imports | Distinct lifecycle | DMOD-13 |
| REL-085 | PHYSICAL_FK | FK-202 | TABLE-076.import_batch_id | TABLE-073.id / imports.import_batches.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Imports | Row outcome retained | — |
| REL-086 | PHYSICAL_FK | FK-204 | TABLE-077.import_row_result_id | TABLE-076.id / imports.import_row_results.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Imports | Traceable | DM-12 |
| REL-087 | PHYSICAL_FK | FK-206 | TABLE-078.import_batch_id | TABLE-073.id / imports.import_batches.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Imports | Actor/time retained | DMOD-13 |
| REL-088 | PHYSICAL_FK | FK-208 | TABLE-079.import_batch_id | TABLE-073.id / imports.import_batches.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Imports | Actor/reason retained | — |
| REL-089 | PHYSICAL_FK | FK-210 | TABLE-080.import_batch_id | TABLE-073.id / imports.import_batches.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Imports | Failure retained | — |
| REL-090 | PHYSICAL_FK | FK-211 | TABLE-081.import_batch_id | TABLE-073.id / imports.import_batches.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Imports | Idempotency disposition | — |
| REL-091 | PHYSICAL_FK | FK-215 | TABLE-083.content_item_id | TABLE-082.id / content.content_items.id | NOT NULL | RESTRICT; prior retained | NO ACTION | NOT DEFERRABLE | Content Management | Revision history | DMOD-10 |
| REL-092 | PHYSICAL_FK | FK-217 | TABLE-084.content_item_id | TABLE-082.id / content.content_items.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Content Management | Publication retained | — |
| REL-093 | PHYSICAL_FK | FK-220 | TABLE-085.content_item_id | TABLE-082.id / content.content_items.id | NOT NULL | RESTRICT; not erase | NO ACTION | NOT DEFERRABLE | Content Management | Withdrawal retained | — |
| REL-094 | PHYSICAL_FK | FK-222 | TABLE-086.content_item_id | TABLE-082.id / content.content_items.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Content Management | Validity history | — |
| REL-095 | PHYSICAL_FK | FK-227 | TABLE-088.audit_event_id | TABLE-087.id / audit.audit_events.id | NOT NULL | RESTRICT; never hard-delete | NO ACTION | NOT DEFERRABLE | Audit and Security | Before/after where applicable; append-only | DM-13 |
| REL-096 | EMBEDDED | — | TABLE-087.actor_context (JSONB ± typed actor columns) | Embedded on audit.audit_events (not a child table) | NULL JSONB / typed actors NULL | N/A (embedded; never hard-delete parent) | N/A | N/A | Audit and Security | Actor context retained with event | DM-13 |
| REL-097 | PHYSICAL_FK | FK-231 | TABLE-090.projection_definition_id | TABLE-091.id / reporting.reporting_projection_definitions.id | NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Reporting | Source history authoritative; projections rebuildable | DM-15 |
| REL-098 | PHYSICAL_FK | FK-234 | TABLE-092.user_profile_id | TABLE-001.id / identity.user_profiles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Reporting | Filter history | DM-16 |
| REL-099 | PHYSICAL_FK | FK-237 | TABLE-093.projection_definition_id | TABLE-091.id / reporting.reporting_projection_definitions.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Reporting | Export retained/audited | DM-16 |
| REL-100 | PHYSICAL_FK | FK-238 | TABLE-093.requested_by_user_profile_id | TABLE-001.id / identity.user_profiles.id | NOT NULL | RESTRICT | NO ACTION | NOT DEFERRABLE | Reporting | Authorization context retained | — |

## Preserved design constraints

1. **Account Link path:** REL-001 + REL-009 + REL-010 encode Authentication Identity → User Profile → Taxpayer Account Link → Taxpayer.
2. **Selected branch → selected activity:** REL-028 and REL-044 are required FKs when a branch is selected.
3. **Ownership / Taxpayer↔Property:** REL-020 (property FK-060) + party FK-061 on TABLE-020; REL-022 is `DERIVED_VIEW` `masterdata.v_taxpayer_properties` only (DM-24). No second authoritative Taxpayer↔Property table/FK.
4. **Due–Receipt:** REL-069 is `UNRESOLVED_NO_FK`; no allocation table approved (DM-22).
5. **Request/Balagh isolation:** No cross-type history FKs.
6. **Polymorphic attachment links:** REL-072 is `POLYMORPHIC_VALIDATED` for `(owner_type, owner_id)`; FK-176 enforces link→attachment only.
7. **Actor context:** REL-096 is `EMBEDDED` on `audit.audit_events`.
8. **Access classification:** REL-073 is `EMBEDDED` on `files.attachments` (COLUMN mapping).
9. **CASCADE delete of submitted cases/decisions/receipts/visits/audit/imports:** **0** proposed.
10. **Logical holds_party edge:** Physical party integrity is FK-061 on TABLE-020 (documented under REL-020); REL-022 classifies the derived Taxpayer↔Property navigation required by DM-24.

## Exact enforcement class counts (REL-001–REL-100)

| Enforcement class | Exact count |
| --- | ---: |
| PHYSICAL_FK | 92 |
| MANAGED_SCHEMA_FK | 2 |
| APPLICATION_VALIDATED | 1 |
| DERIVED_VIEW | 1 |
| EMBEDDED | 2 |
| UNRESOLVED_NO_FK | 1 |
| POLYMORPHIC_VALIDATED | 1 |
| NO_PHYSICAL_ENFORCEMENT | 0 |
| **Total** | **100** |

| Metric | Exact count |
| --- | ---: |
| PHYSICAL_FK (among REL-001–REL-100) | 92 |
| MANAGED_SCHEMA_FK (among REL-001–REL-100) | 2 |
| CASCADE delete proposals for submitted cases/decisions/receipts/visits/audit/imports | 0 |

FK constraint IDs reference `MARIB-TAX-PHYSICAL-COLUMN-CONSTRAINT-CATALOG-01` (FK-001…).
