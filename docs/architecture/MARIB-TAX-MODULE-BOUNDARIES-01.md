# Marib Tax System — Module Boundaries 01

**Document ID:** MARIB-TAX-MODULE-BOUNDARIES-01
**Status:** Proposed NestJS modular-monolith boundaries (documentation only)
**Source:** Approved requirements baseline (SRS, domain, workflow, permissions, API)

> No physical database tables. Modules are application/domain boundaries inside `apps/api` (and related worker consumption for outbox), not microservices.

### Cross-cutting dependency rules

1. Clients (Flutter / Next.js) **never** mutate the database directly.
2. All operational mutations pass through NestJS.
3. A module **must not** modify another module’s owned records directly.
4. Cross-module work uses defined NestJS application contracts or domain events.
5. **No circular module dependency is permitted.**
6. **Audit** receives events; it does not own business decisions.
7. **Reporting** reads approved projections/history; it does not mutate business transactions.
8. **Notification Delivery** does not decide business outcomes.
9. **Attachments** owns file metadata and controlled access, not business approval.
10. Submitting FR-201/204/205/206 does **not** immediately modify authoritative Activity, Branch, Address, Property, or ownership state. Business effects apply only after the configured authorized checkpoint (normally manager/director final approval). Reviewer recommendation, payment confirmation, field-visit completion, or client submission alone must not apply the final business effect.
11. **No unnamed global orchestration module** is introduced. Request flow coordination is owned by the Service Requests application service; Balagh flow coordination is owned by the Balaghat application service.

### Orchestration ownership (explicit)

#### A. Service Request flows

**Owner:** Service Requests application service inside the **Service Requests** module.

It coordinates request-related interactions with:

- Field Visits;
- Dues and Payment Evidence;
- Attachments;
- Notification Delivery;
- Audit;
- Activities and Branches where a request has an approved master-data effect.

#### B. Balagh flows

**Owner:** Balaghat application service inside the **Business Notifications / Balaghat** module.

It coordinates balagh-related interactions with:

- Activities and Branches;
- Field Visits;
- Dues and Payment Evidence;
- Attachments;
- Notification Delivery;
- Audit.

#### C. Master-data application

- The initiating case module **requests** the effect (via its application service).
- The data-owning module **validates and applies** its own aggregate change.
- The case module **never** directly mutates another module’s aggregate.
- The data-owning module emits the authoritative applied-effect event (e.g. ActivityStopped, PropertyOwnershipTransferRecorded).
- Activities and Branches does **not** import Balaghat.
- Balaghat does **not** directly mutate Activities, Branches, Address, or Property.

---

## 1. الهوية والصلاحيات — Identity and Access

| Aspect | Content |
| --- | --- |
| **Responsibility** | Authentication, sessions/tokens, role/permission grants, staff and taxpayer account linkage |
| **Owned concepts** | User, Staff, Role, Permission (`report.view`, `report.export`, …) |
| **Owns mutations** | Register/login/refresh/logout; assign/revoke roles; lock/unlock accounts (policy-bound) |
| **Exposes** | Actor identity; permission checks; ownership claims (taxpayer id) |
| **May depend on** | Audit (emit); Notification Delivery (OTP/security notices via outbox) |
| **Must not** | Own طلب/بلاغ decisions; mutate dues; publish content; run imports; own taxpayer business master data |
| **Audit** | Role/permission changes; sensitive auth events per policy |

## 2. سجل المكلفين — Taxpayer Registry

| Aspect | Content |
| --- | --- |
| **Responsibility** | Taxpayer profile lifecycle and own-data boundaries |
| **Owned concepts** | Taxpayer |
| **Owns mutations** | Register/update own profile fields within policy |
| **Exposes** | Taxpayer identity references; contact channels (masked to unauthorized readers) |
| **May depend on** | Identity; Legal Entities (link); Attachments (profile docs); Audit; Notification Delivery |
| **Must not** | Approve طلبات; register dues; commit imports |
| **Audit** | Profile/contact changes; linkage changes |

## 3. الكيانات القانونية — Legal Entities

| Aspect | Content |
| --- | --- |
| **Responsibility** | Legal entity master data and tax-number association rules |
| **Owned concepts** | Legal Entity, Tax Number |
| **Owns mutations** | Create/update entity and tax-number records per authorized flows |
| **Exposes** | Entity/tax-number references for طلب/بلاغ |
| **May depend on** | Taxpayer Registry; Audit; Imports (controlled ingest via services) |
| **Must not** | Own workflow final decisions |
| **Audit** | Tax-number edits; entity type changes |

## 4. الأنشطة والفروع — Activities and Branches

