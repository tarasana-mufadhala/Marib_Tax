# MARIB-TAX-DB-FOUNDATION-BATCH-01A — Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-01A-REMEDIATION-01 |
| Branch | `feat/db-foundation-batch-01a` |
| Base commit | `c426ead0a417e603e2042b0bdcb7e3411eed3ae2` |
| HEAD before first Batch 01A commit | `c426ead0a417e603e2042b0bdcb7e3411eed3ae2` |
| Mode | Migration authoring remediation and static review only |
| Decision | **PASS — READY FOR DB FOUNDATION BATCH 01A RE-REVIEW** |

> This report does **not** authorize database apply, Supabase connection, or commit.
> PR #7 physical schema design is already merged into the base (`c426ead`).

## Source documents reviewed

- `docs/data/MARIB-TAX-PHYSICAL-SCHEMA-ARCHITECTURE-01.md`
- `docs/data/MARIB-TAX-PHYSICAL-MIGRATION-SEQUENCE-01.md` (Batch 1 schemas)
- `docs/security/MARIB-TAX-RLS-DATABASE-ACCESS-REQUIREMENTS-01.md`
- `docs/governance/MARIB-TAX-PHYSICAL-DESIGN-OPEN-DECISIONS-01.md`
- `docs/preflight/MARIB-TAX-PHYSICAL-SCHEMA-DESIGN-01-REPORT.md`
- `docs/architecture/adr/ADR-005-POSTGRES-SUPABASE.md` (migrations under `database/migrations/`)
- `docs/architecture/adr/ADR-010-NO-DIRECT-CLIENT-DATABASE-WRITES.md`
- `CONTRIBUTING.md`
- `README.md`
- `database/migrations/README.md`
- `scripts/README.md`
- `.cursor/rules/20-database.mdc`

Note: `AGENTS.md` was not present in the repository at authoring time.

## Repository migration convention

| Item | Choice |
| --- | --- |
| Directory | `database/migrations/` (ADR-005 / CONTRIBUTING / database README) |
| Filename | `20260715175300_create_marib_tax_application_schemas.sql` |
| Not used | `supabase/migrations/` (no existing Supabase CLI migration tree) |

## Files created

| Path | Role |
| --- | --- |
| `database/migrations/20260715175300_create_marib_tax_application_schemas.sql` | Migration (unchanged in remediation-01) |
| `scripts/db/verify/verify_batch_01a_application_schemas.sql` | Read-only verification |
| `docs/runbooks/MARIB-TAX-DB-FOUNDATION-BATCH-01A-RUNBOOK.md` | Future apply runbook |
| `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-01A-REPORT.md` | This report |

## Schema inventory

| Item | Value |
| --- | ---: |
| Application schemas created | **14** |
| Managed schemas created | **0** |
| Extensions created | **0** (deferred — يحتاج اعتماد لاحق) |

Exact list (deterministic order):

1. identity
2. registry
3. legal
4. masterdata
5. requests
6. balaghat
7. visits
8. dues
9. files
10. notify
11. imports
12. content
13. audit
14. reporting

Managed schemas excluded from DDL: `auth`, `storage`, `public`, `extensions`, `graphql_public`, `realtime`, `vault`, `pgsodium`, `supabase_functions`, and peers.

## Transaction, ownership, privileges

| Strategy | Implementation |
| --- | --- |
| Atomicity | Single `BEGIN` … `COMMIT` |
| Ownership | Implicit current migration role; no hardcoded username |
| PUBLIC | `REVOKE ALL ON SCHEMA … FROM PUBLIC` for each of the fourteen |
| Client grants | None (`anon` / `authenticated` / `service_role` not granted) |
| search_path | Not mutated |
| ALTER DATABASE / ALTER ROLE | Not used |
| IF NOT EXISTS / DROP / CASCADE | Not used |

## Executable SQL statement total: 44

Breakdown for the migration file only:

| Statement | Count |
| --- | ---: |
| BEGIN | 1 |
| CREATE SCHEMA | 14 |
| COMMENT ON SCHEMA | 14 |
| REVOKE ALL ON SCHEMA … FROM PUBLIC | 14 |
| COMMIT | 1 |
| **Total** | **44** |

The verification script is **not** included in the migration’s 44-statement count. It is a separate read-only operator verification artifact.

## Verification-script coverage

`scripts/db/verify/verify_batch_01a_application_schemas.sql` is read-only and reports five result sets:

1. Per-schema inventory (exists, owner, PUBLIC USAGE/CREATE)
2. Missing expected application schemas
3. PUBLIC USAGE/CREATE aggregate summary
4. Managed `auth` / `storage` presence
5. Authoritative final status and reason

