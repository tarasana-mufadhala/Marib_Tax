# MARIB-TAX-SUPABASE-CLI-ENABLEMENT-01 — Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-SUPABASE-CLI-ENABLEMENT-01 |
| UTC timestamp | 2026-07-15T18:44:02Z |
| Branch | `feat/supabase-cli-enablement-01` |
| HEAD (starting) | `fdc84df9a7c3127aa6f1059f57064445b138415c` |
| PR #8 merge commit | `fdc84df9a7c3127aa6f1059f57064445b138415c` |
| Mode | Local tooling enablement and repository remediation only |
| Final decision | **PASS — READY FOR SUPABASE CLI ENABLEMENT REVIEW** |

> This report does **not** authorize production link, dry-run against remote, or production apply.

## Owner-approved decisions

1. Supabase CLI is the official database migration mechanism.
2. Canonical migration path is `supabase/migrations/`.
3. Approved hosted Supabase project ref: `sjmtiwzddztxfrncwkpx` (non-secret).
4. Approved target environment: `production`.

## Starting state

| Check | Result |
| --- | --- |
| Branch | `feat/supabase-cli-enablement-01` |
| HEAD | `fdc84df9a7c3127aa6f1059f57064445b138415c` |
| Historical NO-GO report preserved | `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-01A-APPLY-PREFLIGHT-01-REPORT.md` |
| Unrelated changes at start | None |

Authoritative sources requested as `docs/architecture/MARIB-TAX-ADRS-BASELINE-01.md`, `docs/architecture/MARIB-TAX-ARCHITECTURE-BASELINE-01.md`, and `AGENTS.md` were **not present**. Applicable ADR used: `docs/architecture/adr/ADR-005-POSTGRES-SUPABASE.md`.

## Tooling discovery

| Tool | Result |
| --- | --- |
| `node` | v24.12.0 |
| `npm` | 11.6.2 |
| `npx` | 11.6.2 |
| Global `supabase` CLI | ABSENT |
| Root `package.json` | Present (not modified for Supabase) |
| Lockfiles | None present |
| Pre-existing `supabase/` | Absent before init |

Resolved exact Supabase CLI package version:

```text
npm view supabase version → 2.109.1
```

Bootstrap command used (local init only):

```text
npx --yes supabase@2.109.1 init
```

## Generated files

| Path | Disposition |
| --- | --- |
| `supabase/config.toml` | Keep / commit (local CLI config) |
| `supabase/.gitignore` | Keep / commit (runtime ignore rules) |
| `supabase/migrations/` | Created; holds moved Batch 01A migration |

No Docker services started. No login, link, start, push, pull, reset, migration up/list/repair, or platform API apply calls.

## Migration rename

| Item | Value |
| --- | --- |
| Old path | `database/migrations/20260715175300_create_marib_tax_application_schemas.sql` |
| New path | `supabase/migrations/20260715175300_create_marib_tax_application_schemas.sql` |
| SHA-256 before | `A197D608D6F33D61488FA6DA3C32BE4E7B5F68458C2E1C6D2482F62F76DB8171` |
| SHA-256 after | `A197D608D6F33D61488FA6DA3C32BE4E7B5F68458C2E1C6D2482F62F76DB8171` |
| Active copies under `supabase/migrations/` | 1 |
| Active copies under `database/migrations/` | 0 |
| SQL content changed | No |

## Config.toml review

| Check | Result |
| --- | --- |
| Local `project_id` | `Marib_Tax` (local CLI identifier only; **not** hosted project proof) |
| Remote project link embedded | No |
| Production credentials | None |
| Access token | None |
| Database password | None |
| Service-role key | None |
| Remote database URL | None |
| `.temp/project-ref` committed | No (directory ignored; not present as committed content) |

## Ignore-rule review

| Pattern | Covered |
| --- | --- |
| `supabase/.temp/` | Yes (root + `supabase/.gitignore`) |
| `supabase/.branches/` | Yes |
| `supabase/.env` / `supabase/.env.*` | Yes |
| `supabase/config.toml` | Not ignored (trackable) |
| `supabase/migrations/` | Not ignored (trackable) |
| Real `.env` file created | No |

## Documentation and governance updates

| Artifact | Change |
| --- | --- |
| `docs/governance/MARIB-TAX-SUPABASE-CLI-MIGRATION-STANDARD-01.md` | Created |
| `docs/architecture/adr/ADR-005-POSTGRES-SUPABASE.md` | Amended active migration decision |
| `docs/data/MARIB-TAX-PHYSICAL-MIGRATION-SEQUENCE-01.md` | Global CLI convention added |
| `docs/runbooks/MARIB-TAX-DB-FOUNDATION-BATCH-01A-RUNBOOK.md` | Path + controlled production sequence |
| `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-01A-REPORT.md` | Path supersession note |
| `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-01A-APPLY-PREFLIGHT-01-REPORT.md` | Historical NO-GO preserved; subsequent owner decisions appended |
| `CONTRIBUTING.md`, PR template, cursor DB rule, architecture/path READMEs, toolchain inventory | Active references remapped |

## Repository reference scan

Active operational references to
`database/migrations/20260715175300_create_marib_tax_application_schemas.sql`: **0**

Remaining mentions of `database/migrations/` are labeled historical / superseded / placeholder directory only.

## Security review

- No passwords, tokens, service-role keys, or database URLs stored or printed.
- No `.env` created.
- No remote connection attempted.
- Project ref documented as non-secret only.
- Local `config.toml` `project_id` not presented as production identity proof.

## Remaining apply prerequisites (still open)

- no login performed;
- no project link performed;
- no remote migration list performed;
- no remote dry-run performed;
- no schema inventory performed;
- no backup/PITR evidence collected;
- no production apply performed.

A new apply preflight is required after this enablement is reviewed/merged.

## Non-actions confirmation

Did **not**: `supabase login`; `supabase link`; `supabase start`; `supabase db push` / `pull` / `reset`; `migration up` / remote `migration list` / `migration repair`; connect to PostgreSQL; execute SQL; create/alter remote schemas; display or store secrets; create `.env`; modify Git history; commit/push/merge/rebase/reset/restore/clean/checkout; modify `main`; initialize Flutter/Next.js/NestJS applications.

## Final decision

**PASS — READY FOR SUPABASE CLI ENABLEMENT REVIEW**
