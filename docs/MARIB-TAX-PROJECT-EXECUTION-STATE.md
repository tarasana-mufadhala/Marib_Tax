# Marib Tax Project Execution State

**Inventory time:** 2026-07-17 (Asia/Riyadh)

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git and delivery state

- `origin/main`: `1e80e3809bca4e3a72e302f3e75ecf5962f4cbfc` (PR #29 merged).
- Local `main`: `8c3628f46e0d8644380f5bc120c868da92e65757`, one local documentation commit ahead of `origin/main`.
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`, branch `chore/marib-tax-autopilot-orchestrator`, clean at inventory start.
- Primary worktree: `C:\projects\Marib_Tax`, branch `main`; its ahead commit is preserved and not rewritten.
- PR #17, `docs(db): record Batch 03 production preflight`, is MERGED with Foundation CI PASS.
- PR #18, `docs: initialize Marib Tax autopilot state`, is MERGED with Foundation CI PASS.
- Latest `origin/main` Foundation CI is PASS at `c11794a`.

## Applications and packages

| Area | Status | Evidence |
| --- | --- | --- |
| Monorepo/governance/ADRs/CI | COMPLETE | Repository structure, ADRs, validation workflow, and baseline documents exist. |
| Flutter taxpayer app | NOT_STARTED | `apps/mobile` contains a README only. |
| Next.js web/admin | NOT_STARTED | `apps/web` contains a README only. |
| NestJS API | RUNTIME_READY | Buildable/tested foundation with safe `/health` and `/ready`; no business or production integration. |
| NestJS worker | NOT_STARTED | `apps/worker` contains a README only. |
| Shared packages | ACTIVE | `@marib-tax/contracts` builds and tests common API-01 types; other packages remain reserved. |
| OpenAPI/runtime DTOs | RUNTIME_READY | OpenAPI 3.1 foundation validates cleanly with safe common contracts. |

## Database and runtime

| Batch | Source | Production/runtime | Notes |
| --- | --- | --- | --- |
| 01A application schemas | COMPLETE | APPLIED | Migration `20260715175300_create_marib_tax_application_schemas.sql`; post-apply report merged in PR #12. |
| 02 identity profiles | COMPLETE | APPLIED | Migration `20260716190000_create_identity_profiles.sql`; post-apply verification merged in PR #15. |
| 03 authorization model | COMPLETE | REQUIRES_USER_APPROVAL | Migration `20260717120000_create_identity_authorization_model.sql` merged in PR #16. Production preflight PR #17 is merged and green. No apply was performed by autopilot. |
| 04 taxpayer registry/legal entities | BLOCKED | NOT_STARTED | Sequence requires Batch 03 application and accepted verification first; open tax-number/account-link decisions must not be guessed. |
| 05-18 | BLOCKED | NOT_STARTED | Dependency-ordered behind earlier database batches and unresolved decisions. |

RLS and database authorization source exist through Batch 03. Production RLS was not disabled, no production SQL was run, and no secrets or taxpayer data were accessed or changed during this inventory.

## Execution queue

| Priority | Task | State | Owner/worktree | Gate/result |
| --- | --- | --- | --- | --- |
| 1 | Merge PR #17 after final review | COMPLETE | `docs/db-foundation-batch-03-production-preflight` | Merged as `c9cf9c0`; CI PASS; documentation-only change. |
| 2 | Apply Batch 03 to production | REQUIRES_USER_APPROVAL | Production operator | Explicit fresh approval required; exact preflight/apply/post-verify sequence must be used. |
| 3 | Post-apply verification for Batch 03 | BLOCKED | Future isolated worktree | Depends on successful authorized apply. |
| 4 | Author Batch 04 source migration | BLOCKED | Future isolated worktree | Depends on accepted Batch 03 and approved DM-04/DM-21/DM-23 choices where encoded. |
| 5 | OpenAPI paths, verbs, and version boundary | COMPLETE | API-01 / ADR-011 | Explicitly approved on 2026-07-17. |
| 6 | OpenAPI, NestJS API, and shared-contract foundation | COMPLETE | PR #24 / `054cd3526e75a5a700419cdb19d3ea53f46fe401` | Expanded CI PASS; production remains closed. |
| 7 | Stable error-code catalog and runtime error envelope | COMPLETE | PR #25 / `5707f58c88be860b34ff9ad01742c0e9ae6608be` | Expanded CI PASS. |
| 8 | Stable endpoint permission identifiers | COMPLETE | API-02 / ADR-012 | Explicitly approved on 2026-07-18. |
| 9 | Fail-closed NestJS authorization foundation | COMPLETE | PR #27 / `8f4280351f2a67deab978484a753d1a5ea0e7115` | Expanded CI PASS; no admin bypass. |
| 10 | First taxpayer request-draft business contract | COMPLETE | PR #29 / `1e80e3809bca4e3a72e302f3e75ecf5962f4cbfc` | Foundation CI PASS; production integration intentionally absent. |

## Quality gates

- Foundation validation: PASS on PR #17 and current `origin/main`.
- NestJS/contracts: OpenAPI PASS, typecheck PASS, 39 tests PASS, build PASS, lint PASS, formatting PASS, `git diff --check` PASS for API-03 locally.
- Flutter/Next.js/worker: NOT_STARTED.
- Migration execution: CLOSED pending explicit approval.
- Production deployment: NOT_STARTED and CLOSED.

## Current blockers and dependencies

- Production Batch 03 application requires explicit user approval.
- The physical model decision register contains 41 open decisions. Batch-specific decisions must be resolved before source code encodes them.
- API-01/API-02/API-03 are approved; the first request-draft source slice may proceed under ADR-013.
- Local `main` has a preserved ahead commit corresponding to Batch 03 preflight work; do not reset or discard it.

## Highest next safe task

No safe `READY` task remains. Request-draft production persistence is dependency-blocked by the database sequence, and real actor/runtime integration needs an approved authentication boundary. Do not execute PROD-DB-03 without separate approval.

## Continuation checkpoint

- **Last completed task:** API-03 merged through PR #29 (`1e80e3809bca4e3a72e302f3e75ecf5962f4cbfc`) after Foundation CI PASS.
- **Active task:** none; no independent safe `READY` task remains.
- **Owner:** `chore/marib-tax-autopilot-orchestrator` in `C:\projects\Marib_Tax-autopilot`.
- **Approval gates:** production Batch 03 (`PROD-DB-03`) remains closed. API-01/API-02/API-03 are approved.
- **Queue result:** API-03 is complete. Database Batch 04 remains blocked by PROD-DB-03 and unresolved data decisions; real request persistence/actor wiring is not independently ready.
- **Highest next task:** API-04 authentication/current-actor boundary or PROD-DB-03, whichever receives explicit approval first.
- **Next action:** perform a focused Git/CI freshness check, record any new approval, and resume directly from its approved boundary without repeating the full inventory.

## Realistic completion estimate

Repository/governance and database foundation through Batch 03 source are established, but all four runtime applications and most business database batches remain unimplemented. Overall implementation completion is estimated at **12%**; this is a planning estimate, not a delivery claim.
