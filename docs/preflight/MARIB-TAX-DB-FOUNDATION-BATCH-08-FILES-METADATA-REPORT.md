# MARIB Tax DB Foundation — Batch 08 Files Metadata Report

## Status

Source only. No database, Storage bucket, object, policy, or production environment was changed. `PROD-DB-08` remains closed.

## Artifacts

- Migration: `supabase/migrations/20260723120000_create_files_attachment_metadata.sql`
- Migration SHA-256: `C5BC82DFFC0D159FF19389398FF926820E71EDD8065EFDDA6894AACC6654D81C`
- Read-only verifier: `scripts/db/verify/verify_batch_08_files_attachment_metadata.sql`
- Verifier SHA-256: `6CD57E5639F4642153CE830D2E69A0C6C7D18D5AFEA9886EF69960004C664D7C`

## Scope and boundaries

The source defines TABLE-063…065 only: `files.attachments`, `files.attachment_links`, and `files.attachment_version_histories`.

- Metadata only; no binary bytes are stored in Postgres.
- No bucket, Storage policy, or foreign key to `storage.objects`.
- Classification, accounting category, storage state, and retention state are required non-blank codes without invented catalogue values.
- Original filename and MIME type are required non-blank metadata; an optional SHA-256 checksum is format-constrained.
- Polymorphic owner references do not grant authorization and remain application-validated.
- Version history is additive and unique per attachment/version; prior versions are retained.
- RLS is enabled with no policies, client/public grants are revoked, and no seed/backfill is present.
- Timed destruction, legal-hold overrides, accounting source, and bucket policy remain deferred.

## Non-actions

No linked preflight, `db push`, SQL execution, seed, bucket creation, deploy, secret change, taxpayer-data mutation, or real notification occurred.
