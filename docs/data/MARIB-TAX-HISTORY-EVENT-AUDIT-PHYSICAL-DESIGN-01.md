# MARIB-TAX-HISTORY-EVENT-AUDIT-PHYSICAL-DESIGN-01

**Document ID:** MARIB-TAX-HISTORY-EVENT-AUDIT-PHYSICAL-DESIGN-01
**Status:** Proposed physical design for history, domain-event outbox, and audit (documentation only; not executable DDL)

### Distinctions (binding)

| Structure | Role |
| --- | --- |
| Authoritative case / registry tables | Source of truth for current business state (request, Balagh, activity, due, etc.) |
| Domain event outbox (`audit.domain_event_outbox`, TABLE-094) | Reliable async publication of business domain events after commit (ADR-007 pattern family) |
| Notification delivery outbox (`notify.notification_outbox_messages`, TABLE-072) | **Notification delivery** processing queue only — not domain events |
| History tables | Append-oriented lifecycle evidence owned by the workflow module |
| `audit_events` / `sensitive_change_details` | Append-only security/compliance evidence; never decision owner |
| Notification attempts / read state | Delivery and recipient-read evidence; not case decisions |
| Reporting projections | Derived read models; rebuildable; non-authoritative |

**Event store ≠ authoritative case.** Outbox and event history must not replace Service Request / Balagh / Activities and Branches current state. Consumers may project; owners remain NestJS workflows.

**Dual outbox (binding):** all 56 catalog domain events enroll in `audit.domain_event_outbox` (TABLE-094). `notify.notification_outbox_messages` (TABLE-072) is used only for notification delivery worker processing and must not be treated as the domain-event store.

**Audit is append-only.** Corrections and decision revisions add rows; they do not overwrite or delete prior history.

**Identifier separation (logical):**

| ID kind | Purpose |
| --- | --- |
| Event ID | Immutable identity of one domain-event occurrence |
| Correlation ID | Ties one user/API operation across modules |
| Causation ID | Points to the prior event or command that caused this event |
| Idempotency / dedupe key | Ensures at-most-once business effect / outbox enrollment for a command |

Retention duration for all families remains **يحتاج اعتماد لاحق**.

---

## 1. History structures

### 1.1 Status history

| Logical structure | Owner | Physical design notes |
| --- | --- | --- |
| Request Status History | Service Requests | Append-only rows: requestId, fromStatus, toStatus, actorId, changedAt, correlationId, reasonRef optional |
| Balagh Status History | Business Notifications / Balaghat | Parallel to request; balaghId instead of requestId |
| Activity Status History | Activities and Branches | Written only after authorized final approval + applied effect (ActivityStopped / ActivityReactivated lineage) |

### 1.2 Assignment history

| Logical structure | Owner | Physical design notes |
| --- | --- | --- |
| Request Assignment History | Service Requests | assigneeStaffProfileId, assignerId, assignedAt, releasedAt optional, correlationId |
| Balagh Assignment History | Business Notifications / Balaghat | Parallel shape |

### 1.3 Completion history

| Logical structure | Owner | Physical design notes |
| --- | --- | --- |
| Request Completion Request / Response | Service Requests | Paired NMI sequence; pending vs provided; items as structured refs not free mutation of case form |
| Balagh Completion Request / Response | Business Notifications / Balaghat | Parallel shape |

### 1.4 Decision history

| Logical structure | Owner | Physical design notes |
| --- | --- | --- |
| Request Decision Record | Service Requests | Final approve/reject; reason; reference; actor; decidedAt; priorDecisionEventRef when revised |
| Request Decision Revision | Service Requests | Additive revision preserving previous decision values (RequestDecisionRevised) |
| Balagh Decision Record / Revision | Business Notifications / Balaghat | Parallel shapes |
| Request / Balagh Close-Archive / Reopen Records | Owning workflow | Administrative close, archive, reopen with reason and actor |

Manager final action remains distinct from reviewer recommendation records.

### 1.5 Correction histories

