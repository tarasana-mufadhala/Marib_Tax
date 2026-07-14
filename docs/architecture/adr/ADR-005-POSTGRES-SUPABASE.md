# ADR-005: PostgreSQL and Supabase

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

The system requires a relational database, managed auth/storage capabilities where approved, and operational reliability without building all platform services from scratch.

## Decision

Use **PostgreSQL** with **selected Supabase managed services**. Clients must **not** perform direct client-side business writes that bypass backend rules.

## Consequences

- Schema evolution via migrations under `database/migrations/`.
- Privileged Supabase credentials remain server-only.
- Supabase features are adopted selectively and explicitly, not as an unbounded platform dump.

## Guardrails

- No direct client-side business writes to the database for operational data (ADR-010).
- Service-role keys never ship to clients.
- Independent databases per environment.
- No production migration automation.
