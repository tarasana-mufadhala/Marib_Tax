-- MARIB-TAX-DB-FOUNDATION-BATCH-17-STORAGE-BUCKETS-AND-POLICIES
-- Create storage buckets for taxpayers and administrative files.
-- Set size limits, MIME validation constraints, and signed URL access rules.
-- Authoring only; do not apply to production in this task.

BEGIN;

-- 1. Insert or update buckets configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'taxpayer-documents', 
    'taxpayer-documents', 
    false, -- private bucket
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'admin-attachments', 
    'admin-attachments', 
    false, -- private bucket
    10485760, -- 10MB limit
    ARRAY[
      'image/jpeg', 
      'image/png', 
      'application/pdf', 
      'text/csv', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'public-forms', 
    'public-forms', 
    true, -- public read bucket
    5242880, -- 5MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO UPDATE 
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Ensure RLS is enabled on storage tables
-- ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Revoke default public privileges (REVOKE ALL) and grant specific access
-- REVOKE ALL ON TABLE storage.buckets, storage.objects FROM PUBLIC, anon, authenticated, service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.buckets, storage.objects TO authenticated;
-- GRANT SELECT ON TABLE storage.buckets, storage.objects TO anon;

--------------------------------------------------------------------------------
-- 4. APPLY ROW LEVEL SECURITY POLICIES FOR STORAGE
--------------------------------------------------------------------------------

-- Public Forms Policies
DROP POLICY IF EXISTS public_forms_read_policy ON storage.objects;
CREATE POLICY public_forms_read_policy ON storage.objects
  FOR SELECT USING (bucket_id = 'public-forms');

DROP POLICY IF EXISTS public_forms_write_policy ON storage.objects;
CREATE POLICY public_forms_write_policy ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'public-forms' AND (identity.has_role('content_manager') OR identity.is_manager()));

-- Taxpayer Documents Policies
DROP POLICY IF EXISTS taxpayer_documents_policy ON storage.objects;
CREATE POLICY taxpayer_documents_policy ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'taxpayer-documents'
    AND (
      -- Taxpayer owns the document path (starts with their taxpayer_id)
      split_part(name, '/', 1) IN (
        SELECT taxpayer_id::text FROM registry.taxpayer_account_links
        WHERE user_profile_id = identity.get_current_user_profile_id()
          AND active_state_code = 'active'
          AND effective_to IS NULL
      )
      OR identity.is_staff()
      OR identity.is_manager()
    )
  );

-- Admin Attachments Policies
DROP POLICY IF EXISTS admin_attachments_policy ON storage.objects;
CREATE POLICY admin_attachments_policy ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'admin-attachments'
    AND (identity.is_staff() OR identity.is_manager())
  );

COMMIT;
