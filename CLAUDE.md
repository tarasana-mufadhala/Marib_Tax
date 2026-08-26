# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marib Tax System is an electronic tax office platform for Marib Governorate. The repository follows a monorepo structure using pnpm, separating concerns into apps and packages. **Overall progress: ~25–30%** (backend operational modules ~10–15%, see `execution_plan.md` for current priorities).

**Key Technologies:**
- Backend: NestJS 11 (Node.js/TypeScript) in `apps/api` — modular monolith
- Background Worker: NestJS in `apps/worker` — outbox, retries, imports
- Admin Dashboard & Public Website: Next.js (TypeScript) in `apps/web`
- Taxpayer Mobile App: Flutter in `apps/mobile`
- Database: PostgreSQL via Supabase (managed migrations)
- API Contract: OpenAPI 3.1 with Zod DTOs in `packages/contracts`
- Shared Types: `packages/shared-types`
- Config: `packages/config`
- Testing Utilities: `packages/testing` (Vitest + supertest)

## Development Setup

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env` and fill in required values (Supabase credentials, etc.)
3. Node.js >=20, pnpm >=11.

## Common Commands

All commands run from the repository root unless otherwise noted.

### Linting & Formatting
- `pnpm lint` — ESLint across API, contracts, web, and worker (zero warnings)
- `pnpm format:check` — Prettier check

### Type Checking
- `pnpm typecheck` — TypeScript type check across all projects

### Building
- `pnpm build` — Build all projects with a build step

### Testing
- `pnpm test` — Build contracts first, then run all Vitest test suites
- Single API test file (unit/integration): `pnpm --filter @marib-tax/api test path/to/test.file.ts`
- Single API test file (E2E via supertest): `pnpm --filter @marib-tax/api test apps/api/test/my-e2e.test.ts`
- Watch mode: `pnpm --filter @marib-tax/api test --watch`

**Test coverage requirements (from `.cursor/rules/60-testing.mdc`):**
- Tests required for: business rules, permissions, negative access cases, state transitions, and failure paths
- No feature is complete with only happy-path tests
- Authorization tests must include denied access cases
- Do not weaken tests to greenwash incomplete behavior

### Validation
- `pnpm validate:foundation` — DB migrations, seeds (via `scripts/validate-foundation.sh`)
- `pnpm validate:openapi` — Lints the OpenAPI spec with Redocly

### Running the API
- `pnpm --filter @marib-tax/api start` — runs compiled `dist/main.js`
- For development (check `apps/api/package.json` for available scripts)

### Running the Worker
- `pnpm --filter @marib-tax/worker start` (or check `apps/worker/package.json`)

## Code Architecture & Structure

### Monorepo Layout
```
/apps
  /api          – NestJS backend (core business logic)
  /worker       – NestJS worker (outbox, retries, imports)
  /web          – Next.js (React) admin dashboard & public site
  /mobile       – Flutter taxpayer app
/packages
  /contracts    – OpenAPI spec, DTOs (Zod), generated clients
  /shared-types – Shared TypeScript interfaces
  /config       – Shared configuration
  /testing      – Test utilities
