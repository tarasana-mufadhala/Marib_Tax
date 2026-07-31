# MARIB Tax DB Foundation — Batch 17 Storage Buckets and Policies Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_17_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-17 = NOT_STARTED` (requires the governed cycle and independent user approval)

## Artifacts

- Migration: `supabase/migrations/20260801120000_create_storage_buckets_and_policies.sql`
- Migration SHA-256: `20634DF28A4FB46FAD79C55A95C084EF34B2CAE4290A94241277D4CC67B682C5`
- Read-only verifier: `scripts/db/verify/verify_batch_17_storage_buckets_and_policies.sql`
- Verifier SHA-256: `4A184073D52C2B269FF786545DA35B3E0A5FBD3C00BBD3481EE90E30995AC22F`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-17-STORAGE-BUCKETS-AND-POLICIES-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_17_STORAGE_BUCKETS_AND_POLICIES_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main`

## Scope and boundaries

The source creates storage buckets and applies RLS policies to `storage.objects` table:
- Buckets: `taxpayer-documents`, `admin-attachments`, `public-forms`.
- Maximum file sizes: 5MB (taxpayer, public-forms), 10MB (admin-attachments).
- Allowed MIME types whitelisted to prevent execution of arbitrary/malicious files.

- No data rows are seeded.
- RLS enabled on `storage.buckets` and `storage.objects`.
- Default public privileges revoked.

## Structural review (source)

- Storage buckets creation with conflict handling.
- Security privileges configuration for `authenticated` and `anon` roles.
- Fine-grained object policies based on user profile and path ownership (e.g. `taxpayer-documents/<taxpayer_id>/filename`).

## Non-actions

This source report authorizes no apply. It did not apply Batch 17 anywhere, mutate Storage, or use real data. Local execution is pending a running database connection and does not replace the governed production preflight.
