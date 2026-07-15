# Marib Tax System — Domain Event Catalog 01

**Document ID:** MARIB-TAX-DOMAIN-EVENT-CATALOG-01
**Status:** Proposed event catalog (not broker-specific; not executable schemas)

### Distinctions

| Kind | Meaning |
| --- | --- |
| **Business domain event** | Something meaningful happened in the domain (case submitted, activity stopped) |
| **Audit record** | Append-only security/compliance record (may mirror domain events with before/after) |
| **Notification delivery message** | Outbox/channel transport of an إشعار (queued/sent/failed) |

### Producer rule

Every domain event has **exactly one** named producer module. Slash-separated dual producers and generic case-owner producer labels are forbidden.

Request and بلاغ lifecycles follow **parallel concrete event families**. Each catalog row names one producer only:

- Service Requests for طلب events
- Business Notifications / Balaghat for بلاغ events

Audit consumes lifecycle events; it does not produce them. Notification Delivery consumes relevant events for delivery; it does not produce case decisions.

### Business-effect timing

ActivityStopped, ActivityReactivated, ActivityAddressChanged, and PropertyOwnershipTransferRecorded are emitted **only after**:

1. authorized final approval (normal checkpoint: manager/director), and
2. successful application of the effect by Activities and Branches.

Submit, recommendation, payment confirmation, or visit completion alone must **not** emit these effect events. Per-service checkpoint variance: **يحتاج اعتماد لاحق حسب إعداد مسار الخدمة**.

---

## Event catalog

