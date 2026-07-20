# MARIB Tax Batch 08 Design Decision Gate

## Decision

**PASS — BATCH_08_SOURCE_READY_FOR_REVIEW**

## Reviewed scope

- TABLE-063…065 only in the `files` schema.
- Metadata, owner links, and append-only version evidence only.
- Original filename, MIME type, nonnegative logical size, optional SHA-256 checksum, classification, category, object reference, storage state, and retention state metadata.

## Accepted source boundaries

- ADR-015 authorizes attachment type classification, permanent archive of versions, and correction by a new version.
- Open DM-17/DM-26 details are not guessed: the source stores opaque status/category codes but defines no retention period, destruction rule, legal-hold override, or accounting calculation.
- Owner types are application-constrained; the metadata link is never treated as download authorization.
- Storage bytes, buckets, ACLs, signed URLs, and `storage.objects` integration are outside Batch 08 and remain separately gated.
- Default-deny RLS, no policies, no positive client grants, no seeds, and no direct client access.

## Verification result

- Three expected tables and three RLS enablements.
- No data mutation statements, policies, positive grants, or managed Storage foreign keys.
- Read-only verifier checks RLS, emptiness, forbidden grants, policies, metadata columns, and absence of Storage FKs.
- Migration SHA: `C5BC82DFFC0D159FF19389398FF926820E71EDD8065EFDDA6894AACC6654D81C`.

## Production gate

`PROD-DB-08 = CLOSED`. This PASS authorizes source review only, not linked preflight, dry-run, apply, bucket creation, or deployment.
