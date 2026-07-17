# MARIB-TAX-DB-FOUNDATION-BATCH-03-AUTHORIZATION-MODEL — Apply Runbook

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-03-AUTHORIZATION-MODEL-AUTHORING-01 |
| Purpose | Create `identity.roles`, `identity.permissions`, `identity.role_permissions`, and `identity.staff_role_assignments` only |
| Migration file | `supabase/migrations/20260717120000_create_identity_authorization_model.sql` |
| Migration SHA-256 | `BF15774686744A86D641D7B0B212F7B25E53D2AE6A8E4445662CA84475A00A86` |
| Verification script | `scripts/db/verify/verify_batch_03_authorization_model.sql` |
| Official runner | Supabase CLI `2.109.1` |
| Target project ref | `sjmtiwzddztxfrncwkpx` |
| Target environment | `production` |
| Status | Authoring runbook — **does not authorize production apply** |

> This runbook describes a future controlled production execution.
> It does not authorize database connection, remote dry-run, or apply by itself.

## 1. Goal and scope

Create exactly four authorization-model tables inside `identity`:

1. `identity.roles`
2. `identity.permissions`
3. `identity.role_permissions`
4. `identity.staff_role_assignments`

Approved boundary:

- Depends on Batch 02 (`identity.user_profiles`, `identity.staff_profiles`).
- Role and permission `code` values are stable programmatic keys, not display names.
- NestJS treats codes as immutable after creation.
- No role/permission/assignment seed rows are introduced in Batch 03.
- `role_permissions` stores direct grants only and does not auto-create permissions.
- `staff_role_assignments` applies to staff profiles only, never taxpayers.
- A user must already own a `staff_profile` before receiving an internal role assignment.
- IDs are supplied by NestJS; no UUID extension or database UUID default is introduced.
- RLS is enabled without policies.
- No client or service-role privileges are granted.
- Detailed grants and RLS policies remain Batch 17.

## 2. Dependency on Batch 02

Batch 03 must not apply until Batch 02 is present and accepted:

- `identity.user_profiles` exists.
- `identity.staff_profiles` exists.
- Batch 02 post-apply verification remains accepted.

Foreign keys in Batch 03 reference those tables for actor and staff identity.

## 3. Exact table inventory

### `identity.roles` — 11 columns

`id`, `code`, `name_ar`, `description`, `is_system`, `is_active`,
`created_at`, `created_by_profile_id`, `updated_at`, `updated_by_profile_id`,
`archived_at`.

### `identity.permissions` — 12 columns

`id`, `code`, `resource`, `action`, `name_ar`, `description`, `is_active`,
`created_at`, `created_by_profile_id`, `updated_at`, `updated_by_profile_id`,
`archived_at`.

`code` must equal `resource || '.' || action`.

### `identity.role_permissions` — 4 columns

`role_id`, `permission_id`, `granted_at`, `granted_by_profile_id`.

Represents a direct grant between an existing role and an existing permission.

### `identity.staff_role_assignments` — 10 columns

`id`, `staff_profile_id`, `role_id`, `effective_from`, `effective_to`,
`assigned_at`, `assigned_by_profile_id`, `revoked_at`, `revoked_by_profile_id`,
`revocation_reason`.

## 4. Constraints and indexes

| Type | Count |
| --- | ---: |
| Tables | 4 |
| Columns | 37 |
| Primary keys | 4 |
| Unique constraints | 4 |
| Foreign keys | 11 |
| Check constraints | 10 |
| Named constraints total | 29 |
| Explicit indexes | 4 |
| Constraint-backed indexes | 8 |
| Total indexes | 12 |

All eleven foreign keys use:

- `ON UPDATE NO ACTION`
- `ON DELETE RESTRICT`
- `NOT DEFERRABLE`

Explicit indexes:

- `role_permissions_permission_id_idx`
- `staff_role_assignments_staff_profile_id_idx`
- `staff_role_assignments_role_id_idx`
- `staff_role_assignments_one_open_assignment_idx` (partial unique)

The partial unique index `staff_role_assignments_one_open_assignment_idx` prevents more than one open assignment of the same role to the same staff profile where:

```text
effective_to IS NULL
AND revoked_at IS NULL
```

No exclusion constraint and no `btree_gist` are used. Broader temporal-overlap prevention remains NestJS responsibility in this batch.

## 5. Staff role-assignment lifecycle

Effective assignment definition used by NestJS:

```text
effective_from <= now()
AND (effective_to IS NULL OR effective_to > now())
AND revoked_at IS NULL
```

