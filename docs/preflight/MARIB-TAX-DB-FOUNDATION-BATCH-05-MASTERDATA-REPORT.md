# MARIB Tax DB Foundation — Batch 05 Masterdata Report

## Status

This is a **source-only** authoring batch. It has not been applied to any database, including production. Do not apply it to production as part of this task.

## Delivered source

- Migration: `supabase/migrations/20260720120000_create_masterdata_activities_and_property.sql`
- Read-only verifier: `scripts/db/verify/verify_batch_05_masterdata_activities_and_property.sql`

## Scope

The migration defines only TABLE-014 through TABLE-020 and TABLE-022:

- commercial activities, branches, activity addresses, and activity status histories;
- properties, property units, authoritative ownership records, and ownership histories.

Each table uses application-supplied UUID identifiers, default-deny RLS with no policies, revoked grants for public/client roles, and no seed data.

## Explicit exclusions

TABLE-021, `masterdata.property_ownership_units`, is conditional/open and is intentionally excluded. The proposed non-authoritative derived view, `masterdata.v_taxpayer_properties`, is also excluded.

The verifier fails if either excluded object is present, if `masterdata.properties.taxpayer_id` exists, or if the expected source-only tables contain rows.
