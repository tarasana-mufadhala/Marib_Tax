# MARIB Tax Attachments API-to-UI Contract Matrix

## Canonical transport vocabulary

| Concern                     | Canonical contract                                                                                            | UI rule                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Classification              | `internal`, `confidential`, `highly_sensitive`                                                                | Present as `داخلي`, `سري`, `شديد الحساسية`; reject `public`, `private`, and `sensitive`                                        |
| Document category           | `identity_document`, `tax_document`, `financial_evidence`, `correspondence`, `license`, `supporting_document` | Localize labels only; send the canonical code as `documentCategoryCode`                                                        |
| Storage accounting category | `storage_accounting_category_code`                                                                            | Server-owned; clients must never supply or infer it                                                                            |
| Retention                   | `active`, `archived`, `legal_hold`, `permanent_operational_archive`                                           | No hard delete or automated purge; correction creates an immutable version                                                     |
| Checksum                    | SHA-256 hex                                                                                                   | Optional in `CreateUploadIntentDto`; mandatory in `RegisterUploadedObjectDto.observed`; availability requires a valid checksum |

## Operation mapping

| User capability    | Track B contract                                        | UI integration boundary                                                     |
| ------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| Select file        | `AttachmentUploadFileDescriptor`                        | Filename/MIME/size required; checksum may not yet exist                     |
| Request upload     | `CreateUploadIntentCommand`                             | Actor is server context; `documentCategoryCode` is client supplied          |
| Register upload    | `RegisterUploadedObjectCommand`                         | Observed descriptor requires checksum; object reference remains server-side |
| List metadata      | `AttachmentMetadataResponse` / `AttachmentListResponse` | Sanitized response only                                                     |
| List versions      | `AttachmentVersionResponse`                             | Version identity, lineage, metadata and audit fields; no object locator     |
| Correct version    | `CreateNewVersionCommand`                               | Must replace latest version; prior versions are immutable                   |
| Request download   | `AuthorizedDownloadIntentResponse`                      | Opaque `intentToken` and `expiresAt` only                                   |
| Archive/legal hold | `ArchiveAttachmentCommand`                              | Uses canonical retention states; no delete operation                        |

The response schemas are strict and do not expose `storage_object_path`, `storage_object_id`, service-role information, permanent public URLs, or internal authorization details. Metadata and binary download are separate decisions made by the concrete below-UI `AttachmentAuthorizationPolicy`.

Transport schemas reject caller-supplied `actorId`, `permissions`, or nested actor objects. Application commands and queries receive a readonly `ServerResolvedAttachmentActorContext` from trusted server infrastructure, separately from parsed DTO input.
