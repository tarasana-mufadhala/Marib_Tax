# Marib Tax System — State Machine Catalog 01

**Document ID:** MARIB-TAX-STATE-MACHINE-CATALOG-01
**Status:** Conceptual state machines for design (not final DB enums)

States marked **PROPOSED — يحتاج اعتماد** are vocabulary proposals, not approved final enums.
**Reopened** is modeled as a **transition/event**, not a persistent state, unless later approved otherwise.

Exact closed vs archived distinction: **يحتاج اعتماد لاحق**.
SLA durations: configurable; **none invented here**.

### Cross-cutting decision and effect rules

1. **Manager/director owns the final decision.** Reviewer recommendation is **optional** unless a future office decision makes it mandatory (OD-07 / future SoD policy). Do not invent a mandatory recommendation-before-decision rule.
2. Reviewer **cannot** issue final approval or rejection.
3. Manager may **return for completion** (`requestCompletion`) instead of deciding.
4. Every final decision preserves reason, reference, actor, timestamp, and revision history (`RequestDecisionRevised` or `BalaghDecisionRevised` when a prior decision is corrected).
5. **Business effects** on Activity, Branch, Address, Property, or ownership are **not** applied on client submit, reviewer recommendation, payment confirmation, or field-visit completion alone. They apply only after the configured authorized checkpoint — normally manager/director **final approval**. Exact per-service checkpoint variance: **يحتاج اعتماد لاحق حسب إعداد مسار الخدمة**.
6. No client writes Activity/Branch/Property state directly.
7. Request audit side effects use **Request\*** events; Balagh audit side effects use **Balagh\*** events. Parallel families; never a shared generic producer.

---

## 1. Service Request (طلب)

**Purpose:** Govern service transaction lifecycle.
**Terminal (conceptual):** `approved`, `rejected` (reopenable), `closed` / `archived` (admin reopen for archived).
**Actors:** Taxpayer; Request Reviewer; Admin Supervisor; Manager/Director; Payment Officer (dues path only).
**Decision ownership:** Service Requests module owns request decisions (see aggregates / module boundaries).
**Orchestration owner:** Service Requests application service (inside Service Requests module).

### Candidate vocabulary

| State | Label | Notes |
| --- | --- | --- |
| `draft` | مسودة | Approved concept |
| `submitted` | مقدَّم | Approved concept |
| `under_review` | قيد المراجعة | Approved concept |
| `need_more_info` | استكمال بيانات | Approved concept |
| `pending_field_visit` | بانتظار زيارة | **PROPOSED — يحتاج اعتماد** |
| `pending_payment` | بانتظار السداد | **PROPOSED — يحتاج اعتماد** |
| `pending_manager_decision` | بانتظار قرار المدير | **PROPOSED — يحتاج اعتماد** (optional recommendation path) |
| `approved` | معتمد | Approved concept |
| `rejected` | مرفوض | Approved concept |
| `closed` | مغلق | Admin terminal; vs archived **يحتاج اعتماد لاحق** |
| `archived` | مؤرشف | Admin-only reopen |

### Transitions

