# MARIB-TAX-DB-FOUNDATION-BATCH-07 — Production Apply Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-07-PRODUCTION-APPLY-PREFLIGHT-01 |
| Repository | `tarasana-mufadhala/Marib_Tax` |
| Base main HEAD | `31ad36dcad5933c8584f2699cae8bbc125294f8e` |
| Target project ref | `sjmtiwzddztxfrncwkpx` |
| Supabase CLI | `2.109.1` |
| Migration version | `20260722120000` |
| Migration file | `supabase/migrations/20260722120000_create_balaghat_family.sql` |
| Migration SHA-256 | `10BA80E828CDB39AB60B1816F8EC6D263169CC6DFA6EC7821D979AE2EDA63118` |
| Design acceptance | `PASS — BATCH_07_SOURCE_COMPATIBLE_WITH_APPROVED_BALAGHAT_RULES` |
| Mode | Production preflight only; no migration apply |
| Decision | **PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY** |

## 1. Backup and recovery gate

- Latest visible managed physical backup: `2026-07-19T22:03:52.367Z` — status `COMPLETED`.
- WALG enabled: yes.
- PITR enabled: no.
- Restore was not executed.
- No backup contents or credentials were copied into this report.

## 2. Repository integrity

- Branch based on `origin/main` `31ad36d` (PR #58 merge).
- Post-acceptance uniqueness correction applied to unapplied Batch 07 source before preflight.
- Migration SHA-256 matched `10BA80E828CDB39AB60B1816F8EC6D263169CC6DFA6EC7821D979AE2EDA63118`.
- Linked project ref matched `sjmtiwzddztxfrncwkpx`.
- Design acceptance PASS recorded in `docs/reviews/MARIB-TAX-BATCH-07-DESIGN-DECISION-GATE-01.md`.

## 3. Migration history

| Migration | Local | Remote |
| --- | ---: | ---: |
| `20260715175300` — Batch 01A | 1 | 1 |
| `20260716190000` — Batch 02 | 1 | 1 |
| `20260717120000` — Batch 03 | 1 | 1 |
| `20260719120000` — Batch 04 | 1 | 1 |
| `20260720120000` — Batch 05 | 1 | 1 |
| `20260721120000` — Batch 06 | 1 | 1 |
| `20260722120000` — Batch 07 | 1 | 0 |

## 4. Remote structural checks

Sixteen Batch 07 tables absent:

`balaghs=0|targets=0|props=0|units=0|acts=0|br=0|snap=0|pay=0|st=0|as=0|cr=0|cresp=0|dec=0|drev=0|ca=0|re=0`

Exclusions absent: `cases=0|table021=0` (`masterdata.property_ownership_units`).

## 5. Dry-run

`npx --yes supabase@2.109.1 db push --linked --dry-run` completed successfully.

Exactly one migration listed:

`20260722120000_create_balaghat_family.sql`

## 6. Non-actions confirmation

This preflight did not apply any migration, run `db push` without `--dry-run`, seed data, repair, reset, deploy, or expose secrets.

## 7. Decision

**PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY**

A separate explicit authorization is required before applying Batch 07 to production.
