# MARIB-TAX-BATCH-06-DESIGN-DECISION-GATE-01

## Decision

**HOLD — BATCH_06_SOURCE_REQUIRES_CORRECTION**

## Scope

- Repository: `tarasana-mufadhala/Marib_Tax`
- Reviewed migration: `supabase/migrations/20260721120000_create_service_requests_family.sql`
- Pre-correction SHA-256: `162E35E352956E5AC7AFE907D95FC0046A1AE6D76F2F27D5E1126FDA3DB6690E`
- Post-correction SHA-256: `F0446C8964C4345D79669C6926B983776213CB06BFD6E4C2DB27BDC3EFB0AE7D`
- Production state: Batches 01A–05 APPLIED / VERIFIED PASS; Batch 06 source-only; PROD-DB-06 CLOSED
- This gate did not run production preflight, dry-run, or `db push`

## Approved lifecycle boundaries (owner, 2026-07-20)

1. **Draft** — no hard delete; applicant may cancel draft before submit only; record actor/time/reason; after submit, delete and direct cancel are forbidden.
2. **Close vs archive** — close ends processing with a final decision; archive is a later administrative retention action; each action is recorded independently.
3. **Reopen** — taxpayer cannot reopen directly; only authorized staff with explicit permission; reopen reason mandatory; prior statuses and decisions remain retained.
4. **Versioning** — each request binds to a fixed `schema_version`; submitted snapshot is immutable; service-form change creates a new version; old requests stay on their original version.

## Compatibility matrix (pre-correction source)

| Boundary | Supported by tables/columns/constraints? | Gap |
| --- | --- | --- |
| Draft — no hard delete | Yes — all Batch 06 FKs use `ON DELETE RESTRICT`; no purge/cascade path | NestJS must refuse hard delete |
| Draft — cancel before submit only | Yes — `submitted_at` + `status_code` + append-only `request_status_histories` (actor/time/reason) | NestJS must require actor/reason for cancel and block post-submit cancel |
| Close vs archive independent | Yes — `request_close_archive_records.action_code` allows independent close and archive event rows; `archived_at` is a complementary marker | Comments incorrectly said DMOD-01 still open |
| Reopen staff-only + retained history | Partial — reopen table references `staff_profiles`; histories/decisions are separate retained tables with `ON DELETE RESTRICT` | `reason` and `reopened_by_staff_profile_id` were NULLABLE |
| Versioning / immutable submitted snapshot | Yes — `schema_version` on snapshot header/payload; `service_types.version_label`; FK retain catalogue rows; client grants revoked | Snapshot immutability and “no in-place form rewrite” remain NestJS/ADR-008 rules |
| Append-only histories protected at DB | Partial — default-deny RLS, revoked client grants, RESTRICT FKs, no seed | No UPDATE/DELETE deny triggers; NestJS must treat histories as append-only (same foundation pattern as Batches 04–05) |

## Close / archive / reopen gap assessment

- **No structural close↔archive merge gap:** one event table with `action_code` can record close and archive as separate rows.
- **Reopen gap (blocking):** nullable `reason` and nullable staff actor allowed rows that violate the approved mandatory-reason / staff-only reopen rule.
- **History retention:** prior `request_status_histories`, `request_decision_records`, and `request_decision_revisions` remain independent and are not deleted by reopen.

## Required correction (applied in this change set)

Batch 06 was **not** applied to production, so the unapplied source migration was corrected in place:

1. `requests.request_reopen_records.reason` → `NOT NULL` + `request_reopen_records_reason_not_blank_check`
2. `requests.request_reopen_records.reopened_by_staff_profile_id` → `NOT NULL`
3. Comments updated for ADR-016 draft/close/archive/reopen/versioning intent
4. Verifier extended to require the reopen NOT NULL / non-blank constraints

## Append-only note

Histories are protected at the foundation layer by RLS default-deny, revoked `PUBLIC/anon/authenticated/service_role` grants, and `ON DELETE RESTRICT`. Database triggers that block UPDATE/DELETE are intentionally deferred with other Batch 17 privilege work; NestJS must not update or delete history rows.

## Non-actions

- No `db push`
- No production dry-run
- No seed/backfill
- No deploy
- No real taxpayer data / notifications

## Follow-on

- PROD-DB-06 remains **CLOSED**
- Do not start production preflight until the corrected source is merged and a later PASS gate or explicit owner instruction authorizes preflight-only work
- Canonical decision record: `docs/architecture/adr/ADR-016-SERVICE-REQUEST-LIFECYCLE-BOUNDARIES.md`