| From | Command/action | To | Authorized actor | Preconditions/guards | Required reason/evidence | Audit | Side effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | createDraft | draft | Taxpayer | Authenticated owner | — | Yes | DraftRequestCreated |
| draft | editDraft | draft | Taxpayer (owner) | Still draft | — | Optional | — |
| draft | deleteDraft | (removed) | Taxpayer (owner) | Still draft | — | Yes | DraftRequestDeleted |
| draft | submit | submitted | Taxpayer (owner) | Valid form | — | Yes | RequestSubmitted; SLA start; إشعار; no further taxpayer delete/cancel |
| submitted | startReview | under_review | Reviewer/Supervisor | Assigned/claimable | — | Yes | RequestReviewStarted |
| under_review | requestCompletion | need_more_info | Reviewer / Manager | Open case | Structured missing items | Yes | RequestCompletionRequested; إشعار; unlimited cycles |
| need_more_info | provideCompletion | under_review | Taxpayer (owner) | Owns case | Updated fields/attachments | Yes | RequestCompletionProvided |
| under_review | requireVisit | pending_field_visit | Reviewer | Type requires/allows | — | Yes | RequestFieldVisitRequired |
| pending_field_visit | visitCompleted | under_review | System/Reviewer | Visit completed | Visit record | Yes | Visit completion alone does **not** apply master-data effects |
| under_review | registerDue | pending_payment | Payment authority | Explicit payment permission | Basis document | Yes | إشعار amount |
| pending_payment | paymentConfirmed | under_review | Payment authority | Receipt present | Receipt | Yes | Payment confirmation alone does **not** equal final case approval |
| under_review | recommendApproval | pending_manager_decision | Reviewer | Ready | Optional note | Yes | RequestApprovalRecommended; optional path; not final |
| under_review | recommendRejection | pending_manager_decision | Reviewer | Ready | Recommendation reason | Yes | RequestRejectionRecommended; optional path; not final |
| under_review | finalApprove | approved | Manager/Director | Eligible for final decision; required checks complete; mandatory visit/payment/completion requirements satisfied if configured; authz verified server-side | Reason + reference | Yes | RequestManagerApproved; إشعار; **no** Activity/Property master effect from request types that do not define one |
| under_review | finalReject | rejected | Manager/Director | Eligible for final decision; authz verified server-side | Reason + reference | Yes | RequestManagerRejected; إشعار |
| pending_manager_decision | finalApprove | approved | Manager/Director | Same final-decision guards as from under_review | Reason + reference | Yes | RequestManagerApproved; إشعار |
| pending_manager_decision | finalReject | rejected | Manager/Director | Same final-decision guards as from under_review | Reason + reference | Yes | RequestManagerRejected; إشعار |
| pending_manager_decision | returnToReview | under_review | Manager/Director | — | Optional note | Yes | Manager declines to decide yet |
| *eligible non-draft* | adminClose | closed | Supervisor+ / Manager | Authorized administrative role; **mandatory recorded reason**; business-rule validation; not draft/deleted | Reason | Yes | RequestAdministrativelyClosed; optional إشعار |
| *eligible non-draft / terminal per policy* | archive | archived | Supervisor+ / Manager | Authorized; **mandatory recorded reason** | Reason | Yes | RequestArchived |
| rejected | reopenRejected | under_review | Authorized role | Authz | Reason **يحتاج اعتماد لاحق** who besides admin | Yes | RequestReopened |
| archived | reopenArchived | under_review | Authorized admin only | Authz | Reason | Yes | RequestReopened |
| *decision recorded* | reviseDecision | *same terminal / revised decision state* | Manager/Director (or explicitly authorized) | Prior decision exists; revision authz; history preserved | Revision reason + new reason/reference | Yes | RequestDecisionRevised; before/after |

**Eligible states for administrative close (controlled rule):** any eligible **non-draft, non-deleted** transaction state except where legally/operationally prohibited, including conceptually: `submitted`, `under_review`, `need_more_info`, `pending_field_visit`, `pending_payment`, `pending_manager_decision`, `approved`, `rejected`. Not from deleted draft. Not by Report Reader, Field Visit Officer, Payment Officer, or ordinary Reviewer unless separately authorized.

**Idempotency:** submit / finalApprove / finalReject / paymentConfirmed / reviseDecision must be idempotent on retry.
**Unresolved:** intermediate recommendation state names; closed vs archived; SLA pause on NMI; exact reviseDecision scenarios — **يحتاج اعتماد لاحق**.

---

## 2. Business Notification / Balagh (بلاغ)

**Purpose:** FR-201…206 cases. Same lifecycle class as Request unless service config differs.
**Vocabulary:** Same candidate set as Request (**PROPOSED** markers apply equally).
**Decision ownership:** Balaghat module owns balagh decisions (not Service Requests; not Audit).
**Orchestration owner:** Balaghat application service (inside Business Notifications / Balaghat module).
**Extra guards:** FR field rules enforced at submit and on NMI.

### Final decision (same principle as Request)

