# ADR-012: Stable Endpoint Permissions

- **Status:** Accepted
- **Date:** 2026-07-18
- **Decision:** API-02

## Decision

Endpoint permissions are stable lowercase dot-separated capability keys shaped as `resource[.subresource].action`. They are never role names and wildcards or general administrator bypasses are prohibited. Published keys are immutable in meaning.

Every business endpoint declares one approved permission and any additional authorization predicates in OpenAPI and NestJS metadata. Permission is necessary but may be insufficient: ownership, active assignment, office/unit scope, resource state, separation of duties, and required evidence are evaluated server-side. Missing actor context, unknown permission, inactive/revoked assignment, or indeterminate policy always denies.

Health and readiness are the only current explicitly public endpoints. Deferred permission keys are documentation-only and must not appear in runtime decorators or grants.

## Consequences

- Shared contracts own the permission and predicate catalogs.
- NestJS authorization is globally fail-closed.
- Role names never imply a permission.
- Audit hooks are required for sensitive operations when their modules are implemented.
- API-02 does not authorize database migrations, production grants, deployment, or operational-data access.
