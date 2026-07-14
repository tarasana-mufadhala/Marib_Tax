# ADR-010: No Direct Client Database Writes

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

If Flutter or Next.js write operational data directly to the database (or via privileged client SDKs), business rules, authorization, audit, and workflow integrity can be bypassed.

## Decision

**Flutter and Next.js do not bypass backend business rules for operational writes.** All operational mutations go through the NestJS API.

## Consequences

- Clients are UI and experience layers for operational flows.
- API remains the enforcement point for validation, authz, audit, and outbox enrollment.
- Any exception requires an explicit approved Change Request and security review (expected: none for MVP).

## Guardrails

- No service-role key in clients.
- No client-side SQL or privileged Supabase writes for operational entities.
- Read models may use approved constrained access patterns only when they cannot mutate operational state or bypass authz.
