# MARIB-TAX-DATA-OWNERSHIP-LIFECYCLE-01

**Status:** Logical ownership and lifecycle controls. Retention duration is **يحتاج اعتماد لاحق**; owners are authoritative NestJS workflows.

| Records | Owner | Lifecycle and preservation |
| --- | --- | --- |
| Identity, Profile, Staff, roles/grants | Identity and Access | Activate/suspend/revoke/archive; retain effective authorization history. |
| Taxpayer, Contact, Account Link, legal-entity association | Taxpayer Registry | Register/verify/end-date/supersede; Account Link retains active/inactive, verification, effective period, approval/revocation actors, reason/reference, and own-data authority history. |
| Legal Entity and Tax Number | Legal Entities | Register/issue/verify/replace/invalidate/archive; retain issuance/evidence lineage. |
| Activity, Branch, address, Property family | Activities and Branches | Correct/effective-date/supersede/archive; authoritative taxpayer/property relation is Ownership Record; branch-scoped effects validated and audited with target scope (IR-72). |
| Request family | Service Requests | Submit/review/complete/decision/close/reopen; all Request-prefixed history retained; Request Selected Branch belongs to Request Selected Activity. |
| Balagh family | Business Notifications / Balaghat | Submit/triage/investigate/decision/close/reopen; all Balagh-prefixed history retained; Balagh Selected Branch belongs to Balagh Selected Activity; no subject-data mutation. |
| Field Visit family | Field Visits | Plan/schedule/staff/conduct/correct/archive; Staff Profile eligibility trace retained. |
| Due/receipt family | Dues and Payment Evidence | Assess/correct/issue/accept/confirm/replace/archive; receipt acceptance precedes confirmation; Due–Receipt cardinality **يحتاج اعتماد لاحق** (REL-069; no fixed Mermaid edge). |
| Attachment family | Attachments and Private Files | Receive/classify/link/version/withdraw/archive; retain logical size, media/content classification, storage accounting category, current-version, storage, deletion/retention status. |
| Notification family | Notification Delivery | Request/attempt/retry/read/archive; append-only delivery/read history including first-read timestamp where available. |
| Import family | Imports and Data Quality | Preview/validate/approve/reject/commit/fail; retain separate outcome and idempotency trace. |
| Reporting/Content/Audit families | Their named owners | Reporting remains derived; publication retains revision lineage; audit/security evidence append-only. |

Manager final action is distinct from non-final reviewer recommendation. Payment and field officers are non-final. Effects follow approval by the owning request/Balagh workflow. Branch-scoped effects apply only to the selected Branch; unrelated branches remain unchanged; Activities and Branches validates target scope and audits applied effects (IR-72).
