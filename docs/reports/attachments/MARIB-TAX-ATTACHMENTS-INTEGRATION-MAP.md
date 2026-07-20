# MARIB Tax Attachments Integration Map

Snapshot baseline: `origin/main` at `8087d74ef02d73d4f8e54649ca5b79032838705a`.

| Track           | PR                                                                        | Corrected responsibility                                                                                | Dependency  |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------- |
| A — database    | [#61](https://github.com/tarasana-mufadhala/Marib_Tax/pull/61), `9e652b2` | Three metadata tables, separate document/storage categories, executable checksum lifecycle; source only | First merge |
| B — API         | [#63](https://github.com/tarasana-mufadhala/Marib_Tax/pull/63), `9a7526b` | Canonical DTOs, sanitized responses, server-resolved actor context, concrete policy, disabled adapter   | After A     |
| C — security    | [#65](https://github.com/tarasana-mufadhala/Marib_Tax/pull/65), `7f74f5c` | Direct policy tests, caller-context rejection, metadata/download separation and immutable versions      | After B     |
| D — Flutter     | [#64](https://github.com/tarasana-mufadhala/Marib_Tax/pull/64)            | Canonical Arabic RTL mock UI                                                                            | After C     |
| E — web         | [#62](https://github.com/tarasana-mufadhala/Marib_Tax/pull/62)            | Canonical Arabic RTL mock admin UI                                                                      | After D     |
| F — integration | [#66](https://github.com/tarasana-mufadhala/Marib_Tax/pull/66)            | Final vocabulary, evidence, gates, and ordered merge record                                             | Last        |

## Canonical flow

1. The UI supplies an owner, one of the three classification codes, a canonical `documentCategoryCode`, and file metadata.
2. Checksum is optional at upload-intent creation and mandatory in the observed uploaded-object descriptor.
3. The server owns `storage_accounting_category_code` and all object locators.
4. The concrete policy separately authorizes metadata and binary download below the UI.
5. Sanitized DTOs cross the API boundary; storage locators and internal authorization details do not.
6. Corrections append immutable versions; retention supports archive/legal hold/permanent operational archive without hard deletion.

No endpoint, repository adapter, real Storage adapter, bucket/policy, database apply, production preflight, deployment, or real data operation is part of this wave. `PROD-DB-08 = CLOSED`.
