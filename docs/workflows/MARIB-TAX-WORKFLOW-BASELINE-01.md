# Marib Tax System — Workflow Baseline 01

**Document ID:** MARIB-TAX-WORKFLOW-BASELINE-01
**Status:** Approved lifecycle baseline

### Terminology

طلب = Service Request · بلاغ = Business Notification / Balagh · إشعار = Notification Message · مستحق = Payment Due · إثبات السداد = Payment Confirmation · تقرير تحليلي = Analytical Report

---

## 1. Request (طلب) lifecycle rules

| # | Rule |
| --- | --- |
| 1 | Taxpayer may delete a **draft** طلب. |
| 2 | Taxpayer may **not** delete a **submitted** طلب. |
| 3 | Taxpayer may **not** cancel a **submitted** طلب. |
| 4 | Authorized admin may administratively **close or archive** a submitted transaction **only with a recorded reason**. Exact closed vs archived distinction: **يحتاج اعتماد لاحق**. |
| 5 | Need-more-information cycles repeat **without a fixed limit**. |
| 6 | Rejected طلب may be reopened per authorization. |
| 7 | Archived طلب reopened **only** by authorized administrator. |
| 8 | **Final** approve/reject: Tax Office manager/director **only**. |
| 9 | Reviewers / ordinary admins: may recommend or return for completion; **cannot** issue final approve/reject. Intermediate recommendation state name: **يحتاج اعتماد لاحق**. |
| 10 | All decisions and revisions preserve full history (decision, reason, reference, actor, timestamp). |
| 11 | SLA values are configurable. |
| 12 | Field visit may be required by service / بلاغ type. |

### Conceptual states (non-exhaustive)

| State | Arabic | Notes |
| --- | --- | --- |
| draft | مسودة | Deletable by taxpayer |
| submitted | مقدَّم | No taxpayer delete/cancel |
| under_review | قيد المراجعة | Staff working |
| need_more_info | استكمال بيانات | Unlimited cycles |
| pending_field_visit | بانتظار زيارة ميدانية | When required |
| pending_payment | بانتظار السداد | After مستحق registered |
| pending_manager_decision | بانتظار قرار المدير | Final gate |
| approved | معتمد | Final success |
| rejected | مرفوض | Reopenable per authz |
| closed / archived | مغلق / مؤرشف | Terminal admin actions with reason; distinction **يحتاج اعتماد لاحق** |

---

## 2. Taxpayer registration

Register → profile → optional entity/tax-number linkage → activation rules **يحتاج اعتماد لاحق** if manual staff activation is mandatory. Audited.

## 3. Request submission

Create draft → fill/upload → delete draft **or** submit → system validates, starts SLA, queues إشعارات, audits → taxpayer can no longer delete or cancel.

## 4. Admin review

Reviewer opens queue item → validates → may: request need-more-info; require field visit; route to manager; **recommend** rejection/return. **Cannot** final-approve or final-reject. Registering a مستحق is **not** a reviewer action by default: only a user with **explicit payment authority** (e.g. Payment Officer) may register the amount. Holding the Request Reviewer role does **not** grant payment authority automatically. A user who holds both roles may perform each action only under the relevant permission. The Payment Officer cannot issue the final طلب/بلاغ decision unless separately assigned the manager/director role.

## 5. Need-more-info cycle

`under_review → need_more_info → taxpayer responds → under_review` (unlimited). Each cycle preserves dates/actors. SLA pause/reset behavior once configured: **يحتاج اعتماد لاحق** (must remain configurable).

## 6. Payment due and confirmation (approved model)

| Step | Actor | Action |
| --- | --- | --- |
| 1 | Authorized Payment Officer / admin | Manually enter amount from supporting documents |
| 2 | Same | Attach **mandatory** basis document |
| 3 | System | إشعار taxpayer of amount; audit amount entry |
| 4 | Taxpayer | Upload **payment receipt** |
| 5 | Authorized admin | Verify receipt; record **تأكيد السداد** |
| 6 | System | Audit receipt + confirmation actor/timestamp; continue workflow |

**Out of scope:** online checkout processors; automated settlement; external finance sync. **Also prohibited:** optional basis/receipt; separate director approval for amount entry or payment confirmation.

**Amount correction:** original/corrected amount, actor, timestamp, reason, supporting document — all audited.

**Final طلب decision** (when required) remains with manager/director — independent of payment confirmation authority.

## 7. Field visit

When required by type: schedule → assign team → record **date, time, location, team members, findings, notes, photos/attachments, result, actor, timestamps** → return to review/manager path → audit + إشعار.

## 8. Manager final decision

Manager/director issues **final** approve or reject with: decision, **reason**, **reference**, decision-maker, timestamp; revisions append history (never overwrite).

## 9. Administrative close / archive

Authorized admin closes or archives **with recorded reason** → history preserved → taxpayer cannot reopen → archived reopen **admin-only**.

## 10. Rejected reopen

`rejected → (authorized reopen) → under_review` (or need_more_info). Who besides admin may request reopen: **يحتاج اعتماد لاحق**; capability exists. History preserved.

## 11. بلاغ workflows (FR-201 … FR-206)

| FR | Name | Workflow notes |
| --- | --- | --- |
| FR-201 | إخطار إيقاف نشاط | Multi-activity; branch select; temporary/final; reason; optional visit; manager decision with reason/reference |
| FR-202 | إخطار خروج مستأجر أو إخلاء عقار | Taxpayer property data; tenant count only; no detailed rental/evacuation; visit per config |
| FR-203 | إخطار خروج عامل | Worker count only; visit per config |
| FR-204 | إخطار تغيير عنوان النشاط | Multi activity/branch; address-only change; district+street; optional map/proof; previous address editable |
| FR-205 | إخطار نقل ملكية عقار | Concise seller/buyer; multi-unit; mandatory attachments list **يحتاج اعتماد لاحق من المكتب** |
| FR-206 | إخطار تفعيل نشاط موقوف | Multi stopped activities; reactivation reason; optional attachments |

Same cross-cutting rules: no taxpayer cancel after submit; NMI unlimited; admin close/archive with reason; manager final decision; history preserved.

## 12. SLA

Configurable per type. Breach escalation details: **يحتاج اعتماد لاحق**. Metrics appear in تقارير تحليلية.

## 13. History and audit (cross-cutting)

Every status transition, assignment change, amount change, payment confirmation, visit result, and final decision: append history + Audit Event for sensitive actions; never silently overwrite.