| Logical structure | Owner | Physical design notes |
| --- | --- | --- |
| Visit Result Correction | Field Visits | previousResultRef, correctedResult, reason, actor, at; evidence by attachment ids only |
| Due Correction | Dues and Payment Evidence | old/new amount, reason, actor; basis document refs |
| Receipt Correction/Replacement | Dues and Payment Evidence | old/new attachment ids; lineage preserved |
| Attachment Version/Replacement History | Attachments and Private Files | version sequence; current-version indicator; storage status |

Exact correction authority remains **يحتاج اعتماد لاحق** where not fully approved.

---

## 2. `audit.domain_event_outbox` (TABLE-094)

Purpose: transactional outbox for business domain events (ADR-007). **All 56 catalog domain events** are represented as rows in `audit.domain_event_outbox` (TABLE-094). This table is append-oriented infrastructure; payloads are minimized; Event ID, Correlation ID, Causation ID, and Idempotency / dedupe key remain distinct fields.

`notify.notification_outbox_messages` (TABLE-072) is **not** this store: it is the notification **delivery** queue only. Domain-event enrollment that later triggers notifications still begins in TABLE-094; delivery workers use TABLE-072 after Notification Delivery accepts the side-effect.

| Logical column group | Notes |
| --- | --- |
| event_id | Unique event occurrence id |
| event_name | Catalog name (e.g. `RequestSubmitted`) |
| producer_module | Exactly one producer per catalog row |
| aggregate_type / aggregate_id | Owning aggregate reference |
| occurred_at | Business time of the event |
| correlation_id / causation_id | Distinct from event_id and idempotency_key |
| idempotency_key | Catalog dedupe key; unique with producer disposition |
| payload_ref or payload | Prefer payload_ref when large/sensitive; minimize PII |
| sensitive_class | Guides masking and consumer eligibility |
| publish_status / attempts / next_attempt_at | Worker processing |
| created_at | Insert time |

Outbox rows are not authoritative case state. Successful publish does not imply case mutation beyond what the owning transaction already committed.

---

## 3. `audit_events`

Append-only security/compliance records.

| Logical column group | Notes |
| --- | --- |
| audit_event_id | Immutable |
| occurred_at / actor_context | Actor Context linkage |
| action / outcome | Catalogued action family (**يحتاج اعتماد لاحق** for full taxonomy) |
| target_type / target_id | Entity under scrutiny |
| correlation_id | Aligns with domain events when available |
| domain_event_name / domain_event_id | Optional mirror reference; audit does not produce domain lifecycle events |
| sensitivity | Supports Audit Restricted access |

Audit consumes lifecycle evidence; Identity and Access produces SensitivePermissionChanged as a domain event and corresponding audit.

---

## 4. `sensitive_change_details`

| Logical column group | Notes |
| --- | --- |
| detail_id | Immutable |
| audit_event_id | Parent audit event |
| field_or_aspect | What changed |
| previous_value_masked / new_value_masked | Storage of raw highly sensitive values restricted; masking policy **يحتاج اعتماد لاحق** |
| change_reason | Where required |

Used for permission changes, amount corrections, decision revisions, receipt replacements, and similar before/after evidence.

---

## 5. Notification attempts (delivery evidence; TABLE-072 is delivery queue only)

| Logical structure | Notes |
| --- | --- |
| Notification Message | messageId, channel, template, caseRef, optional Payment Notice link |
| Delivery Attempt / Retry | attemptNo, status, providerRef, failure reason (safe), actorOrComponent |
| Notification Read State | recipient/profile-specific; first-read and acknowledgement timestamps where available |
| `notify.notification_outbox_messages` (TABLE-072) | **INFRASTRUCTURE** delivery processing queue only — not the domain-event outbox (see TABLE-094) |

Delivery status and read status are separate. OTP-related delivery content must minimize PII (DM-11). Domain events such as `NotificationQueued` / `NotificationSent` still enroll in `audit.domain_event_outbox` (TABLE-094); TABLE-072 only tracks async delivery work.

---

## 6. Import lifecycle

Separate retained outcome records (not collapsed into one status overwrite):

