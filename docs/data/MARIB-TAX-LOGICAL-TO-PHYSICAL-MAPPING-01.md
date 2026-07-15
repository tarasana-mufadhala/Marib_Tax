# MARIB-TAX-LOGICAL-TO-PHYSICAL-MAPPING-01

**Document ID:** MARIB-TAX-LOGICAL-TO-PHYSICAL-MAPPING-01
**Status:** PROPOSED logical→physical mapping (documentation only)
**Baseline:** `MARIB-TAX-LOGICAL-DATA-MODEL-01` (92 entities)
**Companion:** `MARIB-TAX-PHYSICAL-SCHEMA-ARCHITECTURE-01`, `MARIB-TAX-PHYSICAL-TABLE-CATALOG-01`

> Unresolved items are **يحتاج اعتماد لاحق**. Recommendations are **PROPOSED** only. No executable SQL. No secrets.

## Mapping conventions

| Term | Meaning in this document |
| --- | --- |
| TABLE | Application-owned relational table (see table catalogue IDs) |
| MANAGED_REF | Supabase-managed object referenced by application (not app-owned DDL) |
| COLUMN | Logical entity represented as column(s) on a parent table |
| EMBEDDED | Value object / context stored as typed columns and/or JSONB on parent |
| VIEW | Derived read model; not authoritative |
| NONE | No independent physical object pending open decision |

Representation types used below: `TABLE`, `MANAGED_REF`, `COLUMN`, `EMBEDDED`, `VIEW`, `NONE`.

## Critical mapping decisions (PROPOSED)

| Topic | PROPOSED choice | Status |
| --- | --- | --- |
| Authentication Identity | Reference `auth.users` (Supabase-managed). No application password/credential table. | PROPOSED |
| Attachment Access Classification | Column(s) on `files.attachments` (not a separate table) | PROPOSED |
| Actor Context | **JSONB (and/or typed columns) embedded on `audit.audit_events`**. Optional child table only if multi-actor nested contexts are later required. | PROPOSED; exact shape **يحتاج اعتماد لاحق** (DM-13) |
| Decision Value Object | Embedded typed columns on `request_decision_records` / `balagh_decision_records` (and revisions); not a standalone table | PROPOSED |
| Taxpayer↔Property | **DERIVED VIEW only** from active ownership records; no second authoritative link (DM-24). Documented under Property Ownership Record rationale (not a 93rd entity). | PROPOSED |
| Property Ownership Record | `property_ownership_records` + optional `property_ownership_units` association for unit-level ownership | PROPOSED; alternatives OPEN below |
| Due–Receipt allocation | **No independent physical object pending DM-22**. Documented under Payment Receipt. Optional future `due_receipt_links` is non-approved. | **يحتاج اعتماد لاحق** (DM-22) |
| Request/Balagh form snapshots | Hybrid: typed header table + JSONB payload table | PROPOSED |
| Notification Read State | Dedicated table | PROPOSED |
| Taxpayer Account Link | Dedicated table | PROPOSED |

### Property ownership alternatives (OPEN — do not finalize business rule)

| Alternative | Description | Status |
| --- | --- | --- |
| A. Property-only | Ownership recorded only at property grain | OPEN — **يحتاج اعتماد لاحق** |
| B. Unit-only | Ownership recorded only at unit grain | OPEN — **يحتاج اعتماد لاحق** |
| C. Both | Property-level ownership record plus optional unit association rows | PROPOSED documentation option; **not** final business rule |

---

## Entity mapping (exactly 92 rows)