| Aspect | Content |
| --- | --- |
| **Responsibility** | Commercial activities, branches, and Property records; apply approved stoppage/reactivation/address/ownership effects |
| **Owned concepts** | Commercial Activity, Branch, Property (authoritative property / ownership records for FR-202/FR-205 effects) |
| **Owns mutations** | Master updates; validate and apply stoppage/reactivation/address-change/ownership-transfer **effects** when requested by the initiating case module’s application service after the authorized checkpoint |
| **Exposes** | Activity/branch status, address, and property projections |
| **May depend on** | Legal Entities; Audit; NestJS application contracts / **inbound domain events** issued by the Service Requests application service and by the Balaghat application service (not Balaghat module imports) |
| **Must not** | Import or call the Balaghat module directly; read Balaghat internals; bypass بلاغ workflow to silently stop activities; accept client-direct Activity/Branch/Property writes |
| **Audit** | Status/address/ownership changes with before/after |

**Dependency direction:** Activities and Branches **consumes** approved domain/application events or commands issued by the Service Requests application service or the Balaghat application service. It validates and applies its own aggregate changes. It **never** lists Balaghat as a direct module dependency.

## 5. طلبات الخدمة — Service Requests

| Aspect | Content |
| --- | --- |
| **Responsibility** | طلب (Service Request) lifecycle and history; owns request-flow coordination via its application service |
| **Owned concepts** | Service Request; **Request Approval Decision** (case decisions for طلب only) |
| **Owns mutations** | Draft CRUD/delete; submit; NMI cycles; recommend; final decide; revise decision; admin close/archive; reopen |
| **Exposes** | Request status/history projections; assignment history; decision history; produces Request\* lifecycle events |
| **May depend on** | Taxpayer; Legal Entities; Activities/Branches (read / effect requests via Service Requests application service contracts); Field Visits; Dues; Attachments; Notification Delivery; Audit |
| **Must not** | Deliver SMS; store raw files; grant roles; issue analytical exports; own بلاغ decisions; directly mutate Activity/Branch/Property aggregates |
| **Audit** | Every transition and decision revision (`RequestDecisionRevised`) |

## 6. البلاغات — Business Notifications / Balaghat

| Aspect | Content |
| --- | --- |
| **Responsibility** | بلاغ cases FR-201…206 and related history; records and decides the balagh workflow; owns balagh-flow coordination via its application service |
| **Owned concepts** | Business Notification / Balagh; **Balagh Approval Decision** (case decisions for بلاغ only) |
| **Owns mutations** | Same class of lifecycle mutations as requests for balagh types (including final decide and decision revision) |
| **Exposes** | Balagh status/history; selected activities/branch; FR payloads; produces Balagh\* lifecycle events |
| **May depend on** | Taxpayer Registry; Legal Entities; Activities and Branches **read/application interfaces** (effect requests via Balaghat application service — never direct record mutation); Field Visits; Dues and Payment Evidence; Attachments; Notification Delivery; Audit |
| **Must not** | Be confused with تقرير تحليلي; directly mutate Activity, Branch, Address, or Property records; own Request decisions |
| **Audit** | Transitions; stoppage reason; decision reason/reference; decision revisions (`BalaghDecisionRevised`) |

A shared conceptual **Decision value object** may describe reason/reference/actor/time shape, but it is **not** a separate module and does not own case decisions. Each case module enforces manager/director final-decision authority. Audit receives decision events but does not own or alter decisions.

## 7. الزيارات الميدانية — Field Visits

| Aspect | Content |
| --- | --- |
| **Responsibility** | Schedule and record visits linked to طلب/بلاغ |
| **Owned concepts** | Field Visit |
| **Owns mutations** | Schedule/reschedule; assign team; complete with result/evidence; append corrections |
| **Exposes** | Visit status/results for parent case and reporting |
| **May depend on** | Service Requests; Balaghat; Attachments; Notification Delivery; Audit |
| **Must not** | Final-approve parent case; register dues; apply Activity/Property effects |
| **Audit** | Schedule and completion; corrections; no silent overwrite of completed history |

## 8. المستحقات وإثبات السداد — Dues and Payment Evidence

| Aspect | Content |
| --- | --- |
| **Responsibility** | Manual Payment Due and Payment Confirmation |
| **Owned concepts** | Payment Due, Payment Confirmation |
| **Owns mutations** | Register/correct amount; attach basis; issue payment notice; confirm after receipt; receipt correction |
| **Exposes** | Due/payment status to the initiating case module’s application service; produces **PaymentNoticeIssued** |
| **May depend on** | Service Requests; Balaghat; Attachments; Notification Delivery (consumes notice for delivery); Audit |
| **Must not** | Online checkout; external finance sync; final manager decision |
| **Audit** | Amount before/after; basis; receipt; confirmation actor/time |

