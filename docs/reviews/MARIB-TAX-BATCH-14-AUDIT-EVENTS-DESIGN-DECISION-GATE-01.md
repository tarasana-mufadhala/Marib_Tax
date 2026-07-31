# MARIB Tax Batch 14 Audit & Events Design Decision Gate

## Decision

**PASS — BATCH_14_AUDIT_EVENTS_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- TABLES in the `audit` schema (3 tables):
  1. `audit_logs` (TABLE-083)
  2. `log_events` (TABLE-084 - physical implementation of domain events log)
  3. `event_outbox` (TABLE-085 - domain-event outbox)
- Physical names match the implementation definitions: `audit_logs`, `log_events`, `event_outbox`.

## Accepted source boundaries

- Audit and transactional boundaries: state mutations are logged in `audit_logs`, domain events are persisted in `log_events`, and transactional delivery is guaranteed via `event_outbox`.
- RLS enabled on all three tables; positive client grants revoked; no seeds; no Storage schema mutation.
- Security constraints: blank/empty actions or types are rejected. Retries and max retries checks are non-negative.
- Transactional outbox status enums are constrained to: `pending`, `processing`, `published`, `failed`, `dead_lettered`.
- Clear isolation: `audit.event_outbox` handles system-level domain-events, strictly separate from `notify.notification_outbox_messages` which handles delivery messaging.

## Verification result

- Exactly three `CREATE TABLE` + three `ENABLE ROW LEVEL SECURITY`.
- `CREATE POLICY` = 0; positive `GRANT` = 0; `INSERT` seed = 0; no float/real/double columns.
- RLS enabled, ensuring default-deny posture until application-specific rules are defined in Batch 17.
- Repository foundation validation compiles and passes cleanly.
- Migration SHA-256: `A02DC51BF4ED2CACBB2A930078AA3118569CB8A40F455100EB1E076D19DF78A3`
- Verifier SHA-256: `B5EAF380535724293668066CAF49782670AAFE96CC252E6DD7866D7ED65841E0`

## Production gate

This design PASS does not authorize apply. Production apply requires the full governed cycle: PR → CI PASS → review → merge → production preflight with linked read-only checks and `--dry-run` → independent user approval → single apply → post-apply verifier → closure (`BATCH_14 = APPLIED / VERIFIED PASS`).
