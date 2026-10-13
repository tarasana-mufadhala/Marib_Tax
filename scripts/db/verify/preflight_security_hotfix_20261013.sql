-- Read-only preflight for 20261013120000_security_hotfix_lockdown.sql
-- Run against the target database BEFORE any apply. This file performs no writes.

-- A. Environment identity and migration drift snapshot.
select current_database() as database_name,
       current_user as sql_editor_current_user,
       session_user as sql_editor_session_user,
       now() as checked_at;

select version, name
from supabase_migrations.schema_migrations
order by version;

-- B. Owners of application tables. The backend runtime role must be verified
-- separately from deployment DATABASE_URL; SQL Editor current_user is not proof.
select n.nspname as schema_name,
       c.relname as table_name,
       pg_get_userbyid(c.relowner) as owner_role
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r','p')
  and n.nspname in ('files','identity','registry','legal','masterdata','requests',
                    'balaghat','visits','dues','notify','imports','content','reporting','audit')
order by n.nspname, c.relname;

-- C. Direct client write grants, including PUBLIC.
select grantee, table_schema, table_name, privilege_type
from information_schema.table_privileges
where grantee in ('authenticated','anon','PUBLIC')
  and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')
  and table_schema in ('files','identity','registry','legal','masterdata','requests',
                       'balaghat','visits','dues','notify','imports','content','reporting','audit')
order by grantee, table_schema, table_name, privilege_type;

-- D. Default ACLs that could re-open future client writes.
select pg_get_userbyid(d.defaclrole) as owner_role,
       coalesce(n.nspname, '<all schemas>') as schema_name,
       d.defaclobjtype,
       d.defaclacl
from pg_default_acl d
left join pg_namespace n on n.oid = d.defaclnamespace
where coalesce(n.nspname, '') in ('','files','identity','registry','legal','masterdata','requests',
                                  'balaghat','visits','dues','notify','imports','content','reporting','audit')
order by owner_role, schema_name, d.defaclobjtype;

-- E. Every storage.objects policy, regardless of policy name.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- F. Verify helpers and ownership-link columns used by the replacement policy.
select to_regprocedure('identity.get_current_user_profile_id()') as current_profile_helper,
       to_regprocedure('identity.is_staff()') as is_staff_helper,
       to_regprocedure('identity.is_manager()') as is_manager_helper;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'registry'
  and table_name = 'taxpayer_account_links'
  and column_name in ('taxpayer_id','user_profile_id','active_state_code',
                      'verification_status_code','effective_from','effective_to')
order by column_name;

-- G. Existing application RLS write policies (latent or live).
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('files','identity','registry','legal','masterdata','requests',
                     'balaghat','visits','dues','notify','imports','content','reporting','audit')
  and cmd in ('ALL','INSERT','UPDATE','DELETE')
order by schemaname, tablename, policyname;

-- H. Audit owners and current triggers.
select n.nspname as schema_name,
       c.relname as table_name,
       pg_get_userbyid(c.relowner) as owner_role
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'audit'
  and c.relname in ('audit_logs','log_events')
  and c.relkind in ('r','p')
order by c.relname;

select n.nspname as schema_name,
       c.relname as table_name,
       t.tgname,
       t.tgenabled,
       pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'audit'
  and c.relname in ('audit_logs','log_events')
  and not t.tgisinternal
order by c.relname, t.tgname;

-- PASS decision is manual: do not apply until the deployment DATABASE_URL role
-- is confirmed to retain required backend writes after revoking client roles.
