# MARIB-TAX-DB-FOUNDATION-BATCH-08 — Production Apply Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-PREFLIGHT-01 |
| Repository | `tarasana-mufadhala/Marib_Tax` |
| Base main HEAD | `3955c1f10f534a367209f73b7466afe9d72bdda5` |
| Target project ref | `sjmtiwzddztxfrncwkpx` |
| Supabase CLI | `2.109.1` |
| Migration version | `20260723120000` |
| Migration file | `supabase/migrations/20260723120000_create_files_attachment_metadata.sql` |
| Migration SHA-256 | `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496` |
| Verifier | `scripts/db/verify/verify_batch_08_files_attachment_metadata.sql` |
| Verifier SHA-256 | `97ADD70F0E0F4A821FC77ACAA95A2272DBF06533E07BEAD995104EC08254DBCE` |
| Design acceptance | `PASS — BATCH_08_SOURCE_READY_FOR_INTEGRATION_REVIEW` |
| Stale reconciliation | `PASS — STALE_PARALLEL_TASK_RECONCILED` |
| Mode | Production preflight only; no migration apply |
| Decision | **PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY** |

## 0. Stale parallel-task reconciliation (G0)

- `HEAD` matched `origin/main` exactly: `3955c1f10f534a367209f73b7466afe9d72bdda5`.
- PRs #61–#67 are all `MERGED`.
- Intermediate HOLD/superseded migration SHA `BDEDBD040F2EA53D8AAA1BB4A9FB8307FC64A2513283D841632749C2D21E6C60` is retained as historical evidence only and is not a production candidate.
- Final adopted migration SHA only: `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`.
- No stale worktree changes were adopted, raised, or merged. No reset, stash, clean, or force push was performed.

## 1. Backup and recovery gate

- Latest visible managed physical backup: `2026-07-20T22:04:12.315Z` — status `COMPLETED`.
- WALG enabled: yes.
- PITR enabled: no.
- Restore was not executed.
- No backup contents or credentials were copied into this report.

## 2. Repository integrity

- Working tree was clean at preflight start on `origin/main` `3955c1f`.
- Migration SHA-256 matched `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`.
- Verifier SHA-256 matched `97ADD70F0E0F4A821FC77ACAA95A2272DBF06533E07BEAD995104EC08254DBCE`.
- Linked project ref matched `sjmtiwzddztxfrncwkpx`.
- Source creates exactly three tables: `files.attachments`, `files.attachment_links`, `files.attachment_version_histories`.
- Source enables RLS on all three tables; contains no `CREATE POLICY`, no positive grants, no seed/backfill, no Postgres byte/base64 storage, no `storage.objects` FK, and no Storage bucket/policy creation.
- `document_category_code` remains independent of `storage_accounting_category_code`.
- `checksum_sha256` is nullable before upload completion; `storage_status_code = 'available'` requires a non-null checksum.
- Partial unique index prevents duplicate active attachment-owner links while retained unlinked rows preserve unlink/relink history.
- Version history is append-only by design; retention vocabulary is `active` / `archived` / `legal_hold` with no hard-delete or purge path in this source.

## 3. Migration history

| Migration | Local | Remote |
| --- | ---: | ---: |
| `20260715175300` — Batch 01A | 1 | 1 |
| `20260716190000` — Batch 02 | 1 | 1 |
| `20260717120000` — Batch 03 | 1 | 1 |
| `20260719120000` — Batch 04 | 1 | 1 |
| `20260720120000` — Batch 05 | 1 | 1 |
| `20260721120000` — Batch 06 | 1 | 1 |
| `20260722120000` — Batch 07 | 1 | 1 |
| `20260723120000` — Batch 08 | 1 | 0 |

## 4. Remote structural checks

Three Batch 08 tables absent:

`attachments=0|attachment_links=0|attachment_version_histories=0`

Partial Batch 08 objects absent:

`tables=0|indexes=0|constraints=0`

`files` schema remains present from prior foundation batches (`files_schema=1`), which is expected and not a Batch 08 object.

## 5. Dry-run

`npx --yes supabase@2.109.1 db push --linked --dry-run` completed successfully.

Exactly one migration listed:

`20260723120000_create_files_attachment_metadata.sql`

## 6. Non-actions confirmation

This preflight did not apply any migration, run `db push` without `--dry-run`, seed data, repair, reset, create Storage buckets/policies, upload/download objects, deploy, or expose secrets.

## 7. Decision

**PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY**

Final production state after this preflight:

- `PROD-DB-08 = REQUIRES_USER_APPROVAL`
- `BATCH_08_SOURCE = MERGED / NOT APPLIED`

A separate explicit authorization is required before applying Batch 08 to production.
