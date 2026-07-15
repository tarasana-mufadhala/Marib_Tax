# MARIB-TAX-HISTORY-AUDIT-DATA-REQUIREMENTS-01

**Status:** Minimum logical history/audit evidence. Retention duration is **يحتاج اعتماد لاحق**. Corrections are additive.

| Source family | Retained evidence |
| --- | --- |
| Identity, Profile, Staff, roles | actor, time, prior/new state, reason, correlation where available |
| Taxpayer, Tax Number, association, Account Link | evidence, effective dates, grant/revoke, verification, approval/revocation actors, reason/reference, correction/merge, actor/outcome |
| Activity, Branch, Property | owner, evidence, effective dates, ownership history, target-scope of applied effects (branch vs activity-wide), actor/reason |
| Request family | Request snapshots, selection (Selected Branch belongs to Selected Activity), status/assignment, completion, Decision Record/revision, close/reopen, manager/reviewer role and correlation |
| Balagh family | Balagh snapshots, multi-activity/branch eligibility (Selected Branch belongs to Selected Activity), status/assignment, completion, Decision Record/revision, close/reopen, branch-scope preservation, actor/reason |
| Visits | request/Balagh context, schedule, team Staff Profile eligibility, result/correction, evidence |
| Dues/receipts | due basis/correction, receipt acceptance, confirmation, replacement; Due–Receipt allocation cardinality **يحتاج اعتماد لاحق** |
| Attachments | logical size, media/content classification, storage accounting category, current version, storage/deletion/retention status, access event without content |
| Notifications | message context, Payment Notice link, attempt/retry, authorized recipient/profile read-state including first-read and acknowledgement timestamps where available |
| Imports | distinct lifecycle outcome, idempotency disposition, correlation, actor/time |
| Reporting/content/audit | export requester Profile, Staff Profile where actor is staff, Sensitive Change Detail previous/new values, publication lineage, append-only target/actor/outcome/correlation |

Payment evidence does not finalize a request or Balagh. An accepted receipt is required before Payment Confirmation. Own-data access evidence requires the Taxpayer Account Link path. Branch-scoped effects must record target scope so unrelated branches remain unchanged (IR-72).
