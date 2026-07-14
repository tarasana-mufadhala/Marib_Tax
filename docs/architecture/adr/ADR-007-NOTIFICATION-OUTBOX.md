# ADR-007: Notification Outbox

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

SMS (Twilio) and push (FCM) are unreliable relative to database commits. Coupling request submission to external delivery causes lost consistency and hard-to-retry failures.

## Decision

**Requests are committed independently from external message delivery.** Notifications use an **outbox** pattern and a **retry worker** (`apps/worker`).

## Consequences

- Business transactions succeed even when providers are temporarily unavailable.
- Worker delivers/retries notifications asynchronously.
- Observability must cover outbox lag and dead-letter/retry exhaustion.

## Guardrails

- Controllers and domain services must not call Twilio/FCM directly for fire-and-forget side effects outside the outbox abstraction.
- Provider credentials remain server-only on API/worker.
- At-least-once delivery requires idempotent notification handling where applicable.
