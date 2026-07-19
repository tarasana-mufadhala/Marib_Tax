# MARIB-TAX-DATA-MODEL-OPEN-DECISIONS-01

**Status:** Mixed — approved boundaries recorded in ADR-015 and ADR-016; remaining rows stay **يحتاج اعتماد لاحق**.

## Approved boundaries (2026-07-19)

Canonical detail: `docs/architecture/adr/ADR-015-APPROVED-BUSINESS-DATA-BOUNDARIES.md` and `docs/reports/MARIB-TAX-REPORT-TO-FIELD-MATRIX-01.md`.

| Reference | Approved summary |
| --- | --- |
| DM-04 / DM-23 | Digits-only tax number issued in Aden; system stores numeric text as entered (no generation); unique among active taxpayers; corrections retain previous value, reason, actor |
| DM-21 (v1) | One account → one taxpayer; no multi-taxpayer representation in first release |
| DM-22 | Manual payment; receipt to admin; payer identity irrelevant; partial payment allowed; one due : N receipts; admin confirms; no delete of confirmed receipts |
| DM-08 (entry) | Visit location/result entered by admin/authorized staff only; no auto-generation |
| DM-10 (classify/archive) | Type classification; permanent archive of versions; correction = new version, no delete of prior |
| DM-11 (provider) | Twilio via provider port for build/test; port must allow later local/WhatsApp API; no real send now |
| DM-16 | Field coverage per report-to-field matrix; separate `report.view` / `report.export` |

## Approved lifecycle boundaries (2026-07-20)

Canonical detail: `docs/architecture/adr/ADR-016-SERVICE-REQUEST-LIFECYCLE-BOUNDARIES.md` and `docs/reviews/MARIB-TAX-BATCH-06-DESIGN-DECISION-GATE-01.md`.

| Reference | Approved summary |
| --- | --- |
| DMOD-06 | No hard delete; applicant draft-cancel before submit only; record actor/time/reason; post-submit delete/direct cancel forbidden |
| DMOD-01 | Close = final-decision end of processing; archive = later administrative historical retention; independent event records |
| DMOD-11 | Staff-only reopen with explicit permission; mandatory reason; prior statuses/decisions retained |
| ADR-008 binding | Fixed request `schema_version`; immutable submitted snapshot; form change → new version; old requests keep original binding |

## Carried-forward decisions (still open)

| Reference | Question |
| --- | --- |
| DMOD-02 / OD-02 | Final FR-205 mandatory attachment list |
| DMOD-03 / OD-03 | Configured SLA durations |
| DMOD-04 / OD-04 | Rejection/closure reason catalogs |
| DMOD-05 / OD-05 | Geographical master-data structure |
| DMOD-07 / OD-07 | Reviewer recommendation states and separation of duties |
| DMOD-08 / OD-08 | Service-specific field-visit triggers |
| DMOD-09 / OD-09 | File retention periods |
| DMOD-10 / OD-10 | Content publication approval |
| DMOD-12 / OD-12 | Report scheduling configuration |
| DMOD-13 / OD-13 | Import two-person approval and exceptions |
| DMOD-14 / OD-14 | Decision revision scenarios and actors |
| DMOD-15 / OD-15 | Visit-result and receipt correction authority |

## Data-specific decisions

| ID | Status | Question / remaining open |
| --- | --- | --- |
| DM-01 | Open | Identifier/reference representation and generation |
| DM-02 | Open | Public-reference issue/display point |
| DM-03 | Open | Taxpayer matching, merge, split, and correction |
| DM-04 | **Approved** | Tax Number format/verification/uniqueness — see ADR-015 |
| DM-05 | Open | Effective-dated Activity, Branch, Property fields |
| DM-06 | Open | Request/Balagh lifecycle reason catalogs |
| DM-07 | Open | Decision visibility, restricted basis, correction evidence |
| DM-08 | **Partial** | Entry source approved; team masking and full result structure still open |
| DM-09 | Open | Due basis, status, confirmation semantics beyond DM-22 payment evidence rules |
| DM-10 | **Partial** | Classification + archive/versioning approved; legal-hold/destruction detail with DM-17 |
| DM-11 | **Partial** | Provider port + Twilio build intent approved; delivery/read/retry detail still open with DM-25 |
| DM-12 | Open | Import source, validation/error taxonomy, remediation |
| DM-13 | Open | Audit catalogue, sensitive threshold, actor context |
| DM-14 | Open | Representation, staff purpose, own-data attributes |
| DM-15 | Open | Projection freshness, rebuild, reconciliation |
| DM-16 | **Approved** | Report fields + view/export separation — see matrix |
| DM-17 | Open | Retention, archive, legal-hold, destruction periods (version archive retained per DM-10) |
| DM-18 | Open | Access/security event taxonomy and minimization |
| DM-19 | Open | Conditional analytics scope and consent |
| DM-20 | Open | Logical-control implementation strategy and idempotency handling |
| DM-21 | **Partial** | v1 one-account/one-taxpayer approved; multi-account and future delegation still open |
| DM-22 | **Approved** | Due–Receipt cardinality and partial payments — see ADR-015 |
| DM-23 | **Approved** | Tax-number uniqueness/correction/versioning — see ADR-015 |
| DM-24 | Open | Property relationship: direct Taxpayer↔Property navigation remains derived from active Ownership Records; no second authoritative link |
| DM-25 | Open | Notification read tracking: definition of read/acknowledged; supported channels; retention |
| DM-26 | Open | Attachment storage metrics: accounting source; retention; replaced/deleted version treatment |

**Open decision count:** 15 carried-forward + 19 fully open data-specific + 3 partial (DM-08, DM-10, DM-11/DM-21 deferred slices) — fully closed data-specific: DM-04, DM-16, DM-22, DM-23 (and DM-21/DM-08/DM-10/DM-11 closed only for the approved slices above).
