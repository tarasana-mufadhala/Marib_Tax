-- MARIB-TAX-DB-FOUNDATION-BATCH-08-FILES-METADATA
-- Source only. Metadata and lineage; no bytes, buckets, policies, seeds, or storage.objects FK.

BEGIN;

CREATE TABLE files.attachments (
  id uuid NOT NULL,
  logical_file_size_bytes bigint NOT NULL,
  media_content_class_code text NOT NULL,
  access_classification_code text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  checksum_sha256 text NULL,
  document_category_code text NOT NULL,
  storage_accounting_category_code text NOT NULL,
  storage_object_path text NULL,
  storage_object_id text NULL,
  version_number integer NOT NULL DEFAULT 1,
  is_current_version boolean NOT NULL DEFAULT true,
  storage_status_code text NOT NULL,
  deletion_retention_status_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT attachments_pkey PRIMARY KEY (id),
  CONSTRAINT attachments_size_nonnegative_check CHECK (logical_file_size_bytes >= 0),
  CONSTRAINT attachments_version_positive_check CHECK (version_number >= 1),
  CONSTRAINT attachments_media_class_not_blank_check CHECK (btrim(media_content_class_code) <> ''),
  CONSTRAINT attachments_access_class_not_blank_check CHECK (btrim(access_classification_code) <> ''),
  CONSTRAINT attachments_original_filename_not_blank_check CHECK (btrim(original_filename) <> ''),
  CONSTRAINT attachments_mime_type_not_blank_check CHECK (btrim(mime_type) <> ''),
  CONSTRAINT attachments_checksum_sha256_check CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~ '^[0-9A-Fa-f]{64}$'),
  CONSTRAINT attachments_available_checksum_required_check CHECK (
    storage_status_code <> 'available' OR checksum_sha256 IS NOT NULL
  ),
  CONSTRAINT attachments_document_category_not_blank_check CHECK (btrim(document_category_code) <> ''),
  CONSTRAINT attachments_accounting_category_not_blank_check CHECK (btrim(storage_accounting_category_code) <> ''),
  CONSTRAINT attachments_storage_status_not_blank_check CHECK (btrim(storage_status_code) <> ''),
  CONSTRAINT attachments_retention_status_not_blank_check CHECK (btrim(deletion_retention_status_code) <> ''),
  CONSTRAINT attachments_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT attachments_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
COMMENT ON TABLE files.attachments IS 'TABLE-063 attachment metadata only; object bytes remain outside Postgres. Version archive is retained; no storage.objects FK.';
COMMENT ON COLUMN files.attachments.document_category_code IS 'Business/legal document category supplied by the application; distinct from server-owned storage accounting classification.';
COMMENT ON COLUMN files.attachments.storage_accounting_category_code IS 'Internal technical/accounting category assigned by the server; not client supplied.';
COMMENT ON COLUMN files.attachments.checksum_sha256 IS 'May be NULL while upload is incomplete; application transition policy must require a valid SHA-256 before storage_status_code becomes available.';

CREATE TABLE files.attachment_links (
  id uuid NOT NULL,
  attachment_id uuid NOT NULL,
  owner_type text NOT NULL,
  owner_id uuid NOT NULL,
  link_role_code text NULL,
  linked_at timestamptz NOT NULL,
  unlinked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT attachment_links_pkey PRIMARY KEY (id),
  CONSTRAINT attachment_links_owner_type_not_blank_check CHECK (btrim(owner_type) <> ''),
  CONSTRAINT attachment_links_time_order_check CHECK (unlinked_at IS NULL OR unlinked_at >= linked_at),
  CONSTRAINT attachment_links_attachment_fkey FOREIGN KEY (attachment_id)
    REFERENCES files.attachments (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT attachment_links_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX attachment_links_attachment_id_idx ON files.attachment_links (attachment_id);
CREATE INDEX attachment_links_owner_idx ON files.attachment_links (owner_type, owner_id);
CREATE UNIQUE INDEX attachment_links_one_active_owner_link_idx
  ON files.attachment_links (attachment_id, owner_type, owner_id)
  WHERE unlinked_at IS NULL;
COMMENT ON TABLE files.attachment_links IS 'TABLE-064 polymorphic metadata link; owner_type is application-constrained and a reference never grants authorization. A partial unique index prevents duplicate active links while retained unlinked rows permit legitimate historical unlink/relink cycles.';

CREATE TABLE files.attachment_version_histories (
  id uuid NOT NULL,
  attachment_id uuid NOT NULL,
  version_number integer NOT NULL,
  storage_object_path text NULL,
  storage_object_id text NULL,
  changed_at timestamptz NOT NULL,
  changed_by_profile_id uuid NULL,
  reason text NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attachment_version_histories_pkey PRIMARY KEY (id),
  CONSTRAINT attachment_version_histories_attachment_version_key UNIQUE (attachment_id, version_number),
  CONSTRAINT attachment_version_histories_version_positive_check CHECK (version_number >= 1),
  CONSTRAINT attachment_version_histories_attachment_fkey FOREIGN KEY (attachment_id)
    REFERENCES files.attachments (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT attachment_version_histories_changed_by_fkey FOREIGN KEY (changed_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX attachment_version_histories_changed_at_idx ON files.attachment_version_histories (changed_at);
COMMENT ON TABLE files.attachment_version_histories IS 'TABLE-065 append-only attachment version lineage; prior versions are retained and never silently deleted.';

ALTER TABLE files.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files.attachment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE files.attachment_version_histories ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE files.attachments, files.attachment_links, files.attachment_version_histories
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
