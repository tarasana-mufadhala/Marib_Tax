# Project Charter — Marib Tax System

## Project purpose

Deliver an electronic tax office platform for Marib Governorate that enables taxpayers and authorized administrators to conduct approved tax-office services through mobile and web channels, with a trusted backend, private storage, audited workflows, and reliable notifications.

## Components

| Component | Role |
| --- | --- |
| `apps/mobile` | Flutter taxpayer application (Android first; iOS-ready design) |
| `apps/web` | Next.js public website and protected admin dashboard |
| `apps/api` | NestJS Modular Monolith — trusted business logic |
| `apps/worker` | Background notifications and jobs (outbox consumer) |
| `packages/*` | Shared Node contracts, types, config, testing |
| `database/` | Migrations, seeds, database tests |
| `infrastructure/` | Docker, deployment, monitoring |

## Approved MVP boundary

MVP scope is defined by the approved baseline (Final SRS, master implementation blueprint, and accepted ADRs). The repository foundation does not expand MVP scope. Features outside the approved MVP require a Change Request.

## Analysis closed status

Requirements analysis for the foundation baseline is **closed**. Informal reinterpretation of closed analysis is not permitted. Clarifications that change behavior require change control.

## Change-control requirement

Every post-baseline requirement is a Change Request with impact analysis and approval. See [CHANGE-CONTROL.md](CHANGE-CONTROL.md).

## Roles and decision ownership

| Area | Ownership |
| --- | --- |
| Product / scope | Product owner (or designated authority) |
| Architecture | Architecture owner; ADR updates via change control |
| Security | Security owner |
| Database / migrations | Data owner + reviewer |
| Releases | Release owner |
| Repository governance | Repository maintainers (`@tarasana-mufadhala` initially) |

Implementation work must respect approved architecture and closed analysis. Unapproved scope changes are prohibited.