| # | Logical entity | Owning module | Proposed schema | Proposed physical object | Representation type | Aggregate root | Authoritative or derived | History strategy | Logical relationships covered | Rationale | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Authentication Identity | Identity and Access | auth | auth.users | MANAGED_REF | Authentication Identity | Authoritative (platform) | Platform Auth history; app audits sensitive auth outcomes | Identity→Profile linkage | Supabase Auth is credential authority; no app password table | Session/MFA policy **يحتاج اعتماد لاحق** |
| 2 | User Profile | Identity and Access | identity | identity.user_profiles | TABLE | User Profile | Authoritative | Soft lifecycle + audit on material change | Profile↔Identity; Profile↔Staff; Account Link | Application profile separate from Auth user | DM-14 |
| 3 | Staff Profile | Identity and Access | identity | identity.staff_profiles | TABLE | Staff Profile (child of User Profile) | Authoritative | Effective staff eligibility history | Staff↔Visit team; actor staff | Eligibility for visits and staff actions | Staff purpose fields **يحتاج اعتماد لاحق** |
| 4 | Role | Identity and Access | identity | identity.roles | TABLE | Role | Authoritative | Version via change audit; no silent overwrite of grants | Role↔Permission; Role↔Assignment | RBAC catalogue | Permission catalogue evolution **يحتاج اعتماد لاحق** |
| 5 | Permission | Identity and Access | identity | identity.permissions | TABLE | Permission | Authoritative | Catalogue change audited | Role Permission join | Stable permission codes for NestJS authz | — |
| 6 | Role Assignment | Identity and Access | identity | identity.role_assignments | TABLE | Role Assignment (child of Profile/Role) | Authoritative | Effective-dated grant/revoke history | Profile↔Role | Authorization evidence | — |
| 7 | Role Permission | Identity and Access | identity | identity.role_permissions | TABLE | Role Permission (child of Role) | Authoritative | Grant/revoke audited | Role↔Permission | Separates role definition from grants | — |
| 8 | Sensitive Permission Change | Identity and Access | identity | identity.sensitive_permission_changes | TABLE | Sensitive Permission Change | Authoritative (evidence) | Append-only evidence rows | Ties to Role Assignment/Permission changes | Elevated change evidence retained | Sensitive threshold DM-13 **يحتاج اعتماد لاحق** |
| 9 | Taxpayer | Taxpayer Registry | registry | registry.taxpayers | TABLE | Taxpayer | Authoritative | Correct/supersede/end-date; audit | Account Link; Contact; Association; Ownership party | Registry root for own-data | Merge/split DM-03 **يحتاج اعتماد لاحق** |
| 10 | Taxpayer Contact | Taxpayer Registry | registry | registry.taxpayer_contacts | TABLE | Taxpayer (child) | Authoritative | Supersede/end-date; audit | Taxpayer 1:N Contact | Contact channels Confidential | Masking policy **يحتاج اعتماد لاحق** |
| 11 | Taxpayer Account Link | Taxpayer Registry | registry | registry.taxpayer_account_links | TABLE | Taxpayer Account Link | Authoritative | Grant/revoke/verification history retained | Profile↔Taxpayer own-data path | Dedicated table; basis of own-data authorization | DM-21 multiplicity **يحتاج اعتماد لاحق** |
| 12 | Taxpayer Legal-Entity Association | Taxpayer Registry | registry | registry.taxpayer_legal_entity_associations | TABLE | Association | Authoritative | Effective-dated evidence-backed | Taxpayer↔Legal Entity | Registry owns association; Legal owns entity/tax number | — |
| 13 | Legal Entity | Legal Entities | legal | legal.legal_entities | TABLE | Legal Entity | Authoritative | Register/replace/archive | Entity↔Tax Number; Association read | Master legal party | — |
| 14 | Tax Number | Legal Entities | legal | legal.tax_numbers | TABLE | Tax Number (owned by Legal Entity) | Authoritative | Issue/verify/replace/invalidate lineage | Legal Entity 1:N Tax Number | Not owned by Registry | DM-04/DM-23 uniqueness **يحتاج اعتماد لاحق** |
| 15 | Commercial Activity | Activities and Branches | masterdata | masterdata.commercial_activities | TABLE | Commercial Activity | Authoritative | Effective-date/correct/archive | Activity↔Branch; Address; Status History | Master activity aggregate | DM-05 **يحتاج اعتماد لاحق** |
| 16 | Branch | Activities and Branches | masterdata | masterdata.branches | TABLE | Branch (child of Activity) | Authoritative | Branch-scoped effects; audit target scope | Activity 1:N Branch | Unrelated branches unchanged unless activity-wide effect | IR-72 |
| 17 | Activity Address | Activities and Branches | masterdata | masterdata.activity_addresses | TABLE | Activity/Branch address child | Authoritative | Effective-dated address history | Address belongs to Activity/Branch scope | Address-change effects validated by owner | Geo structure OD-05 **يحتاج اعتماد لاحق** |
| 18 | Activity Status History | Activities and Branches | masterdata | masterdata.activity_status_histories | TABLE | History child of Activity | Authoritative (history) | Append-only status transitions | Activity status lineage | Preserves stop/reactivate evidence | — |
| 19 | Property | Activities and Branches | masterdata | masterdata.properties | TABLE | Property | Authoritative | Survives ownership transfer | Property↔Unit; Ownership Record | Physical property identity | — |
| 20 | Property Unit | Activities and Branches | masterdata | masterdata.property_units | TABLE | Property Unit (child of Property) | Authoritative | Unit lifecycle under Property | Property 1:N Unit | Unit grain for optional ownership association | Unit ownership rule OPEN |
| 21 | Property Ownership Record | Activities and Branches | masterdata | masterdata.property_ownership_records (+ optional masterdata.property_ownership_units); derived VIEW masterdata.v_taxpayer_properties | TABLE (+ optional assoc TABLE; VIEW for Taxpayer↔Property) | Property Ownership Record | Authoritative (record); Taxpayer↔Property is Derived VIEW only | Current via record; prior via history | REL-020–REL-022; DM-24 derived navigation | Authoritative taxpayer/property relation; unit association PROPOSED/open; no second authoritative Taxpayer↔Property table | Alternatives A/B/C OPEN — **يحتاج اعتماد لاحق** |
| 22 | Property Ownership History | Activities and Branches | masterdata | masterdata.property_ownership_histories | TABLE | History child of Ownership Record | Authoritative (history) | Append-only transfer/revise | Ownership Record 1:N History | Never overwrite prior ownership | DM-24 |
| 23 | Service Type | Service Requests | requests | requests.service_types | TABLE | Service Type | Authoritative (config) | Config change audited | Service Request N:1 Type | Catalogue of service kinds | Versioned services ADR-008 alignment **يحتاج اعتماد لاحق** |
| 24 | Service Request | Service Requests | requests | requests.service_requests | TABLE | Service Request | Authoritative | Full lifecycle retained | Root for all request_* children | طلب aggregate root; not named `cases` | — |
| 25 | Request Selected Activity | Service Requests | requests | requests.request_selected_activities | TABLE | Service Request (child) | Authoritative (case selection) | Retained with request | Request↔Activity selection | Snapshot of selected activity scope | — |
| 26 | Request Selected Branch | Service Requests | requests | requests.request_selected_branches | TABLE | Selected Activity (child) | Authoritative (case selection) | Retained with request | Belongs to Request Selected Activity (REL-028) | Branch selection nested under selected activity | — |
| 27 | Request Form/Data Snapshot | Service Requests | requests | requests.request_form_snapshots + requests.request_form_snapshot_payloads | TABLE | Service Request (child) | Authoritative (immutable snapshot intent) | Append/new version; do not rewrite payload silently | Request form evidence | Hybrid typed header + JSONB payload tables | Payload schema versioning **يحتاج اعتماد لاحق** |
| 28 | Request Status History | Service Requests | requests | requests.request_status_histories | TABLE | Service Request (child) | Authoritative (history) | Append-only | Status transitions | Workflow evidence | Reason catalogs DM-06 **يحتاج اعتماد لاحق** |
| 29 | Request Assignment History | Service Requests | requests | requests.request_assignment_histories | TABLE | Service Request (child) | Authoritative (history) | Append-only | Assignment changes | Staff assignment evidence | — |
| 30 | Request Completion Request | Service Requests | requests | requests.request_completion_requests | TABLE | Service Request (child) | Authoritative | Retained | Completion cycle | Non-final completion ask | — |
| 31 | Request Completion Response | Service Requests | requests | requests.request_completion_responses | TABLE | Service Request (child) | Authoritative | Retained | Response to completion request | Non-final | — |
| 32 | Request Decision Record | Service Requests | requests | requests.request_decision_records | TABLE | Service Request (child) | Authoritative | Retain + revisions | Final/manager decision; Decision VO embedded as columns | Decision Value Object embedded, not a table | DM-07 visibility **يحتاج اعتماد لاحق** |
| 33 | Request Decision Revision | Service Requests | requests | requests.request_decision_revisions | TABLE | Decision Record (child) | Authoritative (history) | Append-only revisions | Decision lineage | Correction without silent overwrite | DMOD-14 **يحتاج اعتماد لاحق** |
| 34 | Request Close/Archive Record | Service Requests | requests | requests.request_close_archive_records | TABLE | Service Request (child) | Authoritative | Retained | Close/archive event | Closed vs archived semantics OPEN | DMOD-01 **يحتاج اعتماد لاحق** |
| 35 | Request Reopen Record | Service Requests | requests | requests.request_reopen_records | TABLE | Service Request (child) | Authoritative | Retained | Reopen event | Authority policy OPEN | DMOD-11 **يحتاج اعتماد لاحق** |
| 36 | Business Notification / Balagh | Business Notifications / Balaghat | balaghat | balaghat.balaghs | TABLE | Balagh | Authoritative | Full lifecycle retained | Root for all balagh_* children | Distinct from requests; no subject mutation | — |
| 37 | Balagh Selected Activity | Business Notifications / Balaghat | balaghat | balaghat.balagh_selected_activities | TABLE | Balagh (child) | Authoritative (case selection) | Retained | Multi-activity selection | Multiple activities allowed | — |
| 38 | Balagh Selected Branch | Business Notifications / Balaghat | balaghat | balaghat.balagh_selected_branches | TABLE | Selected Activity (child) | Authoritative (case selection) | Retained | Belongs to Balagh Selected Activity (REL-044) | Nested under selected activity | — |
| 39 | Balagh Form/Data Snapshot | Business Notifications / Balaghat | balaghat | balaghat.balagh_form_snapshots + balaghat.balagh_form_snapshot_payloads | TABLE | Balagh (child) | Authoritative (immutable snapshot intent) | Append/new version | Balagh form evidence | Hybrid typed header + JSONB payload tables | Payload versioning **يحتاج اعتماد لاحق** |
| 40 | Balagh Status History | Business Notifications / Balaghat | balaghat | balaghat.balagh_status_histories | TABLE | Balagh (child) | Authoritative (history) | Append-only | Status transitions | Workflow evidence | DM-06 **يحتاج اعتماد لاحق** |
| 41 | Balagh Assignment History | Business Notifications / Balaghat | balaghat | balaghat.balagh_assignment_histories | TABLE | Balagh (child) | Authoritative (history) | Append-only | Assignment changes | Staff assignment evidence | — |
| 42 | Balagh Completion Request | Business Notifications / Balaghat | balaghat | balaghat.balagh_completion_requests | TABLE | Balagh (child) | Authoritative | Retained | Completion cycle | Non-final | — |
| 43 | Balagh Completion Response | Business Notifications / Balaghat | balaghat | balaghat.balagh_completion_responses | TABLE | Balagh (child) | Authoritative | Retained | Completion response | Non-final | — |
| 44 | Balagh Decision Record | Business Notifications / Balaghat | balaghat | balaghat.balagh_decision_records | TABLE | Balagh (child) | Authoritative | Retain + revisions | Decision VO embedded as columns | Embedded decision columns, not table | DM-07 **يحتاج اعتماد لاحق** |
| 45 | Balagh Decision Revision | Business Notifications / Balaghat | balaghat | balaghat.balagh_decision_revisions | TABLE | Decision Record (child) | Authoritative (history) | Append-only | Decision lineage | Additive corrections | DMOD-14 **يحتاج اعتماد لاحق** |
| 46 | Balagh Close/Archive Record | Business Notifications / Balaghat | balaghat | balaghat.balagh_close_archive_records | TABLE | Balagh (child) | Authoritative | Retained | Close/archive | Closed vs archived OPEN | DMOD-01 **يحتاج اعتماد لاحق** |
| 47 | Balagh Reopen Record | Business Notifications / Balaghat | balaghat | balaghat.balagh_reopen_records | TABLE | Balagh (child) | Authoritative | Retained | Reopen | Authority OPEN | DMOD-11 **يحتاج اعتماد لاحق** |
| 48 | Field Visit | Field Visits | visits | visits.field_visits | TABLE | Field Visit | Authoritative | Plan→archive lifecycle | Request/Balagh context refs | Visit aggregate root | Trigger rules DMOD-08 **يحتاج اعتماد لاحق** |
| 49 | Visit Schedule | Field Visits | visits | visits.visit_schedules | TABLE | Field Visit (child) | Authoritative | Schedule revisions audited | Visit schedule | Operational planning | — |
| 50 | Visit Team Member | Field Visits | visits | visits.visit_team_members | TABLE | Field Visit (child) | Authoritative | Membership history retained | References eligible Staff Profile | Team eligibility trace | Masking DM-08 **يحتاج اعتماد لاحق** |
| 51 | Visit Result | Field Visits | visits | visits.visit_results | TABLE | Field Visit (child) | Authoritative | Corrections additive | Visit findings | Non-final for case decision | Result structure DM-08 **يحتاج اعتماد لاحق** |
| 52 | Visit Result Correction | Field Visits | visits | visits.visit_result_corrections | TABLE | Visit Result (child) | Authoritative (history) | Append-only | Result correction lineage | No silent overwrite | DMOD-15 **يحتاج اعتماد لاحق** |
| 53 | Visit Evidence | Field Visits | visits | visits.visit_evidences | TABLE | Field Visit (child) | Authoritative | Link retention | Visit↔Attachment | Evidence linkage; binaries in Storage | — |
| 54 | Payment Due | Dues and Payment Evidence | dues | dues.payment_dues | TABLE | Payment Due | Authoritative | Assess/correct/archive | Due basis; corrections; notices | Manual due model | DM-09/DM-22 **يحتاج اعتماد لاحق** |
| 55 | Due Basis Document Reference | Dues and Payment Evidence | dues | dues.due_basis_document_references | TABLE | Payment Due (child) | Authoritative | Retained | Due↔basis docs/attachments | Basis evidence references | — |
| 56 | Due Correction | Dues and Payment Evidence | dues | dues.due_corrections | TABLE | Payment Due (child) | Authoritative (history) | Append-only | Due correction lineage | Additive corrections | DM-09 **يحتاج اعتماد لاحق** |
| 57 | Payment Notice | Dues and Payment Evidence | dues | dues.payment_notices | TABLE | Payment Due (child) / Notice | Authoritative | Issue/archive | Optional notify context | Notice to pay | — |
| 58 | Payment Receipt | Dues and Payment Evidence | dues | dues.payment_receipts | TABLE | Payment Receipt | Authoritative | Accept/replace lineage | Receipt lineage; REL-069 allocation undecided | Receipt evidence only; **no independent Due–Receipt allocation physical object pending DM-22** (optional future `due_receipt_links` non-approved) | DM-22 **يحتاج اعتماد لاحق** |
| 59 | Receipt Correction/Replacement | Dues and Payment Evidence | dues | dues.receipt_correction_replacements | TABLE | Payment Receipt (child) | Authoritative (history) | Append-only replacement lineage | Receipt lineage | Replacement vs multi-evidence OPEN | DM-22 **يحتاج اعتماد لاحق** |
| 60 | Payment Confirmation | Dues and Payment Evidence | dues | dues.payment_confirmations | TABLE | Confirmation (child of receipt path) | Authoritative | Retained | Requires accepted receipt | Payment not final case approval | Confirmation rules DM-09 **يحتاج اعتماد لاحق** |
| 61 | Attachment | Attachments and Private Files | files | files.attachments | TABLE | Attachment | Authoritative | Version/withdraw/archive | Links; classification columns; Storage key | Metadata + access classification columns on same table | DM-10/DM-26 **يحتاج اعتماد لاحق** |
| 62 | Attachment Link | Attachments and Private Files | files | files.attachment_links | TABLE | Attachment (child) | Authoritative | Link add/remove audited | Polymorphic link to business parents | Does not authorize file access by reference alone | — |
| 63 | Attachment Access Classification | Attachments and Private Files | files | files.attachments.access_classification (+ related columns) | COLUMN | Attachment | Authoritative on parent | Reclassification audited | Attachment 1:1 classification (REL-073) | Not a separate table | Classification taxonomy **يحتاج اعتماد لاحق** |
| 64 | Attachment Version/Replacement History | Attachments and Private Files | files | files.attachment_version_histories | TABLE | Attachment (child) | Authoritative (history) | Append-only versions | Current-version indicator on parent | Replaced versions retained per policy | Retention DMOD-09 **يحتاج اعتماد لاحق** |
| 65 | Notification Message | Notification Delivery | notify | notify.notification_messages | TABLE | Notification Message | Authoritative | Request→archive | Attempts; read state; optional Payment Notice | Delivery content/context minimized | OTP minimization DM-11 **يحتاج اعتماد لاحق** |
| 66 | Delivery Attempt | Notification Delivery | notify | notify.delivery_attempts | TABLE | Message (child) | Authoritative (history) | Append-only | Message 1:N attempts | Channel attempt evidence | — |
| 67 | Delivery Retry | Notification Delivery | notify | notify.delivery_retries | TABLE | Attempt/Message (child) | Authoritative (history) | Append-only | Retry schedule/outcome | Distinct from attempt where useful | Retry policy **يحتاج اعتماد لاحق** |
| 68 | Notification Template/Type | Notification Delivery | notify | notify.notification_templates | TABLE | Template/Type | Authoritative (config) | Config change audited | Message N:1 template | Template catalogue | — |
| 69 | Notification Channel Configuration | Notification Delivery | notify | notify.notification_channel_configurations | TABLE | Channel Configuration | Authoritative (config) | Config change audited | Channel settings | Operational channel config; secrets never in docs | — |
| 70 | Notification Read State | Notification Delivery | notify | notify.notification_read_states | TABLE | Read State (child of Message × recipient) | Authoritative | First-read / acknowledgement retained | Recipient-specific read | Dedicated table; delivery ≠ read | DM-25 **يحتاج اعتماد لاحق** |
| 71 | Import Batch | Imports and Data Quality | imports | imports.import_batches | TABLE | Import Batch | Authoritative | Preview→commit/fail retained | Root for import lifecycle | Batch identity + idempotency | DM-12 **يحتاج اعتماد لاحق** |
| 72 | Import Preview | Imports and Data Quality | imports | imports.import_previews | TABLE | Import Batch (child) | Authoritative | Retained | Preview evidence | Separate retained lifecycle record | — |
| 73 | Import Validation Result | Imports and Data Quality | imports | imports.import_validation_results | TABLE | Import Batch (child) | Authoritative | Retained | Validation summary | Distinct from row results | Taxonomy **يحتاج اعتماد لاحق** |
| 74 | Import Row Result | Imports and Data Quality | imports | imports.import_row_results | TABLE | Import Batch (child) | Authoritative | Retained | Per-row outcome | Row-level evidence | — |
| 75 | Import Error | Imports and Data Quality | imports | imports.import_errors | TABLE | Import Batch (child) | Authoritative | Retained | Error catalogue rows | Source/error files private | — |
| 76 | Import Approval | Imports and Data Quality | imports | imports.import_approvals | TABLE | Import Batch (child) | Authoritative | Retained | Approval actors | Two-person policy OPEN | DMOD-13 **يحتاج اعتماد لاحق** |
| 77 | Import Rejection | Imports and Data Quality | imports | imports.import_rejections | TABLE | Import Batch (child) | Authoritative | Retained | Rejection outcome | Separate from failure | — |
| 78 | Import Failure | Imports and Data Quality | imports | imports.import_failures | TABLE | Import Batch (child) | Authoritative | Retained | Technical/process failure | Separate retained record | — |
| 79 | Import Commit | Imports and Data Quality | imports | imports.import_commits | TABLE | Import Batch (child) | Authoritative | Retained | Commit disposition + correlation | Applied via owning modules after commit | Idempotency DM-20 **يحتاج اعتماد لاحق** |
| 80 | Domain Event History Record | Reporting and Analytics | reporting | reporting.domain_event_history_records | TABLE | Domain Event History Record | Derived/supporting | Append-oriented analytics history | Feeds projections | Not transactional decision owner | Freshness DM-15 **يحتاج اعتماد لاحق** |
| 81 | Reporting Projection Definition | Reporting and Analytics | reporting | reporting.reporting_projection_definitions | TABLE | Projection Definition | Authoritative (definition) / derived (materialization) | Definition versioned; rebuild policy OPEN | Projection catalogue | Reporting does not mutate business tx | Rebuild/reconcile DM-15 **يحتاج اعتماد لاحق** |
| 82 | Saved Report Filter | Reporting and Analytics | reporting | reporting.saved_report_filters | TABLE | Saved Report Filter | Authoritative (user preference) | Soft-delete/archive OPEN | Profile-owned filters | Confidential filters | Masking DM-16 **يحتاج اعتماد لاحق** |
| 83 | Report Export Record | Reporting and Analytics | reporting | reporting.report_export_records | TABLE | Report Export Record | Authoritative (export evidence) | Retained with requester Profile | Export ≠ view permission | Export artifacts private | Scheduling DMOD-12 **يحتاج اعتماد لاحق** |
| 84 | Content Item | Content Management | content | content.content_items | TABLE | Content Item | Authoritative | Revision lineage | Item↔Revision↔Publication | Public only under publication rules | DMOD-10 **يحتاج اعتماد لاحق** |
| 85 | Content Revision | Content Management | content | content.content_revisions | TABLE | Content Item (child) | Authoritative | Append revisions | Revision lineage | Immutable revision bodies preferred | — |
| 86 | Publication Record | Content Management | content | content.publication_records | TABLE | Content Item (child) | Authoritative | Retained | Publication evidence | Required before Public attachment context | — |
| 87 | Withdrawal Record | Content Management | content | content.withdrawal_records | TABLE | Content Item (child) | Authoritative | Retained | Withdrawal/reclassification | Auditable withdrawal | — |
| 88 | Announcement Validity Period | Content Management | content | content.announcement_validity_periods | TABLE | Content Item (child) | Authoritative | Effective period history | Validity window | Announcement scheduling | — |
| 89 | Audit Event | Audit and Security | audit | audit.audit_events | TABLE | Audit Event | Authoritative (evidence) | Append-only; no hard-delete | Actor Context embedded on event; sensitive detail child | Supporting evidence only | Catalogue DM-13 **يحتاج اعتماد لاحق** |
| 90 | Sensitive Change Detail | Audit and Security | audit | audit.sensitive_change_details | TABLE | Audit Event (child) | Authoritative (evidence) | Append-only | Previous/new values | Narrowly authorized readers | Threshold **يحتاج اعتماد لاحق** |
| 91 | Actor Context | Audit and Security | audit | audit.audit_events.actor_context (JSONB ± typed columns) | EMBEDDED | Audit Event | Authoritative on parent | Retained with event | Audit Event 1:1 Actor Context (REL-096) | Prefer embed on audit_events; child table only if later needed | Exact shape DM-13 **يحتاج اعتماد لاحق** |
| 92 | Access/Security Event | Audit and Security | audit | audit.access_security_events | TABLE | Access/Security Event | Authoritative (evidence) | Append-only | Security/access taxonomy | Minimized payloads | DM-18 **يحتاج اعتماد لاحق** |

