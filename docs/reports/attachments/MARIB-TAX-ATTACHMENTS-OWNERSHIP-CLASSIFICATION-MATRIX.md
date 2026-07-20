# MARIB Tax Attachments Ownership and Classification Matrix

## Approved owner families in the API contract

| API owner type        | Existing database family           | Minimum authorization context                                       |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| `service_request`     | `requests.service_requests`        | Actor permission plus taxpayer ownership or active staff assignment |
| `balagh`              | `balaghat.balaghs`                 | Actor permission plus filer ownership or active staff assignment    |
| `taxpayer`            | `registry.taxpayers`               | Linked taxpayer identity or explicitly scoped staff permission      |
| `commercial_activity` | `masterdata.commercial_activities` | Taxpayer ownership chain or scoped staff permission                 |
| `branch`              | `masterdata.branches`              | Parent activity ownership chain or scoped staff permission          |
| `property`            | `masterdata.properties`            | Approved ownership/office scope and explicit permission             |
| `property_unit`       | `masterdata.property_units`        | Parent property scope and explicit permission                       |

An `attachment_links` row proves association only. It never proves that an actor may view metadata, list versions, request a download, correct, archive, link, or unlink.

## Classification behavior

| Classification     | Metadata visibility                 | Binary download                                   | Expected enforcement                    |
| ------------------ | ----------------------------------- | ------------------------------------------------- | --------------------------------------- |
| `internal`         | Authorized owner/staff context only | Separate explicit authorization                   | Deny anonymous and unrelated actors     |
| `confidential`     | Need-to-know context                | Explicit permission plus owner/assignment scope   | Audit denied and granted access         |
| `highly_sensitive` | Minimal sanitized metadata          | Explicit elevated permission and contextual scope | No general admin bypass; enhanced audit |

## Mandatory negative cases for Track C

- Anonymous, unrelated taxpayer, unauthorized staff, and read-only/report actors are denied mutations and download.
- A storage object existing without an authorized metadata/owner decision remains inaccessible.
- Direct repository or service invocation cannot bypass policy evaluation.
- Old versions cannot be mutated, and a stale version cannot become a new lineage head.
- Administrator access requires an explicit permission; role name alone is insufficient.
- Worker/service actors receive only operation-specific capabilities and no general download bypass.

Track C evidence is delivered for review in [PR #65](https://github.com/tarasana-mufadhala/Marib_Tax/pull/65): a documented matrix, threat model, and 12 focused in-memory tests. Its Foundation CI must pass and the tests must later be bound to the concrete Track B service/policy implementation before any endpoint or real adapter is integrated.
