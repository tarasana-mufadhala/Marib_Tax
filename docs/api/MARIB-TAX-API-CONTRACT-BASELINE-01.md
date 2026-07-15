# Marib Tax System — API Contract Baseline 01

**Document ID:** MARIB-TAX-API-CONTRACT-BASELINE-01
**Status:** High-level API contract baseline (not OpenAPI yet)

> OpenAPI will be authoritative when published (ADR-006). Paths/verbs: **يحتاج اعتماد لاحق**.

### Terminology

طلب = Service Request · بلاغ = Business Notification / Balagh · تقرير تحليلي = Analytical Report · إشعار = Notification Message · مستحق = Payment Due · إثبات السداد = Payment Confirmation

### Global rules

| Rule | Baseline |
| --- | --- |
| Style | REST |
| Mutation owner | **NestJS backend only** (`apps/api`) |
| Clients | Flutter / Next.js call API; **no direct database writes** |
| AuthZ | Server-side on every sensitive read/mutation |
| Audit | Sensitive operations create Audit Events |
| Files | Private; short-lived authorized access |
| Payments | Manual مستحق / إثبات السداد only; **no** online checkout callbacks; **no** automated settlement; **no** external finance sync |

For every mutation group below: NestJS owns the mutation; authorization is server-side; sensitive ops are audited; clients do not write directly to the database.

---

## Endpoint groups

### 1. Authentication

Register/login/refresh/logout for taxpayer and staff. Public only where explicitly public. Password/role changes audited. Login success/failure retention policy: **يحتاج اعتماد لاحق**.

### 2. Taxpayer profile and own-data

Profile; own entity linkage views; own طلبات/بلاغات list/detail; own إشعارات. **Own-data only**.

### 3. Admin operations

Staff queues, assignments, case management within permissions. **No public access**.

### 4. Service Request (طلب) workflow

| Capability | Notes |
| --- | --- |
| Draft create/update | Taxpayer own |
| Draft deletion | Taxpayer own drafts only |
| Submission | Locks taxpayer delete/cancel |
| Need-more-info response | Taxpayer own |
| Admin transitions | Review, NMI, route; recommend — not final decide |
| Administrative close/archive | Authorized staff; **mandatory recorded reason** |
| Reopen rejected | Per authorization |
| Reopen archived | **Admin-only** |
| Manager final decision | Reason + reference + actor + timestamp; revision history |

### 5. Business Notification / Balagh (بلاغ) — FR-201 … FR-206

Groups for:

- FR-201 activity stoppage (multi-activity, branch, temporary/final, reason)
- FR-202 tenant departure / property evacuation (property by taxpayer; tenant count)
- FR-203 worker departure (worker count)
- FR-204 activity address change (address-only; district/street; optional map/proof)
- FR-205 property ownership transfer (seller/buyer; multi-unit; attachment list **يحتاج اعتماد لاحق من المكتب**)
- FR-206 reactivation of stopped activity (reason; optional attachments)

Same lifecycle authz patterns as طلب where applicable.

### 6. Field visit

Schedule; assign team; record date/time/location/team/findings/notes/photos/result; link to طلب/بلاغ.

### 7. Payment Due and Payment Confirmation

| Capability | Notes |
| --- | --- |
| Manual مستحق registration | Authorized admin; amount from supporting documents |
| Basis document attachment | **Mandatory** |
| Amount correction | Audited (original/corrected, actor, time, reason, supporting doc) |
| Taxpayer receipt upload | Required for إثبات السداد |
| Authorized payment confirmation | Admin records completion after receipt check |
| Notifications | إشعار of amount / reminders |

**Excluded:** online checkout callbacks; automated settlement; external finance sync.

### 8. Attachments

Initiate upload; finalize metadata; issue short-lived download/view URLs; list by parent. Audit privileged issuance.

### 9. Notification Message (إشعار)

Read own inbox/status; staff ops delivery views; delivery via outbox/worker abstractions (no controller fire-and-forget to providers). Manual resend policy: **يحتاج اعتماد لاحق**.

### 10. Analytical Report view

Run/view تقارير تحليلية **4–29** subject to **`report.view`**. Masking for Report Reader where configured.

### 11. Analytical Report export

Export PDF/Excel/CSV **separately** authorized via **`report.export`**. Sensitive exports audited. Scheduled automatic delivery is **not** in MVP API scope.

### 12. Audit

Query Audit Events for Audit/Security Reviewer (+ System Owner). Not public; not taxpayer.

### 13. Import

Upload/preview/validate; approve; controlled commit; fetch errors/status. Import Operator (+ approved supervisors). Every execute audited.

### 14. Website content (admin)

Publish/withdraw laws, forms, announcements (feeds reports 28–29). Public read of published content is separate from admin mutations.

---

## Client map

| Group | Mobile | Admin web | Public web |
| --- | --- | --- | --- |
| Auth | Yes | Yes | Limited public auth only |
| Taxpayer own-data | Yes | No | No |
| Admin ops | No | Yes | No |
| طلب / بلاغ mutations | Own | Yes | No |
| Field visit | No | Yes | No |
| مستحق / إثبات السداد | Receipt upload | Yes | No |
| إشعار | Own | Ops views | No |
| تقرير تحليلي view/export | No | Yes (permissions) | No |
| Audit / Import | No | Restricted roles | No |
| Published content read | — | — | Yes |
