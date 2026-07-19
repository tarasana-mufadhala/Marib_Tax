# MARIB-TAX-DB-FOUNDATION-BATCH-06 — Production Apply Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-06-PRODUCTION-APPLY-PREFLIGHT-01 |
| Repository | `tarasana-mufadhala/Marib_Tax` |
| Base main HEAD | `52b5604906189815600279b7e9655d854d378f54` |
| Target project ref | `sjmtiwzddztxfrncwkpx` |
| Supabase CLI | `2.109.1` |
| Migration version | `20260721120000` |
| Migration file | `supabase/migrations/20260721120000_create_service_requests_family.sql` |
| Migration SHA-256 | `F0446C8964C4345D79669C6926B983776213CB06BFD6E4C2DB27BDC3EFB0AE7D` |
| Design acceptance | `PASS — BATCH_06_SOURCE_COMPATIBLE_WITH_APPROVED_LIFECYCLE` |
| Mode | Production preflight only; no migration apply |
| Decision | **PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY** |

## 1. Backup and recovery gate

- Latest visible managed physical backup: `2026-07-18T22:04:26.808Z` — status `COMPLETED`.
- WALG enabled: yes.
- PITR enabled: no.
- Restore was not executed.
- No backup contents or credentials were copied into this report.

## 2. Repository integrity

- Working tree was clean at preflight start on `origin/main` `52b5604`.
- Migration SHA-256 matched `F0446C8964C4345D79669C6926B983776213CB06BFD6E4C2DB27BDC3EFB0AE7D`.
- Linked project ref matched `sjmtiwzddztxfrncwkpx`.
- Post-correction design acceptance PASS recorded in `docs/reviews/MARIB-TAX-BATCH-06-DESIGN-DECISION-GATE-01.md`.

## 3. Migration history

| Migration | Local | Remote |
| --- | ---: | ---: |
| `20260715175300` — Batch 01A | 1 | 1 |
| `20260716190000` — Batch 02 | 1 | 1 |
| `20260717120000` — Batch 03 | 1 | 1 |
| `20260719120000` — Batch 04 | 1 | 1 |
| `20260720120000` — Batch 05 | 1 | 1 |
| `20260721120000` — Batch 06 | 1 | 0 |

## 4. Remote structural checks

Fourteen Batch 06 tables absent:

`service_types=0|service_requests=0|selected_activities=0|selected_branches=0|form_snapshots=0|form_payloads=0|status_histories=0|assignment_histories=0|completion_requests=0|completion_responses=0|decision_records=0|decision_revisions=0|close_archive=0|reopen_records=0`

No relation named `cases` (`cases=0`).

## 5. Dry-run

`npx --yes supabase@2.109.1 db push --linked --dry-run` completed successfully.

Exactly one migration listed:

`20260721120000_create_service_requests_family.sql`

## 6. Non-actions confirmation

This preflight did not apply any migration, run `db push` without `--dry-run`, seed data, repair, reset, deploy, or expose secrets.

## 7. Decision

**PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY**

A separate explicit authorization is required before applying Batch 06 to production.
