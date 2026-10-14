# MARIB Tax Batch 16 Final RLS Policies Design Decision Gate

## Decision

**PASS — BATCH_16_FINAL_RLS_POLICIES_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- HELPER FUNCTIONS created (6 functions in `identity` schema):
  1. `identity.get_current_user_profile_id()` — maps `auth.uid()` → application user profile
  2. `identity.get_current_staff_profile_id()` — maps `auth.uid()` → active staff profile
  3. `identity.is_staff()` — true if current user has active staff profile
  4. `identity.is_manager()` — true if current user holds director/manager/auditor/admin role
  5. `identity.has_role(text)` — true if current user has a specific role code
  6. `identity.is_taxpayer_for(uuid)` — true if current user is linked taxpayer for given taxpayer_id

- RLS POLICIES created: SELECT-only policies on every table across 13 application schemas:
  `identity`, `registry`, `legal`, `masterdata`, `requests`, `balaghat`, `visits`, `dues`, `files`, `notify`, `imports`, `content`, `audit`, `reporting`

- Authorization matrix: taxpayer-sees-own → staff-sees-assigned → manager-sees-all.

## Accepted source boundaries

- SELECT-only policies: INSERT/UPDATE/DELETE remain gated by NestJS app-layer authorization.
- All functions are `SECURITY DEFINER` with `search_path` locked to prevent search-path injection.
- Dynamic DO blocks iterate `pg_catalog.pg_tables` for consistency across schemas.
- `DROP POLICY IF EXISTS` prefix on every policy; safe to re-run idempotently.
- `REVOKE ALL` ran in all prior batches; no positive grants remain.
- No `BYPASS_RLS` or superuser backdoors.
- No mail channel recognized (SMS/FCM/in_app only).

## Verification result

- 6 helper functions verified with correct name signatures in `identity` schema.
- RLS enabled verified on sample tables across all schemas.
- Key policies verified: user_profiles_owner_policy, staff_profiles_policy, taxpayers_policy, taxpayer_account_links_policy, service_requests_policy, balaghs_policy, field_visits_policy, dues_staff_policy.
- Forbidden grants check: zero positive grants to PUBLIC/anon/authenticated/service_role.
- Migration SHA-256: `24EA4F6B39C4273EDD55E2C3DC52C169D2A2AFD66436EC9B07DF2ED04F349F26`
- Verifier SHA-256: `DAAE404C23DD7443455AC68B559C686338A44EA3FC5859DBA279D863031DBF4C`

## Production gate

This design PASS does not authorize apply. Production apply requires the full governed cycle: PR → CI PASS → review → merge → production preflight with `--dry-run` → independent user approval → single apply → post-apply verifier → closure (`BATCH_16 = APPLIED / VERIFIED PASS`).