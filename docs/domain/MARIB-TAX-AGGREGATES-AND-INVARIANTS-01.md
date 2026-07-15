# Marib Tax System — Aggregates and Invariants 01

**Document ID:** MARIB-TAX-AGGREGATES-AND-INVARIANTS-01
**Status:** Conceptual aggregate design (no SQL / tables / columns / migrations)

### Terminology

طلب = Service Request · بلاغ = Business Notification / Balagh · مستحق = Payment Due · تأكيد السداد = Payment Confirmation · إشعار = Notification Message · تقرير تحليلي = Analytical Report

### Decision ownership

- **Service Request** decisions (including final approval/rejection and revisions) are owned by the Service Request aggregate / Service Requests module.
- **Balagh** decisions are owned by the Balagh aggregate / Business Notifications module.
- A shared conceptual **Decision value object** (reason, reference, actor, time) may be described for consistency, but it is **not** a separate aggregate or module that owns case decisions.
- Audit receives decision events; it does not own or alter decisions.
- Manager/director final-decision authority is enforced by each case-owning module.

### Business-effect timing

Submitting FR-201, FR-204, FR-205, or FR-206 records case payload only. Authoritative Activity, Branch, Address, Property, or ownership state changes only after the configured authorized checkpoint (normally manager/director final approval), applied by the Activities and Branches module (Property owner). Client submission, reviewer recommendation, payment confirmation, or field-visit completion alone must not apply those effects. Per-service variance: **يحتاج اعتماد لاحق حسب إعداد مسار الخدمة**.

---

## Aggregate catalog

### 1. Taxpayer — المكلف

| Aspect | Content |
| --- | --- |
| **Purpose** | Represent the mobile end-user and own-data boundary |
| **Root** | Taxpayer |
| **Children (conceptual)** | Profile contacts; authentication linkage reference |
| **Identifiers** | Conceptual taxpayer id |
| **Relationships** | May link Legal Entity / Tax Number; owns طلبات/بلاغات |
| **Commands** | Register; update profile; link entity (policy) |
| **Invariants** | Access restricted to owner (and authorized staff); no cross-taxpayer reads |
| **History/audit** | Profile/contact/link changes audited |
| **Delete/archive** | Account deactivation policy **يحتاج اعتماد لاحق** |
| **Sensitive** | Phone and identity fields; mask for Report Reader |

### 2. Commercial Activity — النشاط التجاري

| Aspect | Content |
| --- | --- |
| **Purpose** | Track activity status (active / temporary stop / final stop / reactivated) |
| **Root** | Commercial Activity |
| **Children** | Status periods; address projection |
| **Relationships** | Belongs to Legal Entity and/or Branch |
| **Commands** | Apply stoppage/reactivation/address change via authorized بلاغ effects **after** the authorized checkpoint |
| **Invariants** | Stoppage requires reason when stopped; branch stop does not force stop of sibling branches; no client-direct status write |
| **History/audit** | Before/after status and address; ActivityStopped / ActivityReactivated / ActivityAddressChanged after successful apply |
| **Delete/archive** | Soft retention **يحتاج اعتماد لاحق** |

### 3. Branch — الفرع

| Aspect | Content |
| --- | --- |
| **Purpose** | Operating location selectable on بلاغات |
| **Root** | Branch |
| **Relationships** | Belongs to Legal Entity; hosts activities |
| **Commands** | Master updates; select as affected branch on بلاغ (selection on case; effect apply via Activities module) |
| **Invariants** | May be affected independently of other branches |
| **History/audit** | Master changes audited |

### 4. Property — العقار

