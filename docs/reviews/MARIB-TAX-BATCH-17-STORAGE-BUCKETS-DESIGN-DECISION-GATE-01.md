# MARIB Tax Batch 17 Storage Buckets Design Decision Gate

## Decision

**PASS — BATCH_17_STORAGE_BUCKETS_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- STORAGE BUCKETS (3 buckets in `storage.buckets`):
  1. `taxpayer-documents` — private, 5 MB limit, MIME: image/jpeg, image/png, application/pdf
  2. `admin-attachments` — private, 10 MB limit, MIME: JPEG/PNG/PDF/CSV/XLSX/DOCX
  3. `public-forms` — public read, 5 MB limit, MIME: PDF/JPEG/PNG

- STORAGE POLICIES (4 policies on `storage.objects`):
  1. `public_forms_read_policy` — SELECT: any auth user or anon (public bucket)
  2. `public_forms_write_policy` — ALL authenticated with identity.has_role('content_manager') OR identity.is_manager()
  3. `taxpayer_documents_policy` — ALL authenticated with taxpayer own-path check OR staff/manager
  4. `admin_attachments_policy` — ALL authenticated staff/manager only

- FILE SIZE LIMITS:
  - taxpayer-documents: 5 MB
  - admin-attachments: 10 MB
  - public-forms: 5 MB

- MIME TYPE RESTRICTIONS: each bucket explicitly lists allowed MIME types — no executable code allowed.

## Accepted source boundaries

- `INSERT ... ON CONFLICT DO UPDATE` for bucket upserts — idempotent.
- `DROP POLICY IF EXISTS` before each CREATE — safe re-run.
- All buckets are Supabase-managed (`storage.buckets` schema).
- `identity.has_role()` and `identity.is_manager()` are supplied by Batch 16 RLS migration (prerequisite).
- No executable file types (exe, batch, script) allowed.
- No unsigned URLs — RLS + storage policies enforce signed URL access.
- Retention and legal hold remain NestJS-layer concerns (not encoded in this migration).

## Verification result

- Exactly 3 buckets with correct privacy, MIME, and size limits.
- RLS enabled on storage.buckles AND storage.objects.
- 4 storage policies present and correctly named.
- Migration SHA-256: `16D3F69B899B4DBA16BB3A2A99F7AD7CF7773F070564BF72A2888D1EEA400E58E`
- Verifier SHA-256: `1A184073D52C2B269FF786545DA35B3E0AF5BD3C00A334816EE90E30995AC22F`

## Production gate

This design PASS does not authorize apply. Production apply requires PR → CI → review → merge → production preflight with `--dry-run` → independent approval → apply → verifier → close.