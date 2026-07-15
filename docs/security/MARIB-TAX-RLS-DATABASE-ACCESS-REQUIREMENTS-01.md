# MARIB-TAX-RLS-DATABASE-ACCESS-REQUIREMENTS-01

**Document ID:** MARIB-TAX-RLS-DATABASE-ACCESS-REQUIREMENTS-01
**Status:** Database access **requirements** only (documentation; **no `CREATE POLICY`**, no executable SQL)
**Companion catalogue:** `MARIB-TAX-PHYSICAL-TABLE-CATALOG-01` (TABLE-001 … TABLE-094)

### Purpose

State how PostgreSQL/Supabase row access must behave relative to NestJS authorization, Account Link own-data scope, staff roles, reporting, storage, and audit. This is a requirements baseline for a future RLS/policy design—not the policies themselves.

---

## 1. Cross-cutting requirements

| ID | Requirement |
| --- | --- |
| RLS-01 | **Default-deny** for client-facing database roles on all operational schemas. |
| RLS-02 | Flutter / Next.js **must not** `INSERT` / `UPDATE` / `DELETE` authoritative operational tables; mutations go through NestJS (ADR-010). |
| RLS-03 | Own-data read scope requires Authentication Identity → User Profile → **active Taxpayer Account Link** → Taxpayer. Phone/tax match is insufficient. |
| RLS-04 | Staff access requires Staff Profile + Role Assignment / Permission checks; UI hiding is not authorization. |
| RLS-05 | Manager/director final approve/reject is distinct from reviewer recommendation; payment officer and field officer actions are **non-final**. |
| RLS-06 | `report.view` does not imply `report.export`. |
| RLS-07 | Service-role (privileged) credentials are backend/worker only; never in clients. |
| RLS-08 | Audit and sensitive-change tables are append-oriented and access-restricted; clients do not update/delete them. |
| RLS-09 | Storage object access is not granted by path knowledge; signed URLs follow NestJS authorization (see storage design). |
| RLS-10 | No silent staff/taxpayer merge; no public access to admin functions. |

Exact RLS expression strategy (JWT claims vs security-definer functions vs API-only) remains **يحتاج اعتماد لاحق**—requirements below must hold regardless of mechanism.

---

## 2. Access classification legend

| Class | Meaning |
| --- | --- |
| **authoritative** | Baseline transactional / catalogue / evidence table owned by a NestJS module |
| **conditional** | Catalogued but adoption open (`CONDITIONAL_OPEN`) |
| **derived** | Reporting/projection supporting object; not transactional decision owner |
| **infra** | Worker/outbox infrastructure (`BACKEND_ONLY_INFRASTRUCTURE`) |
| **Not client-exposed** | No direct client SQL/API to the table; NestJS/service-role only |
| **Backend-only** | Readable/writable only by NestJS/worker privileged path |
| **Controlled read** | Possible constrained read for authenticated subjects under Account Link or staff permission; no client writes |
| **Storage** | Bytes in Storage; metadata may be controlled read; uploads mediated by NestJS |
| **Reporting restricted** | Analytical projections/filters/exports; view vs export separated; masking applies |
| **Audit restricted** | Narrow break-glass / audit roles only; append-only |
| **BACKEND_ONLY_INFRASTRUCTURE** | Outbox/worker tables: no client exposure; backend/worker only |

Matrix defaults (unless a cell states otherwise):

- **anon SELECT** = NO
- **client INSERT / UPDATE / DELETE** = NO (transactional default-deny)
- **backend write** = YES (NestJS and/or worker privileged path as designed)
- **RLS required** = YES (PROPOSED defense-in-depth; NestJS remains authorization authority)
- **grant posture** = default-deny for anon/authenticated client roles; privileged grants to NestJS/worker roles only

No `CREATE POLICY` statements appear in this document.

---

## 3. Access matrix (TABLE-001 … TABLE-094)

