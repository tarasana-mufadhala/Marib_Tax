# MARIB Tax Attachments PR Dependency Order

## Required ordered merge

Do not merge until the consolidated report records `PASS — ATTACHMENTS_WAVE_01_INTEGRATION_READY_FOR_ORDERED_MERGE`.

1. PR #61 — corrected Batch 08 database source.
2. Fetch `origin/main`, update PR #63, rerun CI; merge API contracts and policy.
3. Fetch `origin/main`, update PR #65, rerun CI; merge policy-bound security evidence.
4. Fetch `origin/main`, update PR #64, rerun CI; merge Flutter mocks.
5. Fetch `origin/main`, update PR #62, rerun CI; merge web mocks.
6. Refresh this evidence with merge SHAs, update PR #66, rerun CI, then merge integration documents.

Stop the sequence on a conflict, dirty worktree, unexpected overlap, failed check, or contract drift. Every PR must remain free of `package-lock.json`, secrets, production operations, real storage access, and taxpayer data.

After all merges, verify clean `origin/main`, record every merge SHA, and state:

- `PROD-DB-08 = CLOSED`
- `BATCH_08_SOURCE = MERGED / NOT APPLIED`

Production preflight/apply, HTTP endpoints, repositories, buckets, policies, signed-object adapters, deployment, and notifications require separate future gates.
