# Marib Tax System — Transition Authorization Matrix 01

**Document ID:** MARIB-TAX-TRANSITION-AUTHORIZATION-MATRIX-01
**Roles:** Only approved permissions-baseline roles

Legend: **Y** = allowed · **N** = prohibited · **C** = conditional on explicit extra grant/ownership · **SoD** = separation of duties applies

### Stable permission identifiers

API-02 approves the non-deferred identifiers below as stable implementation constants. Wildcards and administrator bypass permissions are prohibited. Keys explicitly marked **DEFERRED** are documentation-only and cannot be used in runtime decorators or grants.

| Command family | Stable permission |
| --- | --- |
| createDraft | `request.draft.create` / `balagh.create` (by case type) |
| editDraft | `request.draft.edit` / `balagh.draft.edit` |
| deleteDraft | `request.draft.delete` / `balagh.draft.delete` |
| submit | `request.submit` / `balagh.submit` |
| startReview / review actions | `request.review` / `balagh.review` |
| requestCompletion | `request.completion.request` / `balagh.completion.request` |
| provideCompletion | `request.completion.provide` / `balagh.completion.provide` |
| recommendApproval / recommendRejection | `request.decision.recommend` / `balagh.decision.recommend` |
| issueFinalApproval / issueFinalRejection | `request.decision.final` / `balagh.decision.final` |
| reviseDecision (طلب) | `request.decision.revise` (**يحتاج اعتماد لاحق** exact scenarios) |
| reviseDecision (بلاغ) | `balagh.decision.revise` (**يحتاج اعتماد لاحق** exact scenarios) |
| administrativeClose | `request.admin.close` / `balagh.admin.close` |
| archive | `request.archive` / `balagh.archive` |
| reopenRejected | `request.reopen.rejected` / `balagh.reopen.rejected` |
| reopenArchived | `request.reopen.archived` / `balagh.reopen.archived` |
| scheduleFieldVisit | `field_visit.schedule` |
| recordVisitResult | `field_visit.result.record` |
| correctVisitResult | `field_visit.result.correct` (**يحتاج اعتماد لاحق**) |
| registerPaymentDue | `due.register` |
| correctPaymentDue | `due.correct` |
| uploadReceipt | `payment.receipt.upload` |
| confirmPayment | `payment.confirm` |
| correctReceipt | `payment.receipt.correct` (**يحتاج اعتماد لاحق**) |
| uploadPreview | `import.preview` (**PROPOSED — needs confirmation during API/security design**) |
| validate (import) | `import.validate` (**PROPOSED — needs confirmation during API/security design**) |
| approveImport | `import.approve` |
| commitImport | `import.commit` |
| rejectImport | `import.reject` |
| publishContent | `content.publish` |
| withdrawContent | `content.withdraw` |
| viewReports | `report.view` |
| exportReports | `report.export` |
| viewSensitiveAudit | `audit.sensitive.view` |

---

