# MARIB Tax Attachments API-to-UI Contract Matrix

| User capability    | Track B contract                | Web PR #62                              | Flutter                | Integration disposition                                                                                           |
| ------------------ | ------------------------------- | --------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Select file        | `AttachmentFileDescriptor`      | Not in admin scope                      | Local preview mock     | Flutter selection lacks MIME/size/checksum contract fields; align before integration                              |
| Request upload     | `CreateUploadIntentCommand`     | Inert action only                       | Progress mock          | Actor identity is server context; never accept a client service role                                              |
| Register upload    | `RegisterUploadedObjectCommand` | Not connected                           | Not connected          | Server must compare observed metadata and authorize owner context                                                 |
| List metadata      | `AttachmentMetadata`            | Mock table                              | Mock repository        | Requires a future authorized query/response DTO; no storage reference in UI                                       |
| List versions      | `ListAttachmentVersionsQuery`   | Version panel                           | Version expansion mock | Current return contract exposes file descriptors only; add version id/number/date/actor DTO before UI integration |
| Correct version    | `CreateNewVersionCommand`       | Inert action                            | Inert correction mock  | `replacesVersionId` must be latest; old versions remain immutable                                                 |
| Request download   | `AuthorizedDownloadIntentQuery` | Inert action with denied/missing states | Denied state only      | Evaluate actor + owner + classification before calling storage; token must be short-lived                         |
| Archive/legal hold | `ArchiveAttachmentCommand`      | Mock archive state                      | Not represented        | Retention semantics and permissions need an approved policy before implementation                                 |

## Presentation mappings requiring resolution

| API code           | Arabic label candidate | Current web mock               | Status                                                 |
| ------------------ | ---------------------- | ------------------------------ | ------------------------------------------------------ |
| `internal`         | داخلي                  | داخلي                          | Aligned                                                |
| `confidential`     | سري                    | سري                            | Aligned                                                |
| `highly_sensitive` | شديد الحساسية          | شديد الحساسية                  | Aligned                                                |
| No API value       | عام                    | عام appears as a filter option | Conflict: remove from UI or approve/add a code         |
| `active`           | نشط                    | نشط                            | Aligned                                                |
| `archived`         | مؤرشف                  | مؤرشف                          | Aligned                                                |
| `legal_hold`       | حجز قانوني             | قيد الحفظ الدائم               | Semantic mismatch; do not equate until policy approval |

Safe error responses must use stable codes such as denied, unavailable, invalid metadata, and version conflict. They must not include object references, storage paths, bucket names, or sensitive metadata.

Flutter PR #64 independently uses `private`/«خاص» and `sensitive`/«حساس». Neither is a canonical Track B code, so the mobile enum must map to or adopt the approved three-value API vocabulary before integration.
