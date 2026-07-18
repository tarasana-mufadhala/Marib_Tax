# Marib Tax Project Execution State

**Inventory time:** 2026-07-18 (Asia/Riyadh)

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git and delivery state

- `origin/main`: `2e7136cfe4e06432ff82e13499a3146be80adf53` (PR #36 merged; Foundation CI PASS).
- Local `main`: `8c3628f46e0d8644380f5bc120c868da92e65757`, one local documentation commit ahead of `origin/main`.
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`, branch `chore/marib-tax-autopilot-orchestrator`, clean at inventory start.
- Primary worktree: `C:\projects\Marib_Tax`, branch `main`; its ahead commit is preserved and not rewritten.
- PR #17, `docs(db): record Batch 03 production preflight`, is MERGED with Foundation CI PASS.
- PR #18, `docs: initialize Marib Tax autopilot state`, is MERGED with Foundation CI PASS.
- Latest `origin/main` Foundation CI is PASS at `c11794a`.

## Applications and packages

| Area                        | Status        | Evidence                                                                                             |
| --------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Monorepo/governance/ADRs/CI | COMPLETE      | Repository structure, ADRs, validation workflow, and baseline documents exist.                       |
| Flutter taxpayer app        | RUNTIME_READY | PR #32 merged; Android/iOS-ready Arabic RTL foundation and API-03 local draft model/UI with CI PASS. |
| Next.js web/admin           | RUNTIME_READY | PR #34 merged; Next.js 16 Arabic RTL public shell and fail-closed `/admin`, CI PASS.                 |
| NestJS API                  | RUNTIME_READY | Buildable/tested foundation with safe `/health` and `/ready`; no business or production integration. |
| NestJS worker               | RUNTIME_READY | PR #35 merged; disabled/fail-closed TypeScript outbox contracts with CI PASS.                        |
| Shared packages             | ACTIVE        | `@marib-tax/contracts` builds and tests common API-01 types; other packages remain reserved.         |
| OpenAPI/runtime DTOs        | RUNTIME_READY | OpenAPI 3.1 foundation validates cleanly with safe common contracts.                                 |

## Database and runtime

| Batch                               | Source   | Production/runtime     | Notes                                                                                                                                                                      |
| ----------------------------------- | -------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01A application schemas             | COMPLETE | APPLIED                | Migration `20260715175300_create_marib_tax_application_schemas.sql`; post-apply report merged in PR #12.                                                                   |
| 02 identity profiles                | COMPLETE | APPLIED                | Migration `20260716190000_create_identity_profiles.sql`; post-apply verification merged in PR #15.                                                                         |
| 03 authorization model              | COMPLETE | REQUIRES_USER_APPROVAL | Migration `20260717120000_create_identity_authorization_model.sql` merged in PR #16. Production preflight PR #17 is merged and green. No apply was performed by autopilot. |
| 04 taxpayer registry/legal entities | BLOCKED  | NOT_STARTED            | Sequence requires Batch 03 application and accepted verification first; open tax-number/account-link decisions must not be guessed.                                        |
| 05-18                               | BLOCKED  | NOT_STARTED            | Dependency-ordered behind earlier database batches and unresolved decisions.                                                                                               |

RLS and database authorization source exist through Batch 03. Production RLS was not disabled, no production SQL was run, and no secrets or taxpayer data were accessed or changed during this inventory.

## Execution queue

| Priority | Task                                                 | State                  | Owner/worktree                                      | Gate/result                                                                                                            |
| -------- | ---------------------------------------------------- | ---------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1        | Merge PR #17 after final review                      | COMPLETE               | `docs/db-foundation-batch-03-production-preflight`  | Merged as `c9cf9c0`; CI PASS; documentation-only change.                                                               |
| 2        | Apply Batch 03 to production                         | REQUIRES_USER_APPROVAL | Production operator                                 | Explicit fresh approval required; exact preflight/apply/post-verify sequence must be used.                             |
| 3        | Post-apply verification for Batch 03                 | BLOCKED                | Future isolated worktree                            | Depends on successful authorized apply.                                                                                |
| 4        | Author Batch 04 source migration                     | BLOCKED                | Future isolated worktree                            | Depends on accepted Batch 03 and approved DM-04/DM-21/DM-23 choices where encoded.                                     |
| 5        | OpenAPI paths, verbs, and version boundary           | COMPLETE               | API-01 / ADR-011                                    | Explicitly approved on 2026-07-17.                                                                                     |
| 6        | OpenAPI, NestJS API, and shared-contract foundation  | COMPLETE               | PR #24 / `054cd3526e75a5a700419cdb19d3ea53f46fe401` | Expanded CI PASS; production remains closed.                                                                           |
| 7        | Stable error-code catalog and runtime error envelope | COMPLETE               | PR #25 / `5707f58c88be860b34ff9ad01742c0e9ae6608be` | Expanded CI PASS.                                                                                                      |
| 8        | Stable endpoint permission identifiers               | COMPLETE               | API-02 / ADR-012                                    | Explicitly approved on 2026-07-18.                                                                                     |
| 9        | Fail-closed NestJS authorization foundation          | COMPLETE               | PR #27 / `8f4280351f2a67deab978484a753d1a5ea0e7115` | Expanded CI PASS; no admin bypass.                                                                                     |
| 10       | First taxpayer request-draft business contract       | COMPLETE               | PR #29 / `1e80e3809bca4e3a72e302f3e75ecf5962f4cbfc` | Foundation CI PASS; production integration intentionally absent.                                                       |
| 11       | Supabase Auth and current-actor source boundary      | COMPLETE               | PR #31 / `ba717a43c909e10e17312a299a408c45871d856f` | Foundation CI PASS; production adapters remain unconnected.                                                            |
| 12       | Flutter taxpayer application foundation              | COMPLETE               | PR #32 / `7619dfa2c502cec564d193fdfe9c92b57f0607dc` | Foundation and Flutter CI PASS; no production connection.                                                              |
| 13       | Next.js public/admin application foundation          | COMPLETE               | PR #34 / `5c64a39858842826d65a0efbe24c539c95e5403e` | Foundation CI PASS; no credentials or backend connection.                                                              |
| 14       | Notification worker source foundation                | COMPLETE               | PR #35 / `cb6127276982f3729356549c8188203bd44f22a7` | CI PASS; no provider, database, credential, or delivery adapter.                                                       |
| 15       | Request ownership/resource-state policy evaluator    | REVIEW                 | `apps/api`                                          | Repository-backed fail-closed evaluator and negative isolated-runtime tests pass all local gates; PR delivery pending. |
| 16       | Protected-operation authentication response contract | READY                  | `packages/contracts`                                | Declare reusable 401/403 responses on every protected business operation and add drift tests.                          |

## Quality gates

- Foundation validation: PASS on PR #17 and current `origin/main`.
- API/web/worker/contracts: OpenAPI PASS, typecheck PASS, 62 tests PASS, build PASS, lint PASS, formatting PASS, `git diff --check` PASS for request policy hardening locally.
- Flutter/Next.js/worker: NOT_STARTED.
- Migration execution: CLOSED pending explicit approval.
- Production deployment: NOT_STARTED and CLOSED.

## Current blockers and dependencies

- Production Batch 03 application requires explicit user approval.
- The physical model decision register contains 41 open decisions. Batch-specific decisions must be resolved before source code encodes them.
- API-01/API-02/API-03 are approved; the first request-draft source slice may proceed under ADR-013.
- Local `main` has a preserved ahead commit corresponding to Batch 03 preflight work; do not reset or discard it.

## Highest next safe task

After delivering the request policy evaluator, declare reusable safe 401/403 OpenAPI responses for all protected request operations and enforce them with contract drift tests. Do not connect persistence or execute PROD-DB-03 without separate approval.

## Continuation checkpoint

- **Last completed task:** repository-backed request ownership/resource-state evaluator implemented locally; full 62-test monorepo gate PASS.
- **Active task:** policy evaluator delivery is in REVIEW pending commit/PR/CI; protected-operation 401/403 contract hardening is READY immediately afterward.
- **Owner:** `chore/marib-tax-autopilot-orchestrator` in `C:\projects\Marib_Tax-autopilot`.
- **Approval gates:** production Batch 03 (`PROD-DB-03`) remains closed. API-01 through API-04 are approved; reversible source engineering decisions are delegated.
- **Queue result:** API, Flutter, Next.js, and worker source foundations are established. Provider/database integration remains blocked or absent. Request predicate hardening passes locally; authentication error-contract drift protection is independently READY.
- **Highest next task:** deliver the policy evaluator through review gates, then add reusable 401/403 OpenAPI responses and contract tests.
- **Next action:** commit/push/open PR for the passing evaluator, monitor CI and merge if green, then synchronize and start the response-contract task in the same extended cycle.

## Realistic completion estimate

Repository/governance and database foundation through Batch 03 source are established, but all four runtime applications and most business database batches remain unimplemented. Overall implementation completion is estimated at **12%**; this is a planning estimate, not a delivery claim.
