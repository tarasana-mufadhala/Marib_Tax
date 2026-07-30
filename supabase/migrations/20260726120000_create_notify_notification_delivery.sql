-- MARIB-TAX-DB-FOUNDATION-BATCH-11-NOTIFICATION-DELIVERY
-- Create notify.notification_templates through notification_outbox_messages (TABLE-066…072).
-- Authoring only; do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No seed/backfill rows are introduced here.
-- No table named cases. No Twilio/FCM secrets, tokens, or credentials in any column.
-- No real SMS/push sending here; delivery is processed later by the Worker via the outbox.
-- TABLE-072 is the notification DELIVERY queue only (ADR-007); it is not the domain-event
-- outbox (audit.domain_event_outbox, TABLE-094, Batch 14).
-- Physical names follow the approved catalog (docs/data/MARIB-TAX-PHYSICAL-COLUMN-CONSTRAINT-CATALOG-01):
--   execution_plan "notification_events"     -> notify.notification_messages     (TABLE-066)
--   execution_plan "notification_deliveries" -> notify.delivery_attempts/retries (TABLE-067/068)
--   execution_plan "notification_outbox"     -> notify.notification_outbox_messages (TABLE-072)
-- execution_plan "device_tokens" and "notification_preferences" are not in the approved
-- 94-table catalog; introducing them requires a Change Request and is out of this batch.
-- Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

