-- MARIB-TAX-DB-FOUNDATION-BATCH-14-AUDIT-EVENTS
-- Create audit.audit_logs, audit.domain_events, audit.event_outbox.
-- Authoring only; do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No seed/backfill rows are introduced here.
-- audit.event_outbox is the domain-event outbox (separate from notify.notification_outbox_messages).
-- Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

-- TABLE-083 audit logs (immutable, append-only)
CREATE TABLE audit.audit_logs (
  id uuid NOT NULL,
  actor_profile_id uuid NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NULL,
  before_snapshot jsonb NULL,
  after_snapshot jsonb NULL,
  metadata jsonb NULL,
  correlation_id uuid NULL,
  ip_address text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_action_not_blank_check CHECK (btrim(action) <> ''),
  CONSTRAINT audit_logs_entity_type_not_blank_check CHECK (btrim(entity_type) <> ''),
  CONSTRAINT audit_logs_before_snapshot_valid_check CHECK (
    before_snapshot IS NULL OR jsonb_typeof(before_snapshot) = 'object'
  ),
  CONSTRAINT audit_logs_after_snapshot_valid_check CHECK (
    after_snapshot IS NULL OR jsonb_typeof(after_snapshot) = 'object'
  ),
  CONSTRAINT audit_logs_actor_fkey FOREIGN KEY (actor_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX idx_audit_logs_entity ON audit.audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit.audit_logs (actor_profile_id, created_at);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs (action, created_at);

COMMENT ON TABLE audit.audit_logs IS 'TABLE-083 immutable append-only audit trail for every state-changing operation.';
COMMENT ON COLUMN audit.audit_logs.before_snapshot IS 'JSONB snapshot of the record state before the change (null for create).';
COMMENT ON COLUMN audit.audit_logs.after_snapshot IS 'JSONB snapshot of the record state after the change (null for delete).';
COMMENT ON COLUMN audit.audit_logs.metadata IS 'Additional context (request IP, user-agent, reason code, etc.).';

-- TABLE-084 domain events (immutable event log)
CREATE TABLE audit.log_events (
  id uuid NOT NULL,
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT log_events_pkey PRIMARY KEY (id),
  CONSTRAINT log_events_event_type_not_blank_check CHECK (btrim(event_type) <> ''),
  CONSTRAINT log_events_aggregate_type_not_blank_check CHECK (btrim(aggregate_type) <> ''),
  CONSTRAINT log_events_payload_valid_check CHECK (
    jsonb_typeof(payload) = 'object'
  )
);
CREATE INDEX idx_log_events_aggregate ON audit.log_events (aggregate_type, aggregate_id);
CREATE INDEX idx_log_events_type ON audit.log_events (event_type, occurred_at);

COMMENT ON TABLE audit.log_events IS 'TABLE-084 durable domain event log; append-only, no deletes.';

-- TABLE-085 event outbox (guarantees reliable event delivery) 
CREATE TABLE audit.event_outbox (
  id uuid NOT NULL,
  domain_event_id uuid NOT NULL,
  status text NOT NULL,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 5,
  last_error text NULL,
  next_retry_at timestamptz NULL,
  processed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_outbox_pkey PRIMARY KEY (id),
  CONSTRAINT event_outbox_status_check CHECK (
    status IN ('pending', 'processing', 'published', 'failed', 'dead_lettered')
  ),
  CONSTRAINT event_outbox_retry_non_negative_check CHECK (retry_count >= 0),
  CONSTRAINT event_outbox_max_retries_positive_check CHECK (max_retries >= 0),
  CONSTRAINT event_outbox_last_error_not_blank_check CHECK (
    last_error IS NULL OR btrim(last_error) <> ''
  ),
  CONSTRAINT event_outbox_domain_event_fkey FOREIGN KEY (domain_event_id)
    REFERENCES audit.log_events (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX idx_event_outbox_status ON audit.event_outbox (status, next_retry_at);
CREATE INDEX idx_event_outbox_created ON audit.event_outbox (created_at);

COMMENT ON TABLE audit.event_outbox IS 'TABLE-085 transactional outbox for guaranteed event delivery (distinct from notification_outbox).';
COMMENT ON COLUMN audit.event_outbox.retry_count IS 'Number of delivery attempts; incremented on retries.';
COMMENT ON COLUMN audit.event_outbox.next_retry_at IS 'When the worker should next attempt this event; NULL when processed or dead-lettered.';

-- Enable Row Level Security (RLS)
ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.log_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.event_outbox ENABLE ROW LEVEL SECURITY;

-- Revoke default public privileges
REVOKE ALL ON TABLE
  audit.audit_logs,
  audit.log_events,
  audit.event_outbox
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