| Command / transition | Conceptual permission (PROPOSED) | Taxpayer | Request Reviewer | Field Visit Officer | Payment Officer | Admin Supervisor | Manager / Director | Content Manager | Import Operator | Report Reader | Audit/Security Reviewer | System Owner | Ownership restriction | Required evidence | Audit mandatory | SoD notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| createDraft | request.draft.create / balagh.create | Y | N | N | N | N | N | N | N | N | N | N | Own taxpayer | — | Y | — |
| editDraft | request.draft.edit | Y | N | N | N | N | N | N | N | N | N | N | Own + draft | — | C | — |
| deleteDraft | request.draft.delete | Y | N | N | N | N | N | N | N | N | N | N | Own + draft | — | Y | — |
| submit | request.submit / balagh.submit | Y | N | N | N | N | N | N | N | N | N | N | Own + draft | Valid form | Y | Locks delete/cancel |
| requestCompletion | request.completion.request | N | Y | N | N | Y | Y | N | N | N | N | C | Assigned/accessible | Missing items list | Y | — |
| provideCompletion | request.completion.provide | Y | N | N | N | N | N | N | N | N | N | N | Own + NMI | Updates/attachments | Y | — |
| recommendApproval | request.decision.recommend | N | Y | N | N | Y | N* | N | N | N | N | N | Accessible case | Optional note | Y | Optional path; not final |
| recommendRejection | request.decision.recommend | N | Y | N | N | Y | N* | N | N | N | N | N | Accessible case | Reason | Y | Optional path; not final |
| issueFinalApproval | request.decision.final / balagh.decision.final | N | **N** | **N** | **N** | **N** | **Y** | N | N | N | N | N | — | Reason + reference | Y | Manager only; from under_review or pending_manager_decision |
| issueFinalRejection | request.decision.final / balagh.decision.final | N | **N** | **N** | **N** | **N** | **Y** | N | N | N | N | N | — | Reason + reference | Y | Manager only |
| reviseRequestDecision | request.decision.revise | N | **N** | N | N | C | **Y** | N | N | N | N | C | Prior **request** decision exists | Revision reason + new reason/reference | Y | Emits RequestDecisionRevised; scenarios **يحتاج اعتماد لاحق**; reviewer role does not grant |
| reviseBalaghDecision | balagh.decision.revise | N | **N** | N | N | C | **Y** | N | N | N | N | C | Prior **balagh** decision exists | Revision reason + new reason/reference | Y | Emits BalaghDecisionRevised; scenarios **يحتاج اعتماد لاحق**; reviewer role does not grant |
| administrativeClose | request.admin.close | N | N | N | N | Y | Y | N | N | N | N | C | Eligible non-draft | **Recorded reason** | Y | Not Report Reader / Visit / Payment / ordinary Reviewer |
| archive | request.archive | N | N | N | N | Y | Y | N | N | N | N | C | Policy | **Recorded reason** | Y | — |
| reopenRejected | request.reopen.rejected | N | C | N | N | Y | Y | N | N | N | N | C | Authz matrix **يحتاج اعتماد لاحق** | Reason | Y | — |
| reopenArchived | request.reopen.archived | N | **N** | N | N | Y | Y | N | N | N | N | C | **Admin-only** | Reason | Y | — |
| scheduleFieldVisit | field_visit.schedule | N | C | C | N | Y | Y | N | N | N | N | N | Parent allows | — | Y | — |
| recordVisitResult | field_visit.result.record | N | N | Y | N | Y | Y | N | N | N | N | N | Assigned visit | Visit fields + evidence | Y | Does not final-decide case |
| correctVisitResult | field_visit.result.correct | N | N | C | N | Y | Y | N | N | N | N | C | Authz **يحتاج اعتماد لاحق** | Correction reason | Y | Append history |
| registerPaymentDue | due.register | N | **N** | N | **Y** | C | C | N | N | N | N | N | Explicit payment authority | **Basis document** | Y | Reviewer has no auto payment auth |
| correctPaymentDue | due.correct | N | **N** | N | **Y** | C | C | N | N | N | N | N | Payment authority | Reason + basis | Y | Before/after |
| uploadReceipt | payment.receipt.upload | Y | N | N | N | N | N | N | N | N | N | N | Own parent case | **Receipt** | Y | — |
| confirmPayment | payment.confirm | N | **N** | N | **Y** | C | C | N | N | N | N | N | Payment authority | Receipt checked | Y | Not final case decision |
| correctReceipt | payment.receipt.correct | N | N | N | **Y** | C | C | N | N | N | N | C | Payment authority | Reason + old/new refs | Y | Before/after |
| publishContent | content.publish | N | N | N | N | N | N | Y | N | N | N | C | — | Per content policy | Y | Approval flow **يحتاج اعتماد لاحق** |
| uploadPreview | import.preview | N | N | N | N | C | C | N | Y | N | N | C | Import policy | File | Y | PROPOSED permission |
| validateImport | import.validate | N | N | N | N | C | C | N | Y | N | N | C | After preview | — | Y | PROPOSED permission |
| approveImport | import.approve | N | N | N | N | C | C | N | C | N | N | C | Import policy | — | Y | Approver ≠ committer (SoD) |
| commitImport | import.commit | N | N | N | N | C | C | N | Y | N | N | C | After approve; committer ≠ approver unless audited exception | — | Y | SoD; role name alone does not bypass; OD-13 |
| rejectImport | import.reject | N | N | N | N | C | C | N | C | N | N | C | Import policy | Rejection reason | Y | ImportRejected |
| viewReports (`report.view`) | report.view | N | C | C | C | C | C | C | C | **Y** | C | C | Granted reports only | — | C | Masking for Report Reader |
| exportReports (`report.export`) | report.export | N | C | C | C | C | C | C | C | **C** | C | C | Separate grant | — | Y if sensitive | Not automatic with view |
| viewSensitiveAudit | audit.sensitive.view | N | N | N | N | N | C | N | N | N | **Y** | Y | Need-to-know | — | C | Cannot rewrite audit |

\* Manager issues **final** decisions; “recommend” rows are N for manager to avoid confusing recommendation with final act (manager uses finalApprove/finalReject from `under_review` or `pending_manager_decision`).

### Explicit confirmations

1. Request Reviewer **cannot** issue final approval/rejection.
2. Manager/director **may** finalize from active review without a prior recommendation; recommendation remains optional unless separately approved.
3. Payment Officer **cannot** issue final transaction decision unless separately assigned manager/director.
4. Report Reader has **no** mutation authority.
5. `report.view` and `report.export` remain **separate**.
6. Taxpayer accesses **only owned** transactions.
7. Administrative role names do **not** automatically grant all permissions (least privilege).
8. Dual-role users may act only under the permission relevant to each command.
9. Import: approving actor must differ from committing actor unless an explicit audited exception is granted (see OD-13).
10. Decision revision must not silently bypass manager/director authority; emits `RequestDecisionRevised` or `BalaghDecisionRevised` as appropriate. Reviewer role does not grant revision. Final-decision and revision authority remain server-enforced. Exact revision scenarios: **يحتاج اعتماد لاحق**.