| Aspect | Content |
| --- | --- |
| **Purpose** | Property data for FR-202/FR-205 |
| **Root** | Property |
| **Owning module** | Activities and Branches (authoritative property / ownership application) |
| **Children** | Units (conceptual multi-unit for FR-205); tenant count; seller/buyer concise data |
| **Commands** | Taxpayer enters property data on forms; staff corrections via authorized process; **apply ownership transfer** only after authorized FR-205 approval |
| **Invariants** | No detailed tenant identity required; no detailed rental/evacuation data in scope; worker identities not stored for FR-203 (count only); Balaghat does not mutate Property records directly |
| **History/audit** | Ownership transfer recordings preserve history; PropertyOwnershipTransferRecorded after successful apply |
| **Sensitive** | Seller/buyer concise data |

### 5. Service Request — طلب

| Aspect | Content |
| --- | --- |
| **Purpose** | Service transaction lifecycle |
| **Root** | Service Request |
| **Children** | Status history; assignment history; **Request Approval Decision** revisions; NMI cycles |
| **Relationships** | Taxpayer; optional entity/activity/branch/property; Field Visits; Payment Due; Attachments |
| **Commands** | Draft create/edit/delete; submit; NMI request/provide; recommend; final decide (from under_review or after optional recommendation); reviseDecision; admin close/archive; reopen |
| **Invariants** | See §A below |
| **History/audit** | All transitions; decision reason/reference; RequestDecisionRevised with before/after; sensitive edits |
| **Delete/archive** | Draft delete only; submitted never taxpayer-deleted; admin close/archive with reason |
| **Sensitive** | Case PII; attachments |

### 6. Business Notification / Balagh — بلاغ

| Aspect | Content |
| --- | --- |
| **Purpose** | FR-201…206 business cases (not analytical reports) |
| **Root** | Balagh |
| **Children** | Selected activities; selected branch; FR-specific payload; history; **Balagh Approval Decision** revisions |
| **Relationships** | Same class as Request for visits/dues/attachments where configured |
| **Commands** | Parallel lifecycle commands to Request for balagh types, including final decide and reviseDecision |
| **Invariants** | See §B below |
| **History/audit** | Mandatory stoppage reason; decision reason/reference; BalaghDecisionRevised |
| **Delete/archive** | Same class as Request |

### 7. Field Visit — زيارة ميدانية

| Aspect | Content |
| --- | --- |
| **Purpose** | On-site verification |
| **Root** | Field Visit |
| **Children** | Team members; findings; notes; evidence attachments; result; correction history |
| **Relationships** | Belongs to Request and/or Balagh |
| **Commands** | Schedule; reschedule; complete; correctResult |
| **Invariants** | See §C |
| **History/audit** | Completed visit not silently overwritten; FieldVisitResultCorrected |
| **Sensitive** | Photos/notes |

### 8. Payment Due — مستحق

| Aspect | Content |
| --- | --- |
| **Purpose** | Manually registered amount |
| **Root** | Payment Due |
| **Children** | Amount versions; basis attachment reference |
| **Relationships** | Parent Request/Balagh |
| **Commands** | Register; correct; issue payment notice |
| **Invariants** | See §D |
| **History/audit** | Original/corrected amount; actor; time; reason; basis doc; PaymentNoticeIssued |
| **Sensitive** | Amounts and identity |

### 9. Payment Confirmation — تأكيد السداد

| Aspect | Content |
| --- | --- |
| **Purpose** | Record completion after receipt |
| **Root** | Payment Confirmation |
| **Children** | Receipt attachment reference; receipt correction history |
| **Commands** | Upload receipt; confirm completion; correctReceipt |
| **Invariants** | See §D |
| **History/audit** | Receipt; confirmation actor/timestamp; PaymentReceiptCorrected |
| **Sensitive** | Receipt image |

### 10. Attachment — مرفق

| Aspect | Content |
| --- | --- |
| **Purpose** | Private file metadata + access control |
| **Root** | Attachment |
| **Relationships** | Parent transaction/visit/profile/due/confirmation |
| **Commands** | Upload; issue short-lived access; replace/delete per policy |
| **Invariants** | See §E |
| **History/audit** | Privileged access; sensitive evidence replace/delete |
| **Sensitive** | All operational files |

### 11. Notification Message — رسالة إشعار

