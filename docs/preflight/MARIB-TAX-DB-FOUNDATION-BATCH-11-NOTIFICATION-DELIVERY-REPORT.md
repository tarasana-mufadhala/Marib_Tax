# MARIB Tax DB Foundation — Batch 11 Notification Delivery Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_11_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-11 = NOT_STARTED` (requires the governed cycle and independent user approval)

## Artifacts

- Migration: `supabase/migrations/20260726120000_create_notify_notification_delivery.sql`
- Migration SHA-256: `1925A56DA66BC523605B780E4FCE52A7DB92A07822169FC99739AB9F8DDD5DC0`
- Read-only verifier: `scripts/db/verify/verify_batch_11_notification_delivery.sql`
- Verifier SHA-256: `E4F03541B3EB25040B26BB2EBD248392CAFC8E3FC3865611D2663120BA6EA0C4`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-11-NOTIFICATION-DELIVERY-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_11_NOTIFICATION_DELIVERY_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main` `eee6c9a7f6c98b7c6aed84362b51f87301aef5de`

## Scope and boundaries

The source defines TABLE-066…072 only in schema `notify` (7 tables):

1. `notification_templates` (TABLE-069)
2. `notification_channel_configurations` (TABLE-070)
3. `notification_messages` (TABLE-066)
4. `delivery_attempts` (TABLE-067)
5. `delivery_retries` (TABLE-068)
6. `notification_read_states` (TABLE-071)
7. `notification_outbox_messages` (TABLE-072)

- Physical names follow the approved 94-table catalog (same precedent as Batches 08–10). Mapping from `execution_plan.md`: `notification_events` → `notification_messages`; `notification_deliveries` → `delivery_attempts` + `delivery_retries`; `notification_outbox` → `notification_outbox_messages`; `notification_templates` → `notification_templates`.
- `device_tokens` and `notification_preferences` are not in the approved catalog and are excluded pending a Change Request (push tokens can be reconsidered before FCM activation).
- Create ≠ send: messages are roots; the Worker delivers asynchronously through TABLE-072 (ADR-007, P-05). No SMS/push send in SQL.
- TABLE-072 is the notification delivery queue only — never the domain-event outbox (TABLE-094, Batch 14).
- No Twilio/FCM secrets, tokens, or credentials in any column; channel config holds a non-secret label only.
- Every delivery attempt and retry is append-only evidence with a mandatory outcome code; delivery status is separate from per-recipient read status.
- Scoped unique partial indexes on `idempotency_key` (message + outbox) prevent duplicate enrollment (DM-20).
- Optional context FKs: `service_request_id`, `balagh_id`, `payment_notice_id` (Batch 10), `template_id`, `channel_config_id`, `recipient_profile_id` — all `ON DELETE RESTRICT`.
- RLS enabled on all seven tables; no policies; positive grants revoked; no seed/backfill; no Storage mutation; no `cases` table.

## Deferred open decisions

- DM-09 / DM-11 status catalogues (delivery, attempt, retry, read, publication states) and OTP content minimization
- DM-25 read-state semantics details
- DM-20 idempotency scoping rules (application side)
- Retry policy, max attempts, dead-letter cutoff (Worker-enforced)
- `device_tokens` / `notification_preferences` introduction (Change Request)

## Structural review (source)

- Schema: `notify`
- Exactly seven `CREATE TABLE` + seven `ENABLE ROW LEVEL SECURITY`
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0
- No float/real/double columns; no secret/token/password/api_key/credential-like column names
- Unique: template `code`, channel `channel_code`, read-state `(notification_message_id, recipient_profile_id)`
- Checks: not-blank codes; `attempt_number >= 1`; `retry_number >= 1`; `attempt_count >= 0` (default 0); time-order checks on retries and read acknowledgements
- Repository foundation validation: `scripts/validate-foundation.sh` PASS (89/0)

## Non-actions

This source report authorizes no apply. It did not apply Batch 11 anywhere, send SMS/push, store provider secrets, mutate Storage, seed templates/channels, deploy the Worker, or use real taxpayer data. Local DB-level execution (apply + verifier on a throwaway instance) is pending a running Docker daemon on the maintainer machine and does not replace the governed production preflight.
