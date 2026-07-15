# Marib Tax System — Domain Model Baseline 01

**Document ID:** MARIB-TAX-DOMAIN-MODEL-BASELINE-01
**Status:** Conceptual domain baseline (no database tables)
**Language:** Arabic business names with English technical names

> Concepts only. No physical table names, SQL types, migrations, or columns.

### Terminology (same as SRS)

| Arabic | English |
| --- | --- |
| طلب | Service Request |
| بلاغ | Business Notification / Balagh |
| تقرير تحليلي | Analytical Report |
| إشعار | Notification Message |
| مستحق | Payment Due |
| إثبات السداد / تأكيد السداد | Payment Confirmation |

---

## Concept catalog

| # | Arabic | English | Purpose |
| --- | --- | --- | --- |
| 1 | مكلف | Taxpayer | Mobile end-user of tax-office services |
| 2 | كيان قانوني | Legal Entity | Business/legal body |
| 3 | رقم ضريبي | Tax Number | Official tax identifier |
| 4 | نشاط تجاري | Commercial Activity | Declared activity (active / stopped temporary|final / reactivated) |
| 5 | فرع | Branch | Entity operating location; stoppable independently |
| 6 | عقار | Property | Property data entered by taxpayer |
| 7 | طلب | Service Request | Service transaction workflow object |
| 8 | بلاغ | Business Notification / Balagh | Business notification/case (FR-201…206) |
| 9 | زيارة ميدانية | Field Visit | On-site visit for طلب/بلاغ when configured |
| 10 | مرفق | Attachment | Private file (basis doc, receipt, evidence, photos) |
| 11 | مستحق | Payment Due | Manually registered amount with mandatory basis document |
| 12 | إثبات السداد / تأكيد السداد | Payment Confirmation | Completion recorded after receipt upload and admin check |
| 13 | رسالة إشعار | Notification Message | Outbound in-app/SMS/(WhatsApp-ready) message |
| 14 | حدث تدقيق | Audit Event | Sensitive action with before/after values |
| 15 | دفعة استيراد | Import Batch | Preview, validate, approve, controlled commit |
| 16 | مستخدم / موظف / دور / صلاحية | User / Staff / Role / Permission | Identity; includes separable `report.view` and `report.export` |
| 17 | قرار اعتماد/رفض | Approval Decision | Final manager decision with reason and reference |
| 18 | محتوى موقع | Website Content | Published laws/forms/announcements (reports 28–29) |

---

## Core concepts

### مكلف (Taxpayer)

Own profile; own طلبات/بلاغات; draft delete only; cannot delete/cancel submitted; own إثبات السداد submissions; receives إشعارات.

### كيان قانوني / رقم ضريبي / نشاط / فرع

Entity has tax number(s), branches, activities. **Branch stoppage** does not require stopping other branches. Activity stoppage: **temporary** or **final**, with **reason**. Reactivation via FR-206.

### عقار (Property)

Entered by taxpayer. For FR-202: tenant **count** when relevant (no detailed tenant identity). No detailed rental/evacuation data in current scope. FR-205: concise seller/buyer; may include **multiple units**.

### طلب (Service Request)

Versioned service type; status/history; assignment history; SLA timestamps; may require visit; may have مستحق; produces إشعارات and Audit Events. Final Decision by manager/director when required.

### بلاغ (Business Notification / Balagh)

Distinct from تقرير تحليلي. May include **one or more activities**; may select a **branch**. Types include FR-201…206. Carries stoppage type/reason, address change fields, seller/buyer, tenant/worker counts as applicable. Attachments and visits per configuration.

**FR-204 address fields:** previous/new address; district; street; previous address correctable; move date not required; optional map; optional proof. Does not change trade name or activity type.

### زيارة ميدانية (Field Visit)

When applicable includes: **date; time; location; team members; findings; notes; photos/attachments; result; actor and timestamps**. Linked to طلب and/or بلاغ.

### مرفق (Attachment)

Private. Roles include: basis document for مستحق (mandatory); payment receipt (mandatory for confirmation); visit photos; optional proofs (e.g. FR-204/FR-206).

### مستحق (Payment Due)

Manual amount entry by authorized admin from supporting documents; **mandatory basis document**; admin responsible for amount correctness; amount corrections audited (original/corrected amount, actor, timestamp, reason, supporting document). Online checkout processors, automated settlement, and external finance sync are **out of scope**.

### إثبات السداد / تأكيد السداد (Payment Confirmation)

Taxpayer uploads **payment receipt**; authorized admin verifies and records completion; audit: receipt, confirmation actor, timestamp. **No** separate director approval for amount entry or payment confirmation. Manager still owns final طلب/بلاغ decision when the workflow requires it.

### رسالة إشعار (Notification Message)

Channel (SMS/push/WhatsApp-ready); delivery status; failure reason; linked transaction; outbox/worker delivery.

### حدث تدقيق (Audit Event)

Actor; operation; object; previous/new values; timestamp; reason for sensitive actions; device/IP when needed.

### دفعة استيراد (Import Batch)

Filename; operator; preview; validation; approval; controlled commit; accepted/rejected/duplicate counts; error file; audit. Approved scope.

### دور / صلاحية

Includes separable **report.view** and **report.export**. Least privilege; no final decision for reviewers.

### قرار اعتماد/رفض (Approval Decision)

Decision; reason; reference; decision-maker; timestamp; revision history. Only Tax Office manager/director issues **final** approve/reject.

### محتوى موقع (Website Content)

Laws, forms, announcements, drafts, archive — supports analytical reports 28–29. Report 29 analytics only when an approved analytics tool is connected.

---

## Relationship sketch

```text
Taxpayer ──submits──► Service Request ──may──► Field Visit
   │                      │
   │                      ├── Attachments
   │                      ├── Payment Due (basis doc) ──► Payment Confirmation (receipt)
   │                      └── Notification Message
   │
   └──submits──► Business Notification / Balagh (FR-201…206)
                      ├── selected Activities / Branch
                      ├── Property / seller-buyer / counts as applicable
                      └── Field Visit / Attachments / Decision

Staff ──via Role (report.view | report.export | …)──► actions ──► Audit Event
Import Batch ──preview/validate/approve/commit──► master data (audited)
```

Cardinalities and enum identifiers for code: **يحتاج اعتماد لاحق** where not fixed above.
