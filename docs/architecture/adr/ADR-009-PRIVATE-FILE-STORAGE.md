# ADR-009: Private File Storage

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

Operational files (attachments, evidence, generated documents) contain sensitive taxpayer and administrative data.

## Decision

Operational files are **private** and accessed using **authorized short-lived mechanisms** (e.g., signed URLs), mediated by backend authorization.

## Consequences

- No public buckets for operational documents.
- Access checks happen before issuing short-lived credentials.
- Clients never receive long-lived privileged storage credentials.

## Guardrails

- Private by default; public ACLs for operational files are prohibited.
- Signed access is time-bounded and scoped.
- Storage credentials for privileged operations remain server-only.
