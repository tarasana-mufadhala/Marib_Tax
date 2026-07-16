# MARIB-TAX-DB-FOUNDATION-BATCH-02-IDENTITY-PROFILES — Apply Runbook

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-02-IDENTITY-PROFILES |
| Purpose | Create `identity.user_profiles` and `identity.staff_profiles` only |
| Migration file | `supabase/migrations/20260716190000_create_identity_profiles.sql` |
| Migration SHA-256 | `8E339EE06703F507512584C72D05BB54AA68A15104BDB77369E635AA0403D7D0` |
| Verification script | `scripts/db/verify/verify_batch_02_identity_profiles.sql` |
| Official runner | Supabase CLI `2.109.1` |
| Target project ref | `sjmtiwzddztxfrncwkpx` |
| Target environment | `production` |
| Status | Authoring runbook — **does not authorize production apply** |

> This runbook describes a future controlled production execution.
> It does not authorize database connection, remote dry-run, or apply by itself.

## 1. Approved scope

Create exactly:

1. `identity.user_profiles`
2. `identity.staff_profiles`

The tables implement the approved Batch 2 identity-profile boundary:

- Supabase Auth remains the credential and session owner.
- `identity.user_profiles.auth_user_id` is a unique managed-schema reference to `auth.users.id`.
- Staff work is attributed through `identity.staff_profiles`.
- No application password, OTP secret, phone-auth key, or tax-number-auth key is stored.
- IDs are supplied by NestJS; no UUID extension or database UUID default is introduced.
- Soft archive and effective dating are retained.
- RLS is enabled without policies.
- No client or service-role privileges are granted.

## 2. Exact table inventory

### `identity.user_profiles`

Nine columns:

`id`, `auth_user_id`, `display_name`, `is_active`, `created_at`,
`created_by_profile_id`, `updated_at`, `updated_by_profile_id`, `archived_at`.

Required controls:

- UUID primary key without database default.
- Unique `auth_user_id`.
- FK to managed `auth.users(id)`.
- Nullable self-referencing creation/update actor fields for controlled bootstrap.
- `is_active DEFAULT true`.
- `created_at DEFAULT now()`.
- No password, OTP, phone, email, role, permission, taxpayer, or public-reference columns.

### `identity.staff_profiles`

Twelve columns:

`id`, `user_profile_id`, `staff_code`, `title`, `is_active`,
`effective_from`, `effective_to`, `created_at`, `created_by_profile_id`,
`updated_at`, `updated_by_profile_id`, `archived_at`.

Required controls:

- UUID primary key without database default.
- One staff profile per user profile (`UNIQUE user_profile_id`).
- Optional unique staff code; PostgreSQL permits multiple NULL values.
- `effective_from` supplied explicitly by NestJS.
- `effective_to IS NULL OR effective_to > effective_from`.
- Soft archive; no hard-delete lifecycle.
- Staff profile is an eligibility/attribution record, not a complete HR record.

## 3. Constraints and referential actions

| Type | Count |
| --- | ---: |
| Primary keys | 2 |
| Unique constraints | 3 |
| Foreign keys | 6 |
| Check constraints | 1 |
| Total | 12 |

All foreign keys use:

- `ON UPDATE NO ACTION`
- `ON DELETE RESTRICT`
- `NOT DEFERRABLE`

Expected constraint-backed indexes: 5.

## 4. Security posture

- `ENABLE ROW LEVEL SECURITY` on both tables.
- No `CREATE POLICY`.
- No grants to `PUBLIC`, `anon`, `authenticated`, or `service_role`.
- Explicit revocation removes direct table privileges from those named roles; inherited-role analysis remains part of the later DB-role security design.
- No schema grant, default privilege, database role, or search-path change.
- NestJS remains the future authoritative mutation and authorization layer.
- Detailed DB roles, grants, and RLS policies remain Batch 17.

## 5. Explicit exclusions

Do not create, alter, seed, or configure:

