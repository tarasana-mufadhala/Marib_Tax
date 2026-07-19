# MARIB-TAX-BATCH-07-DESIGN-DECISION-GATE-01

## Decision

**HOLD — BATCH_07_SOURCE_REQUIRES_CORRECTION**

## Scope

- Repository: `tarasana-mufadhala/Marib_Tax`
- Reviewed migration: `supabase/migrations/20260722120000_create_balaghat_family.sql`
- Pre-correction SHA-256: `71A430F7D9B11BC01202E675DEBD8ED5D7D15769E30F12A1FE07353807B9F7C7`
- Post-correction SHA-256: `4D51F41BF5363662E4F6B1F09B7186E18587FAFE7CBA2656A018DABEE229EE0C`
- Base main at review: `8942ca27dc76d1213b09070295096489c88beb6b` (PR #57)
- Production: Batches 01A–06 APPLIED / VERIFIED PASS; Batch 07 source-only; PROD-DB-07 CLOSED
- This gate did **not** run production preflight, dry-run, or `db push`

## Compatibility matrix (pre-correction source)

| Boundary | Supported? | Gap |
| --- | --- | --- |
| 1. Filer = property owner; retain identity + ownership link | Partial | Only generic `taxpayer_id` + optional `created_by_profile_id`; no mandatory filer profile; no ownership/property selection link |
| 2. Multi-target taxpayers/users | **No** | No multi-value target relation; single root `taxpayer_id` only |
| 3. Multi activities/branches; branch under selected activity | Yes | `balagh_selected_activities` / `balagh_selected_branches` + REL-044 FK; NestJS must still match branch↔activity commercial ids |
| 4. Multi properties/units; no forced activity/branch; no TABLE-021 | Partial | Activities/branches already optional 0..N; **no** property/unit selection tables; TABLE-021 correctly absent |
| 5. Lifecycle (no hard delete; close≠archive; staff reopen+reason; immutable snapshots; append-only) | Yes | ADR-016 parallels already encoded |
| 6. Flexible minutes/results via archived snapshot; retain decisions on reopen | Yes | JSONB form snapshot/payload; separate decision/history tables retained |
| 7. FR-201…206 types without catalogue seed | **No** | No `balagh_type_code` (or equivalent) on root |

## Required correction (applied in this change set)

Batch 07 was **not** applied to production, so the unapplied source was corrected in place:

1. `balaghs.balagh_type_code` NOT NULL + non-blank CHECK (type discriminator without seed catalogue)
2. `balaghs.filer_profile_id` NOT NULL → `identity.user_profiles` (submitter identity)
3. Clarify `taxpayer_id` as notifying / property-owner taxpayer (not multi-target substitute)
4. Add `balagh_selected_targets` (1:N targets with `target_role_code`)
5. Add `balagh_selected_properties` (optional `ownership_record_id` evidence link)
6. Add `balagh_selected_property_units` (case selection only; **not** TABLE-021)
7. Expand verifier to 16 tables + filer/type + property dependencies

## Post-correction acceptance snapshot

| Check | Result |
| --- | --- |
| 16 CREATE TABLE / 16 RLS enablements | PASS |
| No INSERT / seed / POLICY / positive client GRANT | PASS |
| No `cases` / no TABLE-021 | PASS |
| Multi-target + property/unit selection present | PASS |
| Filer + type constraints present | PASS |
| Reopen reason/staff mandatory | PASS |

## Non-actions

- No production preflight
- No dry-run / `db push`
- No seed/backfill, deploy, or real notifications

## Follow-on

- PROD-DB-07 remains **CLOSED**
- Do not start production preflight until corrected source is merged and a later PASS acceptance or explicit owner instruction authorizes preflight-only work
- Canonical decision record: `docs/architecture/adr/ADR-017-BALAGHAT-PARTY-PROPERTY-SELECTION-BOUNDARIES.md`
