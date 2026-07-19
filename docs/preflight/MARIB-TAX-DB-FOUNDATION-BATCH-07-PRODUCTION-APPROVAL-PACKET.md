# MARIB-TAX-DB-FOUNDATION-BATCH-07 — Production Approval Packet

**Status:** `REQUIRES_USER_APPROVAL` — preflight complete; production apply closed until explicit owner authorization.

## Reviewed artifact

| Field | Value |
| --- | --- |
| Project ref | `sjmtiwzddztxfrncwkpx` |
| Migration | `supabase/migrations/20260722120000_create_balaghat_family.sql` |
| SHA-256 | `10BA80E828CDB39AB60B1816F8EC6D263169CC6DFA6EC7821D979AE2EDA63118` |
| Runner | Supabase CLI `2.109.1` |
| Expected change | Sixteen empty `balaghat` tables; RLS enabled; selection UNIQUE constraints; no policies/grants/seeds; no `cases`; no TABLE-021; filer/type/reopen constraints |
| Design acceptance | PASS — `docs/reviews/MARIB-TAX-BATCH-07-DESIGN-DECISION-GATE-01.md` |
| Lifecycle ADR | ADR-016 |
| Selection ADR | ADR-017 |
| Preflight evidence | `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md` |

## Approval requested

Approval must explicitly authorize one controlled production application of Batch 07 against project `sjmtiwzddztxfrncwkpx`. Approval of documentation, design acceptance, orchestration, Batches 01A–06, or source contracts does not authorize this operation.

## Mandatory preflight (completed for this packet)

1. Clean checkout based on reviewed `origin/main`.
2. Recompute migration SHA-256; require the exact value above.
3. Confirm linked project ref is exactly `sjmtiwzddztxfrncwkpx`.
4. Confirm remote history contains Batches 01A–06 exactly once each and does not contain Batch 07.
5. Confirm the sixteen Batch 07 tables do not exist.
6. Confirm no relation named `cases`.
7. Confirm `masterdata.property_ownership_units` (TABLE-021) does not exist.
8. Confirm managed backup/recovery posture.
9. Run only:

```text
npx --yes supabase@2.109.1 db push --linked --dry-run
```

10. Stop unless the dry-run lists exactly `20260722120000_create_balaghat_family.sql`.

## Exact apply command — closed until approval

```text
npx --yes supabase@2.109.1 db push --linked
```

Do not add `--include-all`. Do not retry blindly. Do not use `migration repair`, `db reset --linked`, dashboard SQL, or direct `psql`.

## Required post-verification

1. Remote history contains Batch 07 exactly once.
2. Execute `scripts/db/verify/verify_batch_07_balaghat_family.sql`.
3. Require `final_status = PASS`, empty tables, no unexpected policies/grants/seed, no `cases`, no TABLE-021, filer/type/reopen/selection UNIQUE constraints present.
4. Dry-run reports no pending migrations.
5. Record post-apply report before Batch 08 begins.

## Stop conditions

SHA mismatch, wrong project, unexpected history, more than one pending migration, pre-existing Batch 07 objects, apply/partial failure, verifier mismatch, or production uncertainty.
