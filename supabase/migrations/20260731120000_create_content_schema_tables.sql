-- MARIB-TAX-DB-FOUNDATION-BATCH-13-CONTENT
-- Create content.content_pages, content_versions, announcements, library_documents, faqs.
-- Authoring only; do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No seed/backfill rows are introduced here.
-- No Storage schema mutation, buckets, policies, or bytes.
-- Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

-- TABLE-078 content pages (managed pages for public site and admin)
CREATE TABLE content.content_pages (
  id uuid NOT NULL,
  key text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL,
  published_at timestamptz NULL,
  published_by_profile_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  CONSTRAINT content_pages_pkey PRIMARY KEY (id),
  CONSTRAINT content_pages_key_key UNIQUE (key),
  CONSTRAINT content_pages_key_not_blank_check CHECK (btrim(key) <> ''),
  CONSTRAINT content_pages_title_not_blank_check CHECK (btrim(title) <> ''),
  CONSTRAINT content_pages_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT content_pages_published_by_fkey FOREIGN KEY (published_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT content_pages_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT content_pages_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);

COMMENT ON TABLE content.content_pages IS 'TABLE-078 versioned content pages for public site and admin portal.';
COMMENT ON COLUMN content.content_pages.key IS 'Stable semantic identifier for the page (e.g., about-us, laws).';

-- TABLE-079 content version snapshot (audit trail per page)
CREATE TABLE content.content_versions (
  id uuid NOT NULL,
  content_page_id uuid NOT NULL,
  version_number integer NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  CONSTRAINT content_versions_pkey PRIMARY KEY (id),
  CONSTRAINT content_versions_number_positive_check CHECK (version_number >= 1),
  CONSTRAINT content_versions_title_not_blank_check CHECK (btrim(title) <> ''),
  CONSTRAINT content_versions_page_fkey FOREIGN KEY (content_page_id)
    REFERENCES content.content_pages (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT content_versions_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX content_versions_page_idx ON content.content_versions (content_page_id, version_number DESC);

COMMENT ON TABLE content.content_versions IS 'TABLE-079 immutable version snapshots of every content page update.';

-- TABLE-080 announcements
CREATE TABLE content.announcements (
  id uuid NOT NULL,
  title text NOT NULL,
  body text NULL,
  image_path text NULL,
  starts_at timestamptz NULL,
  ends_at timestamptz NULL,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  published_at timestamptz NULL,
  published_by_profile_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_title_not_blank_check CHECK (btrim(title) <> ''),
  CONSTRAINT announcements_priority_range_check CHECK (priority >= 0 AND priority <= 100),
  CONSTRAINT announcements_image_path_not_blank_check CHECK (image_path IS NULL OR btrim(image_path) <> ''),
  CONSTRAINT announcements_time_order_check CHECK (
    starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at
  ),
  CONSTRAINT announcements_published_by_fkey FOREIGN KEY (published_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT announcements_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);

COMMENT ON TABLE content.announcements IS 'TABLE-080 public announcements and banners for web/app.';

-- TABLE-081 library documents (forms, laws, regulations, decisions)
CREATE TABLE content.library_documents (
  id uuid NOT NULL,
  title text NOT NULL,
  category_code text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint NULL,
  mime_type text NULL,
  status text NOT NULL DEFAULT 'draft',
  version_label text NULL,
  published_at timestamptz NULL,
  published_by_profile_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  CONSTRAINT library_documents_pkey PRIMARY KEY (id),
  CONSTRAINT library_documents_title_not_blank_check CHECK (btrim(title) <> ''),
  CONSTRAINT library_documents_category_not_blank_check CHECK (btrim(category_code) <> ''),
  CONSTRAINT library_documents_file_path_not_blank_check CHECK (btrim(file_path) <> ''),
  CONSTRAINT library_documents_file_size_non_negative_check CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  CONSTRAINT library_documents_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT library_documents_published_by_fkey FOREIGN KEY (published_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT library_documents_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT library_documents_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX idx_library_documents_category ON content.library_documents (category_code);

COMMENT ON TABLE content.library_documents IS 'TABLE-081 library of forms, regulations, laws, and decisions available for download.';

-- TABLE-082 Frequently Asked Questions (FAQs)
CREATE TABLE content.faqs (
  id uuid NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  category_code text NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  CONSTRAINT faqs_pkey PRIMARY KEY (id),
  CONSTRAINT faqs_question_not_blank_check CHECK (btrim(question) <> ''),
  CONSTRAINT faqs_answer_not_blank_check CHECK (btrim(answer) <> ''),
  CONSTRAINT faqs_display_order_non_negative_check CHECK (display_order >= 0),
  CONSTRAINT faqs_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT faqs_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE UNIQUE INDEX idx_faqs_category_order ON content.faqs (category_code, display_order) WHERE is_active = true;

COMMENT ON TABLE content.faqs IS 'TABLE-082 frequently asked questions with category grouping.';

-- Enable Row Level Security (RLS)
ALTER TABLE content.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.library_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.faqs ENABLE ROW LEVEL SECURITY;

-- Revoke default public privileges
REVOKE ALL ON TABLE
  content.content_pages,
  content.content_versions,
  content.announcements,
  content.library_documents,
  content.faqs
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
