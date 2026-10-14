# MARIB-TAX-DB-FOUNDATION-BATCH-11-PRODUCTION-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_11_PRODUCTION_APPLY_AND_STRUCTURAL_VERIFICATION_COMPLETE

## Scope

- Environment: Linked project `sjmtiwzddztxfrncwkpx` (Production/Staging target per lead directive)
- Repository: `tarasana-mufadhala/Marib_Tax`
- HEAD at apply: `8542225` (post PR #75 merge `b61dc85`)
- Verification report created: `2026-07-31`
- Supabase CLI: `2.109.1`
- Batch 12+ work during apply phase: None (uncommitted local sources held aside; see note below)
- Storage bucket/policy/upload/download during apply phase: None

## Applied Migration

- Version: `20260726120000`
- File: `supabase/migrations/20260726120000_create_notify_notification_delivery.sql`
- SHA-256: `1925A56DA66BC523605B780E4FCE52A7DB92A07822169FC99739AB9F8DDD5DC0`
- Verifier: `scripts/db/verify/verify_batch_11_notification_delivery.sql`
- Verifier SHA-256: `E4F03541B3EB25040B26BB2EBD248392CAFC8E3FC3865611D2663120BA6EA0C4`
- Applied migrations in the controlled session: 1
- Seed executed: No
- Backfill executed: No
- Repair executed: No
- Reset executed: No
- Rollback executed: No
- `--include-all`: Not used
- Dashboard SQL / direct `psql`: Not used
- Verifier execution path: `npx --yes supabase@2.109.1 db query --linked --file ...` (approved linked mechanism; no direct `psql`)

## Single-Apply Isolation Note

Uncommitted Batch 12/13/14 migration sources were temporarily moved out of `supabase/migrations/` before the dry-run/apply and restored afterwards, guaranteeing exactly one authorized migration per apply. No file content was modified; Batch 11 SHA-256 was re-verified before apply and matched the preflight report.

## Pre-Apply Gates

| Gate | Result |
| --- | --- |
| Migration SHA-256 exact match | PASS — `1925A56DA66BC523605B780E4FCE52A7DB92A07822169FC99739AB9F8DDD5DC0` |
| Verifier SHA-256 exact match | PASS — `E4F03541B3EB25040B26BB2EBD248392CAFC8E3FC3865611D2663120BA6EA0C4` |
| Linked project ref `sjmtiwzddztxfrncwkpx` | PASS |
| Remote history: 01A–10 once each; Batch 11 absent | PASS — latest remote version before apply was `20260725120000` |
| Pre-apply dry-run listed exactly Batch 11 | PASS |
| Preflight evidence | PASS — `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-11-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md` (PASS_WITH_NOTES); PR #75 MERGED |
| Out-of-catalogue objects | N/A — `device_tokens` / `notification_preferences` remain excluded pending Change Request; not present in source or remote |

## Apply Result

- Command: `npx --yes supabase@2.109.1 db push --linked`
- Exit result: success; remote history gained exactly `20260726120000`
- Migration applied: `20260726120000_create_notify_notification_delivery.sql`
- Additional migrations: none
- This was the only production write authorized for Batch 11.

## Migration-History Verification (post-apply)

| Migration | Remote |
| --- | ---: |
| `20260715175300` — Batch 01A | 1 |
| `20260716190000` — Batch 02 | 1 |
| `20260717120000` — Batch 03 | 1 |
| `20260719120000` — Batch 04 | 1 |
| `20260720120000` — Batch 05 | 1 |
| `20260721120000` — Batch 06 | 1 |
| `20260722120000` — Batch 07 | 1 |
| `20260723120000` — Batch 08 | 1 |
| `20260724120000` — Batch 09 | 1 |
| `20260725120000` — Batch 10 | 1 |
| `20260726120000` — Batch 11 | 1 |

Post-apply dry-run (after restoring local sources): pending = Batch 12/13/14 local sources only, which are **not approved for apply**; no unexpected drift.

## Structural Verification

Read-only verifier: `scripts/db/verify/verify_batch_11_notification_delivery.sql`

| Check | Result |
| --- | --- |
| `final_status` | **PASS** |
| `table_mismatch_count` / `unexpected_table_count` | 0 / 0 |
| `forbidden_grant_count` / `policy_count` | 0 / 0 |
| `secret_like_column_count` | 0 |
| `cases_relation_absent` | true |
| `template_code_unique` / `channel_code_unique` | true / true |
| `read_state_message_recipient_unique` | true |
| `attempt_number_check` / `retry_number_check` / `outbox_attempt_count_check` | true |
| Required-field checks (delivery status, attempt message/status, retry attempt, read-state recipient, template/channel codes, publication state) | true |
| `attempt_count_default_zero` | true |
| `message_idempotency_scoped_unique` / `outbox_idempotency_scoped_unique` | true / true |
| Indexes: `outbox_worker_poll_index`, `recipient_inbox_index`, `request_context_index`, `balagh_context_index` | true |
| Prereq tables present (service_requests, balaghs, payment_notices, user_profiles, notify schema) | true |
| Row counts all seven tables | 0 |
| `table_mismatches` | `[]` |

## Resulting Production Objects

Seven empty `notify` delivery-family tables with RLS enabled, no policies, no unexpected grants, no seed rows:

- `notify.notification_templates`
- `notify.notification_channel_configurations`
- `notify.notification_messages`
- `notify.delivery_attempts`
- `notify.delivery_retries`
- `notify.notification_read_states`
- `notify.notification_outbox_messages`

## Production impact

Batch 11 metadata/structure only: seven empty notification-delivery tables with default-deny RLS. No SMS/Push sending, no channel credentials, no Storage mutation, no seed/backfill, no deploy, no real taxpayer data.

## Non-Actions Confirmation

This apply session did not run `--include-all`, migration repair, `db reset`, dashboard SQL, direct `psql`, seed/backfill, Storage bucket/policy creation, real upload/download, Batch 12 source/apply, deploy, or real SMS/OTP/WhatsApp. Approval for this apply was the lead directive issued 2026-07-31 authorizing Batch 11 push + verifier; no earlier approval was reused.

## Follow-on

- PROD-DB-11 = **APPLIED / VERIFIED PASS** (`BATCH_11 = APPLIED / VERIFIED PASS`)
- Batch 12 (imports) source exists locally (uncommitted); its governance cycle (Design Gate → PR → CI → Preflight → approval → Apply) remains to be run. Apply stays closed until a separate explicit approval.