| Event name | Arabic meaning | Producer module | Triggering command | Minimum conceptual payload | Sensitive restrictions | Audit | Reporting use | Notification/outbox | Idempotency / dedupe key |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TaxpayerRegistered | تسجيل مكلف | Taxpayer Registry | register | taxpayerId; channel; timestamp | Mask phone externally | Y | #12 | Optional welcome إشعار | taxpayerId+register |
| DraftRequestCreated | إنشاء مسودة طلب | Service Requests | createDraft | requestId; taxpayerId; serviceType | — | Y | — | — | requestId |
| DraftRequestDeleted | حذف مسودة طلب | Service Requests | deleteDraft | requestId; taxpayerId | — | Y | #4 drafts | — | requestId+delete |
| RequestSubmitted | تقديم طلب | Service Requests | submit | requestId; serviceType; submittedAt | — | Y | SLA/#5 | Status إشعار | requestId+submit |
| RequestReviewStarted | بدء مراجعة طلب | Service Requests | startReview | requestId; actorId | — | Y | Assignment history | — | requestId+reviewStart+actor |
| RequestCompletionRequested | طلب استكمال لطلب | Service Requests | requestCompletion | requestId; items; actorId; at | — | Y | #5 | إشعار | requestId+nmiSeq |
| RequestCompletionProvided | تقديم استكمال طلب | Service Requests | provideCompletion | requestId; taxpayerId; at | — | Y | #5 | — | requestId+nmiSeq+provide |
| RequestFieldVisitRequired | زيارة مطلوبة لطلب | Service Requests | requireVisit | requestId; type | — | Y | #6/#9 | Optional | requestId+visitReq |
| BalaghReviewStarted | بدء مراجعة بلاغ | Business Notifications / Balaghat | startReview | balaghId; actorId | — | Y | Assignment history | — | balaghId+reviewStart+actor |
| BalaghCompletionRequested | طلب استكمال لبلاغ | Business Notifications / Balaghat | requestCompletion | balaghId; items; actorId; at | — | Y | #5 | إشعار | balaghId+nmiSeq |
| BalaghCompletionProvided | تقديم استكمال بلاغ | Business Notifications / Balaghat | provideCompletion | balaghId; taxpayerId; at | — | Y | #5 | — | balaghId+nmiSeq+provide |
| BalaghFieldVisitRequired | زيارة مطلوبة لبلاغ | Business Notifications / Balaghat | requireVisit | balaghId; type | — | Y | #6/#9 | Optional | balaghId+visitReq |
| FieldVisitScheduled | جدولة زيارة | Field Visits | schedule | visitId; caseId; when; team | — | Y | #9 | Optional إشعار | visitId+scheduleVer |
| FieldVisitRescheduled | إعادة جدولة | Field Visits | reschedule | visitId; oldWhen; newWhen; reason | — | Y | #9/#11 | Optional | visitId+scheduleVer |
| FieldVisitCompleted | إكمال زيارة | Field Visits | complete | visitId; result; findingsRef | Photos via attachment ids only | Y | #10/#11 | Parent may resume | visitId+complete |
| FieldVisitResultCorrected | تصحيح نتيجة زيارة | Field Visits | correctResult | visitId; previousResultRef; correctedResult; reason; actorId; at | Evidence refs only | Y before/after | #10/#11/#25 | — | visitId+correctionSeq |
| DueRegistered | تسجيل مستحق | Dues and Payment Evidence | registerDue | dueId; caseId; amount; basisAttachmentId | Amount; identities | Y | #16 | May queue إشعار | dueId+register |
| DueCorrected | تصحيح مستحق | Dues and Payment Evidence | correctDue | dueId; oldAmount; newAmount; reason; actorId | Amounts | Y before/after | #16/#25 | Optional | dueId+correctionSeq |
| PaymentNoticeIssued | إشعار بالمبلغ | Dues and Payment Evidence | after authorized registerDue / issue notice | noticeId; dueId; channel | Phone masked in logs | Y | #16/#17 | Consumed by Notification Delivery | noticeId |
| PaymentReceiptUploaded | رفع إيصال | Dues and Payment Evidence | uploadReceipt | confirmationId; receiptAttachmentId | Receipt private | Y | #16 | — | confirmationId+receipt |
| PaymentConfirmed | تأكيد السداد | Dues and Payment Evidence | confirmPayment | confirmationId; actorId; at | — | Y | #16 | Optional إشعار | confirmationId+confirm |
| PaymentReceiptCorrected | تصحيح/استبدال إيصال | Dues and Payment Evidence | correctReceipt | confirmationId; oldAttachmentId; newAttachmentId; reason; actorId; at | Receipt private | Y before/after | #16/#25 | — | confirmationId+receiptCorrSeq |
| RequestApprovalRecommended | توصية اعتماد طلب | Service Requests | recommendApproval | requestId; actorId; note | — | Y | — | — | requestId+recSeq |
| RequestRejectionRecommended | توصية رفض طلب | Service Requests | recommendRejection | requestId; actorId; reason | — | Y | — | — | requestId+recSeq |
| RequestManagerApproved | اعتماد نهائي لطلب | Service Requests | finalApprove | requestId; reason; reference; actorId; at | — | Y | #4/#7 | إشعار | requestId+finalApprove |
| RequestManagerRejected | رفض نهائي لطلب | Service Requests | finalReject | requestId; reason; reference; actorId; at | — | Y | #4/#7 | إشعار | requestId+finalReject |
| RequestDecisionRevised | تعديل قرار طلب مع الحفاظ على القرار السابق | Service Requests | reviseDecision | requestId; previousDecision; revisedDecision; previousReason; previousReference; newReason; newReference; revisionReason; actorId; at; priorDecisionEventRef | — | Y before/after | #4/#7/#25/#26 | Optional updated إشعار | requestId+decisionRevSeq |
| RequestAdministrativelyClosed | إغلاق إداري لطلب | Service Requests | adminClose | requestId; reason; actorId | — | Y | #4/#26 | Optional | requestId+close |
| RequestArchived | أرشفة طلب | Service Requests | archive | requestId; reason; actorId | — | Y | #4/#26 | — | requestId+archive |
| RequestReopened | إعادة فتح طلب | Service Requests | reopenRejected / reopenArchived | requestId; from; reason; actorId | — | Y | #7 | Optional | requestId+reopenSeq |
| BalaghApprovalRecommended | توصية اعتماد بلاغ | Business Notifications / Balaghat | recommendApproval | balaghId; actorId; note | — | Y | — | — | balaghId+recSeq |
| BalaghRejectionRecommended | توصية رفض بلاغ | Business Notifications / Balaghat | recommendRejection | balaghId; actorId; reason | — | Y | — | — | balaghId+recSeq |
| BalaghManagerApproved | اعتماد نهائي لبلاغ | Business Notifications / Balaghat | finalApprove | balaghId; reason; reference; actorId; at | — | Y | #4/#7 | إشعار | balaghId+finalApprove |
| BalaghManagerRejected | رفض نهائي لبلاغ | Business Notifications / Balaghat | finalReject | balaghId; reason; reference; actorId; at | — | Y | #4/#7 | إشعار | balaghId+finalReject |
| BalaghDecisionRevised | تعديل قرار بلاغ مع الحفاظ على القرار السابق | Business Notifications / Balaghat | reviseDecision | balaghId; previousDecision; revisedDecision; previousReason; previousReference; newReason; newReference; revisionReason; actorId; at; priorDecisionEventRef | — | Y before/after | #4/#7/#25/#26 | Optional updated إشعار | balaghId+decisionRevSeq |
| BalaghAdministrativelyClosed | إغلاق إداري لبلاغ | Business Notifications / Balaghat | adminClose | balaghId; reason; actorId | — | Y | #4/#26 | Optional | balaghId+close |
| BalaghArchived | أرشفة بلاغ | Business Notifications / Balaghat | archive | balaghId; reason; actorId | — | Y | #4/#26 | — | balaghId+archive |
| BalaghReopened | إعادة فتح بلاغ | Business Notifications / Balaghat | reopenRejected / reopenArchived | balaghId; from; reason; actorId | — | Y | #7 | Optional | balaghId+reopenSeq |
| ActivityStopped | إيقاف نشاط | Activities and Branches | applyStoppage after authorized final approval | activityIds; branchId; temp/final; reason; sourceCaseId | — | Y | #8 | Optional | activityId+stopSeq |
| ActivityReactivated | تفعيل نشاط | Activities and Branches | applyReactivation after authorized final approval | activityIds; reason; sourceCaseId | — | Y | #8 | Optional | activityId+reactSeq |
| ActivityAddressChanged | تغيير عنوان | Activities and Branches | applyAddressChange after authorized approval | activity/branch ids; old/new address; sourceCaseId | Address | Y | #8/#14 | Optional | activityId+addrSeq |
| PropertyOwnershipTransferRecorded | نقل ملكية | Activities and Branches | applyOwnershipTransfer after authorized FR-205 approval | propertyId; units; seller/buyer refs; sourceCaseId | Seller/buyer | Y | #6/#7 | Optional | propertyId+transferSeq |
| NotificationQueued | طابور إشعار | Notification Delivery | queue | messageId; channel; template; caseRef | Minimize PII in payload | C | #17/#19 | Outbox | messageId |
| NotificationSent | إرسال إشعار | Notification Delivery | send | messageId; providerRef | — | C | #17 | — | messageId+attempt |
| NotificationDelivered | تسليم إشعار | Notification Delivery | markDelivered | messageId | — | C | #17 | — | messageId+delivered |
| NotificationFailed | فشل إشعار | Notification Delivery | markFailed | messageId; reason | — | C | #17 | Retry | messageId+attempt |
| NotificationDeliveryRetried | إعادة محاولة تسليم إشعار | Notification Delivery | retry | messageId; priorAttempt; actorOrComponent; at | Minimize PII | C | #17 | Re-queue | messageId+attempt |
| ImportPreviewed | معاينة استيراد | Imports and Data Quality | uploadPreview | batchId; filename; rowCount | No full row dump | Y | #22 | — | batchId+preview |
| ImportValidated | تحقق استيراد | Imports and Data Quality | validate | batchId; accepted; rejected | No full rejected rows | Y | #22/#23 | — | batchId+validate |
| ImportApproved | اعتماد استيراد | Imports and Data Quality | approve | batchId; actorId | — | Y | #22/#26 | — | batchId+approve |
| ImportRejected | رفض دفعة الاستيراد قبل الترحيل | Imports and Data Quality | rejectBatch | batchId; rejectionReasonCode/category; optional notes; actorId; at; summary counts | Do **not** embed full rejected row data | Y | #22/#23/#24/#25/#26 | Optional internal إشعار to operator | batchId+reject |
| ImportFailed | فشل معالجة الاستيراد | Imports and Data Quality | failBatch / processing failure | batchId; phase; failureCategory; safeErrorRef; actorOrComponent; at; retryability | No secrets, stack traces, or sensitive row contents | Y | #22/#23/#25/#26 | Optional ops alert | batchId+failSeq |
| ImportCommitted | تنفيذ استيراد | Imports and Data Quality | commit | batchId; counts; committerId | — | Y | #22/#24 | — | batchId+commit |
| ContentPublished | نشر محتوى | Content Management | publish | contentId; actorId | — | Y | #28 | — | contentId+publishVer |
| ContentWithdrawn | سحب محتوى | Content Management | withdraw | contentId; reason; actorId | — | Y | #28/#26 | — | contentId+withdrawVer |
| SensitivePermissionChanged | تغيير صلاحية حساسة | Identity and Access | assign/revoke | subjectId; role/permission; actorId; before/after | Highly sensitive | Y | #26/#27 | — | changeId |

