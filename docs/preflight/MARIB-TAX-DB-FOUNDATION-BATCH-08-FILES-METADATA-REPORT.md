# MARIB Tax DB Foundation — Batch 08 Files Metadata Report

## Status

Source only. No database, Storage bucket, object, policy, or production environment was changed. `PROD-DB-08` remains closed.

## Artifacts

- Migration: `supabase/migrations/20260723120000_create_files_attachment_metadata.sql`
- Migration SHA-256: `71B17156E347582000B2F54E24A8E18EBB0BE45B3E2919F2C4CF17C6F2E845BA`
- Read-only verifier: `scripts/db/verify/verify_batch_08_files_attachment_metadata.sql`
- Verifier SHA-256: `4F9086FEFEE8CD8391D101F6460603580D9D5C48E411BD26281D2236F9734855`

## Scope and boundaries

The source defines TABLE-063…065 only: `files.attachments`, `files.attachment_links`, and `files.attachment_version_histories`.

- Metadata only; no binary bytes are stored in Postgres.
- No bucket, Storage policy, or foreign key to `storage.objects`.
- Access classification, business/legal `document_category_code`, server-owned technical `storage_accounting_category_code`, storage state, and retention state are distinct required non-blank codes.
- Original filename and MIME type are required non-blank metadata. SHA-256 is format-constrained and may be null only during the incomplete-upload lifecycle; application policy must prevent transition to `available` until an observed valid checksum is registered.
- Polymorphic owner references do not grant authorization and remain application-validated.
- Version history is additive and unique per attachment/version; prior versions are retained.
- RLS is enabled with no policies, client/public grants are revoked, and no seed/backfill is present.
- Retention uses `active`, `archived`, `legal_hold`, and permanent operational archive; this batch performs no hard delete or automated purge. Timed destruction, accounting calculation/source, and bucket policy remain deferred.

## Superseded artifact

Wave 01 migration SHA `C5BC82DFFC0D159FF19389398FF926820E71EDD8065EFDDA6894AACC6654D81C` is superseded by the Wave 02 correction above and must not be used for production approval.

## Non-actions

No linked preflight, `db push`, SQL execution, seed, bucket creation, deploy, secret change, taxpayer-data mutation, or real notification occurred.
