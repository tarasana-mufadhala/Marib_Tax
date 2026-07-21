# MARIB-TAX-DB-FOUNDATION-BATCH-09 — Production Approval Packet

**Status:** `APPLIED / VERIFIED PASS` on 2026-07-21 — see `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`. This packet is retained as authorizing evidence; it does not authorize Batch 10, Storage operations, or any other migration.

## Reviewed artifact

| Field | Value |
| --- | --- |
| Project ref | `sjmtiwzddztxfrncwkpx` |
| Migration | `supabase/migrations/20260724120000_create_field_visits_family.sql` |
| SHA-256 | `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D` |
| Verifier | `scripts/db/verify/verify_batch_09_field_visits_family.sql` |
| Verifier SHA-256 | `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77` |
| Runner | Supabase CLI `2.109.1` |
| Expected change | Six empty `visits` family tables; RLS enabled; XOR parent; RESTRICT FKs; no policies/grants/seeds; no Storage mutation; no automatic visit triggers |
| Design acceptance | PASS — `docs/reviews/MARIB-TAX-BATCH-09-FIELD-VISITS-DESIGN-DECISION-GATE-01.md` |
| Preflight evidence | `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md` |
| Source state | `BATCH_09_SOURCE = MERGED / NOT APPLIED` |
| Baseline | `08841bada5ea570acc2cc64d180a9934aa32e66b` (PR #70) |

## Approval requested

Approval must explicitly authorize one controlled production application of Batch 09 against project `sjmtiwzddztxfrncwkpx`. Approval of documentation, design acceptance, Batch 09 source merge (PR #70), Batches 01A–08, or this preflight packet does **not** by itself authorize apply. Prior approvals must not be reused.

## Mandatory preflight (completed for this packet)

1. Clean checkout based on reviewed `origin/main` `08841bada5ea570acc2cc64d180a9934aa32e66b`.
2. PR #70 MERGED; `HEAD` equals `origin/main` exactly.
3. Recompute migration SHA-256; require the exact value above.
4. Recompute verifier SHA-256; require the exact value above.
5. Confirm linked project ref is exactly `sjmtiwzddztxfrncwkpx`.
6. Confirm remote history contains Batches 01A–08 exactly once each and does not contain Batch 09.
7. Confirm the six Batch 09 tables do not exist.
8. Confirm no partial Batch 09 indexes/constraints/FKs/policies/grants/triggers/functions/sequences exist.
9. Confirm managed backup/recovery posture (latest physical COMPLETED; WALG enabled; PITR disabled; no restore).
10. Confirm open decisions remain open: OD-08, OD-15, DM-08 masking, `cancelVisit`.
11. Run only:

```text
npx --yes supabase@2.109.1 db push --linked --dry-run
```

12. Stop unless the dry-run lists exactly `20260724120000_create_field_visits_family.sql`.

## Exact apply command — closed until approval

```text
npx --yes supabase@2.109.1 db push --linked
```

Do not add `--include-all`. Do not retry blindly. Do not use `migration repair`, `db reset --linked`, dashboard SQL, or direct `psql`. Do not create Storage buckets/policies or perform real upload/download as part of Batch 09 apply.

## Required post-verification

1. Remote history contains Batch 09 exactly once.
2. Execute `scripts/db/verify/verify_batch_09_field_visits_family.sql`.
3. Require `final_status = PASS`, empty tables, RLS enabled, no unexpected policies/grants/seed, XOR parent and active-team uniqueness present, no `cases`, no Storage FKs/buckets.
4. Dry-run reports no pending migrations.
5. Record post-apply report before Batch 10 or any Storage work begins.

## Stop conditions

SHA mismatch, wrong project, unexpected history, more than one pending migration, pre-existing Batch 09 objects, apply/partial failure, verifier mismatch, silent finalization of open decisions, Storage/bucket mutation, or production uncertainty.
