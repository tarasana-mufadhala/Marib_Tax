# MARIB Tax DB Foundation — Batch 16 Final RLS Policies Report

## Status

Source only for this report. Production apply remains closed.

- `BATCH_16_SOURCE = AUTHORED / NOT MERGED / NOT APPLIED`
- `PROD-DB-16 = NOT_STARTED`

## Artifacts

| Artifact | Path | SHA-256 |
|---|---|---|
| Migration | `supabase/migrations/20260801120100_apply_final_rls_policies.sql` | `24EA4F6B39C4273EDD55E2C3DC52C169B2A2AFD66436EC9B07DF2ED04F349F26` |
| Verifier | `scripts/db/verify/verify_batch_16_rls_policies.sql` | `DAAE404C23DD7443455AC68B5596E86338A44EA3FC5859DBA279D862031DBF4C` |
| Design Gate | `docs/reviews/MARIB-TAX-BATCH-16-FINAL-RLS-POLICIES-DESIGN-DECISION-GATE-01.md` | **PASS** |
| Baseline | `origin/main` | |

## Scope and boundaries

6 helper functions in `identity` schema + RLS SELECT policies on all 14 application schemas covering all ~80+ application tables. Authorization matrix: taxpayer sees own data → staff sees assigned data → manager sees everything. All functions use `SECURITY DEFINER` with locked `search_path`. No positive grants remain — all access is through RLS policies.

## Structural review (source)

- 6 identity helper functions: get_current_user_profile_id, get_current_staff_profile_id, is_staff, is_manager, has_role, is_taxpayer_for.
- RLS enabled verified on all schemas (carried forward from prior batches).
- Policies verified on key tables: user_profiles, staff_profiles, taxpayers, taxpayer_account_links, service_requests, balaghs, field_visits, payment_dues.
- Zero positive GRANTs on any schema to PUBLIC/anon/authenticated/service_role.
- No INSERT/UPDATE/DELETE policies introduced — only SELECT.

## Non-actions

No production apply performed. No data mutation, no seeds, no grants changed beyond DROP/CREATE POLICY. Write operations remain gated by NestJS application-layer authorization.