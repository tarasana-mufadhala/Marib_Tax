# MARIB Tax DB Foundation — Batch 06 Service Requests Report

## Status

This is a **source-only** authoring batch. It has not been applied to any database, including production. Do not apply it to production as part of this task. PROD-DB-06 requires a separate explicit approval after the design-decision gate.

## Delivered source

- Migration: `supabase/migrations/20260721120000_create_service_requests_family.sql`
- SHA-256: `F0446C8964C4345D79669C6926B983776213CB06BFD6E4C2DB27BDC3EFB0AE7D`
- Prior SHA (superseded before apply): `162E35E352956E5AC7AFE907D95FC0046A1AE6D76F2F27D5E1126FDA3DB6690E`
- Read-only verifier: `scripts/db/verify/verify_batch_06_service_requests_family.sql`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-06-DESIGN-DECISION-GATE-01.md` — **HOLD** with source correction applied
- Lifecycle ADR: `docs/architecture/adr/ADR-016-SERVICE-REQUEST-LIFECYCLE-BOUNDARIES.md`

## Scope

The migration defines TABLE-023 through TABLE-036 in the `requests` schema:

- `service_types`, `service_requests`
- selected activities/branches (REL-028 selected-branch under selected-activity)
- form snapshot header/payload hybrid with `schema_version`
- append-only status, assignment, and decision revision histories
- completion request/response cycle
- decision, close/archive, and reopen records

Each table uses application-supplied UUID identifiers, default-deny RLS with no policies, revoked grants for public/client roles, and no seed data.

## Lifecycle encoding (ADR-016)

- Draft cancel uses status history (actor/time/reason) before `submitted_at`; no hard delete.
- Close and archive are independent `request_close_archive_records` events distinguished by `action_code`.
- Reopen requires non-blank `reason` and `reopened_by_staff_profile_id` (staff-only).
- Submitted snapshots bind `schema_version`; catalogue/form changes create new versions without rewriting old requests.

## Explicit non-actions

- No FR-201…206 `service_types` catalogue seed/backfill
- No table named `cases`
- No production `db push`, repair, reset, dashboard SQL, or direct `psql`
- No production preflight/dry-run while the design gate is HOLD / PROD-DB-06 closed