CREATE TABLE notify.notification_templates (
  id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  channel_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  CONSTRAINT notification_templates_pkey PRIMARY KEY (id),
  CONSTRAINT notification_templates_code_key UNIQUE (code),
  CONSTRAINT notification_templates_code_not_blank_check CHECK (btrim(code) <> ''),
  CONSTRAINT notification_templates_name_not_blank_check CHECK (btrim(name) <> ''),
  CONSTRAINT notification_templates_channel_not_blank_check CHECK (btrim(channel_code) <> ''),
  CONSTRAINT notification_templates_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT notification_templates_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
COMMENT ON TABLE notify.notification_templates IS 'TABLE-069 notification template catalogue; config rows only, no message content history here.';
COMMENT ON COLUMN notify.notification_templates.code IS 'Unique non-blank template code; immutable after issue per catalog proposal.';
COMMENT ON COLUMN notify.notification_templates.channel_code IS 'Default channel code (application-constrained; e.g. in_app/fcm/sms); no email channel exists in this system.';

CREATE TABLE notify.notification_channel_configurations (
  id uuid NOT NULL,
  channel_code text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  config_label text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  CONSTRAINT notification_channel_configurations_pkey PRIMARY KEY (id),
  CONSTRAINT notification_channel_configurations_channel_code_key UNIQUE (channel_code),
  CONSTRAINT notification_channel_configurations_channel_code_not_blank_check CHECK (btrim(channel_code) <> ''),
  CONSTRAINT notification_channel_configurations_config_label_not_blank_check CHECK (
    config_label IS NULL OR btrim(config_label) <> ''
  ),
  CONSTRAINT notification_channel_configurations_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT notification_channel_configurations_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
COMMENT ON TABLE notify.notification_channel_configurations IS 'TABLE-070 channel enable/label configuration; secrets (Twilio/FCM credentials) are never stored in the database.';
COMMENT ON COLUMN notify.notification_channel_configurations.config_label IS 'Non-secret operational label only; any credential material is held out-of-band.';

CREATE TABLE notify.notification_messages (
  id uuid NOT NULL,
  service_request_id uuid NULL,
  balagh_id uuid NULL,
  payment_notice_id uuid NULL,
  template_id uuid NULL,
  channel_config_id uuid NULL,
  delivery_status_code text NOT NULL,
  recipient_profile_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  idempotency_key text NULL,
  CONSTRAINT notification_messages_pkey PRIMARY KEY (id),
  CONSTRAINT notification_messages_delivery_status_not_blank_check CHECK (btrim(delivery_status_code) <> ''),
  CONSTRAINT notification_messages_idempotency_key_not_blank_check CHECK (
    idempotency_key IS NULL OR btrim(idempotency_key) <> ''
  ),
  CONSTRAINT notification_messages_service_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT notification_messages_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT notification_messages_payment_notice_fkey FOREIGN KEY (payment_notice_id)
    REFERENCES dues.payment_notices (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT notification_messages_template_fkey FOREIGN KEY (template_id)
    REFERENCES notify.notification_templates (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT notification_messages_channel_config_fkey FOREIGN KEY (channel_config_id)
    REFERENCES notify.notification_channel_configurations (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT notification_messages_recipient_fkey FOREIGN KEY (recipient_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT notification_messages_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX notification_messages_service_request_id_idx
  ON notify.notification_messages (service_request_id, created_at DESC)
  WHERE service_request_id IS NOT NULL;
CREATE INDEX notification_messages_balagh_id_idx
  ON notify.notification_messages (balagh_id, created_at DESC)
  WHERE balagh_id IS NOT NULL;
CREATE INDEX notification_messages_payment_notice_id_idx
  ON notify.notification_messages (payment_notice_id)
  WHERE payment_notice_id IS NOT NULL;
CREATE INDEX notification_messages_recipient_profile_id_idx
  ON notify.notification_messages (recipient_profile_id)
  WHERE recipient_profile_id IS NOT NULL;
CREATE INDEX notification_messages_delivery_status_code_idx
  ON notify.notification_messages (delivery_status_code);
CREATE UNIQUE INDEX notification_messages_idempotency_key_key
  ON notify.notification_messages (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
COMMENT ON TABLE notify.notification_messages IS 'TABLE-066 notification message root; creating a message never sends it; delivery never decides business outcome; OTP content minimized (DM-11).';
COMMENT ON COLUMN notify.notification_messages.delivery_status_code IS 'Application-constrained delivery lifecycle status; catalogues deferred (DM-09/DM-11).';
COMMENT ON COLUMN notify.notification_messages.idempotency_key IS 'Optional dedup key; scoped unique when present (DM-20).';

CREATE TABLE notify.delivery_attempts (
  id uuid NOT NULL,
  notification_message_id uuid NOT NULL,
  attempt_number integer NOT NULL,
  attempt_status_code text NOT NULL,
  provider_reference text NULL,
  failure_reason_safe text NULL,
  attempted_at timestamptz NOT NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT delivery_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_attempts_attempt_number_positive_check CHECK (attempt_number >= 1),
  CONSTRAINT delivery_attempts_attempt_status_not_blank_check CHECK (btrim(attempt_status_code) <> ''),
  CONSTRAINT delivery_attempts_message_fkey FOREIGN KEY (notification_message_id)
    REFERENCES notify.notification_messages (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX delivery_attempts_message_attempt_idx
  ON notify.delivery_attempts (notification_message_id, attempt_number);
CREATE INDEX delivery_attempts_attempted_at_idx ON notify.delivery_attempts (attempted_at);
COMMENT ON TABLE notify.delivery_attempts IS 'TABLE-067 append-only delivery attempt evidence; every send attempt and its outcome is recorded; success on one channel never hides failure on another.';
COMMENT ON COLUMN notify.delivery_attempts.provider_reference IS 'Safe provider reference only; no secrets or full provider payloads.';
COMMENT ON COLUMN notify.delivery_attempts.failure_reason_safe IS 'Sanitized failure reason; must not contain OTP text or sensitive PII (DM-11).';

CREATE TABLE notify.delivery_retries (
  id uuid NOT NULL,
  delivery_attempt_id uuid NOT NULL,
  retry_number integer NOT NULL,
  retry_status_code text NOT NULL,
  scheduled_at timestamptz NULL,
  executed_at timestamptz NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT delivery_retries_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_retries_retry_number_positive_check CHECK (retry_number >= 1),
  CONSTRAINT delivery_retries_retry_status_not_blank_check CHECK (btrim(retry_status_code) <> ''),
  CONSTRAINT delivery_retries_time_order_check CHECK (
    executed_at IS NULL OR scheduled_at IS NULL OR executed_at >= scheduled_at
  ),
  CONSTRAINT delivery_retries_attempt_fkey FOREIGN KEY (delivery_attempt_id)
    REFERENCES notify.delivery_attempts (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX delivery_retries_attempt_retry_idx
  ON notify.delivery_retries (delivery_attempt_id, retry_number);
CREATE INDEX delivery_retries_scheduled_at_idx ON notify.delivery_retries (scheduled_at);
COMMENT ON TABLE notify.delivery_retries IS 'TABLE-068 append-only retry schedule/outcome; retry policy and max attempts remain open (governance) and are enforced by the Worker, not SQL.';

CREATE TABLE notify.notification_read_states (
  id uuid NOT NULL,
  notification_message_id uuid NOT NULL,
  recipient_profile_id uuid NOT NULL,
  read_status_code text NOT NULL,
  first_read_at timestamptz NULL,
  latest_acknowledged_at timestamptz NULL,
  read_source_channel_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NULL,
  CONSTRAINT notification_read_states_pkey PRIMARY KEY (id),
  CONSTRAINT notification_read_states_message_recipient_key UNIQUE (notification_message_id, recipient_profile_id),
  CONSTRAINT notification_read_states_read_status_not_blank_check CHECK (btrim(read_status_code) <> ''),
  CONSTRAINT notification_read_states_ack_order_check CHECK (
    latest_acknowledged_at IS NULL OR first_read_at IS NULL OR latest_acknowledged_at >= first_read_at
  ),
  CONSTRAINT notification_read_states_message_fkey FOREIGN KEY (notification_message_id)
    REFERENCES notify.notification_messages (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT notification_read_states_recipient_fkey FOREIGN KEY (recipient_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX notification_read_states_recipient_inbox_idx
  ON notify.notification_read_states (recipient_profile_id, read_status_code, notification_message_id);
COMMENT ON TABLE notify.notification_read_states IS 'TABLE-071 per-recipient read state; delivery status is separate from read status; a delivered message may remain unread (DM-25).';
COMMENT ON COLUMN notify.notification_read_states.first_read_at IS 'Set once on first read; not overwritten by later acknowledgements.';

CREATE TABLE notify.notification_outbox_messages (
  id uuid NOT NULL,
  notification_message_id uuid NULL,
  payload_ref text NULL,
  publication_state text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text NULL,
  next_attempt_at timestamptz NULL,
  published_at timestamptz NULL,
  idempotency_key text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NULL,
  CONSTRAINT notification_outbox_messages_pkey PRIMARY KEY (id),
  CONSTRAINT notification_outbox_messages_publication_state_not_blank_check CHECK (btrim(publication_state) <> ''),
  CONSTRAINT notification_outbox_messages_attempt_count_non_negative_check CHECK (attempt_count >= 0),
  CONSTRAINT notification_outbox_messages_idempotency_key_not_blank_check CHECK (
    idempotency_key IS NULL OR btrim(idempotency_key) <> ''
  ),
  CONSTRAINT notification_outbox_messages_message_fkey FOREIGN KEY (notification_message_id)
    REFERENCES notify.notification_messages (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX notification_outbox_messages_worker_poll_idx
  ON notify.notification_outbox_messages (publication_state, next_attempt_at);
CREATE INDEX notification_outbox_messages_message_id_idx
  ON notify.notification_outbox_messages (notification_message_id)
  WHERE notification_message_id IS NOT NULL;
CREATE UNIQUE INDEX notification_outbox_messages_idempotency_key_key
  ON notify.notification_outbox_messages (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
COMMENT ON TABLE notify.notification_outbox_messages IS 'TABLE-072 notification DELIVERY outbox only (ADR-007); transaction commits enroll here so a failed SMS never fails the business transaction; not the domain-event outbox (TABLE-094, Batch 14).';
COMMENT ON COLUMN notify.notification_outbox_messages.payload_ref IS 'Minimized payload reference; no full message bodies, OTP text, or secrets in the queue.';
COMMENT ON COLUMN notify.notification_outbox_messages.publication_state IS 'Worker lifecycle state (e.g. pending/retry/published/dead); value catalogue and dead-letter cutoff enforced by the Worker.';

ALTER TABLE notify.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify.notification_channel_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify.notification_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify.delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify.delivery_retries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify.notification_read_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify.notification_outbox_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  notify.notification_templates,
  notify.notification_channel_configurations,
  notify.notification_messages,
  notify.delivery_attempts,
  notify.delivery_retries,
  notify.notification_read_states,
  notify.notification_outbox_messages
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
