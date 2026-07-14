# ADR-004: NestJS Backend

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

Business rules, authorization, workflow transitions, and audit must execute in a trusted environment. Clients cannot be trusted to enforce operational integrity.

## Decision

**NestJS** (`apps/api`) is the **only trusted business-logic layer** for operational writes and workflow state changes.

## Consequences

- Controllers stay thin; services own rules.
- Flutter and Next.js call the API; they do not embed authoritative business logic for operational mutations.
- Future WorkflowService (when implemented) will be the sole path for workflow state changes.

## Guardrails

- No bypass of NestJS for operational writes (ADR-010).
- External messaging goes through provider/outbox abstractions (ADR-007).
- Controllers must not contain business rules.
