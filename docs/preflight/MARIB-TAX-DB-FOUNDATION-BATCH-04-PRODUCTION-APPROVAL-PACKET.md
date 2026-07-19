# MARIB-TAX-DB-FOUNDATION-BATCH-04 — Production Approval Packet

**Status:** `APPLIED / VERIFIED PASS` on 2026-07-19 — see `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-04-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`. This packet is retained as authorizing evidence; it does not authorize Batch 05 or any other migration.

## Reviewed artifact

| Field | Value |
| --- | --- |
| Project ref | `sjmtiwzddztxfrncwkpx` |
| Migration | `supabase/migrations/20260719120000_create_taxpayer_registry_and_legal_entities.sql` |
| SHA-256 | `19D92BF7FB23251BF17FE61A80194075ED9FEEB970EFD89EBC88CEF75174F3A4` |
| Runner | Supabase CLI `2.109.1` |
| Expected change | Six empty `registry` / `legal` tables; RLS enabled; no policies, grants, or seed rows; ADR-015 tax-number and account-link constraints |
| Source review | PR #42 merged |
| Production preflight | This packet + companion preflight report |

## Approval recorded

On 2026-07-19 the project owner explicitly authorized one controlled production application of Batch 04 against project `sjmtiwzddztxfrncwkpx` using Supabase CLI `2.109.1`, migration `20260719120000_create_taxpayer_registry_and_legal_entities.sql`, and SHA-256 `19D92BF7FB23251BF17FE61A80194075ED9FEEB970EFD89EBC88CEF75174F3A4`. Approval of documentation, orchestration, or later batches still does not authorize any other production migration.

## Mandatory preflight

Immediately before an authorized apply, the operator must:

1. Use a clean checkout of the reviewed `origin/main` state.
2. Recompute the migration SHA-256 and require the exact value above.
3. Confirm the linked project ref is exactly `sjmtiwzddztxfrncwkpx` without printing credentials.
4. Confirm remote history contains Batches 01A, 02, and 03 exactly once each and does not contain Batch 04.
5. Confirm the six Batch 04 tables do not exist.
6. Confirm the current managed backup/recovery posture.
7. Run only this dry-run command:

```text
npx --yes supabase@2.109.1 db push --linked --dry-run
```

8. Stop unless the dry-run lists exactly `20260719120000_create_taxpayer_registry_and_legal_entities.sql` and nothing else.

## Exact apply command — closed until approval

After all preflight checks pass and explicit approval is recorded, the single apply command is:

```text
npx --yes supabase@2.109.1 db push --linked
```

Do not add `--include-all`. Do not retry blindly. Do not use `migration repair`, `db reset --linked`, dashboard SQL, or direct `psql` as a substitute.

## Required post-verification

Immediately after the command succeeds:

1. Inspect remote migration history and require Batch 04 exactly once.
2. Execute the read-only verifier `scripts/db/verify/verify_batch_04_taxpayer_registry_and_legal_entities.sql`.
3. Require `final_status = PASS`, all six tables empty, no unexpected policies/grants/seed rows.
4. Run the dry-run again and require no pending migrations.
5. Record evidence in a dedicated post-apply report and PR before Batch 05 begins.

## Stop conditions

Stop without retry on SHA mismatch, unexpected migration history, wrong project ref, missing Batch 03 dependencies, pre-existing Batch 04 objects, more than one pending migration, apply error/partial state, any verifier mismatch, any seed row, any unexpected policy/grant, or uncertainty about production state.

## Production effect if approved

The migration creates six empty registry/legal tables with reviewed constraints/indexes (including digits-only tax numbers, issued-value uniqueness, one active account link per profile, and correction lineage columns), enables RLS without policies or direct client/service-role grants, and does not seed taxpayers, tax numbers, or account links.
