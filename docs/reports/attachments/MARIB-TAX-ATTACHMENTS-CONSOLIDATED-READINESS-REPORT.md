# MARIB Tax Attachments Consolidated Readiness Report

## Integration decision

**PASS — ATTACHMENTS_WAVE_01_INTEGRATION_READY_FOR_ORDERED_MERGE**

All corrected tracks implement the canonical decisions and pass their local and CI gates. The API rejects caller-supplied authorization context, Track C binds directly to that server-resolved boundary, and the database enforces a valid non-null checksum whenever an attachment is available. Ordered merge may begin under the documented stop conditions.

## Canonical decisions closed

- Classifications: `internal`, `confidential`, `highly_sensitive` with Arabic presentation labels `داخلي`, `سري`, `شديد الحساسية`.
- Document categories: `identity_document`, `tax_document`, `financial_evidence`, `correspondence`, `license`, `supporting_document`.
- `documentCategoryCode` is the client business/legal field; storage accounting category is server-owned.
- Checksum is optional for upload intent, required for observed registration, and required before availability.
- Retention: `active`, `archived`, `legal_hold`, `permanent_operational_archive`; no hard delete or automated purge.
- Corrections create immutable versions.
- Sanitized metadata/version/list/download-intent response DTOs expose no storage locator, service-role data, permanent public URL, or internal authorization details.
- `AttachmentAuthorizationPolicy` is the concrete below-UI boundary with no general-admin bypass and separate metadata/download permissions.

## Evidence checkpoint

| PR           | Corrected head                             | CI state                                                               | Gate |
| ------------ | ------------------------------------------ | ---------------------------------------------------------------------- | ---- |
| #61 DB       | `9e652b2f1ff592501a062356855088996120453c` | Static lifecycle checks, 88 tests, typecheck/lint/build + both CI PASS | PASS |
| #63 API      | `9a7526b4fb94f3d053c80d5a75cd3171b79ba950` | Caller authorization context rejection + both CI PASS                  | PASS |
| #64 Flutter  | `77f73212d23a7375ab40f59e3e72ed158cbc463f` | Foundation + Flutter PASS                                              | PASS |
| #62 Web      | `7948319bd186d1ba47c8e3d71dc53374161df82f` | 9 tests, lint/typecheck + both CI PASS                                 | PASS |
| #65 Security | `7f74f5ca70cd678015397737fd54184de318597a` | 21 focused; 124 workspace tests; all local gates + both CI PASS        | PASS |

Batch 08 corrected migration SHA-256:

`1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`

Verifier SHA-256:

`97ADD70F0E0F4A821FC77ACAA95A2272DBF06533E07BEAD995104EC08254DBCE`

## Production boundary

`PROD-DB-08 = CLOSED`.

No database dry-run/apply, production preflight, Storage operation, bucket/policy, endpoint, deployment, real file, taxpayer data, secret, or notification was authorized or performed.

## Ordered merge record

| Order | PR                       | Merge commit                               |
| ----- | ------------------------ | ------------------------------------------ |
| 1     | #61 DB                   | `0415db6f7e394a46c9c3ec3e68e356ccc574ad48` |
| 2     | #63 API                  | `828b91f317c28c54d0c4c71c4e66abb618c1c027` |
| 3     | #65 Security             | `61c51118823b5206160f3ffa15cd5f4a2c36e655` |
| 4     | #64 Flutter              | `6ba0bb20daa7826b3936f7d03e473342613268d4` |
| 5     | #62 Web                  | `01e7bf8ac09733aed224ef0dc03e318cdc398568` |
| 6     | #66 Integration evidence | `c2e37bc15867299bc1c53a6e47e8cff991b653b7` |

Each next PR was updated on the then-current `main`, and both Foundation CI and the Flutter gate passed before its merge.

`BATCH_08_SOURCE = MERGED / NOT APPLIED`.
