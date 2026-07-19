# MARIB-TAX-DB-FOUNDATION-BATCH-05 — Production Approval Packet

**Status:** `REQUIRES_USER_APPROVAL` — preflight prepared only; no production command has been executed.

## Reviewed artifact

| Field | Value |
| --- | --- |
| Project ref | `sjmtiwzddztxfrncwkpx` |
| Migration | `supabase/migrations/20260720120000_create_masterdata_activities_and_property.sql` |
| SHA-256 | `D3F15F918B721DD00865CFF8702BBF4313BB21FB741228D5ECCF5F82E7FB148C` |
| Runner | Supabase CLI `2.109.1` |
| Expected change | Eight empty `masterdata` tables (TABLE-014…020, 022); RLS enabled; no policies/grants/seeds; TABLE-021 and ownership view excluded |
| Source review | PR #46 merged |

## Approval requested

Approval must explicitly authorize one controlled production application of Batch 05 against project `sjmtiwzddztxfrncwkpx`. Approval of documentation, orchestration, Batch 04, or source contracts does not authorize this operation.

## Mandatory preflight

1. Clean checkout of reviewed `origin/main`.
2. Recompute migration SHA-256; require the exact value above.
3. Confirm linked project ref is exactly `sjmtiwzddztxfrncwkpx`.
4. Confirm remote history contains Batches 01A–04 exactly once each and does not contain Batch 05.
5. Confirm the eight Batch 05 tables do not exist.
6. Confirm managed backup/recovery posture.
7. Run only:

```text
npx --yes supabase@2.109.1 db push --linked --dry-run
```

8. Stop unless the dry-run lists exactly `20260720120000_create_masterdata_activities_and_property.sql`.

## Exact apply command — closed until approval

```text
npx --yes supabase@2.109.1 db push --linked
```

Do not add `--include-all`. Do not retry blindly. Do not use `migration repair`, `db reset --linked`, dashboard SQL, or direct `psql`.

## Required post-verification

1. Remote history contains Batch 05 exactly once.
2. Execute `scripts/db/verify/verify_batch_05_masterdata_activities_and_property.sql`.
3. Require `final_status = PASS`, empty tables, no unexpected policies/grants/seed, TABLE-021 still absent.
4. Dry-run reports no pending migrations.
5. Record post-apply report before Batch 06 begins.

## Stop conditions

SHA mismatch, wrong project, unexpected history, more than one pending migration, pre-existing Batch 05 objects, apply/partial failure, verifier mismatch, or production uncertainty.
