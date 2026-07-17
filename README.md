# Marib Tax System

النظام الإلكتروني لمكتب الضرائب بمحافظة مأرب.

Official repository for the Marib Tax System — an electronic tax office platform for Marib Governorate.

## Status

**API Runtime Foundation / Database Foundation**

API-01 source implementation has started: the repository now includes an authoritative OpenAPI v1 foundation, common TypeScript contracts, and a buildable/tested NestJS API with isolated health and readiness probes. Business modules and user interfaces are not yet implemented.

## Approved architecture summary

| Layer | Technology |
| --- | --- |
| Taxpayer mobile | Flutter (`apps/mobile`) |
| Public website and admin dashboard | Next.js with TypeScript (`apps/web`) |
| Backend API | NestJS Modular Monolith (`apps/api`) |
| Background jobs | NestJS worker (`apps/worker`) |
| Database | PostgreSQL via Supabase managed services |
| Messaging | Twilio SMS (initial), Firebase Cloud Messaging |
| API contract | REST documented with OpenAPI |
| File storage | Private storage with authorized short-lived access |
| Notifications | Outbox pattern with retry worker |
| Environments | Development, Staging, Production (independent) |
| Node workspaces | pnpm workspace (`apps/web`, `apps/api`, `apps/worker`, `packages/*`) |

Flutter remains a separate project under `apps/mobile` and is **not** part of the pnpm workspace.

## Repository structure

```text
apps/           mobile, web, api, worker
packages/       contracts, shared-types, config, testing
database/       migrations, seeds, tests
infrastructure/ docker, deployment, monitoring
scripts/        foundation validation and future automation
docs/           baseline, governance, architecture, domain, workflows, ...
.cursor/rules/  Cursor project rules
.github/        workflows, issue templates, CODEOWNERS
```

## Development governance

- No direct pushes to `main`
- Feature branches and conventional commits
- Pull requests with required reviews and CI gates
- Formal change control for post-baseline requirements
- Definition of Done includes authorization, audit, Arabic RTL, tests, and security checks

See:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/governance/PROJECT-CHARTER.md](docs/governance/PROJECT-CHARTER.md)
- [docs/governance/DEVELOPMENT-WORKFLOW.md](docs/governance/DEVELOPMENT-WORKFLOW.md)
- [docs/governance/CHANGE-CONTROL.md](docs/governance/CHANGE-CONTROL.md)
- [docs/governance/DEFINITION-OF-DONE.md](docs/governance/DEFINITION-OF-DONE.md)
- [docs/governance/ENVIRONMENT-STRATEGY.md](docs/governance/ENVIRONMENT-STRATEGY.md)

## Key documents

| Document | Path |
| --- | --- |
| Security policy | [SECURITY.md](SECURITY.md) |
| Proprietary notice | [PROPRIETARY.md](PROPRIETARY.md) |
| Architecture ADRs | [docs/architecture/adr/](docs/architecture/adr/) |
| Baseline sources | [docs/baseline/README.md](docs/baseline/README.md) |
| Toolchain inventory | [docs/preflight/TOOLCHAIN-INVENTORY.md](docs/preflight/TOOLCHAIN-INVENTORY.md) |
| Foundation report | [docs/preflight/MARIB-TAX-REPOSITORY-FOUNDATION-01-REPORT.md](docs/preflight/MARIB-TAX-REPOSITORY-FOUNDATION-01-REPORT.md) |
| Environment placeholders | [.env.example](.env.example) |

## Warning

**No business controllers, user interfaces, external-service integrations, or production deployment have been implemented.** The API runtime foundation is executable but intentionally has no production database or operational-data connection.
