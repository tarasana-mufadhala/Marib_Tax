-- =============================================================================
-- SECURITY HOTFIX 2026-10-13 — Marib Tax production lockdown
-- Scope: closes client write paths left open by apply_final_rls_policies,
--        the taxpayer-documents storage policy, and audit-log mutability.
-- Safe for the NestJS backend only after preflight verifies the runtime DB role
-- can still write after client-role revokes. Do not apply without that evidence.
-- Runs in one transaction: either everything applies or nothing does.
-- =============================================================================
BEGIN;

-- 1. No direct client writes to application tables.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA
  files, identity, registry, legal, masterdata, requests, balaghat, visits,
  dues, notify, imports, content, reporting, audit
FROM authenticated, anon, PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA
  files, identity, registry, legal, masterdata, requests, balaghat, visits,
  dues, notify, imports, content, reporting, audit
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM authenticated, anon, PUBLIC;

-- 2. Storage: taxpayer-documents.
DROP POLICY IF EXISTS taxpayer_documents_policy ON storage.objects;
DROP POLICY IF EXISTS taxpayer_documents_select ON storage.objects;
DROP POLICY IF EXISTS taxpayer_documents_insert ON storage.objects;

CREATE POLICY taxpayer_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'taxpayer-documents'
    AND (
      split_part(name, '/', 1) IN (
        SELECT l.taxpayer_id::text
        FROM registry.taxpayer_account_links l
        WHERE l.user_profile_id = identity.get_current_user_profile_id()
          AND l.active_state_code = 'active'
          AND l.verification_status_code = 'verified'
          AND l.effective_from <= now()
          AND (l.effective_to IS NULL OR l.effective_to > now())
      )
      OR identity.is_staff()
      OR identity.is_manager()
    )
  );

CREATE POLICY taxpayer_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'taxpayer-documents'
    AND split_part(name, '/', 1) IN (
      SELECT l.taxpayer_id::text
      FROM registry.taxpayer_account_links l
      WHERE l.user_profile_id = identity.get_current_user_profile_id()
        AND l.active_state_code = 'active'
        AND l.verification_status_code = 'verified'
        AND l.effective_from <= now()
        AND (l.effective_to IS NULL OR l.effective_to > now())
    )
  );

-- 3. Audit logs are append-only at the database level.
CREATE OR REPLACE FUNCTION audit.forbid_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'append-only table %.%: % is not allowed',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP;
END;
$$;

REVOKE ALL ON FUNCTION audit.forbid_mutation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_logs_no_update_delete ON audit.audit_logs;
CREATE TRIGGER audit_logs_no_update_delete
  BEFORE UPDATE OR DELETE ON audit.audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit.forbid_mutation();

DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit.audit_logs;
CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON audit.audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION audit.forbid_mutation();

DROP TRIGGER IF EXISTS log_events_no_update_delete ON audit.log_events;
CREATE TRIGGER log_events_no_update_delete
  BEFORE UPDATE OR DELETE ON audit.log_events
  FOR EACH ROW EXECUTE FUNCTION audit.forbid_mutation();

DROP TRIGGER IF EXISTS log_events_no_truncate ON audit.log_events;
CREATE TRIGGER log_events_no_truncate
  BEFORE TRUNCATE ON audit.log_events
  FOR EACH STATEMENT EXECUTE FUNCTION audit.forbid_mutation();

COMMIT;

-- Post-checks are intentionally read-only and exhaustive enough to catch
-- differently named storage policies and PUBLIC grants.
SELECT grantee, table_schema, privilege_type, count(*) AS grants
FROM information_schema.role_table_grants
WHERE grantee IN ('authenticated', 'anon', 'PUBLIC')
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  AND table_schema IN ('files','identity','registry','legal','masterdata','requests',
                       'balaghat','visits','dues','notify','imports','content','reporting','audit')
GROUP BY grantee, table_schema, privilege_type
ORDER BY grantee, table_schema, privilege_type;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

SELECT n.nspname AS schema_name, c.relname AS table_name, t.tgname,
       t.tgenabled, pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'audit' AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;
