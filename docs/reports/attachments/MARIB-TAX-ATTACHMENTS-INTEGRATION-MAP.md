# MARIB Tax Attachments Integration Map

## Evidence snapshot

Snapshot: 2026-07-20, baseline `8087d74ef02d73d4f8e54649ca5b79032838705a`.

| Track               | Evidence                                                                     | State                     | Integration role                                                       |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| A — database        | [PR #61](https://github.com/tarasana-mufadhala/Marib_Tax/pull/61), `ff1f767` | Draft, Foundation CI pass | Metadata, owner links, append-only version evidence; source only       |
| B — API contracts   | [PR #63](https://github.com/tarasana-mufadhala/Marib_Tax/pull/63), `dea18b1` | Draft, Foundation CI pass | DTO/domain/application and object-storage ports; disabled adapter only |
| C — security matrix | [PR #65](https://github.com/tarasana-mufadhala/Marib_Tax/pull/65), `d91feb1` | Draft, Foundation CI pass | Authorization matrix, threat model, and in-memory test scaffold        |
| D — Flutter         | [PR #64](https://github.com/tarasana-mufadhala/Marib_Tax/pull/64), `fcf5eca` | Draft, Foundation CI pass | Arabic RTL picker/list/version mocks behind a mock repository          |
| E — web admin       | [PR #62](https://github.com/tarasana-mufadhala/Marib_Tax/pull/62), `1afda26` | Draft, Foundation CI pass | Arabic RTL mock-only administration UI                                 |
| F — integration     | This document set                                                            | Active                    | Cross-track mappings, gates, and merge order                           |

## Dependency flow

1. Track C fixes the authorization semantics used by all application operations.
2. Track A supplies private metadata persistence only; its owner link never grants access.
3. Track B supplies validation and application/storage boundaries, but no controller or real adapter.
4. Tracks D and E map presentation labels and states to the approved contracts.
5. A later separately gated implementation may add repositories, endpoints, bucket policy, and adapters.

## Non-overlap and boundaries

- PR #61 changes database source and project-state evidence; PR #63 changes API/contracts; PR #65 changes security documents and a standalone API test; PR #64 changes Flutter; PR #62 changes web-only files. Their implementation files do not overlap.
- Object bytes, bucket creation, Storage policies, signed URL implementation, production SQL, and deploy remain outside this wave.
- `PROD-DB-08 = CLOSED`; source review and merge do not authorize preflight or apply.

## Related reports

- [API-to-UI contract matrix](MARIB-TAX-ATTACHMENTS-API-TO-UI-CONTRACT-MATRIX.md)
- [Report-to-field matrix](MARIB-TAX-ATTACHMENTS-REPORT-TO-FIELD-MATRIX.md)
- [Ownership and classification matrix](MARIB-TAX-ATTACHMENTS-OWNERSHIP-CLASSIFICATION-MATRIX.md)
- [PR dependency order](MARIB-TAX-ATTACHMENTS-PR-DEPENDENCY-ORDER.md)
- [Consolidated readiness report](MARIB-TAX-ATTACHMENTS-CONSOLIDATED-READINESS-REPORT.md)
