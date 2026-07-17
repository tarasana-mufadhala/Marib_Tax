# Marib Tax Project Execution State

**Inventory time:** 2026-07-17 (Asia/Riyadh)

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git and delivery state

- `origin/main`: `c11794aabc3c5556280f1078d39c6df3444b8ee3` (PR #18 merged).
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
| NestJS API | NOT_STARTED | `apps/api` contains a README only. |
| NestJS worker | NOT_STARTED | `apps/worker` contains a README only. |
| Shared packages | NOT_STARTED | Package directories contain READMEs only. |
| OpenAPI/runtime DTOs | NOT_STARTED | API baseline documentation exists; no runtime contracts are implemented. |

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
| 5 | OpenAPI paths, verbs, and version boundary | REQUIRES_USER_APPROVAL | Product/API authority | API baseline explicitly marks paths and verbs as requiring later approval; ADR-006 prohibits inventing undocumented production interfaces. |
| 6 | Runtime scaffolding and shared contracts | BLOCKED | Future isolated worktree | Depends on an approved OpenAPI authoring boundary and toolchain/version baseline; no runtime code currently exists. |

## Quality gates

- Foundation validation: PASS on PR #17 and current `origin/main`.
- Typecheck/build/lint for Flutter, Next.js, NestJS: NOT_APPLICABLE / NOT_STARTED because the runtime applications are placeholders.
- Migration execution: CLOSED pending explicit approval.
- Production deployment: NOT_STARTED and CLOSED.

## Current blockers and dependencies

- Production Batch 03 application requires explicit user approval.
- The physical model decision register contains 41 open decisions. Batch-specific decisions must be resolved before source code encodes them.
- API paths, HTTP verbs, initial version prefix, and compatibility boundary require approval before an authoritative OpenAPI document or client/server contracts are authored.
- Local `main` has a preserved ahead commit corresponding to Batch 03 preflight work; do not reset or discard it.

## Highest next safe task

Request explicit approval using `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-03-PRODUCTION-APPROVAL-PACKET.md`; do not execute it without approval. Continue only independent source work that does not violate the one-batch migration sequence.

## Continuation checkpoint

- **Last completed task:** API approval boundary recorded and merged in PR #20 (`ef1ef192bda98cecdbd15fb7413b550e8b8cba7f`), Foundation CI PASS.
- **Active task:** extended-cycle policy update and automation prompt synchronization.
- **Owner:** `chore/marib-tax-autopilot-orchestrator` in `C:\projects\Marib_Tax-autopilot`.
- **Approval gates:** production Batch 03 (`PROD-DB-03`) and authoritative OpenAPI boundary (`API-01`).
- **Highest next safe task after this policy change:** re-evaluate non-interface runtime/tooling foundation work that does not encode unapproved API routes or advance the blocked migration sequence.
- **Next-run first action:** focused fetch/PR/CI verification, read this checkpoint, then inspect the bounded runtime/tooling candidate; do not repeat the initial repository inventory.

## Realistic completion estimate

Repository/governance and database foundation through Batch 03 source are established, but all four runtime applications and most business database batches remain unimplemented. Overall implementation completion is estimated at **12%**; this is a planning estimate, not a delivery claim.