| From | Command/action | To | Authorized actor | Guards | Evidence | Audit | Side effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| submitted | startReview | under_review | Reviewer/Supervisor | Assigned/claimable | — | Yes | BalaghReviewStarted |
| under_review | requestCompletion | need_more_info | Reviewer / Manager | Open case | Structured missing items | Yes | BalaghCompletionRequested |
| need_more_info | provideCompletion | under_review | Taxpayer (owner) | Owns case | Updates | Yes | BalaghCompletionProvided |
| under_review | requireVisit | pending_field_visit | Reviewer | Type requires/allows | — | Yes | BalaghFieldVisitRequired |
| under_review | recommendApproval / recommendRejection | pending_manager_decision | Reviewer | Optional path | Note / reason | Yes | BalaghApprovalRecommended / BalaghRejectionRecommended; not final |
| under_review | finalApprove | approved | Manager/Director | Final-decision guards (eligible; checks complete; visit/payment/completion if required; authz) | Reason + reference | Yes | BalaghManagerApproved; إشعار; **then** Balaghat application service requests Activities and Branches to apply approved FR effect |
| under_review | finalReject | rejected | Manager/Director | Final-decision guards | Reason + reference | Yes | BalaghManagerRejected; إشعار; **no** Activity/Property effect |
| pending_manager_decision | finalApprove / finalReject | approved / rejected | Manager/Director | Same guards | Reason + reference | Yes | BalaghManagerApproved / BalaghManagerRejected |
| pending_manager_decision | returnToReview | under_review | Manager/Director | — | Optional | Yes | — |
| *eligible non-draft* | adminClose | closed | Supervisor+ / Manager | Mandatory reason; same eligibility rule as Request | Reason | Yes | BalaghAdministrativelyClosed |
| *eligible non-draft / terminal per policy* | archive | archived | Supervisor+ / Manager | Mandatory reason | Reason | Yes | BalaghArchived |
| rejected / archived | reopen* | under_review | Authorized (admin-only for archived) | Authz | Reason | Yes | BalaghReopened |
| *decision recorded* | reviseDecision | *revised decision* | Manager/Director (or explicitly authorized) | History preserved | Revision reason + new reason/reference | Yes | BalaghDecisionRevised; before/after |

### Activity / property effect timing (authoritative)

| Checkpoint | Applies Activity/Branch/Address/Property effect? |
| --- | --- |
| Taxpayer submit (FR-201/204/205/206) | **No** — records case payload only |
| Reviewer recommendation | **No** |
| Field-visit completion | **No** (evidence only) |
| Payment confirmation | **No** (payment path only) |
| Manager/director **final approval** (normal checkpoint) | **Yes** — after BalaghManagerApproved, Balaghat application service requests Activities and Branches to validate and apply; then ActivityStopped / ActivityReactivated / ActivityAddressChanged / PropertyOwnershipTransferRecorded |
| Per-service alternate checkpoint | Only if configured — **يحتاج اعتماد لاحق حسب إعداد مسار الخدمة** |

Balaghat records and decides the بلاغ workflow. Balaghat **never** directly mutates Activity, Branch, or Property records. Activities and Branches (Property owner) applies effects after the authorized checkpoint via defined NestJS application contracts / domain events.

Other transitions mirror Service Request (actors/guards/audit) with **Balagh\*** event names. Administrative close eligibility and reopen rules match Request.

---

## 3. Field Visit

| From | Command | To | Actor | Guards | Evidence | Audit | Side effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | schedule | scheduled | Supervisor/Officer | Parent case allows | — | Yes | إشعار optional |
| scheduled | reschedule | scheduled | Supervisor/Officer | — | Reason recommended | Yes | — |
| scheduled | complete | completed | Field Visit Officer | Date/time/location/team/findings/notes/result | Photos/attachments | Yes | Parent may return to under_review; **does not** apply Activity/Property effects |
| scheduled | cancelVisit | cancelled | Supervisor | Reason | Reason | Yes | **PROPOSED** cancelVisit — يحتاج اعتماد |
| completed | correctResult | completed | Authorized role | Original history preserved | Correction reason + corrected result | Yes | FieldVisitResultCorrected; no silent overwrite |