| TABLE ID | schema.table | owning module | class | client exposure class | anon SELECT | auth SELECT | client INSERT | client UPDATE | client DELETE | backend write | taxpayer own-data condition | staff permission condition | report.view | report.export | audit restriction | attachment/storage restriction | RLS required | grant posture | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TABLE-001 | identity.user_profiles | Identity and Access | authoritative | Controlled read (own) / Backend-only otherwise | NO | Constrained via NestJS | NO | NO | NO | YES | Own profile via Auth→Profile | Staff directory tightly permissioned | NO | NO | Material change audited | — | YES | default-deny; backend privileged | DM-14 **يحتاج اعتماد لاحق** |
| TABLE-002 | identity.staff_profiles | Identity and Access | authoritative | Controlled read (own) / Backend-only otherwise | NO | Constrained via NestJS | NO | NO | NO | YES | N/A (staff subject) | Own staff profile; directory tightly permissioned | NO | NO | Eligibility changes audited | — | YES | default-deny; backend privileged | Staff purpose **يحتاج اعتماد لاحق** |
| TABLE-003 | identity.roles | Identity and Access | authoritative | Not client-exposed | NO | NO direct | NO | NO | NO | YES | NO | Identity admin permission | NO | NO | Catalogue change audited | — | YES | default-deny; backend privileged | Catalogue evolution **يحتاج اعتماد لاحق** |
| TABLE-004 | identity.permissions | Identity and Access | authoritative | Not client-exposed | NO | NO direct | NO | NO | NO | YES | NO | Identity admin permission | NO | NO | Catalogue change audited | — | YES | default-deny; backend privileged | — |
| TABLE-005 | identity.role_assignments | Identity and Access | authoritative | Not client-exposed | NO | NO direct | NO | NO | NO | YES | NO | Identity admin permission | NO | NO | Grant/revoke history restricted | — | YES | default-deny; backend privileged | — |
| TABLE-006 | identity.role_permissions | Identity and Access | authoritative | Not client-exposed | NO | NO direct | NO | NO | NO | YES | NO | Identity admin permission | NO | NO | Grant/revoke audited | — | YES | default-deny; backend privileged | — |
| TABLE-007 | identity.sensitive_permission_changes | Identity and Access | authoritative | Audit restricted | NO | NO | NO | NO | NO | YES (append) | NO | Audit / security reviewer only | NO | NO | YES — Audit Restricted | — | YES | default-deny; audit privileged | Sensitive threshold DM-13 **يحتاج اعتماد لاحق** |
| TABLE-008 | registry.taxpayers | Taxpayer Registry | authoritative | Controlled read (own) / Backend-only otherwise | NO | Constrained via NestJS | NO | NO | NO | YES | Active Account Link → Taxpayer | Registry / case staff permission | Masked only | Masked export only with export grant | Merge/correct audited | — | YES | default-deny; backend privileged | DM-03 **يحتاج اعتماد لاحق** |
| TABLE-009 | registry.taxpayer_contacts | Taxpayer Registry | authoritative | Controlled read (own) / Backend-only otherwise | NO | Constrained via NestJS | NO | NO | NO | YES | Own taxpayer via Account Link | Purpose-limited staff permission | Masked only | Masked export only with export grant | Contact history audited | — | YES | default-deny; backend privileged | Masking **يحتاج اعتماد لاحق** |
| TABLE-010 | registry.taxpayer_account_links | Taxpayer Registry | authoritative | Controlled read (own links) / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Own links only (read) | Registry admin for grant/revoke | Limited | NO | Full grant/revoke history | — | YES | default-deny; backend privileged | DM-21 **يحتاج اعتماد لاحق** |
| TABLE-011 | registry.taxpayer_legal_entity_associations | Taxpayer Registry | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Own taxpayer associations | Registry / Legal readers by permission | Yes (masked) | Export with grant | Evidence-backed history | — | YES | default-deny; backend privileged | — |
| TABLE-012 | legal.legal_entities | Legal Entities | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Via own association path | Legal / Registry permission | Yes (masked) | Export with grant | Change audited | — | YES | default-deny; backend privileged | — |
| TABLE-013 | legal.tax_numbers | Legal Entities | authoritative | Controlled read (masked) / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Via own association path (masked) | Legal permission; Highly Sensitive | Masked only | Masked export with grant | Issuance lineage audited | — | YES | default-deny; backend privileged | DM-04/DM-23 **يحتاج اعتماد لاحق** |
| TABLE-014 | masterdata.commercial_activities | Activities and Branches | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Own-data related activities via Account Link | Activities / case staff permission | Yes | Export with grant | Status/address effects audited | — | YES | default-deny; backend privileged | DM-05 **يحتاج اعتماد لاحق** |
| TABLE-015 | masterdata.branches | Activities and Branches | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Own-data related branches | Activities / case staff; IR-72 scope | Yes | Export with grant | Target-scope audited | — | YES | default-deny; backend privileged | — |
| TABLE-016 | masterdata.activity_addresses | Activities and Branches | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Own-data related addresses | Purpose-limited staff | Yes | Export with grant | Address history audited | — | YES | default-deny; backend privileged | OD-05 geo **يحتاج اعتماد لاحق** |
| TABLE-017 | masterdata.activity_status_histories | Activities and Branches | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Own-data related history | Audit/Reporting/Activities permission | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | — |
| TABLE-018 | masterdata.properties | Activities and Branches | authoritative | Controlled read (purpose-limited) / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Own via active ownership path | Activities / ownership staff | Yes | Export with grant | Ownership history separate | — | YES | default-deny; backend privileged | — |
| TABLE-019 | masterdata.property_units | Activities and Branches | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Own via ownership path | Activities staff | Yes | Export with grant | Unit changes audited | — | YES | default-deny; backend privileged | — |
| TABLE-020 | masterdata.property_ownership_records | Activities and Branches | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Own as ownership party via Account Link | Activities / ownership staff | Yes | Export with grant | Prior ownership retained | — | YES | default-deny; backend privileged | Ownership grain OPEN |
| TABLE-021 | masterdata.property_ownership_units | Activities and Branches | conditional | Controlled read / Backend-only mutations — **CONDITIONAL_OPEN** | NO | Constrained via NestJS if adopted | NO | NO | NO | YES if adopted | Own via ownership path if adopted | Activities staff if adopted | Yes if adopted | Export with grant if adopted | Audited if adopted | — | YES | default-deny; backend privileged | **CONDITIONAL_OPEN** — alternatives A/B/C **يحتاج اعتماد لاحق** |
| TABLE-022 | masterdata.property_ownership_histories | Activities and Branches | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Own ownership history path | Audit/Reporting/Activities | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | DM-24 |
| TABLE-023 | requests.service_types | Service Requests | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Read catalogue where allowed | Config admin for mutations | Limited | NO | Config change audited | — | YES | default-deny; backend privileged | ADR-008 versioning **يحتاج اعتماد لاحق** |
| TABLE-024 | requests.service_requests | Service Requests | authoritative | Controlled read (own or staff queue) | NO | Constrained via NestJS | NO | NO | NO | YES | Own via Account Link | Assignment / request permission | Yes | Export with grant | Full family history | Case attachments via files | YES | default-deny; backend privileged | DMOD-06 draft delete **يحتاج اعتماد لاحق** |
| TABLE-025 | requests.request_selected_activities | Service Requests | authoritative | Controlled read (own or staff) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent request own-data | Request readers by permission | Yes | Export with grant | Snapshot retained | — | YES | default-deny; backend privileged | — |
| TABLE-026 | requests.request_selected_branches | Service Requests | authoritative | Controlled read (own or staff) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent request own-data | Request readers by permission | Yes | Export with grant | Snapshot retained | — | YES | default-deny; backend privileged | REL-028 |
| TABLE-027 | requests.request_form_snapshots | Service Requests | authoritative | Controlled read (own or staff) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent request own-data | Request readers by permission | Limited | Export with grant | Versioned snapshots | — | YES | default-deny; backend privileged | Hybrid header |
| TABLE-028 | requests.request_form_snapshot_payloads | Service Requests | authoritative | Controlled read (own or staff) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent request own-data | Request readers by permission | Limited | Export with grant | Payload versions | — | YES | default-deny; backend privileged | JSON schema version **يحتاج اعتماد لاحق** |
| TABLE-029 | requests.request_status_histories | Service Requests | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Via parent request own-data | Request/Audit/Reporting | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | DM-06 reasons **يحتاج اعتماد لاحق** |
| TABLE-030 | requests.request_assignment_histories | Service Requests | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Limited (own request) | Request/Audit | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | — |
| TABLE-031 | requests.request_completion_requests | Service Requests | authoritative | Controlled read (parties) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent request own-data | Request parties by permission | Yes | Export with grant | Cycle retained | — | YES | default-deny; backend privileged | — |
| TABLE-032 | requests.request_completion_responses | Service Requests | authoritative | Controlled read (parties) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent request own-data | Request parties by permission | Yes | Export with grant | Cycle retained | — | YES | default-deny; backend privileged | — |
| TABLE-033 | requests.request_decision_records | Service Requests | authoritative | Controlled read (restricted) | NO | Constrained via NestJS | NO | NO | NO | YES | Restricted own-case visibility | Restricted decision readers; manager final via NestJS | Yes | Export with grant | Revisions separate | — | YES | default-deny; backend privileged | DM-07 **يحتاج اعتماد لاحق** |
| TABLE-034 | requests.request_decision_revisions | Service Requests | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Restricted | Restricted decision readers | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | DMOD-14 **يحتاج اعتماد لاحق** |
| TABLE-035 | requests.request_close_archive_records | Service Requests | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent request | Request/Audit | Yes | Export with grant | Event retained | — | YES | default-deny; backend privileged | DMOD-01 **يحتاج اعتماد لاحق** |
| TABLE-036 | requests.request_reopen_records | Service Requests | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent request | Request/Audit | Yes | Export with grant | Event retained | — | YES | default-deny; backend privileged | DMOD-11 **يحتاج اعتماد لاحق** |
| TABLE-037 | balaghat.balaghs | Business Notifications / Balaghat | authoritative | Controlled read (own or staff) | NO | Constrained via NestJS | NO | NO | NO | YES | Own via Account Link | Assignment / Balagh permission | Yes | Export with grant | Full family history | Case attachments via files | YES | default-deny; backend privileged | — |
| TABLE-038 | balaghat.balagh_selected_activities | Business Notifications / Balaghat | authoritative | Controlled read (own or staff) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent Balagh own-data | Balagh readers | Yes | Export with grant | Snapshot | — | YES | default-deny; backend privileged | Multi-activity |
| TABLE-039 | balaghat.balagh_selected_branches | Business Notifications / Balaghat | authoritative | Controlled read (own or staff) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent Balagh own-data | Balagh readers | Yes | Export with grant | Snapshot | — | YES | default-deny; backend privileged | REL-044 |
| TABLE-040 | balaghat.balagh_form_snapshots | Business Notifications / Balaghat | authoritative | Controlled read (own or staff) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent Balagh own-data | Balagh readers | Limited | Export with grant | Versioned | — | YES | default-deny; backend privileged | Hybrid header |
| TABLE-041 | balaghat.balagh_form_snapshot_payloads | Business Notifications / Balaghat | authoritative | Controlled read (own or staff) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent Balagh own-data | Balagh readers | Limited | Export with grant | Payload versions | — | YES | default-deny; backend privileged | JSON schema version **يحتاج اعتماد لاحق** |
| TABLE-042 | balaghat.balagh_status_histories | Business Notifications / Balaghat | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Via parent Balagh | Balagh/Audit/Reporting | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | DM-06 **يحتاج اعتماد لاحق** |
| TABLE-043 | balaghat.balagh_assignment_histories | Business Notifications / Balaghat | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Limited | Balagh/Audit | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | — |
| TABLE-044 | balaghat.balagh_completion_requests | Business Notifications / Balaghat | authoritative | Controlled read (parties) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent Balagh | Balagh parties | Yes | Export with grant | Cycle retained | — | YES | default-deny; backend privileged | — |
| TABLE-045 | balaghat.balagh_completion_responses | Business Notifications / Balaghat | authoritative | Controlled read (parties) | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent Balagh | Balagh parties | Yes | Export with grant | Cycle retained | — | YES | default-deny; backend privileged | — |
| TABLE-046 | balaghat.balagh_decision_records | Business Notifications / Balaghat | authoritative | Controlled read (restricted) | NO | Constrained via NestJS | NO | NO | NO | YES | Restricted | Restricted decision readers | Yes | Export with grant | Revisions separate | — | YES | default-deny; backend privileged | DM-07 **يحتاج اعتماد لاحق** |
| TABLE-047 | balaghat.balagh_decision_revisions | Business Notifications / Balaghat | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Restricted | Restricted decision readers | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | DMOD-14 **يحتاج اعتماد لاحق** |
| TABLE-048 | balaghat.balagh_close_archive_records | Business Notifications / Balaghat | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent Balagh | Balagh/Audit | Yes | Export with grant | Event retained | — | YES | default-deny; backend privileged | DMOD-01 **يحتاج اعتماد لاحق** |
| TABLE-049 | balaghat.balagh_reopen_records | Business Notifications / Balaghat | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Via parent Balagh | Balagh/Audit | Yes | Export with grant | Event retained | — | YES | default-deny; backend privileged | DMOD-11 **يحتاج اعتماد لاحق** |
| TABLE-050 | visits.field_visits | Field Visits | authoritative | Controlled read (assigned scope) | NO | Constrained via NestJS | NO | NO | NO | YES | Limited related own-case visibility | Assigned visit / visit permission; non-final | Yes | Export with grant | Full visit family | Visit evidence via files/storage | YES | default-deny; backend privileged | DMOD-08 **يحتاج اعتماد لاحق** |
| TABLE-051 | visits.visit_schedules | Field Visits | authoritative | Controlled read (assigned) | NO | Constrained via NestJS | NO | NO | NO | YES | Limited | Visit team/ops permission | Yes | Export with grant | Audited | — | YES | default-deny; backend privileged | — |
| TABLE-052 | visits.visit_team_members | Field Visits | authoritative | Controlled read (masked) | NO | Constrained via NestJS | NO | NO | NO | YES | NO | Visit ops; masking applies | Limited | Export with grant | Eligibility trace | — | YES | default-deny; backend privileged | DM-08 masking **يحتاج اعتماد لاحق** |
| TABLE-053 | visits.visit_results | Field Visits | authoritative | Controlled read (restricted) | NO | Constrained via NestJS | NO | NO | NO | YES | Limited | Restricted visit readers; non-final | Yes | Export with grant | Via corrections | — | YES | default-deny; backend privileged | Result structure **يحتاج اعتماد لاحق** |
| TABLE-054 | visits.visit_result_corrections | Field Visits | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Limited | Restricted | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | DMOD-15 **يحتاج اعتماد لاحق** |
| TABLE-055 | visits.visit_evidences | Field Visits | authoritative | Controlled read (restricted) / Storage for bytes | NO | Constrained via NestJS | NO | NO | NO | YES | Limited | Restricted; signed URL after NestJS | Limited | Export with grant | Via attachments history | YES — private evidence; path ≠ authorization | YES | default-deny; backend privileged | — |
| TABLE-056 | dues.payment_dues | Dues and Payment Evidence | authoritative | Controlled read (own/staff payment scope) | NO | Constrained via NestJS | NO | NO | NO | YES | Own via Account Link | Payment / case permission; non-final for case | Yes | Export with grant | Corrections retained | Basis docs via files | YES | default-deny; backend privileged | DM-09/DM-22 **يحتاج اعتماد لاحق** |
| TABLE-057 | dues.due_basis_document_references | Dues and Payment Evidence | authoritative | Controlled read (restricted) | NO | Constrained via NestJS | NO | NO | NO | YES | Own due path | Restricted payment staff | Limited | Export with grant | Audited | Attachment refs ≠ authorization | YES | default-deny; backend privileged | — |
| TABLE-058 | dues.due_corrections | Dues and Payment Evidence | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Own due path | Restricted | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | DM-09 **يحتاج اعتماد لاحق** |
| TABLE-059 | dues.payment_notices | Dues and Payment Evidence | authoritative | Controlled read (recipient limited) | NO | Constrained via NestJS | NO | NO | NO | YES | Recipient / own due path | Notify/payment context permission | Yes | Export with grant | Audited | — | YES | default-deny; backend privileged | — |
| TABLE-060 | dues.payment_receipts | Dues and Payment Evidence | authoritative | Controlled read (restricted) | NO | Constrained via NestJS | NO | NO | NO | YES | Own receipt path | Restricted payment staff | Yes | Export with grant | Via replacements | Receipt bytes private storage | YES | default-deny; backend privileged | No due_receipt_links pending DM-22 **يحتاج اعتماد لاحق** |
| TABLE-061 | dues.receipt_correction_replacements | Dues and Payment Evidence | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Restricted | Restricted | Yes | Export with grant | Append-only | — | YES | default-deny; backend privileged | DM-22 **يحتاج اعتماد لاحق** |
| TABLE-062 | dues.payment_confirmations | Dues and Payment Evidence | authoritative | Controlled read (restricted) | NO | Constrained via NestJS | NO | NO | NO | YES | Own confirmation path | Restricted; non-final for case | Yes | Export with grant | Audited | — | YES | default-deny; backend privileged | Not final case approval |
| TABLE-063 | files.attachments | Attachments and Private Files | authoritative | Controlled read of metadata / Storage for bytes | NO | Constrained via NestJS | NO | NO | NO | YES | Own linked parents via Account Link | Purpose + classification + parent scope | Aggregate only | Export with grant | Version histories | YES — NestJS mediation; signed URL only; classification columns | YES | default-deny; backend privileged | DM-10/DM-26 **يحتاج اعتماد لاحق** |
| TABLE-064 | files.attachment_links | Attachments and Private Files | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Via authorized parent | Owning modules via contracts | Limited | Export with grant | Link/unlink audited | Reference ≠ authorization | YES | default-deny; backend privileged | — |
| TABLE-065 | files.attachment_version_histories | Attachments and Private Files | authoritative | Controlled read / Backend-only append | NO | Constrained via NestJS | NO | NO | NO | YES (append) | Restricted | Restricted | Limited | Export with grant | Append-only lineage | Prior versions private | YES | default-deny; backend privileged | DMOD-09 retention **يحتاج اعتماد لاحق** |
| TABLE-066 | notify.notification_messages | Notification Delivery | authoritative | Controlled read of own messages / Backend-only otherwise | NO | Constrained via NestJS | NO | NO | NO | YES | Recipient own messages | Ops limited | Limited | NO | Attempts/read retained | — | YES | default-deny; backend privileged | DM-11 OTP minimize **يحتاج اعتماد لاحق** |
| TABLE-067 | notify.delivery_attempts | Notification Delivery | authoritative | Backend-only / ops read | NO | NO direct | NO | NO | NO | YES (append) | NO | Ops/Audit | Limited | NO | Append-only | — | YES | default-deny; backend privileged | — |
| TABLE-068 | notify.delivery_retries | Notification Delivery | authoritative | Backend-only / ops read | NO | NO direct | NO | NO | NO | YES (append) | NO | Ops/Audit | Limited | NO | Append-only | — | YES | default-deny; backend privileged | Retry policy **يحتاج اعتماد لاحق** |
| TABLE-069 | notify.notification_templates | Notification Delivery | authoritative | Backend-only (config) | NO | NO direct | NO | NO | NO | YES | NO | Notify config admin | NO | NO | Config audited | — | YES | default-deny; backend privileged | — |
| TABLE-070 | notify.notification_channel_configurations | Notification Delivery | authoritative | Backend-only (config) | NO | NO direct | NO | NO | NO | YES | NO | Notify config admin | NO | NO | Config audited; secrets out-of-band | — | YES | default-deny; backend privileged | Secrets never in DB docs |
| TABLE-071 | notify.notification_read_states | Notification Delivery | authoritative | Controlled read (recipient) | NO | Constrained via NestJS | NO | NO | NO | YES | Recipient own read state | Justified ops only | Limited | NO | Append-oriented updates audited | — | YES | default-deny; backend privileged | DM-25 **يحتاج اعتماد لاحق** |
| TABLE-072 | notify.notification_outbox_messages | Notification Delivery (+ worker) | infra | **BACKEND_ONLY_INFRASTRUCTURE** (notification delivery queue only) | NO | NO | NO | NO | NO | YES (NestJS enroll; worker claim/update) | NO | Ops limited; worker privileged | Ops only | NO | Processing outcomes | — | YES | default-deny; backend/worker only | Not domain events; retention **يحتاج اعتماد لاحق** |
| TABLE-073 | imports.import_batches | Imports and Data Quality | authoritative | Backend-only / controlled read for Import Operator | NO | Constrained Import Operator via NestJS | NO | NO | NO | YES | NO | Import Operator / Audit Restricted | Yes | Export with grant | Full lifecycle | Import files private storage | YES | default-deny; backend privileged | DM-12 **يحتاج اعتماد لاحق** |
| TABLE-074 | imports.import_previews | Imports and Data Quality | authoritative | Backend-only / Import Operator read | NO | Constrained via NestJS | NO | NO | NO | YES | NO | Imports staff | Limited | Export with grant | Separate record | — | YES | default-deny; backend privileged | — |
| TABLE-075 | imports.import_validation_results | Imports and Data Quality | authoritative | Backend-only / Import Operator read | NO | Constrained via NestJS | NO | NO | NO | YES | NO | Imports staff | Yes | Export with grant | Separate record | — | YES | default-deny; backend privileged | Taxonomy **يحتاج اعتماد لاحق** |
| TABLE-076 | imports.import_row_results | Imports and Data Quality | authoritative | Backend-only / Import Operator read | NO | Constrained via NestJS | NO | NO | NO | YES | NO | Imports staff | Limited | Export with grant | Row evidence | No full row dump externally | YES | default-deny; backend privileged | — |
| TABLE-077 | imports.import_errors | Imports and Data Quality | authoritative | Backend-only / Import Operator read | NO | Constrained via NestJS | NO | NO | NO | YES | NO | Imports staff | Yes | Export with grant | Error catalogue | Error files private | YES | default-deny; backend privileged | — |
| TABLE-078 | imports.import_approvals | Imports and Data Quality | authoritative | Backend-only / Audit Restricted readers | NO | Constrained via NestJS | NO | NO | NO | YES | NO | Import approve permission / Audit | Yes | Export with grant | Actors retained | — | YES | default-deny; backend privileged | DMOD-13 **يحتاج اعتماد لاحق** |
| TABLE-079 | imports.import_rejections | Imports and Data Quality | authoritative | Backend-only / Imports/Audit | NO | Constrained via NestJS | NO | NO | NO | YES | NO | Imports/Audit | Yes | Export with grant | Separate outcome | — | YES | default-deny; backend privileged | — |
| TABLE-080 | imports.import_failures | Imports and Data Quality | authoritative | Backend-only / Imports/Audit | NO | Constrained via NestJS | NO | NO | NO | YES | NO | Imports/Audit | Yes | Export with grant | Separate outcome | — | YES | default-deny; backend privileged | — |
| TABLE-081 | imports.import_commits | Imports and Data Quality | authoritative | Backend-only / Imports/Audit | NO | Constrained via NestJS | NO | NO | NO | YES | NO | Imports/Audit; target modules via contracts | Yes | Export with grant | Idempotency disposition | — | YES | default-deny; backend privileged | DM-20 **يحتاج اعتماد لاحق** |
| TABLE-082 | content.content_items | Content Management | authoritative | Controlled read (public published) / Backend-only mutations | NO | Public published via NestJS; editors constrained | NO | NO | NO | YES | N/A public path only when published | Content Manager | Limited | Export with grant | Revision lineage | Public attachment only under publication rules | YES | default-deny; backend privileged | DMOD-10 **يحتاج اعتماد لاحق** |
| TABLE-083 | content.content_revisions | Content Management | authoritative | Controlled read (published revision) | NO | Constrained via NestJS | NO | NO | NO | YES | Public published revision only | Editors | Limited | Export with grant | Append | — | YES | default-deny; backend privileged | — |
| TABLE-084 | content.publication_records | Content Management | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Public evidence of publication | Content/Audit | Yes | Export with grant | Publication evidence | Required before Public attachment | YES | default-deny; backend privileged | — |
| TABLE-085 | content.withdrawal_records | Content Management | authoritative | Controlled read / Backend-only mutations | NO | Constrained via NestJS | NO | NO | NO | YES | Limited | Content/Audit | Yes | Export with grant | Withdrawal evidence | Reclassification auditable | YES | default-deny; backend privileged | — |
| TABLE-086 | content.announcement_validity_periods | Content Management | authoritative | Controlled read (public surfaces) | NO | Constrained via NestJS | NO | NO | NO | YES | Public validity where published | Content | Limited | Export with grant | Period history | — | YES | default-deny; backend privileged | — |
| TABLE-087 | audit.audit_events | Audit and Security | authoritative | Audit restricted | NO | NO | NO | NO | NO | YES (append) | NO | Audit / security reviewer only | Restricted | Restricted export with audit grant | YES — Audit Restricted; append-only | — | YES | default-deny; audit privileged | Actor shape DM-13 **يحتاج اعتماد لاحق** |
| TABLE-088 | audit.sensitive_change_details | Audit and Security | authoritative | Audit restricted | NO | NO | NO | NO | NO | YES (append) | NO | Audit Restricted only | Restricted | Restricted export with audit grant | YES — before/after masked | — | YES | default-deny; audit privileged | Threshold **يحتاج اعتماد لاحق** |
| TABLE-089 | audit.access_security_events | Audit and Security | authoritative | Audit restricted | NO | NO | NO | NO | NO | YES (append) | NO | Audit Restricted only | Restricted | Restricted export with audit grant | YES — Audit Restricted | — | YES | default-deny; audit privileged | DM-18 **يحتاج اعتماد لاحق** |
| TABLE-090 | reporting.domain_event_history_records | Reporting and Analytics | derived | Reporting restricted | NO | Constrained report readers via NestJS | NO | NO | NO | YES (projection jobs) | NO | Reporting permission | YES (`report.view`) | Separate `report.export` | Not authoritative case | — | YES | default-deny; reporting privileged | DM-15 freshness **يحتاج اعتماد لاحق** |
| TABLE-091 | reporting.reporting_projection_definitions | Reporting and Analytics | derived | Reporting restricted | NO | Reporting admins via NestJS | NO | NO | NO | YES | NO | Reporting admin | Meta | Meta export with grant | Definition versions | — | YES | default-deny; reporting privileged | Rebuild/reconcile **يحتاج اعتماد لاحق** |
| TABLE-092 | reporting.saved_report_filters | Reporting and Analytics | authoritative | Reporting restricted (owner-scoped) | NO | Owning profile via NestJS | NO | NO | NO | YES | Owner profile only | Justified ops | NO (filters not reports) | NO | Limited | — | YES | default-deny; backend privileged | DM-16 masking **يحتاج اعتماد لاحق** |
| TABLE-093 | reporting.report_export_records | Reporting and Analytics | authoritative | Reporting restricted / audit trail | NO | Owning requester / export auditors via NestJS | NO | NO | NO | YES | Owning requester Profile | Export auditors | NO (record ≠ view) | YES — requires `report.export` | Export evidence retained | Export artifacts private storage | YES | default-deny; backend privileged | DMOD-12 scheduling **يحتاج اعتماد لاحق** |
| TABLE-094 | audit.domain_event_outbox | NestJS Audit / worker infrastructure | infra | **BACKEND_ONLY_INFRASTRUCTURE** (domain event outbox) | NO | NO | NO | NO | NO | YES (Audit NestJS enroll; worker claim/publish) | NO | Ops limited; worker privileged | Via TABLE-090 only | NO direct | Processing outcomes; not case state | — | YES | default-deny; backend/worker only | Dual outbox vs TABLE-072; retention **يحتاج اعتماد لاحق** |