Import Batch → Preview → Validation Result → Row Results / Errors → Approval | Rejection | Failure → Commit

Each material transition retains actor/time, correlation, and idempotency disposition. Domain events must not embed full rejected row dumps.

---

## 7. Reporting projections

| Logical structure | Notes |
| --- | --- |
| Domain Event History Record | Optional curated projection of catalog events for analytics; non-authoritative |
| Reporting Projection Definition | Named derived model metadata |
| Saved Report Filter | Owner profile + report key |
| Report Export Record | Requester User Profile; distinguishes `report.view` vs `report.export` |

Projection freshness, rebuild, and reconciliation remain **يحتاج اعتماد لاحق** (DM-15).

---

## 8. Mapping of all 56 domain events

Columns:

- **Producer** — exactly one module
- **Outbox (TABLE-094)** — row representation in `audit.domain_event_outbox` only; never in TABLE-072
- **Aggregate ref** — primary aggregate identity
- **Payload** — handling posture (minimized)
- **Sensitive** — handling posture
- **Dedup** — idempotency / dedupe key (from catalog)

| # | Event | Producer | Outbox (TABLE-094) | Aggregate ref | Payload | Sensitive | Dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | TaxpayerRegistered | Taxpayer Registry | `audit.domain_event_outbox` — taxpayer aggregate | taxpayerId | Minimal: taxpayerId; channel; timestamp | Mask phone externally | taxpayerId+register |
| 2 | DraftRequestCreated | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; taxpayerId; serviceType | — | requestId |
| 3 | DraftRequestDeleted | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; taxpayerId | — | requestId+delete |
| 4 | RequestSubmitted | Service Requests | `audit.domain_event_outbox` — request aggregate; may enqueue status إشعار | requestId | requestId; serviceType; submittedAt | — | requestId+submit |
| 5 | RequestReviewStarted | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; actorId | — | requestId+reviewStart+actor |
| 6 | RequestCompletionRequested | Service Requests | `audit.domain_event_outbox` — request aggregate; إشعار | requestId | requestId; items; actorId; at | — | requestId+nmiSeq |
| 7 | RequestCompletionProvided | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; taxpayerId; at | — | requestId+nmiSeq+provide |
| 8 | RequestFieldVisitRequired | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; type | — | requestId+visitReq |
| 9 | BalaghReviewStarted | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate | balaghId | balaghId; actorId | — | balaghId+reviewStart+actor |
| 10 | BalaghCompletionRequested | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate; إشعار | balaghId | balaghId; items; actorId; at | — | balaghId+nmiSeq |
| 11 | BalaghCompletionProvided | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate | balaghId | balaghId; taxpayerId; at | — | balaghId+nmiSeq+provide |
| 12 | BalaghFieldVisitRequired | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate | balaghId | balaghId; type | — | balaghId+visitReq |
| 13 | FieldVisitScheduled | Field Visits | `audit.domain_event_outbox` — visit aggregate | visitId | visitId; caseId; when; team | — | visitId+scheduleVer |
| 14 | FieldVisitRescheduled | Field Visits | `audit.domain_event_outbox` — visit aggregate | visitId | visitId; oldWhen; newWhen; reason | — | visitId+scheduleVer |
| 15 | FieldVisitCompleted | Field Visits | `audit.domain_event_outbox` — visit aggregate | visitId | visitId; result; findingsRef | Photos via attachment ids only | visitId+complete |
| 16 | FieldVisitResultCorrected | Field Visits | `audit.domain_event_outbox` — visit aggregate; before/after audit | visitId | previousResultRef; correctedResult; reason; actorId; at | Evidence refs only | visitId+correctionSeq |
| 17 | DueRegistered | Dues and Payment Evidence | `audit.domain_event_outbox` — due aggregate; optional إشعار | dueId | dueId; caseId; amount; basisAttachmentId | Amount; identities | dueId+register |
| 18 | DueCorrected | Dues and Payment Evidence | `audit.domain_event_outbox` — due aggregate; before/after audit | dueId | oldAmount; newAmount; reason; actorId | Amounts | dueId+correctionSeq |
| 19 | PaymentNoticeIssued | Dues and Payment Evidence | `audit.domain_event_outbox` — notice aggregate; consumed by Notification Delivery | noticeId | noticeId; dueId; channel | Phone masked in logs | noticeId |
| 20 | PaymentReceiptUploaded | Dues and Payment Evidence | `audit.domain_event_outbox` — confirmation/receipt aggregate | confirmationId | confirmationId; receiptAttachmentId | Receipt private | confirmationId+receipt |
| 21 | PaymentConfirmed | Dues and Payment Evidence | `audit.domain_event_outbox` — confirmation aggregate; optional إشعار | confirmationId | confirmationId; actorId; at | — | confirmationId+confirm |
| 22 | PaymentReceiptCorrected | Dues and Payment Evidence | `audit.domain_event_outbox` — confirmation aggregate; before/after audit | confirmationId | old/new attachmentId; reason; actorId; at | Receipt private | confirmationId+receiptCorrSeq |
| 23 | RequestApprovalRecommended | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; actorId; note | — | requestId+recSeq |
| 24 | RequestRejectionRecommended | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; actorId; reason | — | requestId+recSeq |
| 25 | RequestManagerApproved | Service Requests | `audit.domain_event_outbox` — request aggregate; إشعار | requestId | requestId; reason; reference; actorId; at | — | requestId+finalApprove |
| 26 | RequestManagerRejected | Service Requests | `audit.domain_event_outbox` — request aggregate; إشعار | requestId | requestId; reason; reference; actorId; at | — | requestId+finalReject |
| 27 | RequestDecisionRevised | Service Requests | `audit.domain_event_outbox` — request aggregate; before/after audit; optional إشعار | requestId | full previous/revised decision set + priorDecisionEventRef | Decision details | requestId+decisionRevSeq |
| 28 | RequestAdministrativelyClosed | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; reason; actorId | — | requestId+close |
| 29 | RequestArchived | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; reason; actorId | — | requestId+archive |
| 30 | RequestReopened | Service Requests | `audit.domain_event_outbox` — request aggregate | requestId | requestId; from; reason; actorId | — | requestId+reopenSeq |
| 31 | BalaghApprovalRecommended | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate | balaghId | balaghId; actorId; note | — | balaghId+recSeq |
| 32 | BalaghRejectionRecommended | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate | balaghId | balaghId; actorId; reason | — | balaghId+recSeq |
| 33 | BalaghManagerApproved | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate; إشعار | balaghId | balaghId; reason; reference; actorId; at | — | balaghId+finalApprove |
| 34 | BalaghManagerRejected | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate; إشعار | balaghId | balaghId; reason; reference; actorId; at | — | balaghId+finalReject |
| 35 | BalaghDecisionRevised | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate; before/after audit; optional إشعار | balaghId | full previous/revised decision set + priorDecisionEventRef | Decision details | balaghId+decisionRevSeq |
| 36 | BalaghAdministrativelyClosed | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate | balaghId | balaghId; reason; actorId | — | balaghId+close |
| 37 | BalaghArchived | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate | balaghId | balaghId; reason; actorId | — | balaghId+archive |
| 38 | BalaghReopened | Business Notifications / Balaghat | `audit.domain_event_outbox` — balagh aggregate | balaghId | balaghId; from; reason; actorId | — | balaghId+reopenSeq |
| 39 | ActivityStopped | Activities and Branches | `audit.domain_event_outbox` — activity aggregate; after authorized final approval + applied effect | activityId (+ branchId scope) | activityIds; branchId; temp/final; reason; sourceCaseId | — | activityId+stopSeq |
| 40 | ActivityReactivated | Activities and Branches | `audit.domain_event_outbox` — activity aggregate; after authorized final approval + applied effect | activityId | activityIds; reason; sourceCaseId | — | activityId+reactSeq |
| 41 | ActivityAddressChanged | Activities and Branches | `audit.domain_event_outbox` — activity/branch aggregate; after authorized approval + applied effect | activityId / branchId | old/new address; sourceCaseId | Address | activityId+addrSeq |
| 42 | PropertyOwnershipTransferRecorded | Activities and Branches | `audit.domain_event_outbox` — property aggregate; after authorized FR-205 approval + applied effect | propertyId | propertyId; units; seller/buyer refs; sourceCaseId | Seller/buyer | propertyId+transferSeq |
| 43 | NotificationQueued | Notification Delivery | `audit.domain_event_outbox` — message aggregate; delivery work may use TABLE-072 | messageId | messageId; channel; template; caseRef | Minimize PII | messageId |
| 44 | NotificationSent | Notification Delivery | `audit.domain_event_outbox` — message aggregate | messageId | messageId; providerRef | — | messageId+attempt |
| 45 | NotificationDelivered | Notification Delivery | `audit.domain_event_outbox` — message aggregate | messageId | messageId | — | messageId+delivered |
| 46 | NotificationFailed | Notification Delivery | `audit.domain_event_outbox` — message aggregate; retry path | messageId | messageId; reason | — | messageId+attempt |
| 47 | NotificationDeliveryRetried | Notification Delivery | `audit.domain_event_outbox` — message aggregate; re-queue delivery via TABLE-072 | messageId | messageId; priorAttempt; actorOrComponent; at | Minimize PII | messageId+attempt |
| 48 | ImportPreviewed | Imports and Data Quality | `audit.domain_event_outbox` — batch aggregate | batchId | batchId; filename; rowCount | No full row dump | batchId+preview |
| 49 | ImportValidated | Imports and Data Quality | `audit.domain_event_outbox` — batch aggregate | batchId | batchId; accepted; rejected | No full rejected rows | batchId+validate |
| 50 | ImportApproved | Imports and Data Quality | `audit.domain_event_outbox` — batch aggregate | batchId | batchId; actorId | — | batchId+approve |
| 51 | ImportRejected | Imports and Data Quality | `audit.domain_event_outbox` — batch aggregate; optional internal إشعار | batchId | rejectionReason; notes; actorId; at; summary counts | No full rejected rows | batchId+reject |
| 52 | ImportFailed | Imports and Data Quality | `audit.domain_event_outbox` — batch aggregate; optional ops alert | batchId | phase; failureCategory; safeErrorRef; retryability | No secrets/stacks/row dumps | batchId+failSeq |
| 53 | ImportCommitted | Imports and Data Quality | `audit.domain_event_outbox` — batch aggregate | batchId | batchId; counts; committerId | — | batchId+commit |
| 54 | ContentPublished | Content Management | `audit.domain_event_outbox` — content aggregate | contentId | contentId; actorId | — | contentId+publishVer |
| 55 | ContentWithdrawn | Content Management | `audit.domain_event_outbox` — content aggregate | contentId | contentId; reason; actorId | — | contentId+withdrawVer |
| 56 | SensitivePermissionChanged | Identity and Access | `audit.domain_event_outbox` — subject/role aggregate; mandatory audit + sensitive detail | changeId / subjectId | subjectId; role/permission; actorId; before/after | Highly sensitive | changeId |

**Event mapping count: 56** (TaxpayerRegistered through SensitivePermissionChanged). **All 56 map to `audit.domain_event_outbox` (TABLE-094).** TABLE-072 is notification delivery only.

---

## 9. Cross-cutting physical rules

1. One producer module per event; Audit does not produce lifecycle events; Notification Delivery does not produce case decisions.
2. ActivityStopped, ActivityReactivated, ActivityAddressChanged, and PropertyOwnershipTransferRecorded emit only after authorized final approval and successful application by Activities and Branches.
3. Payment confirmation and receipt acceptance are non-final for request/Balagh outcomes.
4. Correlation, causation, event, and idempotency identifiers remain distinct fields.
5. All domain-event enrollments use `audit.domain_event_outbox` (TABLE-094); `notify.notification_outbox_messages` (TABLE-072) is delivery-queue infrastructure only.
6. Retention, legal hold, and destruction periods remain **يحتاج اعتماد لاحق**.
