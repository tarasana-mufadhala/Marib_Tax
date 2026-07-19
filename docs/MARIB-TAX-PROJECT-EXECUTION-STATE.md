# Marib Tax Project Execution State

**Inventory time:** 2026-07-19 (Asia/Riyadh) — focused freshness check after PR #39 checkpoint

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git and delivery state

- `origin/main`: `e202274` (PR #39 merged; Foundation CI PASS on main).
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`, branch `chore/marib-tax-autopilot-orchestrator`.
- Primary worktree: `C:\projects\Marib_Tax`, branch `main` at local `8c3628f` (ahead 1 / behind origin; preserved, not rewritten).
- No open PRs at cycle start; latest main Foundation CI PASS.
- AGENTS.md: not present.

## Applications and packages

| Area                        | Status        | Evidence                                                                                             |
| --------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Monorepo/governance/ADRs/CI | COMPLETE      | Repository structure, ADRs through ADR-015, validation workflow, and baseline documents exist.       |
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
| 03 authorization model              | COMPLETE | APPROVED — apply next  | Migration `20260717120000_create_identity_authorization_model.sql`; SHA `BF15774686744A86D641D7B0B212F7B25E53D2AE6A8E4445662CA84475A00A86`; explicit PROD-DB-03 approval 2026-07-19. |
| 04 taxpayer registry/legal entities | READY (source after 03) | NOT_STARTED | ADR-015 unblocks tax-number/account-link encoding; apply only after Batch 03 APPLIED / VERIFIED PASS. Source authoring only — no production apply. |
| 05-18                               | BLOCKED  | NOT_STARTED            | Dependency-ordered behind earlier database batches.                                                                                                                        |

## Execution queue

| Priority | Task                                                 | State                  | Owner/worktree                                      | Gate/result                                                                                |
| -------- | ---------------------------------------------------- | ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1        | Record ADR-015 business decisions + report matrix    | ACTIVE                 | `chore/marib-tax-autopilot-orchestrator`            | Documentation PR then CI PASS.                                                             |
| 2        | Apply Batch 03 to production (PROD-DB-03)            | APPROVED               | Production operator / this worktree after docs merge | Exact preflight/apply/post-verify sequence mandatory.                                      |
| 3        | Post-apply verification for Batch 03                 | BLOCKED                | Same cycle after apply                              | Depends on successful authorized apply + verifier PASS.                                    |
| 4        | Author Batch 04 source migration                     | BLOCKED until 03 PASS  | Same cycle after 03 verified                        | Source only; never apply Batch 04 in this cycle.                                           |
| 5–16     | Prior API/app foundations                            | COMPLETE               | Merged PRs #23–#39                                  | See prior checkpoint.                                                                      |

## Quality gates

- Foundation validation: PASS on current `origin/main` (`e202274`).
- Migration execution: OPEN only for the single approved Batch 03 command after docs merge + preflight PASS.
- Production deployment: NOT_STARTED and CLOSED for applications.

## Current blockers and dependencies

- PROD-DB-03 apply waits for this documentation PR merge + CI PASS, then mandatory preflight.
- Remaining open DM/DMOD/PHY items do not block Batch 04 source for the ADR-015 slices.
- Local primary `main` ahead commit remains preserved.

## Highest next safe task

1. Merge documentation recording ADR-015 + PROD-DB-03 approval.
2. Execute PROD-DB-03 under the approval packet.
3. On verifier PASS, author Batch 04 source only.

## Continuation checkpoint

- **Last completed task:** PR #39 checkpoint merge `e202274` with Foundation CI PASS.
- **Active task:** record approved business decisions + report-to-field matrix; then PROD-DB-03.
- **Owner:** `chore/marib-tax-autopilot-orchestrator` in `C:\projects\Marib_Tax-autopilot`.
- **Approval gates:** PROD-DB-03 explicitly approved 2026-07-19 for the single reviewed migration/SHA/project/CLI only.
- **Highest next task:** documentation PR → CI → PROD-DB-03 preflight/apply/verify.
- **Next action:** after docs merge, recompute SHA, confirm project ref, history, objects, backup, dry-run single file, then one `db push --linked`.

## Realistic completion estimate

Repository/governance and database foundation through Batch 03 source are established; Batch 03 production apply is approved and next. Overall implementation completion remains approximately **12–15%**; this is a planning estimate, not a delivery claim.