/database       – Migration seeds, PG-TAP tests (Kimi)
/infrastructure – Docker, deployment, monitoring
/work-system    – Analysis, blueprints, plans, reports (reference only)
/docs           – Documentation, governance, architecture
/scripts        – Validation and automation scripts
```

### Path Ownership (strict — avoid merge conflicts)
| Owner | Paths |
|---|---|
| **Kimi** | `packages/contracts/**`, `supabase/migrations/**`, `database/**`, `scripts/db/**`, `docs/**`, `work-system/**`, `plan.md` |
| **Antigravity** | `apps/api/**`, `apps/worker/**`, `apps/web/**`, `apps/mobile/**`, `packages/testing/**` |
| **Neutral** (coordinate) | Root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `eslint.config.mjs`, `.env.example`, `packages/config/**`, `infrastructure/**` |

### Backend Module Architecture (NestJS)

The API is a **modular monolith** with ~20 modules in `apps/api/src/`. Key patterns:

**Authorization Pipeline (global):**
```
Incoming request → AuthorizationGuard (APP_GUARD)
  → ActorContextResolver (resolves actor + permissions from JWT)
  → AuthorizationPolicyEvaluator (evaluates x-permission predicates)
  → AuthorizationAuditHook (logs denials to SecurityService)
```
- `AuthorizationGuard` is registered as an `APP_GUARD` — applies to every endpoint by default
- Authorization contracts (DI tokens) in `authz/authorization.contracts.ts`:
  - `ACTOR_CONTEXT_RESOLVER` — currently `BearerActorContextResolver`
  - `AUTHORIZATION_POLICY_EVALUATOR` — currently `MainAuthorizationPolicyEvaluator`
  - `AUTHORIZATION_AUDIT_HOOK` — currently `SecurityService`

**Workflow State Machine** (`workflow/workflow.service.ts`):
- All service requests follow explicit status transitions:
  `draft → submitted → under_review → [need_more_info | field_visit_scheduled | payment_required | approved | rejected] → ... → completed → archived`
- `WorkflowService.transition()` validates allowed transitions, authorizes, then persists
- State changes go only through WorkflowService

**Repository Pattern:**
- Controllers are thin: validate input → call service → map response
- Services use injected Repository classes/tokens (Repository pattern with DI tokens like `WORKFLOW_REPOSITORY`, `TAXPAYER_REPOSITORY`)
- No direct DB access from controllers or workers

**Environment Config:**
- Validated with Zod schema in `config/environment.ts`
- Loaded via `ConfigModule.forRoot()` with `validate: validateEnvironment`

**Modules by domain layer:**
1. **Foundation:** `database`, `config`, `health`
2. **Auth:** `authn` (JWT), `authz` (permissions), `security` (audit logging), `users`, `roles-permissions`
3. **Registry:** `registry`, `masterdata`, `taxpayers`, `legal-entities`, `properties`, `activities-branches`
4. **Operations:** `requests`, `workflow`, `field-visits`, `decisions`, `dues-payments`, `notifications`
5. **Cross-cutting:** `attachments`, `http` (exception filter), `services-versions`

### API Contract First
- OpenAPI 3.1 spec in `packages/contracts/openapi/marib-tax.v1.yaml`
- TypeScript DTOs with Zod in `packages/contracts/src/`
- Antigravity consumes contracts as **read-only**; missing DTOs requested via coordination log in `plan.md`
- Changes go through Kimi

### Security Rules (from `.cursor/rules/`)
- Never expose secrets, tokens, private keys in source, logs, or client bundles
- Never place Supabase service-role keys in Flutter or Next.js clients
- Authorization is enforced **server-side in NestJS** — UI hiding is not authorization
- Sensitive personal data, auth tokens, and secrets must never be logged
- Apply least privilege to credentials, database roles, and production access

### Database Rules (from `.cursor/rules/`)
- Every schema change goes through a versioned migration in `supabase/migrations/`
- Never edit an already-applied migration; create a new migration instead
- No destructive cleanup (drop/truncate) without explicit written approval
- Official runner: Supabase CLI (see `docs/governance/MARIB-TAX-SUPABASE-CLI-MIGRATION-STANDARD-01.md`)
- Old `database/migrations/` path is superseded

### Frontend Rules (from `.cursor/rules/`)
- **Web:** Arabic RTL first; keep public/admin separated within same Next.js app; never put server secrets in `NEXT_PUBLIC_*`
- **Mobile (Flutter):** Feature-first architecture; no privileged keys in client; secure storage for auth tokens; resilient drafts/uploads; Arabic RTL first

## Development Workflow

1. **Create a feature branch** from `main` (never commit directly to `main`).
2. **Make changes** within your ownership area (or request changes to neutral/other areas via the coordination log in `plan.md`).
3. **Ensure linting, type-checking, and tests pass** locally.
4. **Update the coordination log** in `plan.md` when you complete a task.
5. **Open a Pull Request** with a clear description linking to any required coordination.
6. **Wait for CI** (lint, typecheck, tests, validation) to pass.
7. **Request review** from the appropriate teammate (Kimi or Antigravity).
8. **Merge only after approval** and a green CI.

## Reference Documents

- **Master Blueprint:** `work-system/STK-TAX-MRB-2026-MASTER-IMPLEMENTATION-BLUEPRINT-v1.0.md`
- **Requirements (SRS):** `work-system/تحليل.md`
- **Execution Plan:** `work-system/الخطة التفصيلية المعتمدة لمراحل تنفيذ نظام مكتب الضرائب بمحافظة مأرب.md`
- **Execution Status:** `execution_plan.md` (current priority: close Batch 10 production, then backend modules)
- **Task Status:** `work-system/ما تم انجازه وماهو متبقي .md`
- **Coordination Log:** `plan.md`
- **Governance:** `docs/governance/` (PROJECT-CHARTER.md, DEVELOPMENT-WORKFLOW.md, CHANGE-CONTROL.md, DEFINITION-OF-DONE.md, ENVIRONMENT-STRATEGY.md)
- **Technical:** `docs/baseline/`, `docs/architecture/adr/`, `docs/preflight/`
- **Cursor Rules:** `.cursor/rules/` (00-project-governance, 10-security, 20-database, 30-backend, 40-web, 50-mobile, 60-testing)

This CLAUDE.md should be kept up-to-date with any changes to the development process or architecture. When in doubt, consult the referenced documents and the coordination log in `plan.md`.

<!-- ASTRYX:START -->
Astryx v0.5.0 · 163 components
CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing, page frame included.
- Frame first: read `astryx docs layout` before writing any page or screen — page frame, region widths, breakpoint behavior.
- Dense data = rows (Table, List/Item), never Card-wrapped list items; Card is for standalone widgets. Status = StatusDot/Token; Badge = counts only.
- Custom styling: component props first; else style/className with tokens — var(--color-*|--spacing-*|--radius-*). No raw hex/px. (No StyleX/Tailwind compiler here — don't use xstyle/utility classes.)
- Tokens for every value (`astryx docs tokens`). Brand/accent belongs in the theme (`astryx theme list` / `theme add <slug>`, or `astryx theme template` for a custom one) — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any raw <div>/<span> layout, imported .css/@apply, or hardcoded value (#hex, 16px) with the component or a token (var(--color-*|--spacing-*|…)). If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   163 components by category
  template --list    page + block recipes
  docs <topic>       browser-support, cli-integrations, color, elevation, getting-started, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling-libraries, styling, theme, tokens, typography, working-with-ai
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
