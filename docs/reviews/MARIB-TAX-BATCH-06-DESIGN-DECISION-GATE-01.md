# MARIB-TAX-BATCH-06-DESIGN-DECISION-GATE-01

## Decision

**PASS — BATCH_06_SOURCE_COMPATIBLE_WITH_APPROVED_LIFECYCLE**

## Scope

- Repository: `tarasana-mufadhala/Marib_Tax`
- Reviewed migration: `supabase/migrations/20260721120000_create_service_requests_family.sql`
- Corrected source SHA-256: `F0446C8964C4345D79669C6926B983776213CB06BFD6E4C2DB27BDC3EFB0AE7D`
- Prior HOLD SHA (superseded before apply): `162E35E352956E5AC7AFE907D95FC0046A1AE6D76F2F27D5E1126FDA3DB6690E`
- Base main at acceptance: `52b5604906189815600279b7e9655d854d378f54` (PR #54)
- Production state: Batches 01A–05 APPLIED / VERIFIED PASS; Batch 06 corrected source-only; PROD-DB-06 CLOSED until separate apply approval
- Canonical lifecycle record: `docs/architecture/adr/ADR-016-SERVICE-REQUEST-LIFECYCLE-BOUNDARIES.md`

## Post-correction acceptance (2026-07-20)

| Check | Result |
| --- | --- |
| SHA-256 exact match `F0446C8964C4345D79669C6926B983776213CB06BFD6E4C2DB27BDC3EFB0AE7D` | PASS |
| `request_reopen_records.reason` NOT NULL | PASS |
| `request_reopen_records.reopened_by_staff_profile_id` NOT NULL | PASS |
| `request_reopen_records_reason_not_blank_check` (`btrim(reason) <> ''`) | PASS |
| Verifier asserts reopen NOT NULL / non-blank constraints | PASS |
| ADR-016 records draft / close-archive / reopen / versioning | PASS |
| No hard-delete path (`ON DELETE RESTRICT` throughout; no purge SQL) | PASS |
| Draft cancel before submit only (`submitted_at` + status history; NestJS post-submit lock) | PASS |
| Close and archive independent (`request_close_archive_records.action_code`) | PASS |
| Reopen staff-only at application layer (staff FK required; taxpayer cannot reopen via this table) | PASS |
| Submitted snapshots immutable by design (NestJS; client grants revoked; unique payload per header) | PASS |
| Fixed `schema_version` binding on snapshot header/payload | PASS |
| Histories append-only by design (comments + RLS default-deny + NestJS no UPDATE/DELETE) | PASS |
| No relation named `cases` | PASS |
| No FR-201…206 catalogue seed/backfill in migration | PASS |

## Compatibility matrix (corrected source)

| Boundary | Supported? | Notes |
| --- | --- | --- |
| Draft — no hard delete | Yes | All Batch 06 FKs use `ON DELETE RESTRICT` |
| Draft — cancel before submit only | Yes | Status history records actor/time/reason; NestJS blocks post-submit cancel/delete |
| Close vs archive independent | Yes | Separate event rows via `action_code` |
| Reopen staff-only + mandatory reason | Yes | Staff FK + reason NOT NULL + non-blank CHECK |
| Versioning / immutable submitted snapshot | Yes | Snapshot `schema_version`; catalogue `version_label`; NestJS immutability |
| Append-only histories | Yes | Foundation default-deny; NestJS forbids UPDATE/DELETE (Batch 17 may add DB deny triggers later) |
| No `cases` / no catalogue seed | Yes | Explicitly excluded |

## Prior HOLD (retained evidence)

The first gate pass found nullable reopen `reason` / staff actor and recorded **HOLD — BATCH_06_SOURCE_REQUIRES_CORRECTION**. Corrections landed in PR #54 before any production apply. This acceptance supersedes HOLD for source compatibility only; it does **not** authorize PROD-DB-06 apply.

## Non-actions at acceptance

- No `db push` without `--dry-run` during acceptance itself
- No seed/backfill, repair, reset, deploy, or real notifications

## Follow-on

PROD-DB-06 production preflight may proceed as a separate controlled read-only gate. Apply remains closed until an independent explicit owner approval.
