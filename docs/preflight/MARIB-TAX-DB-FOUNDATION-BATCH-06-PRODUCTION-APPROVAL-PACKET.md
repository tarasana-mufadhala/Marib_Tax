# MARIB-TAX-DB-FOUNDATION-BATCH-06 — Production Approval Packet

**Status:** `APPLIED / VERIFIED PASS` on 2026-07-20 — see `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-06-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`. This packet is retained as authorizing evidence; it does not authorize Batch 07 or any other migration.

## Reviewed artifact

| Field | Value |
| --- | --- |
| Project ref | `sjmtiwzddztxfrncwkpx` |
| Migration | `supabase/migrations/20260721120000_create_service_requests_family.sql` |
| SHA-256 | `F0446C8964C4345D79669C6926B983776213CB06BFD6E4C2DB27BDC3EFB0AE7D` |
| Runner | Supabase CLI `2.109.1` |
| Expected change | Fourteen empty `requests` tables (TABLE-023…036); RLS enabled; no policies/grants/seeds; no `cases`; reopen reason/staff NOT NULL |
| Design acceptance | PASS — `docs/reviews/MARIB-TAX-BATCH-06-DESIGN-DECISION-GATE-01.md` |
| Lifecycle ADR | ADR-016 |
| Source correction | PR #54 |

## Approval requested

Approval must explicitly authorize one controlled production application of Batch 06 against project `sjmtiwzddztxfrncwkpx`. Approval of documentation, design acceptance, orchestration, Batch 05, or source contracts does not authorize this operation.

## Mandatory preflight

1. Clean checkout of reviewed `origin/main`.
2. Recompute migration SHA-256; require the exact value above.
3. Confirm linked project ref is exactly `sjmtiwzddztxfrncwkpx`.
4. Confirm remote history contains Batches 01A–05 exactly once each and does not contain Batch 06.
5. Confirm the fourteen Batch 06 tables do not exist.
6. Confirm no relation named `cases`.
7. Confirm managed backup/recovery posture.
8. Run only:

```text
npx --yes supabase@2.109.1 db push --linked --dry-run
```

9. Stop unless the dry-run lists exactly `20260721120000_create_service_requests_family.sql`.

## Exact apply command — closed until approval

```text
npx --yes supabase@2.109.1 db push --linked
```

Do not add `--include-all`. Do not retry blindly. Do not use `migration repair`, `db reset --linked`, dashboard SQL, or direct `psql`.

## Required post-verification

1. Remote history contains Batch 06 exactly once.
2. Execute `scripts/db/verify/verify_batch_06_service_requests_family.sql`.
3. Require `final_status = PASS`, empty tables, no unexpected policies/grants/seed, no `cases`, reopen constraints present.
4. Dry-run reports no pending migrations.
5. Record post-apply report before Batch 07 begins.

## Stop conditions

SHA mismatch, wrong project, unexpected history, more than one pending migration, pre-existing Batch 06 objects, apply/partial failure, verifier mismatch, or production uncertainty.
