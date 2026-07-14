# Development Workflow — Marib Tax System

## Branches

- `main` is protected. No direct pushes.
- Work occurs on short-lived branches (`feature/`, `fix/`, `chore/`, `docs/`, `security/`).
- Keep branches up to date with the integration target before review.

## Commits

- Use Conventional Commits.
- Prefer small, reviewable commits that map to a single intent.
- Do not commit secrets, generated noise, or unrelated reformatting.

## Pull request lifecycle

1. Create branch from the agreed base.
2. Implement within approved task scope.
3. Open PR using the repository template.
4. Pass CI gates and required reviews.
5. Merge only after Definition of Done items applicable to the change are satisfied.
6. Delete the branch after merge when appropriate.

## Reviews

- At least one informed review for functional changes.
- Security-sensitive and migration changes require explicit security/data review notes.
- CODEOWNERS apply to sensitive paths.

## CI gates

- Foundation validation (`scripts/validate-foundation.sh`) and whitespace checks for repository hygiene.
- Future application CI will add lint, test, and build gates per workspace — not part of this foundation task.

## Migrations

- Schema changes ship only as versioned migrations.
- Never edit applied migrations.
- No automatic production migrations.
- Document rollback expectations in the PR.

## Releases

- Releases promote through Development → Staging → Production with independent environments.
- Production releases require explicit approval and recorded checklist evidence.

## Rollback expectations

- Every release must state a rollback approach (revert deploy, migration reverse plan, or feature flag strategy).
- Destructive data operations require explicit written approval and are never informal.
