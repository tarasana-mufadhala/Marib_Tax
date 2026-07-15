# Marib Tax System — Domain Design Open Decisions 01

**Document ID:** MARIB-TAX-DOMAIN-DESIGN-OPEN-DECISIONS-01
**Status:** Decision register for domain/workflow design phase

---

## A. Approved and closed decisions (do not reopen informally)

| Topic | Decision |
| --- | --- |
| Architecture | Flutter / Next.js / NestJS modular monolith / PostgreSQL+Supabase / REST+OpenAPI / outbox notifications |
| Mutations | NestJS only; no client DB writes |
| Payment model | Manual dues; mandatory basis doc; mandatory receipt; no director approval for amount/confirm; no checkout/finance sync |
| Lifecycle | Draft delete only; no taxpayer delete/cancel after submit; NMI unlimited; manager final decide (recommendation optional unless later mandated); admin close/archive with reason; archived reopen admin-only |
| Activity/property effects | Apply only after authorized checkpoint (normally manager final approval); no client-direct Activity/Branch/Property writes; no circular Activities↔Balagh module dependency |
| Import SoD (safe baseline) | Approving actor ≠ committing actor unless explicit audited exception; strict/global exceptions still open (OD-13) |
| Terminology | طلب / بلاغ / تقرير تحليلي / إشعار / مستحق / تأكيد السداد |
| FR-201…206 | Approved field rules as in baseline and FR field-rules doc |
| Permissions | Separate report.view / report.export; reviewer no final decide; payment authority ≠ final decide |
| Reports | Catalog 4–29; scheduled delivery future |

---

## B. Open decisions requiring office approval

| Decision ID | Question | Business impact | Affected docs/modules | Approver | Required before | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OD-01 | Exact semantic distinction between **closed** and **archived** | Terminal ops, reopen rules, reports 4/26 | State machines; Requests/Balaghat; Reporting | Tax Office Manager + Product | DB/API design | Open — يحتاج اعتماد لاحق |
| OD-02 | Final mandatory attachment list for **FR-205** | Completeness gates | FR field rules; Attachments; Balaghat | Tax Office | Implementation of FR-205 | Open — يحتاج اعتماد لاحق من المكتب |
| OD-03 | Configured **SLA durations** per service | Breach metrics, إشعارات | Requests/Balaghat; Reporting | Tax Office Manager | Ops go-live | Open — يحتاج اعتماد لاحق |
| OD-04 | Final organized rejection/closure **reason catalogs** | Structured reporting #4/#7 | Workflows; Reporting | Tax Office | Reporting accuracy | Open — يحتاج اعتماد لاحق |
| OD-05 | Final **geographical master-data** structure | FR-204/202 address quality; filters | Activities; Property; Reporting | Tax Office + Architecture | Address services | Open — يحتاج اعتماد لاحق |
| OD-06 | Draft deletion **retention/audit** policy | Storage/compliance | Requests; Audit | Security + Tax Office | Soft-delete design | Open — يحتاج اعتماد لاحق |
| OD-07 | Exact intermediate **reviewer recommendation** state names; whether recommendation becomes **mandatory** SoD | UI/API enums; optional vs required recommend path | State machines; API later | Architecture + Product + Tax Office | API contract | Open — يحتاج اعتماد لاحق |
| OD-08 | Service-specific **field-visit triggers** | Ops load | Field Visits; FR rules | Tax Office | Visit config | Open — يحتاج اعتماد لاحق |
| OD-09 | **File retention** periods | Storage/legal | Attachments | Security + Tax Office | Ops policy | Open — يحتاج اعتماد لاحق |
| OD-10 | Final **content publication approval** flow | Website governance | Content module | Content + Manager | Content go-live | Open — يحتاج اعتماد لاحق |
| OD-11 | Who besides admin may **reopen rejected** cases | Authz matrix | Transition matrix | Tax Office | Authz implementation | Open — يحتاج اعتماد لاحق |
| OD-12 | Report **scheduling** configuration | Manager delivery | Reporting | Product | Future CR | Open — future scope |
| OD-13 | Import **two-person approval** mandatory in all environments? Emergency exception allowed? Who authorizes exception? | Import SoD; staffing | Imports; transition matrix; state machines | Tax Office + Security | Import go-live | Open — يحتاج اعتماد لاحق |
| OD-14 | Exact permitted **decision revision** scenarios and who may revise | RequestDecisionRevised / BalaghDecisionRevised; reports 4/7/25/26 | Service Requests; Balaghat; authz matrix (`request.decision.revise`, `balagh.decision.revise`) | Tax Office + Manager | Authz implementation | Open — يحتاج اعتماد لاحق |
| OD-15 | Exact who may **correct** completed field-visit results and payment receipts | Correction events; history | Field Visits; Dues; authz | Tax Office | Ops policy | Open — يحتاج اعتماد لاحق |

---

## C. Technical decisions deferred to database/API design

| Decision ID | Question | Notes | Required before |
| --- | --- | --- | --- |
| TD-01 | Physical schema / keys / indexes | Out of this phase | Database design task |
| TD-02 | OpenAPI paths/verbs/DTO shapes | High-level groups exist | API contract task |
| TD-03 | Outbox/worker storage shape | Pattern approved; schema later | Worker design |
| TD-04 | Projection/read-model strategy for reports 4–29 | Events catalog ready | Reporting implementation |
| TD-05 | Idempotency store mechanism | Keys proposed conceptually | API/worker design |
| TD-06 | Final naming of conceptual permission identifiers | PROPOSED families in authz matrix | API/security design |

---

## D. Future change requests (not current baseline)

| ID | Topic |
| --- | --- |
| FCR-01 | Automatic scheduled analytical-report delivery |
| FCR-02 | Operational WhatsApp channel enablement |
| FCR-03 | Website analytics tool integration (report 29) |
| FCR-04 | Any external finance or government system integration |
| FCR-05 | Microservices split |

New external integrations require formal Change Control.
