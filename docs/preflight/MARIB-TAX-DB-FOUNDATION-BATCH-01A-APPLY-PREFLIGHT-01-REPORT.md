# MARIB-TAX-DB-FOUNDATION-BATCH-01A — Apply Preflight 01 Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-01A-APPLY-PREFLIGHT-01 |
| UTC timestamp | 2026-07-15T18:30:41Z |
| Branch | `ops/db-foundation-batch-01a-apply-preflight-01` |
| HEAD | `fdc84df9a7c3127aa6f1059f57064445b138415c` |
| PR #8 merge commit | `fdc84df9a7c3127aa6f1059f57064445b138415c` (`feat(db): add application schema foundation batch 01a (#8)`) |
| Mode | Read-only database apply preflight |
| Final decision | **NO-GO — STOPPED WITH REASON** |

> This report does **not** authorize migration apply, DDL/DML, Supabase connection with writes, or commit.
> No database write and no migration apply occurred during this preflight.

## Approved migration artifact

| Item | Value |
| --- | --- |
| Filename | `database/migrations/20260715175300_create_marib_tax_application_schemas.sql` |
| Present on `main` / HEAD | Yes (PR #8) |
| SHA-256 | `A197D608D6F33D61488FA6DA3C32BE4E7B5F68458C2E1C6D2482F62F76DB8171` |
| Hash verdict | **MATCH** |
| Post-apply verify script | `scripts/db/verify/verify_batch_01a_application_schemas.sql` |
| Runbook | `docs/runbooks/MARIB-TAX-DB-FOUNDATION-BATCH-01A-RUNBOOK.md` |

## Local repository gate

| Check | Result |
| --- | --- |
| Branch | `ops/db-foundation-batch-01a-apply-preflight-01` — PASS |
| HEAD | `fdc84df9a7c3127aa6f1059f57064445b138415c` — PASS |
| Working tree before report | Clean (no tracked or untracked changes) — PASS |
| Migration on main | Present at expected path — PASS |
| Unrelated local changes | None — PASS |

## Expected vs confirmed target identity

| Item | Value |
| --- | --- |
| Expected project ref | `sjmtiwzddztxfrncwkpx` |
| Confirmed project ref | **NOT_CONFIRMED** |
| Target environment | **UNKNOWN** |
| Identity signal count | 0 usable non-secret signals |

Identity signals checked (presence only; no secret values printed):

| Signal | Result |
| --- | --- |
| `SUPABASE_PROJECT_REF` | ABSENT |
| Sanitized DB URL host / username component | Not derivable (DB URL vars ABSENT) |
| Linked Supabase CLI project | Not available (CLI ABSENT; no `supabase/` config) |
| Safe server metadata | Not available (no connection) |

Environment was **not** inferred from the expected project ref alone.

## Credential presence (values never printed)

| Name | Presence |
| --- | --- |
| `DATABASE_URL` | ABSENT |
| `DIRECT_URL` | ABSENT |
| `SUPABASE_DB_URL` | ABSENT |
| `SUPABASE_ACCESS_TOKEN` | ABSENT |
| `SUPABASE_PROJECT_REF` | ABSENT |
| `MARIB_TAX_TARGET_ENV` | ABSENT |
| `PGHOST` / `PGUSER` / `PGDATABASE` / `PGPASSWORD` | ABSENT |

Credential absence is treated as a **safe NO-GO**, not a prompt to invent workarounds.

## Tool availability

| Tool | Availability |
| --- | --- |
| `psql` | ABSENT |
| Supabase CLI | ABSENT |
| Repository `supabase/` tree / `config.toml` | ABSENT |
| Repository migration convention | `database/migrations/` (ADR-005 / CONTRIBUTING) — present |
| Approved automated migration runner under `scripts/` or `package.json` | **ABSENT** |

## Available execution paths (discovery only; none selected for apply)

| Path | Status |
| --- | --- |
| A. Approved repository migration runner | **Unavailable** — no runner script or package script found that applies `database/migrations` with history tracking |
| B. Supabase CLI | **Unavailable** — CLI not installed; no local Supabase config; default CLI migration path would **not** discover `database/migrations` (do not copy/duplicate the file) |
| C. Direct `psql` with `ON_ERROR_STOP=1` | **Unavailable** — `psql` not installed; even if present, history recording for this path is **not** approved in-repo |
| D. No approved method available | **Yes — current state** |

Migration-history tracking ambiguity for any ad-hoc apply is **NO-GO** until an execution method is explicitly selected and approved.

## Recommended future apply method

**None selectable now.** Preflight cannot recommend a ready method that satisfies both execution and history requirements.

When a later ops task reopens apply readiness, the method must:

1. Apply exactly the reviewed file under `database/migrations/` (preserve SHA-256 byte-for-byte; no copy into `supabase/migrations/`).
2. Record migration history through an **approved** tracking mechanism (repository runner or explicitly approved ledger procedure) — not manual inserts into Supabase history tables.
3. Apply **one** Batch 01A migration only.
4. Keep secrets in the operator vault / CI secrets; never print connection strings, passwords, tokens, or service-role keys.
5. Run `scripts/db/verify/verify_batch_01a_application_schemas.sql` read-only after apply and require final `PASS`.

**Do not** use default `supabase db push` / `supabase migration up` against this repository as-is: they would ignore `database/migrations`.

**Do not** use direct `psql` until migration-history handling is explicitly approved.

## Read-only connection result

| Item | Value |
| --- | --- |
| Attempted | **No** |
| Reason | Credentials ABSENT; project ref NOT_CONFIRMED; environment UNKNOWN; no read-only client available |
| Connection success/failure | **NOT_ATTEMPTED** |
| Current database name | NOT_OBSERVED |
| Current user name | NOT_OBSERVED |
| PostgreSQL version family | NOT_OBSERVED |
| Transaction read-only setting | NOT_OBSERVED |
| UTC server timestamp | NOT_OBSERVED |

## Fourteen-schema pre-apply inventory

Catalog inspection was **not performed** (no confirmed connection). Required pre-apply state remains unverified:

| Schema | Exists | Owner | Status |
| --- | --- | --- | --- |
| identity | NOT_OBSERVED | — | NOT_INSPECTED |
| registry | NOT_OBSERVED | — | NOT_INSPECTED |
| legal | NOT_OBSERVED | — | NOT_INSPECTED |
| masterdata | NOT_OBSERVED | — | NOT_INSPECTED |
| requests | NOT_OBSERVED | — | NOT_INSPECTED |
| balaghat | NOT_OBSERVED | — | NOT_INSPECTED |
| visits | NOT_OBSERVED | — | NOT_INSPECTED |
| dues | NOT_OBSERVED | — | NOT_INSPECTED |
| files | NOT_OBSERVED | — | NOT_INSPECTED |
| notify | NOT_OBSERVED | — | NOT_INSPECTED |
| imports | NOT_OBSERVED | — | NOT_INSPECTED |
| content | NOT_OBSERVED | — | NOT_INSPECTED |
| audit | NOT_OBSERVED | — | NOT_INSPECTED |
| reporting | NOT_OBSERVED | — | NOT_INSPECTED |

Required for GO: all fourteen `READY_ABSENT`. Any `BLOCK_ALREADY_EXISTS` would be NO-GO without drop/alter.

## Managed auth / storage

| Schema | Result |
| --- | --- |
| auth | **NOT_INSPECTED** |
| storage | **NOT_INSPECTED** |

Missing managed schema after a future successful connection would be NO-GO. Absence of inspection here is itself a stop condition for apply.

## Migration-history preflight

| Item | Result |
| --- | --- |
| Supabase migration-history schema/table | **NOT_INSPECTED** (no connection) |
| Version `20260715175300` recorded | **UNKNOWN** |
| Exact filename recorded | **UNKNOWN** |
| Repository-specific migration ledger | **None found** in-repo |
| Intended method auto-records history | **No approved method selected** |

Verdict: **NO-GO_EXECUTION_METHOD_NOT_APPROVED** (and history not inspectable). Schemas-absent alone would not be sufficient without clean, method-aligned history checks.

## Backup and recovery gate

| Item | Result |
| --- | --- |
| Backup posture | **NOT_CONFIRMED** |
| Point-in-time recovery posture | **NOT_CONFIRMED** |
| Operator evidence reference | None available in this process environment |

No backup was created in this task. Production with unconfirmed backup would be `NO-GO_BACKUP_POSTURE_NOT_CONFIRMED`. Environment is UNKNOWN, so backup cannot be accepted as confirmed for any environment class.

## Security review

- No passwords, full connection strings, tokens, service-role keys, or raw environment dumps included in this report.
- No secrets were printed during discovery.
- No DDL/DML, temp objects, migration-history writes, or `supabase db push` / `migration up` executed.
- Migration file was not copied or duplicated into another directory.

## Stop conditions encountered

1. **Credentials absent** for all checked database / Supabase environment variables (safe NO-GO).
2. **Target project ref NOT_CONFIRMED** — zero corroborating non-secret identity signals for `sjmtiwzddztxfrncwkpx`.
3. **Target environment UNKNOWN / AMBIGUOUS** — `MARIB_TAX_TARGET_ENV` ABSENT; environment not inferred from project ref.
4. **Read-only connection not attempted** — prerequisites unmet; client tools absent.
5. **Fourteen-schema inventory not inspected** — pre-apply READY_ABSENT state unverified.
6. **Managed auth/storage not inspected**.
7. **No approved execution method** — paths A/B/C unavailable; history tracking ambiguous for ad-hoc apply (`NO-GO_EXECUTION_METHOD_NOT_APPROVED`).
8. **Backup/recovery posture NOT_CONFIRMED**.

## Non-actions confirmation

Did **not**: execute the migration; create or alter schemas; write migration history; run `supabase db push` / `migration up`; run DDL or DML; create temporary tables; connect to any database; install `psql`, Supabase CLI, Docker, or dependencies; display passwords, tokens, connection strings, or service-role keys; run `git add` / `commit` / `push` / `merge` / `reset` / `restore` / `clean` / `checkout` / `rebase`; modify `main`.

## Final decision

**NO-GO — STOPPED WITH REASON**

DB Foundation Batch 01A is **not** ready for a controlled application attempt in this process environment. Re-run apply preflight only after:

1. explicit target environment is set and recorded;
2. expected project ref `sjmtiwzddztxfrncwkpx` is confirmed by at least two non-secret signals;
3. credentials are present in the operator environment without being committed;
4. an approved apply method that both executes `database/migrations` and records history is selected;
5. read-only inventory shows all fourteen schemas absent and `auth`/`storage` present;
6. migration history is clean for version `20260715175300`;
7. backup/recovery posture is confirmed for the named environment.

## Subsequent owner decisions

| Field | Value |
| --- | --- |
| Dated | 2026-07-15T18:44:02Z |
| Related task | MARIB-TAX-SUPABASE-CLI-ENABLEMENT-01 |

Owner-approved decisions recorded after this NO-GO:

1. **Supabase CLI** is approved as the official database migration mechanism.
2. Canonical migration path is approved as **`supabase/migrations/`**.
3. Project ref is confirmed by owner as **`sjmtiwzddztxfrncwkpx`**.
4. Target environment is confirmed by owner as **`production`**.

These decisions resolve the **governance / execution-method ambiguity only**.

Still unperformed after enablement (and not authorized by this appendix):

- credentials present in an operator session;
- remote project link;
- remote migration-history inspection;
- fourteen-schema inventory;
- managed auth/storage live confirmation;
- backup / PITR evidence collection;
- production apply.

The original **NO-GO — STOPPED WITH REASON** decision above was valid at the time of this apply-preflight and is **not** retroactively changed.

A **new** apply preflight is required after Supabase CLI enablement is merged before any controlled production apply.
