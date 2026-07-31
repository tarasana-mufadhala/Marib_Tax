# MARIB Tax Batch 16 Final RLS Policies Design Decision Gate

## Decision

**PASS — BATCH_16_FINAL_RLS_POLICIES_DESIGN_APPROVED_FOR_SOURCE**

## Reviewed scope

- POLICIES applied across 9 core schemas:
  1. `identity` - User/staff profiles, role catalogs, role assignments.
  2. `registry` - Taxpayer profiles, taxpayer link associations.
  3. `legal` - Legal entity metadata, tax numbers.
  4. `masterdata` - Commercial activities, branches, properties, ownership history.
  5. `requests` - Service requests (TABLE-024) and all child histories, decisions, completion requests/responses, selected activities.
  6. `balaghat` - Balagh aggregate root and child snapshots, histories, decisions.
  7. `visits` - Field visits and scheduling, results, active team members, evidences.
  8. `dues` - Payment dues, notices, receipts, confirmations, replacements.
  9. `notify` - Outbox messages, notification read states.
  10. `imports` - Import jobs, files, and rows.
  11. `content` - Content pages, announcements, library documents, FAQs.
  12. `reporting` - Analytical filters, export logs.
  13. `audit` - Security logs, events outbox.

## Accepted source boundaries

- Revoked all existing positive privileges (`REVOKE ALL`) on tables to default-deny.
- Re-granted minimal privileges (SELECT, INSERT, UPDATE, DELETE) to `authenticated` and `anon` roles.
- RLS enabled on all tables across the application database schemas.
- Policies utilize five new security functions on `identity` to cleanly enforce context:
  - `identity.get_current_user_profile_id()`
  - `identity.get_current_staff_profile_id()`
  - `identity.is_staff()`
  - `identity.is_manager()`
  - `identity.has_role(role_code)`
- Matrix logic strictly enforced:
  - Taxpayer sees their own data only.
  - Employee/staff sees their assigned tasks only.
  - Manager sees everything.
- Public content pages/announcements/FAQs/library documents are readable by `anon` and `authenticated`.

## Verification result

- Helper security functions and RLS policies created.
- Repository foundation validation compiles and passes cleanly.
- Migration SHA-256: `03102916CCB124B414FC7C22FA4F29CF2BFEF9178705A8827B6FA6AC96448E8B`
- Verifier SHA-256: `2167C060A7BADD816814E786AC1F1957E6825C7E17A93503AC538A1E8A50BD5B`

## Production gate

This design PASS does not authorize apply. Production apply requires the full governed cycle: PR → CI PASS → review → merge → production preflight with linked read-only checks and `--dry-run` → independent user approval → single apply → post-apply verifier → closure (`BATCH_16 = APPLIED / VERIFIED PASS`).
