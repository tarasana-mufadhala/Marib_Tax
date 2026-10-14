# MARIB Tax DB Foundation — Batch 17 Storage Buckets and Policies Report

## Status

Source only. Production apply blocked.

- `BATCH_17_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-17 = NOT_STARTED`

## Artifacts

| Artifact | Path | SHA-256 |
|---|---|---|
| Migration | `supabase/migrations/20260801120200_create_storage_buckets_and_policies.sql` | `16D3F69B799B4DAA16A2A7F7CDD777F070B64BF72A2888DFEEA400E58E` |
| Verifier | `scripts/db/verify/verify_batch_17_storage_buckets_and_policies.sql` | `1A184073D5C2B269FF786545EA35B3E0AF5CD3C00BB48lambda19EE0F30995AC22F` |
| Design Gate | `docs/reviews/MARIB-TAX-BATCH-17-STORAGE-BUCKETS-DESIGN-DECISION-GATE-01.md` | **PASS** |
| Baseline | `origin/main` | |

## Scope

3 Supabase Storage buckets with configured size limits, MIME type restrictions, and RLS policies controlling read/write access based on user identity.

| Bucket | Purpose | Public | Size Limit | Allowed MIME |
|---|---|---|---|---|
| `taxpayer-documents` | Taxpayer identity, ownership, and activity documents | false | 5 MB | image/jpeg, image/png, application/pdf |
| `admin-attachments` | Staff-uploaded files (CSV, DOCX, PDF) | false | 10 MB | image/jpeg, png, pdf, csv, xlsx, docx |
| `public-forms` | Public downloadable forms and library documents | true | 5 MB | application/pdf, image/jpeg, image/png |

### Storage policies

| Policy Name | Bucket | Access |
|---|---|---|
| `public_forms_read_policy` | public-forms | SELECT — any user (public) |
| `public_forms_write_policy` | public-forms | ALL — content_manager role or manager |
| `taxpayer_documents_policy` | taxpayer-documents | ALL authenticated — path ownership check OR staff/manager |
| `admin_attachments_policy` | admin-attachments | ALL authenticated — staff or manager only |

## Non-actions

This is a source only. No bucket uploads, downloads, objects mutated, signed URL generation tested, public endpoint validation run, or production connection. Application-layer upload/retention at NestJS/Worker layer remains separate.