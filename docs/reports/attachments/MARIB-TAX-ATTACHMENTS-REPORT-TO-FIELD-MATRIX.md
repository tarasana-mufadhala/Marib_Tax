# MARIB Tax Attachments Report-to-Field Matrix

| Concept            | Batch 08 database source                           | API/client contract                                                           | Resolution                                                                    |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Attachment id      | `attachments.id`                                   | `AttachmentMetadataResponse.id`                                               | UUID                                                                          |
| Owner              | `attachment_links.owner_type`, `owner_id`          | `AttachmentOwnerReference`                                                    | Association is not authorization                                              |
| Filename           | `original_filename`                                | `originalFilename`                                                            | No path accepted or returned                                                  |
| MIME               | `mime_type`                                        | `mimeType`                                                                    | Validated metadata                                                            |
| Size               | `logical_file_size_bytes`                          | `sizeBytes`                                                                   | Integer metadata; UI formats display                                          |
| Checksum           | `checksum_sha256` nullable during intent lifecycle | Optional on upload intent; required in observed registration/version response | Attachment cannot become available without valid SHA-256                      |
| Classification     | `access_classification_code`                       | `classification` canonical enum                                               | Three codes only                                                              |
| Document category  | `document_category_code` NOT NULL                  | `documentCategoryCode` canonical enum                                         | Business/legal category supplied by client                                    |
| Storage accounting | `storage_accounting_category_code`                 | No client field                                                               | Server-owned technical/accounting category                                    |
| Object locator     | `storage_object_path`, `storage_object_id`         | Internal port only                                                            | Excluded from all response DTOs                                               |
| Download intent    | Not persisted as public URL                        | `AuthorizedDownloadIntentResponse`                                            | Opaque token plus expiry only                                                 |
| Retention          | `deletion_retention_status_code`                   | `retentionState`                                                              | `active`, `archived`, `legal_hold`, `permanent_operational_archive`; no purge |
| Version            | `attachment_version_histories`                     | `AttachmentVersionResponse`                                                   | Immutable append-only correction                                              |
| Audit              | creator/updater/history columns                    | Sanitized actor/time fields                                                   | Server authored                                                               |

Batch 08 migration SHA-256 after the Wave 02 correction:

`1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`

This mapping is source evidence only and does not authorize database or Storage operations.
