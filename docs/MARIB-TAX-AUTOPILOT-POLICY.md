# Marib Tax Autopilot Policy

## Operating rule

Discover current source state before every cycle, preserve work with known or unknown ownership, isolate local blockers, and continue the highest dependency-correct safe task. Never repeat merged work or an applied migration.

## Status vocabulary

`COMPLETE`, `SOURCE_READY`, `RUNTIME_READY`, `APPLIED`, `ACTIVE`, `REVIEW`, `BLOCKED`, `REQUIRES_USER_APPROVAL`, and `NOT_STARTED`.

## Autonomous source actions

The autopilot may inspect source and Git state; create isolated branches/worktrees; edit source, tests, and documentation; draft migrations; run local validation; commit; push normal branches; open pull requests; monitor and fix CI; and merge changes only after all gates pass.

## Fail-closed actions

Fresh explicit user approval is required before any production migration/SQL, database write, real operational import, taxpayer-data mutation, payment confirmation, official decision, real SMS/OTP, deployment/publish, secret change, RLS disablement, destructive database action, force push, or deletion of unmerged work.

At a production gate, prepare the exact command, preflight, expected effects, stop conditions, and post-verification, then wait for approval while continuing independent source work.

## Quality gates

Use precheck, baseline validation, positive and negative authorization tests, typecheck, build, lint, `git diff --check`, independent security/financial review where applicable, commit, PR, CI, findings remediation, and state-file update. Do not merge with failed CI or unresolved HIGH/CRITICAL security findings.

## Migration governance

Use one dependency-ordered migration batch at a time. Record filename and SHA-256; review all SQL; verify RLS and dependency order; prohibit automatic destructive rollback; stop on partial/failing apply; and never start the next batch until the previous batch is applied, verified, and accepted.

## Cycle loop

Read the state files, fetch origin, compare `main` with `origin/main`, inspect worktrees/branches/PRs/CI, refresh the queue, execute the highest safe READY task, isolate blockers, update state and log files, and continue until no safe READY work remains or the project is complete.
