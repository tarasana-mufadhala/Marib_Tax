# MARIB Tax Attachments Ownership and Classification Matrix

## Owner families

| Owner type            | Database family                    | Required scope                                                |
| --------------------- | ---------------------------------- | ------------------------------------------------------------- |
| `service_request`     | `requests.service_requests`        | Taxpayer ownership or active staff assignment plus permission |
| `balagh`              | `balaghat.balaghs`                 | Filer ownership or active staff assignment plus permission    |
| `taxpayer`            | `registry.taxpayers`               | Linked identity or explicit staff scope                       |
| `commercial_activity` | `masterdata.commercial_activities` | Taxpayer ownership chain or staff scope                       |
| `branch`              | `masterdata.branches`              | Parent activity chain or staff scope                          |
| `property`            | `masterdata.properties`            | Approved ownership/office scope                               |
| `property_unit`       | `masterdata.property_units`        | Parent property scope                                         |

An `attachment_links` row proves association only and never grants access.

## Concrete policy behavior

`apps/api/src/attachments/attachment-authorization.policy.ts` exports `AttachmentAuthorizationPolicy`. Its direct `canAccess()` boundary requires active role, active assignment, matching owner scope, and an operation-specific permission. It has no role-name or general-admin bypass.

| Classification/state | Metadata                                | Binary download                                  |
| -------------------- | --------------------------------------- | ------------------------------------------------ |
| `internal`           | `attachment.metadata.read` plus scope   | Separate `attachment.binary.download` plus scope |
| `confidential`       | Same explicit metadata gate             | Same explicit download gate                      |
| `highly_sensitive`   | Adds `attachment.highly_sensitive.read` | Adds `attachment.highly_sensitive.read`          |
| `legal_hold`         | Metadata remains separately evaluated   | Adds `attachment.legal_hold.download`            |

Track C must import this concrete policy and directly test positive/negative service invocation, metadata/download separation, legal hold, owner scope, inactive contexts, and immutable version lineage. Storage object existence never implies authorization.
