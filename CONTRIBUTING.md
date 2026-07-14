# Contributing to Marib Tax System

This repository is private proprietary software. Contribution access is limited to authorized project members.

## Branching

- Do **not** push directly to `main`.
- Create a feature (or chore/fix/docs) branch from the current integration branch.
- Prefer names such as `feature/<task-id>-short-name`, `fix/<task-id>-short-name`, or `chore/<task-id>-short-name`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `security:`
- Reference the task ID in the body or footer when applicable.

## Pull requests

- Open a PR against the agreed target branch (never force-push to `main`).
- Complete the PR template fully.
- Keep PRs focused; do not mix unrelated scope.
- Address review comments before merge.

## Required tests

- Business rules, permissions, negative access cases, state transitions, and failure paths must be covered.
- Happy-path-only tests are insufficient for Definition of Done.
- CI gates must pass before merge.

## Database migration review

- Every schema change requires a versioned migration under `database/migrations/`.
- Never edit an already-applied migration.
- Migration PRs require explicit review of rollback/impact notes.
- Production migrations are never automatic.

## Security review

- No secrets in source, logs, or client bundles.
- No Supabase service-role credentials in Flutter or Next.js client code.
- Authorization is enforced server-side.
- Flag security impact in the PR template.

## Definition of Done

Follow [docs/governance/DEFINITION-OF-DONE.md](docs/governance/DEFINITION-OF-DONE.md). A feature is not complete until acceptance, authorization, audit, RTL (where relevant), API docs, migrations (if any), tests, failure handling, secret hygiene, and QA approval are satisfied.

## AI-assisted changes

- AI-generated bulk implementation without human review is prohibited.
- Authors remain responsible for correctness, security, and scope compliance.
- Do not expand scope beyond the approved task or change request.
