# MARIB-TAX-DB-FOUNDATION-BATCH-08 — Production Approval Packet

**Status:** `APPLIED / VERIFIED PASS` on 2026-07-21 — see `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`. This packet is retained as authorizing evidence; it does not authorize Batch 09, Storage operations, or any other migration.

## Reviewed artifact

| Field | Value |
| --- | --- |
| Project ref | `sjmtiwzddztxfrncwkpx` |
| Migration | `supabase/migrations/20260723120000_create_files_attachment_metadata.sql` |
| SHA-256 | `1BEFCACAD87C0A3813F7335FAFC42BEB8066C70ECFE5191D9609C9759E9A4496` |
| Verifier | `scripts/db/verify/verify_batch_08_files_attachment_metadata.sql` |
| Verifier SHA-256 | `97ADD70F0E0F4A821FC77ACAA95A2272DBF06533E07BEAD995104EC08254DBCE` |
| Runner | Supabase CLI `2.109.1` |
| Expected change | Three empty `files` metadata tables; RLS enabled; no policies/grants/seeds; no Storage buckets/policies; no `storage.objects` FK; no Postgres bytes |
| Design acceptance | PASS — `docs/reviews/MARIB-TAX-BATCH-08-DESIGN-DECISION-GATE-01.md` |
| Preflight evidence | `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-08-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md` |
| Source state | `BATCH_08_SOURCE = MERGED / NOT APPLIED` |

## Approval requested

Approval must explicitly authorize one controlled production application of Batch 08 against project `sjmtiwzddztxfrncwkpx`. Approval of documentation, design acceptance, Attachments Wave 02 merges, Batches 01A–07, or this preflight packet does **not** by itself authorize apply. Prior approvals and superseded SHAs must not be reused.

Superseded migration SHAs (do not use):

- `BDEDBD040F2EA53D8AAA1BB4A9FB8307FC64A2513283D841632749C2D21E6C60`
- `C5BC82DFFC0D159FF19389398FF926820E71EDD8065EFDDA6894AACC6654D81C`

## Mandatory preflight (completed for this packet)

1. Clean checkout based on reviewed `origin/main` `3955c1f10f534a367209f73b7466afe9d72bdda5`.
2. Stale reconciliation PASS; PRs #61–#67 MERGED; final SHA adopted only.
3. Recompute migration SHA-256; require the exact value above.
4. Recompute verifier SHA-256; require the exact value above.
5. Confirm linked project ref is exactly `sjmtiwzddztxfrncwkpx`.
6. Confirm remote history contains Batches 01A–07 exactly once each and does not contain Batch 08.
7. Confirm the three Batch 08 tables do not exist.
8. Confirm no partial Batch 08 indexes/constraints/objects exist.
9. Confirm managed backup/recovery posture (latest physical COMPLETED; WALG enabled; PITR disabled; no restore).
10. Run only:

```text
npx --yes supabase@2.109.1 db push --linked --dry-run
```

11. Stop unless the dry-run lists exactly `20260723120000_create_files_attachment_metadata.sql`.

## Exact apply command — closed until approval

```text
npx --yes supabase@2.109.1 db push --linked
```

Do not add `--include-all`. Do not retry blindly. Do not use `migration repair`, `db reset --linked`, dashboard SQL, or direct `psql`. Do not create Storage buckets/policies or perform real upload/download as part of Batch 08 apply.

## Required post-verification

1. Remote history contains Batch 08 exactly once.
2. Execute `scripts/db/verify/verify_batch_08_files_attachment_metadata.sql`.
3. Require `final_status = PASS`, empty tables, RLS enabled, no unexpected policies/grants/seed, no Storage FKs, active-link uniqueness present.
4. Dry-run reports no pending migrations.
5. Record post-apply report before Batch 09 or any Storage work begins.

## Stop conditions

SHA mismatch, wrong project, unexpected history, more than one pending migration, pre-existing Batch 08 objects, apply/partial failure, verifier mismatch, Storage/bucket mutation, or production uncertainty.