## Entity row count check

| Check | Count |
| --- | ---: |
| Logical entities from baseline | 92 |
| Mapping rows (#1–#92) | **92** |

## Representation summary (exact; sums to 92 logical entities)

Exactly one principal representation category per logical entity:

| Principal representation category | Count | Notes |
| --- | ---: | --- |
| TABLE | 89 | Application TABLE(s); hybrid Form/Data Snapshot entities counted once as TABLE (header + optional payload child) |
| COLUMN | 1 | Attachment Access Classification |
| EMBEDDED | 1 | Actor Context on `audit.audit_events` |
| JSONB SNAPSHOT | 0 | No entity is principally only a JSONB snapshot (payload tables are secondary physical objects under TABLE hybrids) |
| VIEW | 0 | No entity is principally only a VIEW (`v_taxpayer_properties` is an additional object under Property Ownership Record) |
| MATERIALIZED PROJECTION | 0 | Reporting projections are physical tables under Reporting entities counted as TABLE where applicable |
| MANAGED REFERENCE | 1 | Authentication Identity → `auth.users` (not an application TABLE ID) |
| DERIVED ONLY | 0 | No entity is solely derived without a principal store |
| NONE / UNRESOLVED | 0 | No entity lacks a principal representation; Due–Receipt allocation remains an additional unresolved stance on Payment Receipt (DM-22), not a separate entity |
| **Sum (logical entities)** | **92** | Matches baseline entity count |

Additional non-entity physical dispositions (do **not** add to the 92):

| Disposition | Count | Notes |
| --- | --- | --- |
| VIEW (additional object) | 1 | `masterdata.v_taxpayer_properties` under Property Ownership Record (not a separate logical entity; not a TABLE ID) |
| NONE / UNRESOLVED (additional stance) | 1 | Due–Receipt allocation pending DM-22 (documented on Payment Receipt; no TABLE ID) |
| JSONB payload child tables | 2 | TABLE-028 and TABLE-041 — secondary physical tables under Form/Data Snapshot hybrids |

### Dual outbox (infrastructure TABLE IDs; no logical entities)

| Physical object | TABLE ID | Role |
| --- | --- | --- |
| `audit.domain_event_outbox` | TABLE-094 | Business **domain event** transactional outbox (ADR-007 pattern family) |
| `notify.notification_outbox_messages` | TABLE-072 | **Notification delivery** processing queue only — not domain events |

### Physical TABLE IDs reconciliation

Exact path from the 92 logical entities to catalogued TABLE IDs:

| Step | Delta | Running total | Explanation |
| --- | ---: | ---: | --- |
| TABLE logical entities | +89 | 89 | One principal TABLE disposition per TABLE-typed logical entity (snapshot entities counted once) |
| + `requests.request_form_snapshot_payloads` | +1 | 90 | Second physical table for Request Form/Data Snapshot hybrid (TABLE-028; header is TABLE-027) |
| + `balaghat.balagh_form_snapshot_payloads` | +1 | 91 | Second physical table for Balagh Form/Data Snapshot hybrid (TABLE-041; header is TABLE-040) |
| + TABLE-021 `masterdata.property_ownership_units` | +1 | 92 | Conditional/open unit-association table under the same Property Ownership Record logical entity |
| + TABLE-072 `notify.notification_outbox_messages` | +1 | 93 | INFRASTRUCTURE notification delivery outbox; **no** logical entity |
| + TABLE-094 `audit.domain_event_outbox` | +1 | 94 | INFRASTRUCTURE domain-event outbox; **no** logical entity |
| − Authentication Identity as table | 0 | 94 | `auth.users` is MANAGED_REF only — **not** a TABLE ID |
| − COLUMN / EMBEDDED as tables | 0 | 94 | Attachment Access Classification and Actor Context are not TABLE IDs |
| − Derived VIEW / NONE allocation | 0 | 94 | `v_taxpayer_properties` and pending Due–Receipt link are not TABLE IDs |
| **Total TABLE IDs** | | **94** | TABLE-001 … TABLE-094 |

Check: 89 + 1 + 1 + 1 + 1 + 1 = **94**.

## Related documents

- `MARIB-TAX-PHYSICAL-SCHEMA-ARCHITECTURE-01.md`
- `MARIB-TAX-PHYSICAL-TABLE-CATALOG-01.md`
- `docs/governance/MARIB-TAX-DATA-MODEL-OPEN-DECISIONS-01.md`
