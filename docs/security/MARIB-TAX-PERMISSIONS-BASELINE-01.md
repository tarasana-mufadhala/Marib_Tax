# Marib Tax System — Permissions Baseline 01

**Document ID:** MARIB-TAX-PERMISSIONS-BASELINE-01
**Status:** Initial RBAC baseline (remediated)

### Terminology

طلب · بلاغ (Business Notification / Balagh) · تقرير تحليلي · إشعار · مستحق · إثبات السداد / تأكيد السداد

### Cross-cutting rules

| Rule | Baseline |
| --- | --- |
| Public access | **No** public access to admin functions |
| Taxpayer scope | **Own data only** |
| Sensitive actions | Require **Audit Event** |
| Attachments | Private; short-lived authorized access |
| Analytical reports | Separate permissions: **`report.view`** and **`report.export`** |
| Mutations | NestJS server-side only |
| Least privilege | Do not grant capabilities merely because a role name sounds administrative |
| Final decision | Tax Office manager/director **only** |

A user may hold `report.view` **without** `report.export`.

---

## Roles

### 1. مالك النظام (System Owner)

| Aspect | Baseline |
| --- | --- |
| Purpose | Platform ownership / break-glass governance |
| Allowed | Role administration; emergency procedures; view authorized reports (audited) |
| Restricted | No bypass of audit; day-to-day case work should be delegated |
| Sensitive data | Full when justified and audited |
| Reports | May be granted view and/or export explicitly (audited) |

### 2. مدير مكتب الضرائب (Tax Office Director / Manager)

| Aspect | Baseline |
| --- | --- |
| Purpose | Final business authority on طلب / بلاغ outcomes |
| Allowed | **Final approve/reject** with reason and reference; oversee SLA; management تقارير تحليلية per grants |
| Restricted | Must not silently alter history |
| Sensitive data | Full operational |
| Reports | View/export per explicit grants |

### 3. مشرف إداري (Admin Supervisor)

| Aspect | Baseline |
| --- | --- |
| Purpose | Queues, assignments, quality |
| Allowed | Assign reviewers; escalate; administrative close/archive **with recorded reason**; supervise visits/بلاغات |
| Restricted | **Cannot** issue final approve/reject (unless also holding manager role) |
| Sensitive data | Full operational for supervised scope |
| Reports | Per explicit view/export grants |

### 4. مراجع الطلبات (Request Reviewer)

| Aspect | Baseline |
| --- | --- |
| Purpose | Process submitted طلبات / بلاغات |
| Allowed | Review; request need-more-info; route to visit/payment/manager; **recommend** a decision; comments/history |
| Restricted | **Cannot** issue final approval or final rejection; no role admin |
| Sensitive data | Assigned/accessible queue |
| Reports | No automatic export; view only if explicitly granted |

### 5. مأمور زيارة ميدانية (Field Visit Officer)

| Aspect | Baseline |
| --- | --- |
| Purpose | Execute/record field visits |
| Allowed | Assigned visits; record date/time/location/team/findings/notes/photos/result |
| Restricted | No final manager decision; no global payment authority |
| Sensitive data | Visit-related fields |
| Reports | Assigned-scope visit reports if granted |

### 6. مسؤول المدفوعات (Payment Officer)

| Aspect | Baseline |
| --- | --- |
| Purpose | Manual مستحقات and إثبات السداد |
| Allowed | Enter amount from supporting documents; **must attach basis document**; verify receipt; record completion when authorized; amount corrections with audit reason |
| Restricted | **Cannot** issue final طلب/بلاغ decision unless separately holding manager role; cannot enable online checkout or external finance sync |
| Sensitive data | Payment and identity fields for reconciliation |
| Audit | Original/corrected amount; actor; timestamp; reason; basis document; receipt; confirmation actor/timestamp |
| Reports | Payment analytical reports if granted view/export |

### 7. مسؤول المحتوى (Content Manager)

| Aspect | Baseline |
| --- | --- |
| Purpose | Public website content (supports reports 28–29) |
| Allowed | Create/update/publish/withdraw content |
| Restricted | No request workflow mutations; no taxpayer case access by default |
| Reports | Content reports if granted |

### 8. قارئ التقارير (Report Reader)

| Aspect | Baseline |
| --- | --- |
| Purpose | Read تقارير تحليلية without mutating cases |
| Allowed | **`report.view`** for authorized reports only |
| Restricted | **No** automatic **`report.export`**; no workflow mutations; no raw attachment download beyond policy |
| Sensitive data | **Masked** phone/sensitive fields where configured |
| Export | Only if separately granted `report.export` |

### 9. مشغّل الاستيراد (Import Operator)

| Aspect | Baseline |
| --- | --- |
| Purpose | Controlled imports (reports 22–24) |
| Allowed | Upload/preview/validate; execute after approval path; view import quality reports if granted |
| Restricted | No silent destructive production cleanup; no manager final decisions |
| Audit | Preview, approval, commit, error downloads |

### 10. مراجع التدقيق/الأمن (Audit / Security Reviewer)

| Aspect | Baseline |
| --- | --- |
| Purpose | Oversight of audit/security analytical reports (25–27) |
| Allowed | Read Audit Events; security reports per grants |
| Restricted | No routine case approval; cannot disable auditing |
| Sensitive data | Need-to-know; full vs masked **يحتاج اعتماد لاحق** |

### 11. مكلف (Taxpayer)

| Aspect | Baseline |
| --- | --- |
| Purpose | Self-service mobile |
| Allowed | Own profile; draft/submit own طلبات/بلاغات; **delete drafts**; respond to need-more-info; upload attachments/receipt; read own إشعارات/status |
| Restricted | No others’ data; no admin APIs; **cannot delete or cancel submitted** transactions; cannot reopen archive |
| Sensitive data | Own only |
| Reports | No staff analytical catalog access |

---

## Sensitive actions (always audited)

Final decisions; reopen; administrative close/archive; need-more-info; مستحق entry/correction; payment confirmation; role/permission changes; import approve/commit; privileged attachment URL issuance; analytical report exports when sensitive.
