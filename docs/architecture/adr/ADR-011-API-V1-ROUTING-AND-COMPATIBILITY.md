# ADR-011: API v1 Routing and Compatibility Boundary

- **Status:** Accepted
- **Date:** 2026-07-17
- **Decision:** API-01

## Context

ADR-006 makes OpenAPI the authoritative interface shared by NestJS, Next.js, and Flutter. The initial baseline intentionally deferred route, verb, error, and compatibility conventions. API-01 now approves those conventions without authorizing production deployment, database migration, or operational-data access.

## Decision

- Business APIs use the `/api/v1` prefix. Isolated, non-data-bearing internal health and readiness routes may remain outside it.
- Paths use stable English plural resource names and kebab-case compound names.
- Internal path identifiers are UUIDs. Sensitive serial references are not exposed as internal identifiers.
- Relationships are nested only for clear ownership and never deeply.
- `GET` reads, `POST` creates or invokes a named lifecycle transition, and `PATCH` partially updates.
- `PUT` requires a separately documented true replacement use case.
- `DELETE` is prohibited by default for operational, financial, and audited records; lifecycle transitions replace deletion.
- Lifecycle commands have explicit names and distinct DTO, permission, test, and documentation boundaries. Generic `/{id}/action` endpoints are prohibited.
- The error envelope is `{ error: { code, message, details?, traceId } }`. Codes are stable, messages are safe, and stack traces, SQL, secrets, and internal structure are never exposed.
- Every endpoint declares its required permission. NestJS enforces authorization; UI visibility is not authorization. No general administrator bypass exists.
- Additive compatible changes may remain in v1. Removing, renaming, changing type/meaning, path, or verb requires documented deprecation or a new major API version with migration and compatibility tests.
- Generated clients come only from reviewed OpenAPI that passes CI.

## Initial foundation scope

The first source foundation may define metadata, safe server placeholders, bearer security metadata without secrets, common UUIDs, error and validation details, pagination conventions, and isolated health/readiness endpoints. Business endpoints are added only when their requirements, permissions, and DTO semantics are established.

## Consequences

- OpenAPI validation is a CI gate.
- Controllers, DTOs, shared contracts, and clients must not diverge from the reviewed document.
- Sensitive lifecycle endpoints require positive and negative authorization tests when implemented.
- This decision does not authorize `PROD-DB-03`, SQL, migrations, deployment, secrets, real notifications, or production data changes.
