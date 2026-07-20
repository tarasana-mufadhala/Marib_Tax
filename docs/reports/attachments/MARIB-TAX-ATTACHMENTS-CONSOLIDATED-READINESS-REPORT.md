# MARIB Tax Attachments Consolidated Readiness Report

## Decision

**HOLD — INTEGRATION NOT READY FOR MERGE AS A COMPLETE FEATURE**

The delivered tracks are suitable for independent draft review. The attachment feature is not ready for endpoint, storage, database apply, or production integration.

## Evidence reviewed

| PR                                                             | Scope                            | CI                                                       | Readiness                |
| -------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------- | ------------------------ |
| [#61](https://github.com/tarasana-mufadhala/Marib_Tax/pull/61) | Batch 08 metadata source         | Foundation CI pass                                       | Source review only       |
| [#63](https://github.com/tarasana-mufadhala/Marib_Tax/pull/63) | API/domain/application contracts | Foundation CI pass                                       | Contract review only     |
| [#62](https://github.com/tarasana-mufadhala/Marib_Tax/pull/62) | Web Arabic RTL mocks             | Foundation CI pass                                       | UI review only           |
| [#65](https://github.com/tarasana-mufadhala/Marib_Tax/pull/65) | Security matrix and threat model | 12 focused and 68 full API tests plus Foundation CI pass | Security review required |
| [#64](https://github.com/tarasana-mufadhala/Marib_Tax/pull/64) | Flutter Arabic RTL mocks         | Analyze, 10 tests, debug APK, and Foundation CI pass     | UI review only           |

## Ready

- Database metadata stays private/default-deny and stores no bytes.
- API validates filename, MIME, size, checksum, owner type, and classification.
- API version helper appends immutable lineage and rejects stale heads.
- Storage dependency is a port with a disabled adapter; no real calls or endpoints exist.
- Web UI is mock-only and omits storage paths and public URLs.
- Flutter UI is repository-backed by mocks only and covers picker, offline, denied, version, and correction presentation.
- Security evidence covers taxpayer, staff, admin, report, anonymous, and worker actors with positive and negative cases.
- Current PRs have non-overlapping implementation files and passing Foundation CI.

## Required before integration

1. Review Track C PR #65, then bind its standalone policy matrix to the eventual concrete service below the UI.
2. Review Track D PR #64 and reconcile its mock codes.
3. Resolve canonical classification across API `internal/confidential/highly_sensitive`, web «عام», and Flutter `private/sensitive`.
4. Resolve nullable database checksum versus required API checksum.
5. Separate or approve the meaning of document category versus storage accounting category.
6. Define sanitized metadata/version response DTOs, including version number, timestamps, actor display, and availability.
7. Approve retention/legal-hold vocabulary and transitions before implementing archive behavior.
8. Rebase/review cross-track changes and rerun all gates; do not auto-merge Draft PRs.

## Production gate

`PROD-DB-08 = CLOSED`.

No previous approval authorizes Batch 08 preflight/apply. No bucket, Storage policy, real upload/download, database write, secret, deployment, or production data operation is authorized by these documents.

## Companion evidence

- [Integration map](MARIB-TAX-ATTACHMENTS-INTEGRATION-MAP.md)
- [API-to-UI contract matrix](MARIB-TAX-ATTACHMENTS-API-TO-UI-CONTRACT-MATRIX.md)
- [Report-to-field matrix](MARIB-TAX-ATTACHMENTS-REPORT-TO-FIELD-MATRIX.md)
- [Ownership and classification matrix](MARIB-TAX-ATTACHMENTS-OWNERSHIP-CLASSIFICATION-MATRIX.md)
- [PR dependency order](MARIB-TAX-ATTACHMENTS-PR-DEPENDENCY-ORDER.md)
