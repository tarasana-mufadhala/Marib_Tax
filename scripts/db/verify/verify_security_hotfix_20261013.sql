-- Post-apply verifier for 20261013120000_security_hotfix_lockdown.sql
-- Read-only except for the DO block's assertions; it does not modify application data.

DO $$
DECLARE
  bad_grants integer;
  bad_storage_policies integer;
  expected_storage_policies integer;
  enabled_audit_triggers integer;
BEGIN
  select count(*) into bad_grants
  from information_schema.table_privileges
  where grantee in ('authenticated','anon','PUBLIC')
    and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')
    and table_schema in ('files','identity','registry','legal','masterdata','requests',
                         'balaghat','visits','dues','notify','imports','content','reporting','audit');

  if bad_grants <> 0 then
    raise exception 'SECURITY HOTFIX VERIFY FAIL: % direct client write grants remain', bad_grants;
  end if;

  select count(*) into bad_storage_policies
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and cmd in ('ALL','UPDATE','DELETE')
    and (
      roles @> array['authenticated']::name[]
      or roles @> array['anon']::name[]
      or roles @> array['public']::name[]
    );

  if bad_storage_policies <> 0 then
    raise exception 'SECURITY HOTFIX VERIFY FAIL: % client UPDATE/DELETE/ALL storage policies remain', bad_storage_policies;
  end if;

  select count(*) into expected_storage_policies
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname in ('taxpayer_documents_select','taxpayer_documents_insert')
    and cmd in ('SELECT','INSERT');

  if expected_storage_policies <> 2 then
    raise exception 'SECURITY HOTFIX VERIFY FAIL: expected 2 taxpayer-document SELECT/INSERT policies, found %', expected_storage_policies;
  end if;

  select count(*) into enabled_audit_triggers
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'audit'
    and c.relname in ('audit_logs','log_events')
    and t.tgname in (
      'audit_logs_no_update_delete',
      'audit_logs_no_truncate',
      'log_events_no_update_delete',
      'log_events_no_truncate'
    )
    and t.tgenabled <> 'D'
    and not t.tgisinternal;

  if enabled_audit_triggers <> 4 then
    raise exception 'SECURITY HOTFIX VERIFY FAIL: expected 4 enabled audit immutability triggers, found %', enabled_audit_triggers;
  end if;
END $$;

select 'PASS' as result,
       'no direct client writes; no authenticated/anon/public UPDATE/DELETE/ALL storage policy; expected storage policies and 4 audit triggers present' as detail;

-- Evidence snapshot
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

select n.nspname as schema_name, c.relname as table_name,
       t.tgname, t.tgenabled, pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'audit' and not t.tgisinternal
order by c.relname, t.tgname;