**Terminal:** completed; cancelled (**PROPOSED**).
**Invariant:** completed history not silently overwritten (corrections append).
**Unresolved:** service-specific visit triggers; exact who may correct — **يحتاج اعتماد لاحق**.

---

## 4. Payment Due and Payment Confirmation

### Payment Due

| From | Command | To | Actor | Guards | Evidence | Audit | Side effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | registerDue | due_open | Payment authority | Explicit payment permission | **Mandatory basis document** | Yes (amount) | PaymentNoticeIssued (producer: Dues and Payment Evidence) |
| due_open | correctDue | due_open | Payment authority | Reason required | Basis as needed | Yes before/after | — |
| due_open | markAwaitingReceipt | awaiting_receipt | System | After notice | — | Yes | **PROPOSED** state name |

### Payment Confirmation

| From | Command | To | Actor | Guards | Evidence | Audit | Side effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| awaiting_receipt | uploadReceipt | receipt_uploaded | Taxpayer (owner) | Owns parent | **Receipt mandatory** | Yes | — |
| receipt_uploaded | confirmPayment | confirmed | Payment authority | Receipt checked | Receipt | Yes actor/time | Parent workflow continues; **not** final case approval |
| receipt_uploaded | rejectReceipt | awaiting_receipt | Payment authority | Reason | Reason | Yes | إشعار |
| *with receipt* | correctReceipt | receipt_uploaded / confirmed per policy | Payment authority | Reason; history preserved | Old/new attachment refs | Yes before/after | PaymentReceiptCorrected |

**Out of scope:** checkout callbacks; automated settlement; external finance sync.
**No** director approval for amount entry or confirmation.

---

## 5. Notification Message Delivery

| From | Command | To | Actor | Guards | Evidence | Audit | Side effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | queue | queued | System | Outbox write after business commit | — | Optional | — |
| queued | send | sent | Worker | Provider accept | — | Ops | — |
| sent | markDelivered | delivered | Worker | Provider receipt | — | Ops | — |
| * | markFailed | failed | Worker | Error | Failure reason | Ops | Retry policy |
| failed | retry | queued | Worker/ops | Retry budget; controlled retry | — | Yes if manual | NotificationDeliveryRetried; **no** new business outcome |

**Must not** change business case state. WhatsApp only when enabled.
Each delivery attempt retains its own attempt reference/status; dedupe prevents accidental duplicate notifications.

---

## 6. Import Batch

| From | Command | To | Actor | Guards | Evidence | Audit | Side effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | uploadPreview | previewed | Import Operator | File accepted | File | Yes | ImportPreviewed |
| previewed | validate | validated | Import Operator | — | — | Yes | ImportValidated; row errors stay in Imports module |
| validated | approve | approved | Authorized approver | Policy; approver identity recorded | — | Yes | ImportApproved; approval flow details **يحتاج اعتماد لاحق** |
| approved | commit | committed | Import Operator/approver | Batch approved; **committing actor ≠ approving actor** unless explicit audited exception granted | — | Yes | ImportCommitted; apply master data via services |
| *non-committed* | rejectBatch | rejected | Approver | Reason | Reason | Yes | **ImportRejected** |
| *processing* | failBatch | failed | System / Imports | Controlled failure | Phase + safe error ref | Yes | **ImportFailed** (retryability recorded) |

**Separation of duties (safe baseline until OD-13 approved):** approving actor must differ from committing actor unless an explicit audited exception is granted. Role name alone (System Owner / Admin Supervisor / Import Operator) does **not** bypass SoD.

---

## 7. Content Publication

| From | Command | To | Actor | Guards | Evidence | Audit | Side effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | createDraft | draft | Content Manager | — | — | Yes | — |
| draft | publish | published | Content Manager (+ approval if required) | Policy | — | Yes | Public visible |
| published | withdraw | withdrawn | Content Manager | Reason recommended | — | Yes | — |
| * | archiveContent | archived | Content Manager | — | — | Yes | — |

Final content approval flow: **يحتاج اعتماد لاحق**.
