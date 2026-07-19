# MARIB Tax DB Foundation — Batch 07 Balaghat Report

## Status

This is a **source-only** authoring batch. It has not been applied to any database. Production apply remains closed. Design gate: **HOLD** with source correction applied — see `docs/reviews/MARIB-TAX-BATCH-07-DESIGN-DECISION-GATE-01.md`.

## Delivered source

- Migration: `supabase/migrations/20260722120000_create_balaghat_family.sql`
- SHA-256: `4D51F41BF5363662E4F6B1F09B7186E18587FAFE7CBA2656A018DABEE229EE0C`
- Prior SHA (superseded before apply): `71A430F7D9B11BC01202E675DEBD8ED5D7D15769E30F12A1FE07353807B9F7C7`
- Read-only verifier: `scripts/db/verify/verify_batch_07_balaghat_family.sql`
- Lifecycle ADR: ADR-016
- Balaghat selection ADR: ADR-017

## Scope

Sixteen empty `balaghat` tables:

- Root `balaghs` with `balagh_type_code` and `filer_profile_id`
- Multi-value `balagh_selected_targets`
- Optional activity/branch selections (REL-044)
- Optional property/unit case selections (not TABLE-021)
- Form snapshot header/payload hybrid
- Append-only status/assignment/decision histories
- Completion cycle, close/archive, staff-only reopen

No seeds, no `cases`, no catalogue backfill.

## Explicit non-actions

- No production preflight, dry-run, or `db push`
- No Batch 08 work
- No deploy / real taxpayer data / real notifications
