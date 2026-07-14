# Change Control — Marib Tax System

## Principle

Every post-baseline requirement is a **Change Request (CR)**. The closed analysis and accepted ADRs are the baseline. Informal scope changes are prohibited.

## When a Change Request is required

- New features or services outside approved MVP
- Changes to accepted ADRs or architecture boundaries
- Breaking API contract changes
- Destructive data model changes
- New external integrations or credential models
- Environment or security policy exceptions

## Required impact analysis

Each CR must describe:

1. Business justification
2. Affected components (mobile, web, api, worker, database, infrastructure)
3. Security and privacy impact
4. Data/migration impact
5. API/contract impact
6. RTL/localization impact where relevant
7. Test and rollback plan
8. Effort and schedule impact

## Approval roles

| Change type | Minimum approval |
| --- | --- |
| Scope / product | Product owner |
| Architecture / ADR | Architecture owner |
| Security | Security owner |
| Database | Data owner |
| Release process | Release owner |

## Versioning

- CRs receive an identifier and status (Proposed, Approved, Rejected, Implemented).
- Approved CRs that alter contracts or schemas must update versioned artifacts (API, service definitions, form schemas) without rewriting historical requests (see ADR-008).

## Prohibited informal scope changes

- Expanding a PR beyond its task without a CR
- “While we are here” schema or API redesigns
- Bypassing NestJS business rules from clients
- Introducing microservices or alternate stacks without ADR change control
- Shipping secrets or privileged keys into clients “temporarily”
