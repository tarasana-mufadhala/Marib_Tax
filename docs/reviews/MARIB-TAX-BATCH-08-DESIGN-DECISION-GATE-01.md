# MARIB Tax Batch 08 Design Decision Gate

## Decision

**PASS — BATCH_08_SOURCE_READY_FOR_INTEGRATION_REVIEW**

## Reviewed scope

- TABLE-063…065 only in the `files` schema.
- Metadata, owner links, and append-only version evidence only.
- Original filename, MIME type, nonnegative logical size, conditionally nullable SHA-256 checksum, access classification, business/legal document category, server-owned storage accounting category, object reference, storage state, and retention state metadata.

## Accepted source boundaries

- ADR-015 authorizes attachment type classification, permanent archive of versions, and correction by a new version.
- Open DM-17/DM-26 details are not guessed: the source stores opaque status/category codes but defines no retention period, destruction rule, legal-hold override, or accounting calculation.
- Owner types are application-constrained; the metadata link is never treated as download authorization.
- Active attachment/owner links are unique through a partial index; historical unlinked rows remain retained and do not block a later legitimate relink.
- `document_category_code` is business/legal metadata and remains distinct from server-owned `storage_accounting_category_code`.
- Checksum may be absent only before upload completion; an executable database check plus application transition policy require a valid SHA-256 before an attachment becomes `available`.
- Retention uses `active`, `archived`, `legal_hold`, and permanent operational archive; correction creates a new immutable version, with no hard-delete or automated-purge path in this source.
- Storage bytes, buckets, ACLs, signed URLs, and `storage.objects` integration are outside Batch 08 and remain separately gated.
- Default-deny RLS, no policies, no positive client grants, no seeds, and no direct client access.

## Verification result

- Three expected tables and three RLS enablements.
- No data mutation statements, policies, positive grants, or managed Storage foreign keys.
- Read-only verifier checks RLS, emptiness, forbidden grants, policies, metadata columns, active-link uniqueness, and absence of Storage FKs.
- Migration SHA: `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496` (supersedes intermediate SHA `BDEDBD040F2EA53D8AAA1BB4A9FB8307FC64A2513283D841632749C2D21E6C60` and Wave 01 SHA `C5BC82DFFC0D159FF19389398FF926820E71EDD8065EFDDA6894AACC6654D81C`).

## Production gate

`PROD-DB-08 = CLOSED`. This PASS authorizes source review only, not linked preflight, dry-run, apply, bucket creation, or deployment.
