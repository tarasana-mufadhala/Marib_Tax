# MARIB-TAX-DB-FOUNDATION-BATCH-16-STAGING-APPLY-POST-VERIFY-01

## Decision

PASS — BATCH_16_STAGING_APPLY_AND_VERIFICATION_COMPLETE
- All final RLS utility functions and table-level access control rules successfully applied and verified.

## Scope

- Environment: Linked project `sjmtiwzddztxfrncwkpx` (Staging target)
- Repository: `tarasana-mufadhala/Marib_Tax`
- Verification report created: `2026-08-01`
- Supabase CLI: `2.109.1`

## Applied Migration

- Version: `20260731120200`
- File: `supabase/migrations/20260731120200_apply_final_rls_policies.sql`
- SHA-256: `6FF404D394E85F76993216754044817152B0542E8F4B8BF469334967B256BFE7`
- Verifier: `scripts/db/verify/verify_batch_16_rls_policies.sql`
- Verifier SHA-256: `DAAE404C23DD7443455AC68B559C686338A44EA3FC5859DBA279D863031DBF4C`

## Verification Results

Read-only verifier: `scripts/db/verify/verify_batch_16_rls_policies.sql`

| Check | Result | Detail |
| --- | --- | --- |
| `user_profile_fn` | **true** | Function `get_current_user_profile_id` exists |
| `staff_profile_fn` | **true** | Function `get_current_staff_profile_id` exists |
| `is_staff_fn` | **true** | Function `is_staff` exists |
| `is_manager_fn` | **true** | Function `is_manager` exists |
| `has_role_fn` | **true** | Function `has_role` exists |
| `requests_rls` | **true** | RLS enabled on `requests.service_requests` |
| `visits_rls` | **true** | RLS enabled on `visits.field_visits` |
| `dues_rls` | **true** | RLS enabled on `dues.payment_dues` |
| `identity_rls` | **true** | RLS enabled on `identity.user_profiles` |
| `content_rls` | **true** | RLS enabled on `content.content_pages` |
| `requests_policies` | **true** | Policies exist on `requests.service_requests` |
| `visits_policies` | **true** | Policies exist on `visits.field_visits` |
| `dues_policies` | **true** | Policies exist on `dues.payment_dues` |
| `identity_policies` | **true** | Policies exist on `identity.user_profiles` |
| `final_status` | **PASS** | Overall Batch 16 verification passes |

## Structural Adjustments Note
1. `payment_dues_policy` on `dues.payment_dues` was updated to check ownership through parent `requests.service_requests` or `balaghat.balaghs` tables to resolve the missing `taxpayer_id` column.
2. Policies targeting tables in the non-existent `reporting` schema were commented out in `20260731120200_apply_final_rls_policies.sql`.
