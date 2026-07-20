# MARIB Tax Attachments Report-to-Field Matrix

This matrix maps the Batch 08 database report in PR #61 to API contracts in PR #63 and the web mock in PR #62. It is a design mapping, not an authorization to implement persistence.

| Concept          | Database source                             | API contract                                 | Web mock                  | Gap/action                                                                                   |
| ---------------- | ------------------------------------------- | -------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| Attachment id    | `attachments.id`                            | `AttachmentMetadata.id`                      | `id`                      | UUID required in persisted/API data; mock ids are display-only                               |
| Owner            | `attachment_links.owner_type`, `owner_id`   | `AttachmentOwnerReference`                   | `ownerType`, `ownerLabel` | UI label is display data; server must resolve authorized owner context                       |
| Filename         | `original_filename`                         | `file.originalFilename`                      | `filename`                | Aligned; never accept a path                                                                 |
| MIME             | `mime_type`                                 | `file.mimeType`                              | `mimeType`                | Aligned; enforce allow-list later if approved                                                |
| Size             | `logical_file_size_bytes`                   | `file.sizeBytes`                             | `sizeLabel`               | UI label is formatted output, not an input                                                   |
| Checksum         | `checksum_sha256` nullable                  | `checksumSha256` required                    | Not shown                 | Nullability conflict must be resolved before repository implementation                       |
| Classification   | `access_classification_code`                | `classification` enum                        | Arabic label              | Persist canonical API code; presentation localizes it                                        |
| Category         | `storage_accounting_category_code`          | `category`                                   | Arabic category           | Accounting category and document category may be different concepts; decision required       |
| Object locator   | `storage_object_path` / `storage_object_id` | `objectReference`                            | Deliberately absent       | Keep opaque and server-only; choose one canonical locator mapping                            |
| Storage state    | `storage_status_code`                       | No domain field                              | `availability`            | Add an authorized sanitized availability DTO, not raw storage state                          |
| Retention        | `deletion_retention_status_code`            | `retentionState`                             | `archiveState`            | Values and transitions need policy approval                                                  |
| Current version  | `version_number`, `is_current_version`      | latest entry in `versions`                   | ordered `versions`        | Define ordering and concurrency in repository contract                                       |
| History          | `attachment_version_histories`              | `previousVersionId`, immutable append helper | version/author/note       | DB source lacks an explicit previous-version id; lineage derives from ordered version number |
| Audit actor/time | creator/updater/history columns             | `createdBy`, `createdAt`                     | localized display values  | Server authored only; never trust UI actor/time                                              |

## Evidence boundary

The database source uses opaque text codes intentionally. This matrix does not establish retention periods, destruction rules, bucket policy, or a positive authorization policy.
