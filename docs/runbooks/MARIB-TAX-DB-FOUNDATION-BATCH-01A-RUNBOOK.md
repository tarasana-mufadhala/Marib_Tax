# MARIB-TAX-DB-FOUNDATION-BATCH-01A — Apply Runbook

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-01A |
| Purpose | Create the fourteen application-owned PostgreSQL schemas only |
| Migration file | `database/migrations/20260715175300_create_marib_tax_application_schemas.sql` |
| Verification script | `scripts/db/verify/verify_batch_01a_application_schemas.sql` |
| Status | Documentation runbook — **do not apply during authoring/review of this task** |

> This runbook describes **future** execution. It does not authorize apply as part of Batch 01A authoring or SQL review alone.

## 1. Purpose

Create empty application-owned schemas for Marib Tax physical design Batch 01A / physical migration sequence Batch 1 (schemas portion only). Extensions remain deferred (**يحتاج اعتماد لاحق**).

## 2. Exact schemas created

1. `identity`
2. `registry`
3. `legal`
4. `masterdata`
5. `requests`
6. `balaghat`
7. `visits`
8. `dues`
9. `files`
10. `notify`
11. `imports`
12. `content`
13. `audit`
14. `reporting`

## 3. Explicit exclusions

Do **not** create, alter, or drop:

- `auth`, `storage`, `public`, `extensions`, `graphql_public`, `realtime`, `vault`, `pgsodium`, `supabase_functions`, or any other platform-managed schema
- extensions (`CREATE EXTENSION` deferred)
- tables, views, functions, triggers, types, sequences, policies, buckets
- grants to `anon`, `authenticated`, `service_role`, or application roles
- database-wide or role-level `search_path` changes
- `ALTER DATABASE` / `ALTER ROLE`

## 4. Credentials (safe storage only)

| Requirement | Rule |
| --- | --- |
| Migration / DB role | Server-side only; never in client apps or committed files |
| Storage location | Approved secret store / CI secret / operator vault for the target environment |
| Logging | Do **not** print connection strings, passwords, service-role keys, or project URLs containing secrets |
| Repo | No credentials, tokens, or `.env` secrets in this branch |

Exact credential names and retrieval steps remain environment-specific and are **not** recorded here.

## 5. Pre-apply checks (mandatory)

1. Confirm the correct Supabase / PostgreSQL **project identity** for the intended environment.
2. Confirm the **environment** (e.g. local/dev/staging — never ambiguous production apply without Change Control).
3. Confirm **backup / recovery posture** for the target database is acceptable.
4. Confirm **none** of the fourteen expected application schemas already exist.
5. Confirm managed schemas **`auth`** and **`storage`** exist (platform-managed; do not recreate).
6. Confirm migration history does **not** already contain `20260715175300_create_marib_tax_application_schemas.sql`.
7. Confirm the working tree has **no unrelated dirty local changes** that would apply the wrong SQL.
8. Confirm credentials will not be printed, logged in cleartext, or committed.
9. Confirm the SQL file matches the **reviewed commit** byte-for-byte.

## 6. Apply command placeholder

Use the approved Supabase / repository migration workflow for the target environment. Placeholder only (do not run during this authoring task):

```text
# PLACEHOLDER — replace with the approved environment workflow after review
# Example patterns (choose the one approved for Marib Tax ops; do not invent secrets):
#   supabase db push
#   supabase migration up
#   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/20260715175300_create_marib_tax_application_schemas.sql
```

Apply **one batch only**. Do **not** start Batch 2 in the same session.

## 7. Post-apply verification

Run the read-only script (after apply, in a future ops session):

```text
# PLACEHOLDER
# psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/db/verify/verify_batch_01a_application_schemas.sql
```

The script returns **five** result sets in this exact order. Operators must inspect **all** preceding sets; do not read only the final status word.

### Result set 1 — Per-schema inventory

| Field | Content |
| --- | --- |
| **Purpose** | List each of the fourteen expected application schemas with existence, owner, and PUBLIC privilege posture |
| **Key columns** | `ordinal`, `expected_schema`, `exists`, `schema_owner`, `public_has_usage`, `public_has_create`, `privilege_posture` |
| **Successful output** | Fourteen rows; every `exists` = true; `privilege_posture` = `OK_OWNER_ONLY_POSTURE` |
| **Failure / warning** | Any `exists` = false → missing application schema; `WARN_PUBLIC_PRIVILEGE` or true USAGE/CREATE → unexpected PUBLIC privileges |

