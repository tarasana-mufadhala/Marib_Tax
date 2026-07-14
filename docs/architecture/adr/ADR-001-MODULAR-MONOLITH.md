# ADR-001: Modular Monolith

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

The Marib Tax System needs a coherent backend for MVP delivery with clear module boundaries, shared transactions for workflow state, and operational simplicity for a small team.

## Decision

Use a **NestJS Modular Monolith** as the backend architecture for MVP. Do **not** introduce microservices during MVP.

## Consequences

- Faster delivery and simpler deployment/observability for MVP.
- Modules must still enforce clear boundaries to allow future extraction if justified.
- Cross-cutting concerns (authz, audit, outbox) remain centralized.

## Guardrails

- No microservice split without an approved Change Request and new ADR.
- Module boundaries must not be bypassed via ad-hoc shared mutable state.
- Background processing remains a separate worker process consuming shared patterns (outbox), not a separate microservice domain estate.
