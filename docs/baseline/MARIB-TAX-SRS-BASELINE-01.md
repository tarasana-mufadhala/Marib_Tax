# Marib Tax System — SRS Baseline 01

**Document ID:** MARIB-TAX-SRS-BASELINE-01
**Status:** Requirements baseline (documentation only) — content remediated
**Owner:** SysTrac / مؤسسة سيستراك للأنظمة والحلول التقنية
**System:** النظام الإلكتروني لمكتب الضرائب بمحافظة مأرب (Marib Tax System)

> Operationalizes approved scope for delivery. Does **not** replace the Final SRS or STK-TAX-MRB-2026-MASTER-IMPLEMENTATION-BLUEPRINT-v1.0. Unresolved items only are marked **يحتاج اعتماد لاحق**.

---

## 0. Terminology (canonical)

| Arabic | English technical name | Meaning |
| --- | --- | --- |
| طلب | Service Request | A service transaction initiated by the taxpayer to obtain a tax-office service. |
| بلاغ | Business Notification / Balagh | A taxpayer business notification/case (e.g. activity stoppage, address change, property transfer, activity reactivation). **Not** an analytical report. |
| تقرير تحليلي | Analytical Report | A management, operational, security, or statistical report generated from system data. |
| إشعار | Notification Message | A message sent in-app, by SMS, or via another configured channel. |
| مستحق | Payment Due | An amount administratively registered against a transaction. |
| إثبات السداد / تأكيد السداد | Payment Confirmation | Recording payment completion based on an uploaded payment receipt. |

Do not translate بلاغ simply as “Report”.

---

## 1. Project purpose and ownership

Provide a secure electronic platform for the Tax Office in Marib Governorate enabling taxpayers and authorized staff to process طلبات and بلاغات, register مستحقات, confirm سداد, conduct زيارات ميدانية, send إشعارات, and produce تقارير تحليلية — with NestJS enforcing all business rules, authorization, audit, and private file access.

**Ownership:** The system is proprietary to SysTrac / شركة سيستراك للأنظمة والحلول التقنية. Repository and implementation artifacts follow the project proprietary notice and change-control policies.

## 2. Target users

| User group | Arabic | Channel |
| --- | --- | --- |
| Taxpayer | مكلف | Flutter mobile (`apps/mobile`) |
| Staff / reviewers | موظف / مراجع | Next.js admin (`apps/web`) |
| Manager / director | مدير مكتب الضرائب | Next.js admin |
| Content manager | مسؤول محتوى | Next.js admin |
| System owner | مالك النظام | Controlled admin/ops |
| Public visitor | زائر عام | Next.js public pages only (no admin) |

## 3. System boundaries

| Boundary | Decision |
| --- | --- |
| Taxpayer app | Flutter (Android first; iOS-ready design) |
| Public website + admin | One Next.js TypeScript app |
| Business logic | NestJS modular monolith only |
| Background jobs | Worker + notification outbox |
| Data | PostgreSQL via Supabase managed services |
| Files | Private storage; short-lived authorized access |
| API | REST + OpenAPI (API-first) |
| إشعارات | Twilio SMS initially; WhatsApp-ready abstraction; FCM push |
| Mutations | No direct client database writes; backend owns all operational mutations |

### MVP vs future / conditional

| Current MVP baseline | Future / conditional |
| --- | --- |
| Manual مستحقات / إثبات السداد | Automatic scheduled delivery of تقارير تحليلية to the manager |
| Core طلبات and بلاغات (FR-201…206) | Website analytics only after approved analytics integration |
| Field visits, إشعارات, imports, content management | WhatsApp channel only when operationally enabled |
| Approved analytical reports 4–29 | Any new external integration requires Change Control |

## 4. Approved business rules and simplifications

1. One بلاغ may include one or more activities.
2. A specific branch may be stopped without stopping the taxpayer’s other branches.
3. Activity stoppage may be **temporary** or **final**.
4. Stoppage reason must be recorded.
5. Property data is entered by the taxpayer.
6. Detailed tenant identity data is **not** required in current scope.
7. Tenant count is sufficient when relevant.
8. Detailed rental and evacuation data is **not** required in current scope.
9. Detailed worker identity data is **not** required.
10. Worker count is sufficient.
11. Do not add unapproved tenant/worker personal-detail requirements.

## 5. Request (طلب) lifecycle rules

