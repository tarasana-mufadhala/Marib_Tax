# MARIB Tax DB Foundation — Batch 16 Final RLS Policies Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_16_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-16 = NOT_STARTED` (requires the governed cycle and independent user approval)

## Artifacts

- Migration: `supabase/migrations/20260731120200_apply_final_rls_policies.sql`
- Migration SHA-256: `03102916CCB124B414FC7C22FA4F29CF2BFEF9178705A8827B6FA6AC96448E8B`
- Read-only verifier: `scripts/db/verify/verify_batch_16_rls_policies.sql`
- Verifier SHA-256: `2167C060A7BADD816814E786AC1F1957E6825C7E17A93503AC538A1E8A50BD5B`
- Design gate: `docs/reviews/MARIB-TAX-BATCH-16-FINAL-RLS-POLICIES-DESIGN-DECISION-GATE-01.md` — **PASS — BATCH_16_FINAL_RLS_POLICIES_DESIGN_APPROVED_FOR_SOURCE**
- Baseline: `origin/main`

## Scope and boundaries

The source configures Row Level Security (RLS) policies for all system schemas:
- `identity`, `registry`, `legal`, `masterdata`, `requests`, `balaghat`, `visits`, `dues`, `notify`, `imports`, `content`, `reporting`, `audit`.

- Privileges are revoked from default public roles (`PUBLIC`, `anon`, `authenticated`, `service_role`).
- Explicit privileges are granted back to `authenticated` and `anon`.
- Policies resolve access using `auth.uid()` mapped through `identity.user_profiles` and roles.

## Structural review (source)

- Five security context helper functions.
- Row level security policies applied on all active tables.
- Managers (`office_director`, `department_manager`, `technical_admin`, `auditor`) can view all data.
- Staff members can view assigned data (assigned requests, assigned team visits, etc.).
- Taxpayers can view their own data (owned requests, linked taxpayers, properties owned, notices, etc.).

## Non-actions

This source report authorizes no apply. It did not apply Batch 16 anywhere, mutate Storage, or use real data. Local execution is pending a running database connection and does not replace the governed production preflight.