**Event count:** **56** named events in this catalog.

*(Was 44 before producer-ownership remediation: 12 generic case-family rows replaced by 24 concrete Request/Balagh events; net +12.)*

### Parallel event families (conceptual)

طلب and بلاغ share parallel lifecycle **command** semantics, but emit **distinct** events with distinct producers. Do not collapse them into a shared producer cell.

### Import event distinctions

| Event | Meaning |
| --- | --- |
| **ImportRejected** | Authorized business/operational decision to reject a batch before commit |
| **ImportFailed** | Technical or controlled processing failure during preview, validation, or commit |
| Row-level validation errors | Remain detailed records owned by Imports; not all copied into domain events |

### Decision revision rules

Apply to **RequestDecisionRevised** and **BalaghDecisionRevised**:

- Payload must include previous decision, revised decision, previous reason, previous reference, new reason, new reference, revision reason, actor, timestamp, prior decision-event reference, and correlation/idempotency key.
- Mandatory before/after audit history.
- Previous decision history cannot be overwritten or removed.
- Only explicitly authorized roles may revise; manager/director authority cannot be silently bypassed.
- Exact permitted revision scenarios: **يحتاج اعتماد لاحق**.

### Correction / retry history

- `PaymentReceiptCorrected` — authorized receipt replacement/correction.
- `FieldVisitResultCorrected` — completed visit result correction with original history preserved.
- `NotificationDeliveryRetried` — controlled retry; does not create a new business outcome.

Exact correction authorization details where not fully approved: **يحتاج اعتماد لاحق**.

Draft balagh create/delete may mirror request draft events in implementation; if needed as separate names: **يحتاج اعتماد لاحق**.
