-- Batch 17 read-only structural verifier for storage buckets and policies. Success requires final_status = PASS.
-- Does not mutate data, privileges, policies, or schema objects.

WITH bucket_presence AS (
  SELECT
    count(*) FILTER (WHERE id = 'taxpayer-documents' AND NOT public AND file_size_limit = 5242880) = 1 AS taxpayer_docs_correct,
    count(*) FILTER (WHERE id = 'admin-attachments' AND NOT public AND file_size_limit = 10485760) = 1 AS admin_attachments_correct,
    count(*) FILTER (WHERE id = 'public-forms' AND public AND file_size_limit = 5242880) = 1 AS public_forms_correct
  FROM storage.buckets
),
rls_status AS (
  SELECT
    count(*) FILTER (WHERE c.relname = 'buckets' AND c.relrowsecurity) = 1 AS buckets_rls_enabled,
    count(*) FILTER (WHERE c.relname = 'objects' AND c.relrowsecurity) = 1 AS objects_rls_enabled
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage' AND c.relkind = 'r'
),
policies_presence AS (
  SELECT
    count(*) FILTER (WHERE p.polname = 'public_forms_read_policy') = 1 AS public_forms_read_policy_present,
    count(*) FILTER (WHERE p.polname = 'public_forms_write_policy') = 1 AS public_forms_write_policy_present,
    count(*) FILTER (WHERE p.polname = 'taxpayer_documents_policy') = 1 AS taxpayer_documents_policy_present,
    count(*) FILTER (WHERE p.polname = 'admin_attachments_policy') = 1 AS admin_attachments_policy_present
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage' AND c.relname = 'objects'
)
SELECT
  bp.taxpayer_docs_correct,
  bp.admin_attachments_correct,
  bp.public_forms_correct,
  rs.buckets_rls_enabled,
  rs.objects_rls_enabled,
  pp.public_forms_read_policy_present,
  pp.public_forms_write_policy_present,
  pp.taxpayer_documents_policy_present,
  pp.admin_attachments_policy_present,
  CASE
    WHEN bp.taxpayer_docs_correct
      AND bp.admin_attachments_correct
      AND bp.public_forms_correct
      AND rs.buckets_rls_enabled
      AND rs.objects_rls_enabled
      AND pp.public_forms_read_policy_present
      AND pp.public_forms_write_policy_present
      AND pp.taxpayer_documents_policy_present
      AND pp.admin_attachments_policy_present
    THEN 'PASS'
    ELSE 'FAIL'
  END AS final_status
FROM bucket_presence bp
CROSS JOIN rls_status rs
CROSS JOIN policies_presence pp;
