# MARIB-TAX-BATCH-07-DESIGN-DECISION-GATE-01

## Decision

**PASS — BATCH_07_SOURCE_COMPATIBLE_WITH_APPROVED_BALAGHAT_RULES**

## Scope

- Repository: `tarasana-mufadhala/Marib_Tax`
- Reviewed migration: `supabase/migrations/20260722120000_create_balaghat_family.sql`
- Accepted SHA-256: `10BA80E828CDB39AB60B1816F8EC6D263169CC6DFA6EC7821D979AE2EDA63118`
- Prior post-#58 SHA (superseded by uniqueness correction): `4D51F41BF5363662E4F6B1F09B7186E18587FAFE7CBA2656A018DABEE229EE0C`
- Pre-correction SHA-256: `71A430F7D9B11BC01202E675DEBD8ED5D7D15769E30F12A1FE07353807B9F7C7`
- Base main at this acceptance: `31ad36dcad5933c8584f2699cae8bbc125294f8e` (PR #58 merged)
- Production: Batches 01A–06 APPLIED / VERIFIED PASS; Batch 07 source-only until separate PROD-DB-07 approval
- Verifier: `scripts/db/verify/verify_batch_07_balaghat_family.sql`
- ADRs: ADR-016 (lifecycle), ADR-017 (filer/targets/property selection)

## Correction delta after PR #58

Acceptance re-checked the merged #58 source against the owner uniqueness rule (“القيود والفهارس تمنع التكرار غير المقصود”). Indexes alone do not prevent duplicate selection rows, so the unapplied source was corrected before PASS:

| Table | UNIQUE constraint |
| --- | --- |
| `balagh_selected_targets` | `(balagh_id, taxpayer_id, target_role_code)` |
| `balagh_selected_properties` | `(balagh_id, property_id)` |
| `balagh_selected_property_units` | `(balagh_selected_property_id, property_unit_id)` |
| `balagh_selected_activities` | `(balagh_id, commercial_activity_id)` |
| `balagh_selected_branches` | `(balagh_selected_activity_id, branch_id)` |

Verifier checks for these UNIQUE names and continues to reject `cases` and `masterdata.property_ownership_units` (TABLE-021).

## Compatibility matrix (accepted source)

| Boundary | Result | Evidence |
| --- | --- | --- |
| 1. Root filer + type; taxpayer_id not sole ownership proof | PASS | `filer_profile_id` NOT NULL; `balagh_type_code` NOT NULL + non-blank; optional `ownership_record_id` on selected properties |
| 2. Multi-target; non-empty target identity; no unintended duplicates | PASS | `balagh_selected_targets` 1:N; `taxpayer_id` + non-blank `target_role_code` required; UNIQUE on `(balagh_id, taxpayer_id, target_role_code)` |
| 3. Multi activities/branches; branch under selected activity; optional for property balaghs | PASS | selection children 0..N; branch FK → selected activity; no forced activity/branch on root |
| 4. Multi properties/units; unit under selected property; no TABLE-021 | PASS | selection tables present; unit FK → selected property; `property_ownership_units` not created |
| 5. Lifecycle (no hard delete; close≠archive; staff reopen+reason; immutable snapshots; append-only histories) | PASS | ADR-016 comments/constraints; reopen reason/staff NOT NULL + non-blank; snapshot `schema_version`; history tables |
| 6. Safety (no `cases`; no FR catalogue seed; no policies/grants; RLS on all 16) | PASS | 16 CREATE TABLE + 16 ENABLE RLS; no INSERT/POLICY/GRANT; comments forbid `cases`/TABLE-021 |

## Acceptance checks

| Check | Result |
| --- | --- |
| SHA-256 recomputed and recorded | PASS — `10BA80E828CDB39AB60B1816F8EC6D263169CC6DFA6EC7821D979AE2EDA63118` |
| Exactly 16 CREATE TABLE | PASS |
| Exactly 16 RLS enablements | PASS |
| No INSERT / seed / POLICY / positive client GRANT | PASS |
| No relation named `cases` | PASS (design; verifier asserts absence post-apply) |
| No TABLE-021 / `property_ownership_units` | PASS |
| Filer + type constraints | PASS |
| Selection UNIQUE constraints | PASS |
| Reopen reason/staff mandatory | PASS |

## Follow-on

- Design gate is PASS; PROD-DB-07 may proceed to **preflight-only** work.
- Production apply remains closed until an explicit owner approval packet authorization.
- Canonical selection rules: ADR-017; lifecycle: ADR-016.