Lifecycle notes:

- `effective_to` ends the planned effectiveness window.
- `revoked_at` is explicit revocation and is not the same as `effective_to`.
- Hard deletion is not the normal lifecycle.
- `granted_by_profile_id` / `assigned_by_profile_id` may be NULL only for controlled bootstrap.
- A staff role assignment requires an existing `identity.staff_profiles` row.

## 6. Security posture

- `ENABLE ROW LEVEL SECURITY` on all four tables.
- No `CREATE POLICY`.
- No grants to `PUBLIC`, `anon`, `authenticated`, or `service_role`.
- Explicit revocation removes direct table privileges from those named roles.
- Tables are closed to client/service direct access until Batch 17.
- NestJS remains the authoritative mutation and authorization layer.
- Detailed DB roles, grants, and RLS policies remain Batch 17.

## 7. Explicit exclusions

Do not create, alter, seed, or configure:

- seed/bootstrap role, permission, grant, or assignment rows;
- Auth users, Auth hooks, passwords, OTPs, or MFA configuration;
- Storage buckets or policies;
- functions, procedures, triggers, views, sequences, extensions, or custom types;
- RLS policies or GRANT statements;
- exclusion constraints or `btree_gist`;
- Batch 04 objects;
- NestJS, Next.js, or Flutter application code;
- modifications to Batch 01A or Batch 02 artifacts.

## 8. Mandatory pre-apply checks (future)

1. Batch 01A and Batch 02 are present in remote migration history exactly once each.
2. Batch 02 post-apply report remains accepted.
3. `identity.user_profiles` and `identity.staff_profiles` exist.
4. None of the four Batch 03 tables exist.
5. Migration version `20260717120000` is absent remotely.
6. Git commit and migration SHA-256 match the reviewed artifact.
7. Working tree is clean and contains no unrelated change.
8. Backup/recovery posture is reviewed and recorded.
9. Project ref is exactly `sjmtiwzddztxfrncwkpx`.
10. Credentials remain out of logs, commands, reports, and repository files.

Any mismatch is a stop condition.

## 9. Future controlled production sequence

Use only:

```text
npx --yes supabase@2.109.1 <subcommand>
```

Future authorized sequence:

1. Verify reviewed Git commit and migration SHA-256.
2. Confirm the linked production project ref.
3. Inspect remote migration history.
4. Confirm Batch 02 is recorded and Batch 03 is absent.
5. Run future dry-run only when separately authorized:
   `npx --yes supabase@2.109.1 db push --linked --dry-run`
6. Confirm exactly migration `20260717120000_create_identity_authorization_model.sql` would apply.
7. Obtain explicit production-apply authorization.
8. Apply once in a separate controlled session.
9. Run `scripts/db/verify/verify_batch_03_authorization_model.sql`.
10. Inspect the authoritative result set and every mismatch array.
11. Stop on any FAIL, mismatch, partial state, or uncertainty.
12. Confirm post-apply dry-run reports no pending migration.

### Prohibited

- `db reset --linked`
- automatic `migration repair`
- automatic rollback
- `--include-all` without separate approval
- blind retry
- direct `psql` as the default migration mechanism
- manually creating tables through the dashboard
- applying Batch 04 in the same session

Correction posture: prefer a separately reviewed forward corrective migration. Do not reset, repair, or roll back automatically.

## 10. Verification result

The read-only verification script returns one authoritative result set containing:

- Batch 02 dependency presence;
- mismatch counts for tables/RLS, columns, constraints, and indexes;
- forbidden direct-grant count;
- seed/row-count mismatch indicator;
- policy, view, routine, trigger, sequence, and custom-type counts scoped to Batch 03;
- JSON arrays containing every detected mismatch;
- final authoritative status.

Successful output:

- dependency flags true;
- all mismatch and forbidden-object counts = `0`;
- all four tables empty (`0` rows);
- all mismatch JSON arrays = `[]`;
- `final_status = PASS`.

## 11. Stop conditions

Stop immediately when any of the following occur:

- dependency tables missing;
- unexpected table/column/constraint/index shape;
- any policy or forbidden direct grant present;
- any seed row present;
- dry-run shows more or fewer than the one Batch 03 migration;
- SHA-256 or commit mismatch;
- uncertainty about production state.

## 12. Current authorization boundary

This authoring phase permits repository artifacts and review only.

It does **not** authorize:

- Supabase connection or login;
- remote history inspection;
- remote dry-run;
- production migration apply;
- seed or backfill;
- application deployment;
- Batch 04 start.
