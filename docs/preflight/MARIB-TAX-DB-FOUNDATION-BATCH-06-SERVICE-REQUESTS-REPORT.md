# MARIB Tax DB Foundation — Batch 06 Service Requests Report

## Status

This is a **source-only** authoring batch. It has not been applied to any database, including production. Do not apply it to production as part of this task. PROD-DB-06 requires a separate explicit approval.

## Delivered source

- Migration: `supabase/migrations/20260721120000_create_service_requests_family.sql`
- SHA-256: `162E35E352956E5AC7AFE907D95FC0046A1AE6D76F2F27D5E1126FDA3DB6690E`
- Read-only verifier: `scripts/db/verify/verify_batch_06_service_requests_family.sql`

## Scope

The migration defines TABLE-023 through TABLE-036 in the `requests` schema:

- `service_types`, `service_requests`
- selected activities/branches (REL-028 selected-branch under selected-activity)
- form snapshot header/payload hybrid
- append-only status, assignment, and decision revision histories
- completion request/response cycle
- decision, close/archive, and reopen records

Each table uses application-supplied UUID identifiers, default-deny RLS with no policies, revoked grants for public/client roles, and no seed data.

## Explicit non-actions

- No FR-201…206 `service_types` catalogue seed/backfill
- No table named `cases`
- No production `db push`, repair, reset, dashboard SQL, or direct `psql`
- Open items remain open: DMOD-06 draft delete, DMOD-01 close/archive semantics, DMOD-11 reopen authority, ADR-008 versioning detail

The verifier fails if expected tables/indexes/RLS mismatch, if forbidden grants/policies/seeds appear, or if any relation named `cases` is present.
