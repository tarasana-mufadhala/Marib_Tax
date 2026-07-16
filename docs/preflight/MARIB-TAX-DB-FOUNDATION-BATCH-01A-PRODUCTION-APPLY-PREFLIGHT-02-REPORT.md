# MARIB-TAX-DB-FOUNDATION-BATCH-01A-PRODUCTION-APPLY-PREFLIGHT-02

## Decision

**PASS_WITH_NOTES — GO_FOR_SEPARATE_CONTROLLED_APPLY**

This authorization is limited strictly to:

`20260715175300_create_marib_tax_application_schemas.sql`

It does not authorize applying additional migrations or making unrelated production changes.

## Target

- Environment: Production
- Supabase project ref: `sjmtiwzddztxfrncwkpx`
- Repository: `tarasana-mufadhala/Marib_Tax`
- Branch: `ops/db-foundation-batch-01a-production-apply-preflight-02`
- Preflight base HEAD: `0a9b67d12886e48e6619928e03f70e64a54197e7`
- Supabase CLI: `2.109.1`

## Migration Integrity

- Migration:
  `supabase/migrations/20260715175300_create_marib_tax_application_schemas.sql`
- SHA-256:
  `A197D608D6F33D61488FA6DA3C32BE4E7B5F68458C2E1C6D2482F62F76DB8171`
- Scope: create 14 empty application schemas
- Transactional wrapper: present
- Tables created: none
- Data modified: none
- Auth or Storage changes: none
- Grants to application roles: none

## Production Inventory Gate

Read-only production inspection confirmed:

- Existing target application schemas: `0`
- Absent target application schemas: `14`
- `auth` schema: present
- `storage` schema: present
- Inventory decision:
  `PASS_APPLICATION_SCHEMAS_ABSENT`

## Backup Gate

The project is on the Supabase Free plan.

- Scheduled backups: unavailable
- Point-in-time recovery: unavailable
- Compensating control: manual external logical snapshot
- Backup location: outside the Git repository
- Backup manifest SHA-256:
  `7527245E72A4CE7E3B251C3FA89DFE8F62351E19D1C58F5A8228B8AA8F888754`

Validated backup files:

| File | Bytes | SHA-256 |
|---|---:|---|
| `roles.sql` | 297 | `25873CEC56A2CC6514E204F420231777F85C03DA818CAA7090CDCDFA89776ECD` |
| `schema.sql` | 2402 | `9CE7BB5DBF67DEC8193C9D9D4504FCFF43E82B19F4ED5E2CA3A74F79170192B7` |
| `data.sql` | 9571 | `10370739CBF673357220F447D08DE1D8A1A915E73551294F04538C4DC298C47E` |

Limitations:

- This logical snapshot is not equivalent to managed PITR.
- Managed Supabase schemas such as `auth` and `storage` are not included.
- Storage object bytes are not included.
- The approved migration does not modify those excluded areas.

Backup decision:

`PASS_WITH_NOTES`

## Migration History Before Dry Run

- Local migration: `20260715175300`
- Remote migration: absent
- Remote database access: passed
- Database write: none

## Production Dry Run

Command class executed:

`supabase db push --linked --dry-run`

Result:

- Exit code: `0`
- Expected migration listed: yes
- Additional migrations listed: none
- CLI output confirmed:
  `DRY RUN: migrations will not be pushed to the database`
- Proposed migration:
  `20260715175300_create_marib_tax_application_schemas.sql`

## Post-Dry-Run Verification

A second linked migration-history read confirmed:

- Local version: `20260715175300`
- Remote version: absent
- Migration applied by dry run: no
- Database schema write: none
- Working tree: clean

## Controlled Apply Conditions

The subsequent production-apply task must:

1. Verify project ref `sjmtiwzddztxfrncwkpx`.
2. Verify the exact migration SHA-256.
3. Verify only migration `20260715175300` is pending.
4. Apply one migration only.
5. Stop immediately on any failure or partial result.
6. Run the Batch 01A verification SQL after apply.
7. Confirm all 14 schemas exist.
8. Confirm `auth` and `storage` remain present.
9. Confirm migration history contains exactly the applied version.
10. Confirm no tables, functions, policies, types, sequences, or application grants were introduced.
11. Record all post-apply evidence in a separate report.

## Final Preflight Decision

`PASS_WITH_NOTES — GO_FOR_SEPARATE_CONTROLLED_APPLY`

No production migration was applied during this preflight.