**Matrix row count: 94** (TABLE-001 … TABLE-094).

---

## 4. Role-oriented read expectations (requirements)

| Actor | May read (via NestJS, subject to grants) | Must not |
| --- | --- | --- |
| Taxpayer | Own profile, own Account Link, own cases/Balaghat, own notifications/read-state, own dues/receipts metadata | Others’ data; staff queues; audit; imports; role admin; outbox tables |
| Request Reviewer | Assigned/accessible queue cases; related histories | Final decision mutation; global role admin |
| Field Visit Officer | Assigned visits and evidence metadata | Final case approval; global payment authority |
| Payment Officer | Payment family for authorized scope | Final request/Balagh decision (unless also manager) |
| Admin Supervisor | Supervised queues; administrative close/archive via NestJS | Silent history rewrite; final approve unless also manager |
| Manager / Director | Operational oversight; final decisions via NestJS | Bypass audit |
| Content Manager | Content family | Taxpayer case access by default |
| Report Reader | Authorized reports with `report.view` | Export without `report.export`; workflow mutations |
| Import Operator | Import batches/errors | Manager final decisions; unaudited production wipe |
| Audit / Security Reviewer | Audit restricted tables per grant | Disable auditing; routine case approval |
| System Owner | Break-glass per procedure | Bypass audit requirements |
| Worker | TABLE-072 / TABLE-094 claim-and-update under privileged role | Client credential use; direct case mutation outside NestJS contracts |

