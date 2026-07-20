# MARIB Tax DB Foundation — Batch 08 Files Metadata Report

## Status

Source only for this report. Production apply remains closed. Fresh linked preflight evidence (no apply) is recorded in `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md`. `PROD-DB-08 = REQUIRES_USER_APPROVAL`; `BATCH_08_SOURCE = MERGED / NOT APPLIED`.

## Artifacts

- Migration: `supabase/migrations/20260723120000_create_files_attachment_metadata.sql`
- Migration SHA-256: `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496`
- Read-only verifier: `scripts/db/verify/verify_batch_08_files_attachment_metadata.sql`
- Verifier SHA-256: `97ADD70F0E0F4A821FC77ACAA95A2272DBF06533E07BEAD995104EC08254DBCE`

## Scope and boundaries

The source defines TABLE-063…065 only: `files.attachments`, `files.attachment_links`, and `files.attachment_version_histories`.

- Metadata only; no binary bytes are stored in Postgres.
- No bucket, Storage policy, or foreign key to `storage.objects`.
- Access classification, business/legal `document_category_code`, server-owned technical `storage_accounting_category_code`, storage state, and retention state are distinct required non-blank codes.
- Original filename and MIME type are required non-blank metadata. SHA-256 is format-constrained and may be null only during the incomplete-upload lifecycle; an executable database check prevents `storage_status_code = 'available'` until a valid checksum is present.
- Polymorphic owner references do not grant authorization and remain application-validated.
- A partial unique index prevents duplicate active links for the same attachment/owner reference while retained unlinked rows allow legitimate historical unlink/relink cycles.
- Version history is additive and unique per attachment/version; prior versions are retained.
- RLS is enabled with no policies, client/public grants are revoked, and no seed/backfill is present.
- Retention uses `active`, `archived`, `legal_hold`, and permanent operational archive; this batch performs no hard delete or automated purge. Timed destruction, accounting calculation/source, and bucket policy remain deferred.

## Superseded artifact

Wave 01 migration SHA `C5BC82DFFC0D159FF19389398FF926820E71EDD8065EFDDA6894AACC6654D81C` is superseded by the Wave 02 correction above and must not be used for production approval.

Intermediate SHA `BDEDBD040F2EA53D8AAA1BB4A9FB8307FC64A2513283D841632749C2D21E6C60` is superseded by the executable checksum-invariant correction.

## Non-actions

This source report authorizes no apply. The later production preflight used linked read-only checks and `--dry-run` only; it did not apply Batch 08, create buckets, seed, deploy, or mutate taxpayer data.
