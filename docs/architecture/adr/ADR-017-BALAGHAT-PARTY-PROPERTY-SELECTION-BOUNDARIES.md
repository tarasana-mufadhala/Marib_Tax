# ADR-017: Balaghat Party, Target, and Property Selection Boundaries

- **Status:** Accepted
- **Date:** 2026-07-20
- **Decision:** Balagh filer/owner identity, multi-target parties, property/unit case selection, and type discriminator without catalogue seed

## Context

Batch 07 initially mirrored the request-family shape with a single root `taxpayer_id` and activity/branch selections only. Owner-approved Balaghat rules require a property-owner filer, multi-target parties, optional multi-property/unit selections, and FR-201…206 type discrimination without seeding a catalogue in Batch 07.

## Decision

### Filer / property owner

- The balagh filer is the property owner (notifying party).
- Persist filer identity as `filer_profile_id` and the notifying taxpayer as `taxpayer_id`.
- Property-owner capacity may be evidenced via optional `ownership_record_id` on selected property rows; do not treat a bare `taxpayer_id` as proof of ownership by itself.

### Targets

- One balagh may target multiple taxpayers and/or users.
- Persist targets in `balagh_selected_targets` with a non-blank `target_role_code`.
- Do not encode multi-target scope as a single `target_taxpayer_id` column on the root.

### Activities and branches

- One balagh may select multiple activities and multiple branches.
- A selected branch must reference a selected activity on the same balagh (REL-044).
- NestJS must ensure the branch belongs to that activity’s commercial activity.
- Property-oriented balagh types must not be forced to select activities/branches (0..N allowed).

### Properties and units

- Property balaghs may select one or more properties and, when needed, property units via case-selection tables.
- Do not create CONDITIONAL TABLE-021 `property_ownership_units` in Batch 07.
- Flexible form snapshots/payloads carry evacuation/minutes-style content; do not invent fixed formal minute columns.

### Types and versioning

- Discriminate FR-201…206 with non-blank `balagh_type_code` on the root without seeding a catalogue table in Batch 07.
- Submitted snapshots remain immutable and retain `schema_version` so historical balaghs stay bound to their submitted form version.

### Lifecycle

- ADR-016 applies to Balaghat parallels: no hard delete; independent close vs archive; staff-only reopen with mandatory reason; append-only status/assignment/decision histories.

## Consequences

- Batch 07 persistence includes filer/type columns plus target/property/unit selection children.
- Catalogue seeds for balagh types remain deferred.
- PROD-DB-07 remains closed until corrected source review and a separate explicit production approval.

## Guardrails

- Do not use root `taxpayer_id` as the only multi-party or ownership proof.
- Do not invent TABLE-021.
- Do not seed FR-201…206 operational catalogue rows in Batch 07.
- Do not lose decisions/histories/snapshots on reopen.
