# MARIB-TAX-SUPABASE-CLI-MIGRATION-STANDARD-01

| Field | Value |
| --- | --- |
| Document ID | MARIB-TAX-SUPABASE-CLI-MIGRATION-STANDARD-01 |
| Status | Accepted for repository enablement |
| Reviewed CLI version | `2.109.1` |
| Canonical migration directory | `supabase/migrations/` |
| Production project ref (non-secret) | `sjmtiwzddztxfrncwkpx` |
| Approved target environment | `production` |

> **This document does not authorize linking or applying to production.**
> Production linking and production apply are separate controlled stages.

## 1. Official mechanism

- **Supabase CLI** is the official database migration and migration-history mechanism for Marib Tax.
- Canonical migration files live under **`supabase/migrations/`** only.
- Direct `psql` application is **no longer** the default migration path.
- No migration may be copied into multiple active migration directories.

## 2. Filename and version rules

- Every migration filename uses: `YYYYMMDDHHMMSS_description.sql`
- Migration versions (the timestamp prefix) must be unique.
- Do not edit an already-applied migration; add a forward corrective migration instead.
- Capture the migration SHA-256 before any controlled apply and retain it in apply evidence.

## 3. Project identity and secrets

| Item | Rule |
| --- | --- |
| Project ref `sjmtiwzddztxfrncwkpx` | Non-secret identifier; may appear in docs and runbooks |
| Target environment for that ref | `production` |
| Passwords, access tokens, service-role keys, database URLs | Secret; never commit; never print in tickets or logs |
| Credential supply | Approved secret store / CI secret / operator vault only |

The `project_id` value inside `supabase/config.toml` is a **local CLI identifier only**. It is not proof of the hosted production project identity.

## 4. Repository artifacts

| Artifact | Commit? |
| --- | --- |
| `supabase/config.toml` | Yes |
| `supabase/migrations/*.sql` | Yes (reviewed SQL only) |
| `supabase/.temp/` | No |
| `supabase/.branches/` | No |
| `supabase/.env` / `supabase/.env.*` | No |
| Access-token / password / cache files | No |

## 5. Reviewed CLI version

Enablement used:

```text
npx --yes supabase@2.109.1 ...
```

Future local bootstrap and operator commands must use this **exact reviewed version** until a separate Change Control task upgrades the CLI version.

Do not rely on an unrecorded floating `latest` after the version has been resolved.

## 6. Pre-apply comparison and dry-run

Before any production apply:

1. Local config must exist (`supabase/config.toml`).
2. Remote linking (separate controlled stage) must confirm project ref `sjmtiwzddztxfrncwkpx`.
3. Local migrations must be compared with remote migration history.
4. `db push --dry-run` (linked) is **mandatory** before a production apply.
5. Confirm exactly the reviewed migration(s) for the authorized batch would apply.
6. One migration batch per controlled apply stage.
7. Do not use `--include-all` unless separately reviewed and justified.

## 7. Repair, reset, and retry

| Action | Rule |
| --- | --- |
| Blind retry | Forbidden |
| Automatic `migration repair` | Forbidden |
| `migration repair` | Requires separate explicit authorization |
| `db reset --linked` | Prohibited |
| Corrective schema change | Prefer a new reviewed migration under Change Control |

## 8. Batch sequencing

- Do not proceed to Batch 2 until Batch 01A is applied and post-apply verification returns accepted `PASS`.
- Stop on FAIL, WARN, history mismatch, uncertainty, or partial completion.

## 9. Remaining controlled stages (out of scope here)

The following remain unperformed and unauthorized by this document alone:

- `supabase login`
- `supabase link` to production
- remote `migration list`
- remote `db push --dry-run`
- production apply
- schema inventory against the live database
- backup / PITR evidence acceptance
