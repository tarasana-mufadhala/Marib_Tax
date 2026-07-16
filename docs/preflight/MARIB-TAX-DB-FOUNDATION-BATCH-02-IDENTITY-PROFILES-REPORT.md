# MARIB-TAX-DB-FOUNDATION-BATCH-02-IDENTITY-PROFILES — Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-02-IDENTITY-PROFILES |
| Branch | `feat/db-foundation-batch-02-identity-profiles` |
| Base commit | `d89f8495b7e04fd1e30d61baa77418baa8328d24` |
| Mode | Migration authoring and static review only |
| Decision | **PASS_WITH_NOTES — READY FOR INDEPENDENT REVIEW; NOT AUTHORIZED FOR APPLY** |

> No Supabase connection, remote dry-run, migration apply, seed, or production database write occurred.

## 1. Owner-approved decisions used

The owner approved the Batch 02 execution package:

- internal primary keys are `uuid`;
- NestJS supplies UUID values;
- no `gen_random_uuid()` default;
- no extension is added;
- only `identity.user_profiles` and `identity.staff_profiles` are in scope;
- no application passwords, OTPs, phone-auth keys, or tax-number-auth keys;
- `effective_from` is supplied explicitly;
- soft archive is retained;
- RLS is enabled without policies;
- no grants to `PUBLIC`, `anon`, `authenticated`, or `service_role`;
- roles and permissions remain Batch 3;
- detailed policies and DB grants remain Batch 17;
- no bootstrap data is seeded.

## 2. Sources reviewed

- `docs/data/MARIB-TAX-PHYSICAL-MIGRATION-SEQUENCE-01.md`
- `docs/data/MARIB-TAX-PHYSICAL-TABLE-CATALOG-01.md`
- `docs/data/MARIB-TAX-PHYSICAL-COLUMN-CONSTRAINT-CATALOG-01.md`
- `docs/data/MARIB-TAX-PHYSICAL-RELATIONAL-INTEGRITY-01.md`
- `docs/data/MARIB-TAX-PHYSICAL-IDENTIFIER-DESIGN-01.md`
- `docs/security/MARIB-TAX-SUPABASE-AUTH-DATABASE-DESIGN-01.md`
- `docs/security/MARIB-TAX-RLS-DATABASE-ACCESS-REQUIREMENTS-01.md`
- `docs/governance/MARIB-TAX-PHYSICAL-DESIGN-OPEN-DECISIONS-01.md`
- `docs/governance/MARIB-TAX-SUPABASE-CLI-MIGRATION-STANDARD-01.md`
- `.cursor/rules/20-database.mdc`
- Batch 01A production post-apply report

## 3. Files authored

| Path | Role |
| --- | --- |
| `supabase/migrations/20260716190000_create_identity_profiles.sql` | Batch 02 migration |
| `scripts/db/verify/verify_batch_02_identity_profiles.sql` | Read-only structural/security verification |
| `docs/runbooks/MARIB-TAX-DB-FOUNDATION-BATCH-02-IDENTITY-PROFILES-RUNBOOK.md` | Future controlled-apply runbook |
| `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-02-IDENTITY-PROFILES-REPORT.md` | This report |

## 4. Migration integrity

| Item | Value |
| --- | --- |
| Version | `20260716190000` |
| Filename | `20260716190000_create_identity_profiles.sql` |
| SHA-256 | `8E339EE06703F507512584C72D05BB54AA68A15104BDB77369E635AA0403D7D0` |
| Encoding | UTF-8 |
| Transaction | One `BEGIN` / one `COMMIT` |
| Tables | 2 |
| Columns | 21 |
| Constraints | 12 |
| Constraint-backed indexes | 5 |
| Seed/backfill | 0 |
| Extensions | 0 |
| Policies | 0 |
| Functions/triggers/types/sequences/views | 0 |

## 5. Table and column scope

### TABLE-001 — `identity.user_profiles`

- 9 catalogued columns.
- UUID PK without DB default.
- Unique FK to managed `auth.users(id)`.
- Nullable actor self-FKs for controlled bootstrap.
- `is_active DEFAULT true`.
- `created_at DEFAULT now()`.
- Soft archive through `archived_at`.