- roles, permissions, role assignments, or role-permission mappings;
- taxpayer account links or taxpayer data;
- Auth users, Auth hooks, passwords, OTPs, or MFA configuration;
- triggers, routines, views, sequences, extensions, custom types, or policies;
- indexes beyond PK/UNIQUE constraint indexes;
- seed/bootstrap users or staff records;
- Storage buckets or policies;
- grants to application/client roles;
- NestJS, Next.js, or Flutter application code.

## 6. Mandatory pre-apply checks

1. Batch 01A is present in remote migration history exactly once.
2. Batch 01A post-apply report remains accepted.
3. `identity` schema exists.
4. `auth.users` exists and is managed by Supabase.
5. Neither target table exists.
6. No unexpected objects exist in the `identity` schema.
7. Migration version `20260716190000` is absent remotely.
8. Git commit and migration SHA-256 match the reviewed artifact.
9. Working tree is clean and contains no unrelated change.
10. Backup/recovery posture is reviewed and recorded.
11. Project ref is exactly `sjmtiwzddztxfrncwkpx`.
12. Credentials remain out of logs, commands, reports, and repository files.

Any mismatch is a stop condition.

## 7. Future controlled production sequence

Use only:

```text
npx --yes supabase@2.109.1 <subcommand>
```

Future authorized sequence:

1. Verify reviewed Git commit and migration SHA-256.
2. Confirm the linked production project ref.
3. Inspect remote migration history.
4. Confirm Batch 01A is recorded and Batch 02 is absent.
5. Run:
   `npx --yes supabase@2.109.1 db push --linked --dry-run`
6. Confirm exactly migration `20260716190000_create_identity_profiles.sql` would apply.
7. Obtain explicit production-apply authorization.
8. Apply once in a separate controlled session.
9. Run `scripts/db/verify/verify_batch_02_identity_profiles.sql`.
10. Inspect the authoritative result set and every mismatch array.
11. Stop on any FAIL, mismatch, partial state, or uncertainty.
12. Confirm post-apply dry-run reports no pending migration.

### Prohibited

- `db reset --linked`
- automatic `migration repair`
- `--include-all` without separate approval
- blind retry
- direct `psql` as the default migration mechanism
- manually creating tables through the dashboard
- applying Batch 3 in the same session

## 8. Verification result

The read-only verification script returns one authoritative result set containing:

- mismatch counts for tables/RLS, columns, constraints, and indexes;
- forbidden direct-grant count;
- policy, routine, trigger, and custom-type counts;
- `auth.users` presence;
- JSON arrays containing every detected mismatch;
- final authoritative status.

Successful output:

- all mismatch and forbidden-object counts = `0`;
- `auth_users_present = true`;
- all mismatch JSON arrays = `[]`;
- `final_status = PASS`.

Possible failure statuses include:

- `FAIL_AUTH_USERS_MISSING`
- `FAIL_TABLE_OR_RLS_MISMATCH`
- `FAIL_COLUMN_MISMATCH`
- `FAIL_CONSTRAINT_MISMATCH`
- `FAIL_INDEX_MISMATCH`
- `FAIL_UNEXPECTED_OBJECT`
- `FAIL_FORBIDDEN_GRANT`
- `FAIL_UNEXPECTED_POLICY`

## 9. Evidence to capture

- operator and UTC timestamp;
- project/environment identity using non-secret identifiers;
- reviewed Git commit;
- migration filename and SHA-256;
- exact CLI version;
- pre-apply history and schema inventory;
- dry-run output showing one migration only;
- safe apply result;
- complete verification result;
- confirmation of no seed/backfill;
- confirmation that managed Auth objects were not modified;
- post-apply no-pending-migration result.

## 10. Failure and correction posture

- Stop immediately on failure or uncertainty.
- Do not retry the migration blindly.
- Do not delete Auth users or profile records as rollback.
- Do not use `DROP ... CASCADE`.
- Prefer a separately reviewed forward corrective migration.
- Do not start Batch 3 until Batch 02 apply and verification are accepted.

## 11. Current authorization boundary

This authoring phase permits repository artifacts and review only.

It does **not** authorize:

- Supabase connection or login;
- remote history inspection;
- remote dry-run;
- production migration apply;
- seed or backfill;
- application deployment.
