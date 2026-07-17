# MARIB-TAX-DB-FOUNDATION-BATCH-03 — Production Approval Packet

**Status:** `REQUIRES_USER_APPROVAL` — prepared only; no production command has been executed.

## Reviewed artifact

| Field | Value |
| --- | --- |
| Project ref | `sjmtiwzddztxfrncwkpx` |
| Migration | `supabase/migrations/20260717120000_create_identity_authorization_model.sql` |
| SHA-256 | `BF15774686744A86D641D7B0B212F7B25E53D2AE6A8E4445662CA84475A00A86` |
| Runner | Supabase CLI `2.109.1` |
| Expected change | Four empty `identity` authorization tables; RLS enabled; no policies, grants, or seed rows |
| Source review | PR #16 merged |
| Production preflight | PR #17 merged; dry-run identified exactly Batch 03 |

## Approval requested

Approval must explicitly authorize one controlled production application of Batch 03 against project `sjmtiwzddztxfrncwkpx`. Approval of documentation, orchestration, or later batches does not authorize this operation.

## Mandatory preflight

Immediately before an authorized apply, the operator must:

1. Use a clean checkout of the reviewed `origin/main` state.
2. Recompute the migration SHA-256 and require the exact value above.
3. Confirm the linked project ref is exactly `sjmtiwzddztxfrncwkpx` without printing credentials.
4. Confirm remote history contains Batches 01A and 02 exactly once and does not contain Batch 03.
5. Confirm `identity.user_profiles` and `identity.staff_profiles` exist and the four Batch 03 tables do not.
6. Confirm the current managed backup/recovery posture.
7. Run only this dry-run command:

```text
npx --yes supabase@2.109.1 db push --linked --dry-run
```

8. Stop unless the dry-run lists exactly `20260717120000_create_identity_authorization_model.sql` and nothing else.

## Exact apply command — closed until approval

After all preflight checks pass and explicit approval is recorded, the single apply command is:

```text
npx --yes supabase@2.109.1 db push --linked
```

Do not add `--include-all`. Do not retry blindly. Do not use `migration repair`, `db reset --linked`, dashboard SQL, or direct `psql` as a substitute.

## Required post-verification

Immediately after the command succeeds:

1. Inspect remote migration history and require Batch 03 exactly once.
2. Execute the read-only verifier `scripts/db/verify/verify_batch_03_authorization_model.sql` in the controlled operator session.
3. Require all mismatch/forbidden-object counts to be zero, all four tables to be empty, all mismatch arrays to be `[]`, and `final_status = PASS`.
4. Run the dry-run again and require no pending migrations.
5. Record evidence in a dedicated post-apply report and PR before Batch 04 begins.

## Stop conditions

Stop without retry on SHA mismatch, unexpected migration history, wrong project ref, missing Batch 02 dependencies, pre-existing Batch 03 objects, more than one pending migration, apply error/partial state, any verifier mismatch, any seed row, any unexpected policy/grant, or uncertainty about production state. Preserve evidence and request a separately reviewed forward corrective plan.

## Production effect if approved

The migration creates four empty authorization-model tables in `identity`, their reviewed constraints/indexes, and enables RLS without policies or direct client/service-role grants. It does not create users, assign roles, seed permissions, modify taxpayer data, send notifications, or deploy applications.
