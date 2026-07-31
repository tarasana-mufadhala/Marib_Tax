# MARIB Tax Batch 17 Storage Buckets and Policies Design Decision Gate

## Decision

**PASS — BATCH_17_STORAGE_BUCKETS_AND_POLICIES_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- BUCKETS created:
  1. `taxpayer-documents` (private bucket for taxpayers' official documents, limited to 5MB, MIME types: jpeg, png, pdf).
  2. `admin-attachments` (private bucket for administrative attachments, limited to 10MB, MIME types: jpeg, png, pdf, csv, xlsx, docx).
  3. `public-forms` (public read bucket for tax forms and templates, limited to 5MB, MIME types: pdf, jpeg, png).
- RLS POLICIES applied to `storage.objects`:
  1. `public-forms` allows general read access (SELECT), write access restricted to managers and content managers.
  2. `taxpayer-documents` allows taxpayers to select and write only within their own folder (folder name matching their taxpayer ID), while staff and managers have complete access.
  3. `admin-attachments` restricts all access (SELECT and write) to staff and managers only.

## Accepted source boundaries

- Storage tables `storage.buckets` and `storage.objects` have RLS enabled.
- Default public privileges are revoked (`REVOKE ALL`).
- Minimal permissions granted to roles `authenticated` and `anon`.
- Signed URLs logic is time-bounded and managed by server-side backend logic.
- Executable files are blocked by strict MIME type constraint whitelisting.

## Verification result

- Storage buckets and RLS policies created.
- Repository foundation validation compiles and passes cleanly.
- Migration SHA-256: `20634DF28A4FB46FAD79C55A95C084EF34B2CAE4290A94241277D4CC67B682C5`
- Verifier SHA-256: `4A184073D52C2B269FF786545DA35B3E0A5FBD3C00BBD3481EE90E30995AC22F`

## Production gate

This design PASS does not authorize apply. Production apply requires the full governed cycle: PR → CI PASS → review → merge → production preflight with linked read-only checks and `--dry-run` → independent user approval → single apply → post-apply verifier → closure (`BATCH_17 = APPLIED / VERIFIED PASS`).