1. Taxpayer may delete a **draft** طلب.
2. Taxpayer may **not** delete a **submitted** طلب.
3. Taxpayer may **not** cancel a **submitted** طلب.
4. Authorized administrator may administratively **close or archive** a submitted transaction **only with a recorded reason**. Exact distinction between “closed” and “archived” in the final state model: **يحتاج اعتماد لاحق**. Archived reopen is **admin-only**.
5. Need-more-information cycles may repeat **without a fixed limit**.
6. Rejected طلب may be reopened per authorization.
7. Archived طلب may be reopened **only** by an authorized administrator.
8. **Final** approval or rejection belongs **only** to the Tax Office manager/director.
9. Reviewers and ordinary administrators **cannot** issue final approval or final rejection (they may recommend or return for completion). Intermediate reviewer recommendation state name: **يحتاج اعتماد لاحق**.
10. Every final decision and revision preserves complete history (decision, reason, reference, actor, timestamp, revisions).
11. SLA values are **configurable** (no fixed durations invented here).
12. Field visits may be required depending on service / بلاغ type.

## 6. Payment and dues model (approved)

1. Amounts are registered **manually** in-system only; online checkout processors and external finance sync are **out of approved scope**.
2. Authorized administrator **manually enters** the amount from approved supporting documents.
3. Supporting **basis document** for the amount is **mandatory**.
4. Administrator is responsible for correctness of the entered amount.
5. Taxpayer is notified of the amount (إشعار).
6. Payment confirmation requires **uploading the payment receipt**.
7. Authorized administrator records payment completion after checking the receipt.
8. **No** additional director approval for amount entry or payment confirmation.
9. Audit must capture: original amount; corrected amount; actor; date/time; correction reason; supporting document; receipt; payment-confirmation actor and timestamp.
10. Final approval/rejection of the underlying طلب (when required) remains with the manager/director.

## 7. Approved بلاغ / service form catalog (FR-201 … FR-206)

### FR-201 — إخطار إيقاف نشاط

- One or more activities; specific branch may be selected.
- Stoppage type: temporary | final; reason recorded.
- Field visit may be part of the configured workflow.
- Decision preserves: reason, reference, actor, timestamp (+ revision history).

### FR-202 — إخطار خروج مستأجر أو إخلاء عقار

- Property data entered by taxpayer.
- No detailed tenant identity; tenant count when relevant.
- No detailed rental/evacuation data in current scope.
- Field visit may be required per configuration.
- Final decision preserves reason and reference.

### FR-203 — إخطار خروج عامل

- No detailed worker identity; worker count is sufficient.
- Field visit may be required per configuration.
- Final decision preserves reason and reference.

### FR-204 — إخطار تغيير عنوان النشاط

- One or more activities/branches; specific branch may be selected.
- Changes **address only** (not trade name or activity type).
- Move date not required; previous address shown and may be corrected.
- Required: district, street. Not currently required: area/neighborhood, building/shop number, landmark.
- Map location optional (recommended); proof document optional.

### FR-205 — إخطار نقل ملكية عقار

- Concise seller and buyer data; may support multiple property units.
- Final mandatory attachment list: **يحتاج اعتماد لاحق من المكتب** (do not invent).

### FR-206 — إخطار تفعيل نشاط موقوف

- One or more stopped activities; reactivation reason recorded; attachments optional.
- Follow configured workflow; do not invent extra mandatory fields.

### Field visit record (when applicable)

Date; time; location; team members; findings; notes; photos/attachments; result; actor and timestamps.

### Approval / rejection decision record

Decision; reason; reference; decision-maker; timestamp; revision history.

## 8. Taxpayer mobile scope

Registration/profile; own طلبات and بلاغات; draft delete; submit (no delete/cancel after submit); respond to need-more-info; attachments via API; view status/history; receive إشعارات; upload receipt for إثبات السداد; **own-data only**.

## 9. Admin portal scope

Queues for طلبات/بلاغات; need-more-info; recommend/return (not final decide); field visits; manual مستحقات + basis document; verify receipt and record تأكيد السداد; manager final decisions; administrative close/archive with reason; imports; content; تقارير تحليلية (view/export per permission); audit visibility.

## 10. Notification (إشعار) overview

| Channel | Baseline |
| --- | --- |
| SMS | Twilio initially |
| Push | FCM |
| WhatsApp | Abstraction WhatsApp-ready; operational enablement **يحتاج اعتماد لاحق** / future until enabled |
| Delivery | Outbox + worker; business commit independent of provider success |

## 11. Files

Private storage only; NestJS-mediated short-lived access; no privileged storage credentials on clients.

## 12. Security and audit

Server-side authorization; no public admin; taxpayers own-data only; sensitive actions → Audit Events; Arabic RTL first; independent Dev/Staging/Prod secrets and databases.

## 13. Out of scope / Change Control

Microservices split; client DB writes; unapproved integrations; production data in development; automatic production migrations; features outside approved MVP without Change Request.

Every post-baseline requirement is a Change Request (`docs/governance/CHANGE-CONTROL.md`).

---

**Related:** Domain · Workflow · Reports (4–29) · Permissions · API Contract
