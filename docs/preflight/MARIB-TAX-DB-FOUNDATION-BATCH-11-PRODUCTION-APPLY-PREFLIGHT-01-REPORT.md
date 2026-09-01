# MARIB-TAX-DB-FOUNDATION-BATCH-11 — Production Apply Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-11-PRODUCTION-APPLY-PREFLIGHT-01 |
| Repository | `tarasana-mufadhala/Marib_Tax` |
| Base main HEAD | `b61dc85` |
| Target project ref | `sjmtiwzddztxfrncwkpx` |
| Supabase CLI | `2.109.1` |
| Migration version | `20260726120000` |
| Migration file | `supabase/migrations/20260726120000_create_notify_notification_delivery.sql` |
| Migration SHA-256 | `1925A56DA66BC523605B780E4FCE52A7DB92A07822169FC99739AB9F8DDD5DC0` |
| Verifier | `scripts/db/verify/verify_batch_11_notification_delivery.sql` |
| Verifier SHA-256 | `E4F03541B3EB25040B26BB2EBD248392CAFC8E3FC3865611D2663120BA6EA0C4` |
| Design acceptance | `PASS — BATCH_11_NOTIFICATION_DELIVERY_DESIGN_APPROVED_FOR_SOURCE` |
| Source PR | `#75` MERGED |
| Mode | Production preflight only; no migration apply |
| Decision | **PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY** |

## 0. Baseline and source integrity (G0)

- `git fetch origin` completed; working tree clean.
- `HEAD` matched `origin/main` exactly.
- PR #75 is `MERGED` (merge commit `b61dc85`).
- Migration SHA-256 matched `1925A56DA66BC523605B780E4FCE52A7DB92A07822169FC99739AB9F8DDD5DC0`.
- Verifier SHA-256 matched `E4F03541B3EB25040B26BB2EBD248392CAFC8E3FC3865611D2663120BA6EA0C4`.
- Source creates exactly seven tables in schema `notify`: `notification_templates`, `notification_channel_configurations`, `notification_messages`, `delivery_attempts`, `delivery_retries`, `notification_read_states`, `notification_outbox_messages`.
- Application-supplied UUIDs; explicit PK/FK; `ON DELETE RESTRICT` / `ON UPDATE NO ACTION`; no secrets or tokens stored in config; RLS enabled on all seven; positive client grants revoked; no seed/backfill; no hard-delete or purge path.
- Outbox pattern is strictly separated from the audit domain-event outbox.
- SMS and Push sending are decoupled from SQL insert operations.
- Open decisions remain unencoded in SQL and are enforced by the application/Worker layer.

## 1. Linked project and migration history (G1)

- Linked project ref matched `sjmtiwzddztxfrncwkpx`.
- No migration repair was used.

| Migration | Local | Remote |
| --- | ---: | ---: |
| `20260715175300` — Batch 01A | 1 | 1 |
| `20260716190000` — Batch 02 | 1 | 1 |
| `20260717120000` — Batch 03 | 1 | 1 |
| `20260719120000` — Batch 04 | 1 | 1 |
| `20260720120000` — Batch 05 | 1 | 1 |
| `20260721120000` — Batch 06 | 1 | 1 |
| `20260722120000` — Batch 07 | 1 | 1 |
| `20260723120000` — Batch 08 | 1 | 1 |
| `20260724120000` — Batch 09 | 1 | 1 |
| `20260725120000` — Batch 10 | 1 | 0 |
| `20260726120000` — Batch 11 | 1 | 0 |

- Batches 01A–09 exist exactly once locally and remotely.
- Batch 10 and Batch 11 are absent remotely.
- No local/remote migration-history mismatch.

## 2. Remote structural absence (G2)

Seven Batch 11 tables absent:

`notification_templates=0|notification_channel_configurations=0|notification_messages=0|delivery_attempts=0|delivery_retries=0|notification_read_states=0|notification_outbox_messages=0`

Partial Batch 11 objects absent:

`tables=0|indexes=0|constraints=0|foreign_keys=0|policies=0|grants=0|triggers=0|functions=0|sequences=0`

`cases_any=false`. Schema `notify` remains present from prior foundation batches (`notify_schema=true`), which is expected and not a Batch 11 object.

Approved read-only mechanism used: Supabase CLI `db query --linked`.

## 3. Backup and recovery posture (G3)

- Latest visible managed physical backup: COMPLETED.
- WALG enabled: yes.
- PITR enabled: no.
- Restore was not executed.
- No backup was created.

## 4. Dry-run (G4)

`npx --yes supabase@2.109.1 db push --linked --dry-run` completed successfully.

Exactly two migrations listed as pending:

- `20260725120000_create_dues_payment_evidence_family.sql` (Batch 10)
- `20260726120000_create_notify_notification_delivery.sql` (Batch 11)

Confirmation: only Batch 10 and Batch 11 are pending.

## 5. Non-actions confirmation

This preflight did not apply any migration, run `db push` without `--dry-run`, seed data, repair, reset, create Storage buckets/policies, upload/download objects, deploy, publish, start Batch 12, use real taxpayer data, send SMS/OTP/WhatsApp, or reuse an older production approval.

**Explicit confirmation: no production write occurred.**

## 6. Decision

**PASS_WITH_NOTES — READY_FOR_INDEPENDENT_REVIEW_NOT_AUTHORIZED_FOR_APPLY**

Final production state after this preflight:

- `PROD-DB-11 = REQUIRES_USER_APPROVAL`
- `BATCH_11_SOURCE = MERGED / NOT APPLIED`

A separate explicit authorization is required before applying Batch 10 and Batch 11 to Staging. This preflight must not be reused as apply approval.