Final-status precedence:

1. FAIL when any of the fourteen application schemas is missing
2. FAIL when `auth` is missing
3. FAIL when `storage` is missing
4. WARN when PUBLIC has unexpected USAGE or CREATE
5. PASS only when 14/14 + auth + storage and no unexpected PUBLIC privileges

Statuses: `FAIL_MISSING_APPLICATION_SCHEMA` | `FAIL_MISSING_MANAGED_SCHEMA` | `WARN_PUBLIC_PRIVILEGES` | `PASS`

No temporary tables, functions, privilege changes, or search_path mutation.

## Runbook coverage

`docs/runbooks/MARIB-TAX-DB-FOUNDATION-BATCH-01A-RUNBOOK.md` documents purpose, filename, schema list, exclusions, credential hygiene, pre-apply checks, apply placeholders, five verification result sets, evidence, stop conditions, rollback / partial-apply response, security confirmation, and next-batch gate (no Batch 2).

## Static forbidden-token results (migration file)

Zero executable occurrences of: `CREATE EXTENSION`, `CREATE TABLE`, `CREATE VIEW`, `CREATE MATERIALIZED VIEW`, `CREATE FUNCTION`, `CREATE TRIGGER`, `CREATE TYPE`, `CREATE POLICY`, `CREATE SEQUENCE`, `ALTER DATABASE`, `ALTER ROLE`, `ALTER DEFAULT PRIVILEGES`, `GRANT`, `DROP`, `TRUNCATE`, `INSERT`, `UPDATE`, `DELETE`, and executable references to `auth.`, `storage.`, or `public.` as DDL targets.

Also zero: `IF NOT EXISTS`, `CASCADE`, dynamic `EXECUTE`, anonymous `DO` blocks, hardcoded owner names.

## Security review

- No secrets, tokens, project URLs with credentials, or service-role keys
- No client grants or RLS policies
- No Auth / Storage DDL
- Comments distinguish `requests` vs `balaghat`; reporting/audit/files/notify do not claim transactional ownership

## Open decisions

- Exact extension inventory remains يحتاج اعتماد لاحق (deferred; no `CREATE EXTENSION` in this batch)
- Future grants / RLS remain Batch 17+ per physical migration sequence
- Apply to a live Supabase project remains a separate ops action after SQL re-review

## Non-actions confirmation

Did not: connect to Supabase; run `supabase db push` / `migration up` / `db reset`; execute SQL against any database; create extensions/tables/views/functions/triggers/types/policies/buckets; modify managed schemas; initialize NestJS/Next.js/Flutter; install dependencies; introduce secrets; commit; push; merge; reset; restore; clean; checkout; or modify `main`.

The only Git history operation performed in remediation-01 was rebasing the empty feature branch onto `origin/main` (`c426ead`).

## Independent SQL review

| Field | Value |
| --- | --- |
| Review task | MARIB-TAX-DB-FOUNDATION-BATCH-01A-SQL-REVIEW-01 |
| Decision | **REQUEST_CHANGES — DB FOUNDATION BATCH 01A CORRECTIONS REQUIRED** |
| Finding counts | BLOCKER **0** / MAJOR **3** / MINOR **2** / NOTE **2** |

| ID | Sev | Summary |
| --- | --- | --- |
| R1-M01 | MAJOR | Managed-schema absence not included in final FAIL |
| R1-M02 | MAJOR | Trailing whitespace in preflight schema list |
| R1-M03 | MAJOR | Stale branch base (`c614362` instead of `c426ead`) |
| R1-m01 | MINOR | Five verification result sets not documented in runbook |
| R1-m02 | MINOR | Missing explicit total of 44 executable statements |
| — | — | Migration SQL itself passed structural review and remains unchanged |

## Remediation 01

| Correction | Result |
| --- | --- |
| Branch rebased/fast-forwarded onto `c426ead` | HEAD = merge-base = `c426ead0a417e603e2042b0bdcb7e3411eed3ae2` |
| Final verification semantics corrected | Missing `auth` or `storage` forces FAIL |
| PUBLIC privilege mismatch | Remains WARN (`WARN_PUBLIC_PRIVILEGES`) |
| Five result sets documented | Runbook §7 |
| 44-statement total recorded | Preflight section above |
| Trailing whitespace removed | This file |
| Migration SQL | Unchanged byte-for-byte |
| Database / Supabase execution | None |

## Decision

**PASS — READY FOR DB FOUNDATION BATCH 01A RE-REVIEW**

This is a remediation-01 gate pass for independent re-review. It is **not** commit approval.
