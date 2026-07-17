# Marib Tax Decisions Needed

Only decisions that require an authorized human are listed here. Source work must remain conservative and fail closed until each applicable decision is recorded in the canonical governance documents.

## Immediate production approval

### PROD-DB-03 — Apply Batch 03 authorization model

- **State:** REQUIRES_USER_APPROVAL
- **Source migration:** `supabase/migrations/20260717120000_create_identity_authorization_model.sql`
- **Current evidence:** source merged in PR #16; production preflight merged in PR #17 with CI PASS.
- **Approval boundary:** approval must explicitly authorize the reviewed production migration command against project `sjmtiwzddztxfrncwkpx`. It must not be inferred from approval of this orchestration policy.
- **Until approved:** do not run `supabase db push`, `supabase migration up`, SQL, or any production write.

## Business/data decisions blocking later batches

- **DM-04 / DM-23:** tax-number format, verification, uniqueness scope, correction/versioning, and duplicate resolution.
- **DM-21:** account-to-taxpayer multiplicity, delegated representation, approval, and revocation.
- **DM-22:** due-to-receipt cardinality and partial-payment behavior before financial tables are fixed.
- **DM-08:** field-visit visibility, team masking, and result structure.
- **DM-10 / DM-17:** attachment classification, retention, legal hold, and destruction periods.
- **DM-11 / DM-25:** notification delivery/read semantics, OTP minimization, and retention.
- **DM-16:** report fields, masking, aggregation, and export rules.

The canonical open-decision registers remain under `docs/governance/`; this file is an execution-facing summary and does not replace them.