### Result set 2 — Missing application schemas

| Field | Content |
| --- | --- |
| **Purpose** | Enumerate expected application schemas that are absent |
| **Key columns** | `missing_expected_schema` |
| **Successful output** | Zero rows (empty result) |
| **Failure / warning** | One or more rows → application schema missing (hard failure) |

### Result set 3 — PUBLIC privilege summary

| Field | Content |
| --- | --- |
| **Purpose** | Aggregate PUBLIC USAGE/CREATE counts across present expected schemas |
| **Key columns** | `expected_schemas_with_public_usage`, `expected_schemas_with_public_create`, `present_expected_schemas` |
| **Successful output** | usage = 0, create = 0, present = 14 |
| **Failure / warning** | present < 14 → incomplete set; usage/create > 0 → unexpected PUBLIC privileges (warning) |

### Result set 4 — Managed schemas

| Field | Content |
| --- | --- |
| **Purpose** | Confirm platform-managed `auth` and `storage` exist |
| **Key columns** | `managed_schema`, `exists`, `status` |
| **Successful output** | Two rows (`auth`, `storage`); both `exists` = true; both `status` = `OK` |
| **Failure / warning** | Any `UNEXPECTED_ABSENCE` → managed schema missing (hard failure) |

### Result set 5 — Authoritative overall decision

| Field | Content |
| --- | --- |
| **Purpose** | Single overall decision for the batch |
| **Key columns** | `application_schemas_found`, `application_schemas_missing`, `auth_present`, `storage_present`, `unexpected_public_usage_count`, `unexpected_public_create_count`, `final_status`, `final_reason` |
| **Successful output** | `final_status` = `PASS` |
| **Failure / warning** | See statuses below |

**Authoritative overall decision is in this fifth/final result set.**

Status meanings:

- **PASS** — all 14/14 application schemas exist; `auth` exists; `storage` exists; PUBLIC has neither USAGE nor CREATE on the expected application schemas.
- **FAIL** (`FAIL_MISSING_APPLICATION_SCHEMA` or `FAIL_MISSING_MANAGED_SCHEMA`) — an application schema is missing, and/or `auth`/`storage` is missing.
- **WARN** (`WARN_PUBLIC_PRIVILEGES`) — all expected and managed schemas exist, but PUBLIC privilege posture differs from the reviewed owner-only intent.

**WARN is a stop condition pending review.** Do not treat WARN as success.

**No Batch 2 work begins** until the final result is **PASS** and evidence is accepted.

## 8. Evidence to capture

- Operator identity and timestamp (UTC)
- Confirmed project / environment identity (non-secret identifiers only)
- Migration filename and git commit SHA applied
- Apply command exit code and truncated safe logs (redact secrets)
- Full verification script result set (or saved output file without secrets)
- Confirmation that managed schemas were not modified

## 9. Stop conditions

Stop immediately and escalate when:

- any expected application schema already exists unexpectedly;
- target project identity cannot be confirmed;
- migration history is inconsistent or the migration is already recorded;
- any managed schema would be modified;
- SQL differs from the reviewed commit;
- apply reports failure or uncertain / partial completion;
- verification does not return fourteen of fourteen schemas;
- verification `final_status` is FAIL or WARN (WARN is a stop pending review);
- PUBLIC receives unexpected USAGE or CREATE on application schemas after apply;
- credentials might be exposed in logs or tickets.

## 10. Rollback and partial-apply response

| Situation | Response |
| --- | --- |
| Apply failed before `COMMIT` | Transaction should roll back; re-verify no schemas were created; do not retry blindly |
| Uncertain / partial completion | Preserve logs; do not drop schemas as automatic repair; escalate |
| Need reverse after successful empty apply | Prefer an explicit **corrective migration** reviewed under Change Control; drop empty schemas only if unused and approved; **never** drop `auth` / `storage` |
| Blind retry | **Forbidden** |

## 11. Security confirmation

- No client grants in this batch
- No RLS policies in this batch
- No Storage / Auth DDL
- No secrets in migration, verification script, or this runbook
- Owner is the applying migration role (not a hardcoded username)

## 12. Next-batch gate

Batch 01A is complete only when:

1. SQL review has passed;
2. apply (future) succeeded with verification `PASS`;
3. evidence is retained.

Do **not** start Batch 2 (identity tables) until Batch 01A is accepted for the target environment.

**One batch only.**
