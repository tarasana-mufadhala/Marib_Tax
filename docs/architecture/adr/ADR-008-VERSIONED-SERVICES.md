# ADR-008: Versioned Services

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

Tax services, requirements, and form schemas will evolve. Historical requests must remain interpretable and auditable under the rules that applied when they were submitted.

## Decision

**Service definitions, requirements, and form schemas are versioned** so future changes do not alter historical requests.

## Consequences

- New versions can be introduced without mutating past submissions.
- Reporting and audit can reconstruct the applicable version for each request.
- Clients must target explicit versions when submitting new requests.

## Guardrails

- Do not overwrite historical schema definitions in place.
- Migrations must preserve historical version rows/data.
- Breaking service definition changes require a new version and change control.

## 2026-07-20 operational binding

ADR-016 binds Batch 06 request persistence to this ADR: each request keeps a fixed submitted `schema_version`, submitted snapshots are immutable, and form changes create new versions without rewriting historical requests.
