# MARIB-TAX-DB-FOUNDATION-BATCH-05 — Production Apply Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-05-PRODUCTION-APPLY-PREFLIGHT-01 |
| Repository | `tarasana-mufadhala/Marib_Tax` |
| Base main HEAD | `9462f68702ae35758d1f1f3daa3327c7302a1f05` |
| Autopilot HEAD at preflight | `4965e1a1d7666116ea44bc415d7ba40a841ac8aa` |
| Target project ref | `sjmtiwzddztxfrncwkpx` |
| Supabase CLI | `2.109.1` |
| Migration version | `20260720120000` |
| Migration file | `supabase/migrations/20260720120000_create_masterdata_activities_and_property.sql` |
| Migration SHA-256 | `D3F15F918B721DD00865CFF8702BBF4313BB21FB741228D5ECCF5F82E7FB148C` |
| Mode | Production preflight only; no migration apply |
| Decision | **PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY** |

## 1. Backup and recovery gate

- Latest visible managed physical backup: `2026-07-18T22:04:26.808Z` — status `COMPLETED`.
- WALG enabled: yes.
- PITR enabled: no.
- Restore was not executed.
- No backup contents or credentials were copied into this report.

## 2. Repository integrity

- Working tree was clean at preflight start.
- Migration SHA-256 matched `D3F15F918B721DD00865CFF8702BBF4313BB21FB741228D5ECCF5F82E7FB148C`.
- Linked project ref matched `sjmtiwzddztxfrncwkpx`.

## 3. Migration history

| Migration | Local | Remote |
| --- | ---: | ---: |
| `20260715175300` — Batch 01A | 1 | 1 |
| `20260716190000` — Batch 02 | 1 | 1 |
| `20260717120000` — Batch 03 | 1 | 1 |
| `20260719120000` — Batch 04 | 1 | 1 |
| `20260720120000` — Batch 05 | 1 | 0 |

## 4. Remote structural checks

Batch 05 tables absent:

`commercial_activities=0|branches=0|activity_addresses=0|activity_status_histories=0|properties=0|property_units=0|ownership_records=0|ownership_histories=0`

## 5. Dry-run

`npx --yes supabase@2.109.1 db push --linked --dry-run` completed successfully.

Exactly one migration listed:

`20260720120000_create_masterdata_activities_and_property.sql`

## 6. Non-actions confirmation

This preflight did not apply any migration, run `db push` without `--dry-run`, seed data, repair, reset, or expose secrets.

## 7. Decision

**PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY**

A separate explicit authorization is required before applying Batch 05 to production.
