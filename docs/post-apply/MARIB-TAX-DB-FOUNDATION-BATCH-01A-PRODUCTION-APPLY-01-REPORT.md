# MARIB-TAX-DB-FOUNDATION-BATCH-01A-PRODUCTION-APPLY-01

## Decision

PASS — PRODUCTION MIGRATION APPLIED AND VERIFIED

## Execution Target

- Environment: Production
- Supabase project ref: sjmtiwzddztxfrncwkpx
- Repository: tarasana-mufadhala/Marib_Tax
- Branch: ops/db-foundation-batch-01a-production-apply-01
- Execution HEAD: b31b5b27af418e82da3fd6c754f39439dea8c280
- Completed at: 2026-07-16 05:46:45 UTC
- Supabase CLI: 2.109.1

## Applied Migration

- Version: 20260715175300
- File: supabase/migrations/20260715175300_create_marib_tax_application_schemas.sql
- SHA-256: A197D608D6F33D61488FA6DA3C32BE4E7B5F68458C2E1C6D2482F62F76DB8171
- Migrations applied in this phase: 1

## Pre-Apply Gates

- Working tree was clean.
- Local and remote branch HEAD matched the authorized execution HEAD.
- Linked Supabase Project Ref matched Production.
- Migration SHA-256 matched the approved value.
- Existing target application schemas: 0.
- Managed auth and storage schemas were present.
- Migration history before apply: Absent before the first Supabase CLI migration.
- Immediate Dry Run listed only the approved Migration.

## Apply Result

- Command: npx supabase@2.109.1 db push --linked --yes
- Exit result: success.
- The approved Migration version appeared in the apply output.
- Seed application: none.
- Roles application: none.
- Additional migrations: none.

## Post-Apply Verification

- Application schemas found: 14/14.
- Missing application schemas: 0.
- Managed auth schema remains present.
- Managed storage schema remains present.
- Migration 20260715175300 is recorded exactly once.
- Unexpected relations: 0.
- Unexpected sequences: 0.
- Unexpected functions or routines: 0.
- Unexpected triggers: 0.
- Unexpected policies: 0.
- Unexpected PostgreSQL types: 0.
- Unexpected extensions: 0.
- Unexpected default privileges: 0.
- Unexpected schema grants: 0.
- Unexpected PUBLIC privileges: 0.
- Schema comments present: 14/14.
- Approved verification script: PASS.
- Strict post-apply verification: STRICT_POST_APPLY_PASS.
- Post-apply Dry Run found no pending Migrations.

## Database Write Scope

The only production database write authorized and executed in this phase was:

20260715175300_create_marib_tax_application_schemas.sql

No later Migration was executed.

## Backup Note

The project remains on the Supabase Free plan. Scheduled backups and PITR are unavailable. The previously validated manual logical backup remains the compensating control and does not include managed auth or storage contents.

## Evidence

Execution evidence was retained locally outside the repository at:

C:\Users\YOGA\AppData\Local\Temp\Marib-Tax-Production-Apply-01-Corrected-02-20260716T054516Z

No access token, database password, connection string, or backup contents were added to this report.