---

## 5. Mutation path (binding)

1. Client → NestJS command API (authenticated).
2. NestJS loads identity, Account Link and/or Role Permissions from DB.
3. NestJS enforces workflow + integrity rules.
4. NestJS writes authoritative tables + history + `audit.domain_event_outbox` (TABLE-094) + audit in one unit of work as designed.
5. Worker consumes TABLE-094 for domain-event publish/projections; Notification Delivery enrolls TABLE-072 for **delivery** processing only.

Therefore: even if a future RLS design allows limited **SELECT** for constrained read models, **client INSERT/UPDATE/DELETE on authoritative tables remains prohibited**.

---

## 6. Credential isolation

| Credential | Allowed location | Forbidden |
| --- | --- | --- |
| Anon / authenticated end-user key | Clients (Auth session bootstrap only as needed) | Privileged Storage admin; bypass NestJS mutations; outbox enqueue |
| Service-role / privileged DB role | NestJS API, worker, controlled migrations | Flutter, Next.js bundles, mobile secure storage as standing privilege |
| Signed URL token | Short-lived client use after NestJS issuance | Long-lived redistribution; logging of full URLs with secrets |

---

## 7. Coverage checklist

| Schema group | Covered |
| --- | --- |
| Identity and Access | Yes (TABLE-001 … TABLE-007) |
| Taxpayer Registry | Yes (TABLE-008 … TABLE-011) |
| Legal Entities | Yes (TABLE-012 … TABLE-013) |
| Activities and Branches | Yes (TABLE-014 … TABLE-022) |
| Service Requests | Yes (TABLE-023 … TABLE-036) |
| Business Notifications / Balaghat | Yes (TABLE-037 … TABLE-049) |
| Field Visits | Yes (TABLE-050 … TABLE-055) |
| Dues and Payment Evidence | Yes (TABLE-056 … TABLE-062) |
| Attachments and Private Files (+ Storage) | Yes (TABLE-063 … TABLE-065) |
| Notification Delivery | Yes (TABLE-066 … TABLE-072) |
| Imports and Data Quality | Yes (TABLE-073 … TABLE-081) |
| Content Management | Yes (TABLE-082 … TABLE-086) |
| Audit and Security | Yes (TABLE-087 … TABLE-089) |
| Reporting and Analytics | Yes (TABLE-090 … TABLE-093) |
| Domain event outbox (infra) | Yes (TABLE-094) |

**Schema groups covered: 15** (14 application schemas + dual-outbox infrastructure posture). **TABLE IDs covered: 94**.

---

## 8. Out of scope

- Any `CREATE POLICY`, `ALTER TABLE ENABLE ROW LEVEL SECURITY`, or policy SQL
- Hook/trigger definitions
- Final choice of RLS vs API-only enforcement mechanism (**يحتاج اعتماد لاحق**)

Traceability: ADR-010; MARIB-TAX-PERMISSIONS-BASELINE-01; MARIB-TAX-DATA-CLASSIFICATION-ACCESS-01; MARIB-TAX-SUPABASE-AUTH-DATABASE-DESIGN-01; MARIB-TAX-PHYSICAL-TABLE-CATALOG-01.
