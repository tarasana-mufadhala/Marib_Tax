# MARIB Tax DB Foundation — Batch 07 Balaghat Report

## Status

This is a **source-only** authoring batch. It has not been applied to any database. Production apply remains closed and requires a new explicit `PROD-DB-07` approval after a separate fresh preflight.

## Delivered source

- Migration: `supabase/migrations/20260722120000_create_balaghat_family.sql`
- SHA-256: `71A430F7D9B11BC01202E675DEBD8ED5D7D15769E30F12A1FE07353807B9F7C7`
- Read-only verifier: `scripts/db/verify/verify_batch_07_balaghat_family.sql`
- Verifier SHA-256: `37D9444053E6646ECFF862CFA60EE5416C0735AB37EA5898B593B169B8102C52`

## Scope

The migration defines TABLE-037 through TABLE-049 in the `balaghat` schema:

- `balaghs` and selected activity/branch children, with the branch bound to its selected activity (REL-044)
- versioned form snapshot header/payload records
- append-only status and assignment histories
- completion request/response cycle
- decision and additive decision revision records
- independent close/archive events and staff-only reopen evidence

All thirteen tables use application-supplied UUIDs, dependency-preserving `RESTRICT` foreign keys, default-deny RLS with no policies, revoked client/public grants, and no seeds or backfills.

## Lifecycle and isolation

- The Batch 06 accepted lifecycle pattern is carried to its explicitly parallel Balaghat family: no hard-delete workflow, independent close/archive events, retained decision history, non-blank staff reopen evidence, and immutable submitted snapshots.
- Balaghat remains isolated in its own schema and does not mutate taxpayer, activity, branch, property, or ownership master data.
- No table named `cases` is introduced.

## Source verification

- 13 expected `CREATE TABLE` statements and 13 matching RLS enablements.
- No `INSERT`, `UPDATE`, `DELETE`, `CREATE POLICY`, or positive `GRANT` statement.
- The verifier checks dependencies, expected tables, RLS, indexes, empty tables, forbidden grants, unexpected policies, absence of `cases`, and reopen constraints; success is `final_status = PASS`.

## Explicit non-actions

- No production preflight or apply
- No `db push`, migration repair/reset, direct SQL session, seed, or backfill
- No Batch 08 source or production work
- No deployment, secret change, taxpayer-data mutation, or real notification
