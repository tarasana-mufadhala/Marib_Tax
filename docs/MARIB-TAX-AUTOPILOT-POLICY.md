# Marib Tax Autopilot Policy

## Operating rule

Discover current source state before every cycle, preserve work with known or unknown ownership, isolate local blockers, and continue the highest dependency-correct safe task. Never repeat merged work or an applied migration.

## Status vocabulary

`COMPLETE`, `SOURCE_READY`, `RUNTIME_READY`, `APPLIED`, `ACTIVE`, `REVIEW`, `BLOCKED`, `REQUIRES_USER_APPROVAL`, and `NOT_STARTED`.

## Autonomous source actions

The autopilot may inspect source and Git state; create isolated branches/worktrees; edit source, tests, and documentation; draft migrations; run local validation; commit; push normal branches; open pull requests; monitor and fix CI; and merge changes only after all gates pass.

The project owner has delegated all reversible, Git-reviewable source and engineering decisions to the autopilot. This includes API/DTO/schema design, authentication and authorization boundaries, source-only security architecture, packages/tooling, modules, repository ports/adapters, OpenAPI, errors, tests, logging/audit interfaces, non-production runtime registration, source migrations, verification scripts, ADRs, and technical governance. Choose the simplest conservative standards-based option, document material choices in an ADR, test positive and negative behavior, and do not create a new human approval gate for a purely technical reversible source decision.

## Fail-closed actions

Fresh explicit user approval is required before any production migration/SQL, database write, real operational import, taxpayer-data mutation, payment confirmation, official decision, real SMS/OTP, deployment/publish, secret change, RLS disablement, destructive database action, force push, or deletion of unmerged work.

Human approval also remains required for legal/regulatory wording, unresolved business behavior that changes service meaning, and a HIGH/CRITICAL risk that cannot be isolated. The source-decision delegation never implies production approval.

At a production gate, prepare the exact command, preflight, expected effects, stop conditions, and post-verification, then wait for approval while continuing independent source work.

## Quality gates

Use precheck, baseline validation, positive and negative authorization tests, typecheck, build, lint, `git diff --check`, independent security/financial review where applicable, commit, PR, CI, findings remediation, and state-file update. Do not merge with failed CI or unresolved HIGH/CRITICAL security findings.

## Migration governance

Use one dependency-ordered migration batch at a time. Record filename and SHA-256; review all SQL; verify RLS and dependency order; prohibit automatic destructive rollback; stop on partial/failing apply; and never start the next batch until the previous batch is applied, verified, and accepted.

An approval for a migration already present in remote history is stale and must never be treated as permission to replay it. Record the mismatch, perform no dry-run/apply retry, and keep the actual next production batch behind its own fresh approval.

Source-only authoring of the next dependency-ordered batch does not authorize its linked preflight or apply. Preserve the migration SHA and verifier as review evidence, then keep production closed until a fresh approval names that exact batch and hash.

## Cycle loop

Every scheduled run and every Run now is an **extended work cycle**, not a single-task invocation.

At cycle start, read the state files and perform a focused freshness check of Git, worktrees, branches, PRs, CI, and evidence that changed since the last checkpoint. Do not repeat a full inventory when the recorded state is current unless a discrepancy, stale dependency, or missing evidence requires it.

After every completed task:

1. Update the execution state, decisions register when applicable, and autopilot log.
2. Re-evaluate the queue and actual dependency graph.
3. Select the highest safe `READY` task.
4. Start it in the same run.
5. Repeat the sequence.

A commit, push, PR, successful CI run, review completion, or merge is a task boundary, not a cycle stop condition. Continue immediately when an independent safe `READY` task remains.

The extended cycle may stop only when:

- no safe `READY` task remains;
- all remaining paths are at a production or user-decision approval gate;
- the execution time limit is approaching; or
- a material risk cannot be isolated safely.

## Time-limit checkpoint

Before an approaching execution limit, persist a precise checkpoint in the execution state and log. It must identify:

- last completed task and evidence;
- any active task and exact current step;
- owning branch and worktree;
- commit, PR, review, and CI state;
- blockers and approval gates;
- highest next safe task; and
- the first command or action for the next run.

The next scheduled or Run now cycle resumes from that checkpoint after a focused verification. It must not redo the full inventory or repeat completed work unless the verification reveals drift.

The 2026-07-18 request-policy checkpoint confirms this extended-cycle rule is active: passing local gates places a task in review, and the next independent source-contract task remains eligible after delivery without reopening production gates.
