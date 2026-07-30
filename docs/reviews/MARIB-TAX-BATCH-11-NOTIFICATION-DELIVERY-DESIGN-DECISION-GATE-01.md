# MARIB Tax Batch 11 Design Decision Gate

## Decision

**PASS — BATCH_11_NOTIFICATION_DELIVERY_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- TABLE-066…072 only in the `notify` schema (7 tables):
  1. `notification_templates` (TABLE-069 — created first as FK target)
  2. `notification_channel_configurations` (TABLE-070)
  3. `notification_messages` (TABLE-066)
  4. `delivery_attempts` (TABLE-067)
  5. `delivery_retries` (TABLE-068)
  6. `notification_read_states` (TABLE-071)
  7. `notification_outbox_messages` (TABLE-072)
- Physical names follow the approved 94-table catalog (`docs/data/MARIB-TAX-PHYSICAL-COLUMN-CONSTRAINT-CATALOG-01.md`), exactly as Batches 08–10 did. The `execution_plan.md` names map onto the catalog as: `notification_events` → `notification_messages`, `notification_deliveries` → `delivery_attempts`/`delivery_retries`, `notification_outbox` → `notification_outbox_messages`.

## Accepted source boundaries

- Creating a notification never sends it; delivery is asynchronous via the outbox and the Worker (ADR-007, P-05). No SMS/push is sent from SQL and no send-time logic exists in this source.
- **Dual outbox separation (binding):** TABLE-072 is the notification **delivery** queue only. It is not the domain-event outbox; `audit.domain_event_outbox` (TABLE-094) belongs to Batch 14 and responsibilities must not be merged.
- **No secrets in the database:** no Twilio/FCM credential, token, or API-key columns anywhere; `config_label` is a non-secret label only. The verifier fails on any secret/token/password/api_key/credential-like column name in `notify`.
- Delivery status ≠ read status: `notification_read_states` is a dedicated per-recipient table (DM-25 remains open); a delivered message may remain unread.
- Append-only evidence: every attempt (`delivery_attempts`) and retry (`delivery_retries`) is recorded with a mandatory outcome code; success on one channel never hides failure on another.
- Dedup without content guessing: scoped unique partial indexes on `idempotency_key` (message-level and outbox-level, DM-20); NULL keys are unrestricted.
- OTP content minimization (DM-11) is not encoded in SQL; `payload_ref` / `failure_reason_safe` are minimized-reference columns by design and the application must not store OTP text in them.
- Open `execution_plan.md` items `device_tokens` and `notification_preferences` are **not** in the approved catalog; they are excluded from this batch and require a Change Request before any introduction.
- Retry policy, max attempts, and dead-letter cutoff are Worker-enforced and remain open governance decisions; no retry policy is hardcoded in SQL.
- RLS enabled on all seven tables; no policies; positive grants revoked; no seeds; no Storage mutation; no `cases` table.

## Verification result

- Exactly seven `CREATE TABLE` + seven `ENABLE ROW LEVEL SECURITY`.
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0; no float/real/double money-like columns.
- Mandatory NOT NULL evidence columns per catalog: `delivery_status_code`, `attempt_status_code`, `retry_status_code`, `read_status_code`, `publication_state`, `attempt_count` (default 0), template `code`, channel `channel_code`, read-state `recipient_profile_id`.
- Unique constraints: template `code`, channel `channel_code`, read-state `(notification_message_id, recipient_profile_id)`.
- Positive checks: `attempt_number >= 1`, `retry_number >= 1`, `attempt_count >= 0`.
- Read-only verifier checks dependency presence, RLS, emptiness, forbidden grants, zero policies, secret-like columns, constraints, columns, indexes, and absence of any `cases` relation.
- Repository foundation validation: `scripts/validate-foundation.sh` PASS (89/0).
- Migration SHA-256: `1925A56DA66BC523605B780E4FCE52A7DB92A07822169FC99739AB9F8DDD5DC0`
- Verifier SHA-256: `E4F03541B3EB25040B26BB2EBD248392CAFC8E3FC3865611D2663120BA6EA0C4`

## Production gate

This design PASS does not authorize apply. Production apply requires the full governed cycle: PR → CI PASS → review → merge → production preflight with linked read-only checks and `--dry-run` → independent user approval → single apply → post-apply verifier → closure (`BATCH_11 = APPLIED / VERIFIED PASS`).