### TABLE-002 — `identity.staff_profiles`

- 12 catalogued columns.
- UUID PK without DB default.
- Unique backing `user_profile_id`.
- Optional unique `staff_code`.
- Effective-period check.
- Actor FKs to `identity.user_profiles`.
- Staff eligibility and attribution only; no broad HR record invented.

## 6. Constraint inventory

| Constraint family | Count |
| --- | ---: |
| Primary key | 2 |
| Unique | 3 |
| Foreign key | 6 |
| Check | 1 |
| **Total** | **12** |

Foreign-key posture:

- `ON UPDATE NO ACTION`
- `ON DELETE RESTRICT`
- `NOT DEFERRABLE`

No cascade delete is introduced.

## 7. RLS and privilege posture

- RLS enabled on both tables.
- RLS is not forced.
- No policies are created.
- No privileges are granted to client or service roles.
- Explicit direct table revocation covers `PUBLIC`, `anon`, `authenticated`, and `service_role`.
- Migration owner retains implicit ownership.
- Batch 17 remains responsible for the reviewed role/grant/policy design.

## 8. Static migration review

Expected top-level executable statement count: **30**.

| Statement | Count |
| --- | ---: |
| `BEGIN` | 1 |
| `CREATE TABLE` | 2 |
| `COMMENT ON TABLE` | 2 |
| `COMMENT ON COLUMN` | 21 |
| `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` | 2 |
| `REVOKE ALL ON TABLE` | 1 |
| `COMMIT` | 1 |
| Constraint clauses inside `CREATE TABLE` | 12 |
| **Executable top-level statements** | **30** |

The 12 constraint clauses are part of the two `CREATE TABLE` statements and are not additional top-level SQL statements. Static review uses SQL statement boundaries rather than counting semicolon characters inside quoted comments.

Forbidden executable operations absent:

- `CREATE EXTENSION`
- `CREATE POLICY`
- `CREATE FUNCTION`
- `CREATE TRIGGER`
- `CREATE TYPE`
- `CREATE VIEW`
- `CREATE SEQUENCE`
- `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`
- `DROP`
- `ALTER DATABASE`, `ALTER ROLE`, `ALTER DEFAULT PRIVILEGES`
- `GRANT`
- `IF NOT EXISTS`
- `CASCADE`
- anonymous `DO` / dynamic `EXECUTE`

Expected references to managed `auth.users` are FK references only; no managed-schema DDL is present.

## 9. Verification coverage

The verification script is read-only and returns one authoritative result set covering:

- table existence and RLS;
- exact 21-column shape;
- exact 12-constraint inventory;
- FK source columns, targets, actions, and deferrability;
- exact five-index inventory;
- forbidden direct ACLs;
- policies, routines, triggers, and custom types;
- mismatch details as JSON arrays;
- authoritative PASS/FAIL status.

The final status cannot be PASS when `auth.users` is missing, tables/RLS differ, columns or constraints differ, unexpected objects exist, forbidden grants exist, or policies exist.

## 10. Open decisions and bounded deferrals

- Broader DM-14 representation and own-data attributes remain open beyond these two approved fields/tables.
- Initial operator/bootstrap provisioning process remains a separate controlled decision.
- Role/permission catalogue names and seeds remain Batch 3.
- Exact RLS mechanism and DB role split remain Batch 17.
- Retention/anonymization procedures remain open; no destructive procedure is introduced.
- UUID generation is approved for this batch as NestJS-supplied with no DB default.

## 11. Non-actions confirmation

This phase did not:

- connect to Supabase or any database;
- inspect remote migration history;
- execute a remote dry-run;
- apply SQL;
- create or update production data;
- create Auth users;
- seed profiles or staff;
- create policies or grants;
- modify managed schemas;
- deploy or publish applications;
- modify `main`.

## 12. Decision

**PASS_WITH_NOTES — READY FOR INDEPENDENT REVIEW; NOT AUTHORIZED FOR APPLY**

The next allowed activity is repository validation and independent review. Production preflight and production apply require separate explicit authorization.
