# MARIB-TAX-DB-FOUNDATION-BATCH-10-11 — Post-Apply Report

## Status

**FAILED_CONNECTION_TIMEOUT — MIGRATION PUSH PENDING RESOLUTION**

The migration apply session was initiated for Batch 10 and Batch 11 against the Staging environment. However, the connection to the remote database host timed out, preventing DDL execution.

## Execution Details

- **Target project ref**: `sjmtiwzddztxfrncwkpx`
- **Supabase CLI**: `2.109.1`
- **Attempt Time**: `2026-07-31` 23:56 (Asia/Riyadh)
- **Migrations Attempted**:
  1. `20260725120000_create_dues_payment_evidence_family.sql` (Batch 10)
  2. `20260726120000_create_notify_notification_delivery.sql` (Batch 11)

## Observed Error Output

```text
Initialising login role...
Connecting to remote database...
failed to connect to postgres: failed to connect to `host=aws-0-ap-southeast-1.pooler.supabase.com user=cli_login_postgres.sjmtiwzddztxfrncwkpx database=postgres`: failed to write startup message (read tcp 170.152.10.254:56146->54.255.219.82:5432: i/o timeout)
```

## Network Diagnosis

1. **TCP Port 6543 Test**:
   - Host: `aws-0-ap-southeast-1.pooler.supabase.com`
   - Port: `6543` (Pooler)
   - Result: `TcpTestSucceeded : True`
2. **TCP Port 5432 Test**:
   - Host: `aws-0-ap-southeast-1.pooler.supabase.com`
   - Port: `5432` (Direct connection)
   - Result: `WARNING: Name resolution of aws-0-ap-southeast-1.pooler.supabase.com failed` or `I/O timeout`
3. **Verdict**:
   - The CLI attempts connection on the default PostgreSQL port (5432) which is currently failing DNS name resolution or encountering a firewall/I/O timeout on the host network.

## Current State

- `PROD-DB-10 = PENDING_APPLY`
- `PROD-DB-11 = PENDING_APPLY`
- Remote database remains untouched. No write occurred. No schema modifications were performed.

## Resolution Plan

Re-run the apply sequence:
`npx --yes supabase@2.109.1 db push --linked --yes`
once host network connectivity/DNS resolution on port 5432 is stabilized, followed by executing the verifiers:
1. `npx --yes supabase@2.109.1 db query --linked --file scripts/db/verify/verify_batch_10_dues_payment_evidence.sql`
2. `npx --yes supabase@2.109.1 db query --linked --file scripts/db/verify/verify_batch_11_notification_delivery.sql`
