# MARIB-TAX-SUPABASE-STORAGE-PHYSICAL-DESIGN-01

**Document ID:** MARIB-TAX-SUPABASE-STORAGE-PHYSICAL-DESIGN-01
**Status:** Proposed private storage layout (documentation only; **no bucket creation**, no executable policies)

### Purpose

Describe the **PROPOSED** Supabase Storage physical layout for Marib Tax operational and public content files. Aligns with ADR-009 (private file storage; short-lived authorized access).

This document does not create buckets, ACLs, or SQL.

---

## 1. Design principles

| Principle | Requirement |
| --- | --- |
| Private by default | Operational buckets are private; no public ACL for taxpayer/case/payment/visit/import/audit files. |
| Metadata is authoritative for app links | Application `Attachment` rows own business metadata; `storage.objects` holds bytes and storage-native keys. |
| Access mediation | NestJS authorizes then issues short-lived signed URLs; clients never receive long-lived privileged storage credentials. |
| Public exception | Only Content Management approved public publication context may expose public objects. |
| Versioning | Replacements are additive versions; prior objects retained per retention policy (**يحتاج اعتماد لاحق**). |

Signed URL expiry duration remains **يحتاج اعتماد لاحق**.

---

## 2. PROPOSED private bucket layout

Logical bucket names are proposals only (not provisioned by this document):

| Proposed bucket | Purpose | Public? |
| --- | --- | --- |
| `mt-case-attachments` | Request / Balagh form and supporting documents | No |
| `mt-visit-evidence` | Field visit photos and evidence | No |
| `mt-payment-evidence` | Due basis documents, receipts | No |
| `mt-import-files` | Import source files and operator error exports | No |
| `mt-audit-evidence` | Privileged audit/security export packages | No |
| `mt-content-public` | Approved Content Management public assets only | Yes (publication-gated) |

Additional segregation (env prefix, tenant prefix) remains **يحتاج اعتماد لاحق**.

---

## 3. Object path conventions (proposed)

Paths are opaque and non-authorizing. Knowing a path does not grant access.

| Family | Proposed path pattern | Notes |
| --- | --- | --- |
| Request/Balagh attachment | `{env}/{caseType}/{caseId}/{attachmentId}/v{version}/{objectId}` | caseType = `requests` \| `balaghat` (no `cases` path segment) |
| Visit evidence | `{env}/visits/{visitId}/{attachmentId}/v{version}/{objectId}` | Photos referenced by attachment ids in events |
| Due basis | `{env}/dues/{dueId}/basis/{attachmentId}/v{version}/{objectId}` | Required for DueRegistered evidence |
| Receipt | `{env}/payments/{confirmationOrDueRef}/receipts/{attachmentId}/v{version}/{objectId}` | Private; replacement increments version |
| Import source | `{env}/imports/{batchId}/source/{objectId}` | No public listing |
| Import errors | `{env}/imports/{batchId}/errors/{objectId}` | Operator download; audited |
| Audit package | `{env}/audit/{exportId}/{objectId}` | Audit Restricted |
| Public content | `{env}/content/{contentId}/rev{revision}/{objectId}` | Only after ContentPublished rules |

Exact delimiter, hash salting, and filename sanitization remain **يحتاج اعتماد لاحق**.

---

## 4. Attachments metadata ↔ `storage.objects`

| Application (Attachments and Private Files) | Storage |
| --- | --- |
| Attachment.id | Stable business id |
| storage_bucket (logical name) | Bucket id/name |
| storage_object_key | `storage.objects.name` (key) |
| content_type / media classification | Optional mirror; business classification wins for access |
| logical_size_bytes | Application-recorded size for accounting |
| storage_accounting_category | Operational metrics category (DM-26 open) |
| current_version_indicator | Points at active Attachment Version |
| storage_status | pending_upload \| available \| replaced \| delete_pending \| deleted \| legal_hold |
| deletion/retention status | Aligns with retention open decision |

`Attachment Link` associates Attachment to parent (request, Balagh, visit, due, receipt, content, import, audit package) without embedding bytes.

An attachment **reference never authorizes** download; NestJS checks parent scope + classification + role/Account Link before signing.

---

## 5. Versions

| Concern | Design |
| --- | --- |
| Upload of replacement | New version row + new object key; prior version remains addressable to authorized auditors |
| Current pointer | Only one current version for business reads |
| Events | PaymentReceiptCorrected / visit corrections cite attachment ids, not raw URLs |
| Orphan objects | Reconciliation job concept only; procedure **يحتاج اعتماد لاحق** |

---

## 6. Size and status

| Attribute | Requirement |
| --- | --- |
| Logical size | Recorded on Attachment; used for quotas/reporting without listing storage ACLs to clients |
| Max size per type | **يحتاج اعتماد لاحق** |
| Status transitions | pending_upload → available on successful finalize; failed uploads do not become available |
| Delete pending | Soft marker; hard delete subject to retention/legal hold |

---

## 7. Upload lifecycle (conceptual)

1. Client requests upload intent via NestJS (authenticated + authorized).
2. NestJS creates Attachment (pending) + optional Attachment Link to parent.
3. NestJS returns short-lived upload credential or signed upload URL (server-mediated).
4. Client uploads bytes to Storage.
5. NestJS finalizes: verify object exists/size/type → mark available → audit access/enrollment as required.
6. Domain commands consume attachment ids only after available status.

Direct client writes to operational tables remain forbidden (ADR-010). Privileged Storage admin APIs remain server-only.

---

## 8. Signed URL strategy

| Concern | Requirement |
| --- | --- |
| Issuance | NestJS only, after authorization |
| Scope | Single object (or tightly scoped prefix if unavoidable) |
| Expiry | Short-lived; exact TTL **يحتاج اعتماد لاحق** |
| Logging | Record Access/Security or Attachment access event **without** storing file content |
| Re-issue | Allowed after re-check; prior URL expiry not extended client-side |
| Prohibitions | No permanent public URLs for operational files; no service-role key to clients |

---

## 9. Public only via Content Management

An object may be public **only when all** hold:

- Belongs to approved public Content Item / publication context
- Content Management authorization flow permits publication
- Contains no taxpayer, case, payment, visit, audit, import, or staff-sensitive data
- Publication is explicitly recorded (`ContentPublished`)
- Withdrawal/reclassification remains auditable (`ContentWithdrawn`)

Never become public merely by an admin label: identity documents; receipts; due basis; visit evidence; case attachments; import files; audit exports; permission/security evidence.

---

## 10. Family-specific notes

### Visit evidence

- Stored under `mt-visit-evidence` (proposed).
- Domain events reference findings via attachment ids only.
- Field officers access assigned-visit scope; no global browse.

### Receipts / payment evidence

- Stored under `mt-payment-evidence` (proposed).
- Receipt acceptance precedes Payment Confirmation; confirmation is non-final for case approval.
- Corrections create new versions; lineage retained.

### Import files

- Source and error artifacts under `mt-import-files` (proposed).
- Domain events carry summary counts only; no full row dumps.
- Downloads audited for Import Operator / approved roles.

### Audit evidence

- Restricted bucket `mt-audit-evidence` (proposed).
- Access limited to Audit / Security Reviewer and explicitly granted break-glass roles.
- Export packages tied to Report Export Record / audit correlation where applicable.

---

## 11. Out of scope

- Creating buckets or policies
- Executable SQL
- Final TTL, max size, and retention numbers
- CDN configuration

Traceability: ADR-009; MARIB-TAX-DATA-CLASSIFICATION-ACCESS-01; Attachments entities in MARIB-TAX-LOGICAL-DATA-MODEL-01.
