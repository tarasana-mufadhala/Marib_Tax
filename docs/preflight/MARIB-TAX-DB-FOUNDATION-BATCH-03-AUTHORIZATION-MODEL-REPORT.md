# MARIB-TAX-DB-FOUNDATION-BATCH-03-AUTHORIZATION-MODEL — Authoring Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-03-AUTHORIZATION-MODEL-AUTHORING-01 |
| Branch | `feat/db-foundation-batch-03-authorization-model` |
| Base HEAD | `7201ecdf0d83123e6716e01931e4e907db9012e3` |
| Mode | Repository authoring and static review only |
| Decision | **PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY** |

> No Supabase connection, remote dry-run, migration apply, seed, or production database write occurred.

## 1. Scope

Create exactly four authorization-model tables in schema `identity`:

1. `identity.roles`
2. `identity.permissions`
3. `identity.role_permissions`
4. `identity.staff_role_assignments`

Batch 03 depends on Batch 02 profile tables and introduces no seed rows, policies, grants, functions, triggers, views, sequences, extensions, or custom types.

## 2. Files authored

| Path | Role |
| --- | --- |
| `supabase/migrations/20260717120000_create_identity_authorization_model.sql` | Batch 03 migration |
| `scripts/db/verify/verify_batch_03_authorization_model.sql` | Read-only structural/security verification |
| `docs/runbooks/MARIB-TAX-DB-FOUNDATION-BATCH-03-AUTHORIZATION-MODEL-RUNBOOK.md` | Future controlled-apply runbook |
| `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-03-AUTHORIZATION-MODEL-REPORT.md` | This report |

## 3. Migration integrity

| Item | Value |
| --- | --- |
| Version | `20260717120000` |
| Path | `supabase/migrations/20260717120000_create_identity_authorization_model.sql` |
| SHA-256 | `BF15774686744A86D641D7B0B212F7B25E53D2AE6A8E4445662CA84475A00A86` |
| Encoding | UTF-8 |
| Transaction | One `BEGIN` / one `COMMIT` |
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
| RLS-enabled tables | 4 |
| RLS policies | 0 |
| Seed rows | 0 |
| GRANT statements | 0 |
| Extensions | 0 |
| Functions/triggers/types/sequences/views | 0 |

## 4. Constraint and index inventory

| Constraint family | Count |
| --- | ---: |
| Primary key | 4 |
| Unique | 4 |
| Foreign key | 11 |
| Check | 10 |
| **Named constraints total** | **29** |

Foreign-key posture for all 11 FKs:

- `ON UPDATE NO ACTION`
- `ON DELETE RESTRICT`
- `NOT DEFERRABLE`

Explicit indexes:

- `role_permissions_permission_id_idx`
- `staff_role_assignments_staff_profile_id_idx`
- `staff_role_assignments_role_id_idx`
- `staff_role_assignments_one_open_assignment_idx` (partial unique on open assignments)

The partial unique index prevents more than one open assignment of the same role to the same staff profile (`effective_to IS NULL AND revoked_at IS NULL`). Broader temporal-overlap prevention remains NestJS responsibility; no exclusion constraint or `btree_gist` is introduced.

## 5. Security posture

- RLS enabled on all four Batch 03 tables.
- RLS is not forced.
- No policies are created.
- No privileges are granted to `PUBLIC`, `anon`, `authenticated`, or `service_role`.
- Explicit direct table revocation covers those named roles.
- Tables remain closed until Batch 17 detailed grants/policies.
- No passwords, OTP secrets, or Auth credential material are stored.

## 6. Deferred items

- Role/permission catalogue seed content and bootstrap provisioning.
- Broader temporal-overlap enforcement beyond the one open-assignment partial unique index.
- Detailed DB roles, grants, and RLS policies (Batch 17).
- Batch 04 and later physical objects.
- Runtime DB verification and production apply (separate authorized sessions).

## 7. Static verification results

Executed locally during authoring:

| Check | Result |
| --- | --- |
| Workspace / origin / clean tree / base HEAD barriers | PASS |
| Exactly one new migration authored | PASS |
| Changed files limited to the four approved paths | PASS |
| `git diff --check` | PASS |
| Foundation validator `scripts/validate-foundation.sh` | PASS (local static; no DB/Docker) |
| Migration SHA-256 computed | PASS |
| Source counts: 4/37/29/12 and RLS 4 / policies 0 / seeds 0 / grants 0 | PASS |
| Forbidden DML / UUID defaults / extensions / policies absent | PASS |
| Secret/credential files absent from authored artifacts | PASS |
| Runtime SQL verification | **NOT EXECUTED** |
| Supabase connection | **NOT EXECUTED** |
| Production database write | **NONE** |
| Migration apply | **NOT EXECUTED** |
| Seed/backfill | **NONE** |
| Batch 04 | **NOT STARTED** |
| Remote PR CI | **PENDING** at report authoring time |

## 8. Non-actions confirmation

This phase did not:

- connect to Supabase or any database;
- run `supabase link`, login, migration list --linked, or db push;
- apply SQL;
- create or update production data;
- seed roles, permissions, grants, or assignments;
- create policies or GRANT statements;
- modify Batch 01A or Batch 02 artifacts;
- start Batch 04;
- modify `main`.

## 9. Decision

**PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY**

The next allowed activity is repository validation and independent review. Production preflight and production apply require separate explicit authorization.