## 9. المرفقات والملفات الخاصة — Attachments and Private Files

| Aspect | Content |
| --- | --- |
| **Responsibility** | Private file metadata and short-lived authorized access |
| **Owned concepts** | Attachment |
| **Owns mutations** | Upload finalize; issue access URL; replace/delete per policy |
| **Exposes** | Attachment references/metadata (not raw bytes in other modules) |
| **May depend on** | Identity (authz); Audit |
| **Must not** | Decide approval; decide payment outcome |
| **Audit** | Privileged download issuance; sensitive evidence replace/delete |

## 10. تسليم الإشعارات — Notification Delivery

| Aspect | Content |
| --- | --- |
| **Responsibility** | Outbox consumption and channel delivery (SMS/push/WhatsApp-ready) |
| **Owned concepts** | Notification Message (delivery record) |
| **Owns mutations** | Queue/send/retry status updates (worker) |
| **Exposes** | Delivery status for reporting/ops; produces NotificationQueued/Sent/Delivered/Failed/Retried |
| **May depend on** | Audit (ops); channel providers via abstractions |
| **Must not** | Change طلب/بلاغ business state; invent outcomes; produce business events such as PaymentNoticeIssued or case decision events |
| **Audit** | Manual resend / ops overrides when enabled |

## 11. الاستيراد وجودة البيانات — Imports and Data Quality

| Aspect | Content |
| --- | --- |
| **Responsibility** | Import Batch preview/validate/approve/commit/reject/fail |
| **Owned concepts** | Import Batch |
| **Owns mutations** | Upload preview; validate; approve; controlled commit; reject; record processing failure |
| **Exposes** | Batch status/error summaries |
| **May depend on** | Legal Entities; Activities; Taxpayer (targets via services); Audit |
| **Must not** | Bypass approval for production commit; allow default self-approve-and-commit without audited exception |
| **Audit** | Preview, approve, commit, reject, fail |

## 12. التقارير والتحليلات — Reporting and Analytics

| Aspect | Content |
| --- | --- |
| **Responsibility** | تقارير تحليلية 4–29 view/export |
| **Owned concepts** | Report definitions/projections (read models) |
| **Owns mutations** | None on business aggregates (export is controlled side effect) |
| **Exposes** | Aggregated indicators |
| **May depend on** | Read models fed by events/history from other modules; Identity for `report.view`/`report.export` |
| **Must not** | Mutate transactions; merge view+export permissions |
| **Audit** | Sensitive exports |

## 13. إدارة المحتوى — Content Management

| Aspect | Content |
| --- | --- |
| **Responsibility** | Public website content lifecycle |
| **Owned concepts** | Content Item |
| **Owns mutations** | Draft/publish/withdraw/archive content |
| **Exposes** | Published content to public web |
| **May depend on** | Identity; Audit; Attachments (optional assets) |
| **Must not** | Mutate taxpayer cases |
| **Audit** | Publish/withdraw |

## 14. التدقيق والأمن — Audit and Security

| Aspect | Content |
| --- | --- |
| **Responsibility** | Append-oriented Audit Events and security query surfaces |
| **Owned concepts** | Audit Event |
| **Owns mutations** | Append only (internal writers) |
| **Exposes** | Query to Audit/Security Reviewer (+ System Owner) |
| **May depend on** | Identity (authz) |
| **Must not** | Own business approvals; allow rewrite of history; alter decisions; produce business lifecycle events |
| **Audit** | N/A (is the audit store) |

---

## Allowed dependency sketch (acyclic)

```text
Identity ──► Taxpayer, Legal Entities, Content, Imports, Reporting, Audit
Taxpayer / Legal Entities ──► Service Requests, Balaghat
Service Requests application service ──► Field Visits, Dues, Attachments, Notification Delivery, Audit
     └──► Activities and Branches (effect requests only; no direct aggregate mutation)
Balaghat application service ──► Field Visits, Dues, Attachments, Notification Delivery, Audit
     └──► Activities and Branches (effect requests / application interfaces only)
Activities and Branches ◄── effect requests from the Service Requests application service and from the Balaghat application service
     (no Balaghat module import; no reverse dependency)
Imports ──► Legal Entities / Activities / Taxpayer (via services)
Events ──► Reporting projections, Audit, Notification outbox
```

**Forbidden:** Activities and Branches → Balaghat (module dependency).

**Forbidden:** Balaghat direct mutation of Activity/Branch/Address/Property records.

**Forbidden:** Unnamed global orchestration module.

Circular ownership between Service Requests and Balaghat is avoided by separate application services and events, not mutual record writes.
