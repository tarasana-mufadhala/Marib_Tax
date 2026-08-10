# Change Request: Add Device Tokens Table (CR-001)

## 1. Summary & Motivation
To enable FCM Push Notifications, the system must persist target device tokens associated with user profiles. These tokens are registered by clients (Flutter mobile app, web application) and used by the background outbox worker to route FCM payloads.

Since `device_tokens` was not part of the initial SQL migrations (Batch 11 did not deploy it), this Change Request specifies the schema definition and RLS policies for `notify.device_tokens`.

---

## 2. SQL Migration Specification

The following SQL migration should be added by the DB Owner (Codex) under `supabase/migrations/`:

```sql
-- Create device_tokens table
CREATE TABLE notify.device_tokens (
  id uuid NOT NULL,
  user_profile_id uuid NOT NULL,
  device_token text NOT NULL,
  device_type text NOT NULL, -- ios, android, web
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NULL,
  
  CONSTRAINT device_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT device_tokens_token_key UNIQUE (device_token),
  CONSTRAINT device_tokens_user_fkey FOREIGN KEY (user_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT device_tokens_device_type_check CHECK (device_type IN ('ios', 'android', 'web'))
);

-- Indices
CREATE INDEX device_tokens_user_profile_id_idx ON notify.device_tokens (user_profile_id);
CREATE UNIQUE INDEX device_tokens_active_token_idx ON notify.device_tokens (device_token) WHERE is_active = true;

-- Enable RLS
ALTER TABLE notify.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY device_tokens_owner_policy ON notify.device_tokens
  FOR ALL
  TO authenticated
  USING (user_profile_id = auth.uid())
  WITH CHECK (user_profile_id = auth.uid());

-- Document mappings
COMMENT ON TABLE notify.device_tokens IS 'TABLE-071 persists client device tokens for FCM push notification routing.';
```

---

## 3. Scope Mappings
- **Schema**: `notify`
- **Kysely Interface**: `DeviceTokensTable` (already added to `database.contracts.ts` and `outbox-processor.ts` by Antigravity).
- **Service Integration**: Already fully supported inside `NotificationsService` and `KyselyOutboxRepository` with in-memory fallbacks during testing.
