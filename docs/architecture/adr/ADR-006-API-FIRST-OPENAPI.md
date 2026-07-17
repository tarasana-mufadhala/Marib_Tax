# ADR-006: API-First OpenAPI

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

Multiple clients (Flutter, Next.js) consume the same backend. An ambiguous interface causes drift, broken clients, and incomplete tests.

## Decision

Adopt **REST API first**, with **OpenAPI as the authoritative interface contract**.

## Consequences

- API changes update the OpenAPI contract in the same change set.
- Shared contracts package (`packages/contracts`) will align to OpenAPI when implementation begins.
- Informal undocumented endpoints are not permitted for production clients.

## Guardrails

- Contract changes that break clients require versioning and change control.
- Controllers and DTOs must stay consistent with the published OpenAPI document.
- Documentation under `docs/api/` tracks contract evolution.
- ADR-011 defines the approved `/api/v1` routing, HTTP verb, error-envelope, authorization declaration, and compatibility boundaries.
- Generated clients may only be produced from a reviewed OpenAPI artifact that passes CI.
