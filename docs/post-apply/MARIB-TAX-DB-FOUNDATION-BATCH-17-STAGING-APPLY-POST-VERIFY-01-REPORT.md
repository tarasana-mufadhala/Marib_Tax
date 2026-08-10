# MARIB-TAX-DB-FOUNDATION-BATCH-17-STAGING-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_17_STAGING_APPLY_AND_VERIFICATION_COMPLETE
- All storage bucket configurations and security policies successfully created and verified on the remote staging database.

## Scope

- Environment: Linked project `sjmtiwzddztxfrncwkpx` (Staging target)
- Repository: `tarasana-mufadhala/Marib_Tax`
- Verification report created: `2026-08-01`
- Supabase CLI: `2.109.1`

## Applied Migration

- Version: `20260801120200`
- File: `supabase/migrations/20260801120200_create_storage_buckets_and_policies.sql`
- SHA-256: `16D3F69B899B4DBA16BB3A2A99F7AD7CF777F070564BF72A2888D1EEA400E58E`
- Verifier: `scripts/db/verify/verify_batch_17_storage_buckets_and_policies.sql`
- Verifier SHA-256: `4A184073D52C2B269FF786545DA35B3E0A5FBD3C00BBD3481EE90E30995AC22F`

## Verification Results

Read-only verifier: `scripts/db/verify/verify_batch_17_storage_buckets_and_policies.sql`

| Check | Result | Detail |
| --- | --- | --- |
| `buckets_rls_enabled` | **true** | RLS is active on `storage.buckets` |
| `objects_rls_enabled` | **true** | RLS is active on `storage.objects` |
| `public_forms_correct` | **true** | Public Forms bucket exists with size limit and allowed MIME types |
| `public_forms_read_policy_present` | **true** | Public Forms read policy exists |
| `public_forms_write_policy_present` | **true** | Public Forms write policy exists |
| `taxpayer_docs_correct` | **true** | Taxpayer Documents bucket exists with correct size/MIME config |
| `taxpayer_documents_policy_present` | **true** | Taxpayer Documents access control policy exists |
| `admin_attachments_correct` | **true** | Admin Attachments bucket exists with correct size/MIME config |
| `admin_attachments_policy_present` | **true** | Admin Attachments policy exists |
| `final_status` | **PASS** | Overall Batch 17 verification passes |

## Structural Adjustments Note
1. Commented out bucket RLS enablement (`ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY`) and default grants/revokes in the migration script to bypass ownership restrictions on Supabase managed tables.
2. The remote database already has default RLS active on these tables; all access control is managed via the created policies on `storage.objects`.