| Aspect | Content |
| --- | --- |
| **Purpose** | Outbound delivery tracking (not a بلاغ) |
| **Root** | Notification Message |
| **Children** | Attempts/retries conceptual |
| **Commands** | Queue; mark sent/delivered/failed; retry (worker) |
| **Invariants** | Delivery status must not rewrite business case outcome |
| **History/audit** | Ops overrides audited; NotificationDeliveryRetried |
| **Sensitive** | Phone numbers in payload — minimize retention **يحتاج اعتماد لاحق** |

### 12. Import Batch — دفعة استيراد

| Aspect | Content |
| --- | --- |
| **Purpose** | Controlled bulk ingest |
| **Root** | Import Batch |
| **Children** | Preview rows; validation errors |
| **Commands** | Preview; validate; approve; commit; reject; record failure |
| **Invariants** | Commit only after approval; approving actor ≠ committing actor unless audited exception; errors downloadable |
| **History/audit** | Preview/approve/commit/reject/fail (ImportRejected / ImportFailed) |
| **Sensitive** | Import payloads |

### 13. Content Item — عنصر محتوى

| Aspect | Content |
| --- | --- |
| **Purpose** | Public site content |
| **Root** | Content Item |
| **Commands** | Draft; publish; withdraw; archive |
| **Invariants** | Public read only published; approval flow details **يحتاج اعتماد لاحق** |
| **History/audit** | Publish/withdraw |

### 14. Audit Event — حدث تدقيق

| Aspect | Content |
| --- | --- |
| **Purpose** | Append-oriented sensitive action log |
| **Root** | Audit Event |
| **Commands** | Append only |
| **Invariants** | See §F |
| **History/audit** | Is history |
| **Sensitive** | May contain before/after; access restricted |

---

## Required invariant sets

### A. Request lifecycle

1. Taxpayer may delete **only** a draft.
2. Taxpayer cannot delete or cancel a **submitted** request.
3. Submitted information changes only via authorized completion/correction (NMI) process.
4. Final approval/rejection belongs to manager/director; may be issued from active review **without** a mandatory prior recommendation.
5. Reviewer recommendation is optional unless separately approved as mandatory.
6. Administrative close/archive requires a recorded reason.
7. Every decision revision preserves history (previous/new decision, previous/new reason and reference, revision reason, actor, timestamp, prior decision-event reference) via RequestDecisionRevised.
8. Exact closed vs archived semantics: **يحتاج اعتماد لاحق**.

### B. Balagh

1. One balagh may include multiple activities.
2. A selected branch may be affected independently.
3. Activity stoppage is temporary or final.
4. Stoppage reason is mandatory when stopping.
5. FR-201…206 field rules remain enforceable (see FR field-rules doc).
6. Balagh decisions are owned by this aggregate; Activity/Property effects apply only after authorized checkpoint via Activities and Branches.
7. Decision revisions preserve full history (BalaghDecisionRevised) with the same payload and before/after audit expectations as request revisions. Exact revision scenarios: **يحتاج اعتماد لاحق**.

### C. Field visit

1. Visit belongs to an authorized request or balagh.
2. Preserve date, time, location, team, findings, notes, result, evidence.
3. Completed visit history cannot be silently overwritten (corrections append).

### D. Dues / payment

1. Due amount entered only by explicit payment authority.
2. Basis document mandatory.
3. Amount correction requires reason and before/after history.
4. Payment confirmation requires a receipt.
5. Confirmation actor and timestamp preserved.
6. Payment authority does not grant final request/balagh decision authority.
7. Receipt replacement/correction preserves history (PaymentReceiptCorrected).
8. No online checkout / external finance sync in scope.

### E. Attachments

1. Private by default.
2. Access authorized through related transaction.
3. Deletion/replacement of sensitive evidence preserves required history.

### F. Audit

1. Audit events are append-oriented.
2. Business actors cannot rewrite audit history.
3. Sensitive changes preserve before/after values.
