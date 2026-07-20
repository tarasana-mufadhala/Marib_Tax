# MARIB Tax Attachments PR Dependency Order

## Recommended review and merge sequence

1. [PR #65](https://github.com/tarasana-mufadhala/Marib_Tax/pull/65) security architecture and automated matrix after Foundation CI passes. It defines the below-UI authorization invariant.
2. [PR #61](https://github.com/tarasana-mufadhala/Marib_Tax/pull/61) database source after database review. Merge authorizes source only; `PROD-DB-08` stays closed.
3. [PR #63](https://github.com/tarasana-mufadhala/Marib_Tax/pull/63) API contracts after resolving or explicitly deferring the field mismatches in the report-to-field matrix.
4. [PR #64](https://github.com/tarasana-mufadhala/Marib_Tax/pull/64) Flutter mock foundation after CI passes and its `private`/`sensitive` values are reconciled to canonical codes.
5. [PR #62](https://github.com/tarasana-mufadhala/Marib_Tax/pull/62) web mock foundation after removing/resolving the unsupported `public`/«عام» classification and retention label mismatch.
6. Track F integration documentation after refreshing links, SHAs, CI, and C/D evidence.

## Per-PR gates

- Draft reviewed for security boundaries, file overlap, secrets, generated lockfiles, and production operations.
- Focused lint/typecheck/test/build and Foundation CI pass.
- Canonical field/code mappings are explicit; localized labels do not become persistence codes.
- No real storage adapter, bucket, endpoint, migration apply, or deploy is introduced by implication.
- Integration captain changes Draft to Ready only after dependencies and review comments are satisfied.

## Separate future gates

Repository implementation, HTTP endpoints/OpenAPI operations, Storage bucket/policy, signed upload/download adapters, linked database preflight, production apply, and deployment each require later scoped work and applicable approval. They are not part of this merge sequence.
