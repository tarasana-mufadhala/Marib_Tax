-- MARIB-TAX-DB-FOUNDATION-BATCH-12-IMPORTS
-- Create imports.import_jobs through import_matches (TABLE-073…077 variant).
-- Authoring only; do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- RLS policies and detailed access grants remain deferred to Batch 17.

BEGIN;

CREATE TABLE imports.import_jobs (
  id uuid NOT NULL,
  public_ref text NULL,
  status_code text NOT NULL,
  source_label text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  idempotency_key text NULL,
  CONSTRAINT import_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT import_jobs_public_ref_key UNIQUE (public_ref),
  CONSTRAINT import_jobs_status_code_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT import_jobs_source_label_not_blank_check CHECK (source_label IS NULL OR btrim(source_label) <> ''),
  CONSTRAINT import_jobs_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT import_jobs_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE UNIQUE INDEX import_jobs_idempotency_key_key ON imports.import_jobs (idempotency_key) WHERE idempotency_key IS NOT NULL;

COMMENT ON TABLE imports.import_jobs IS 'TABLE-073 import batch/job root tracker; tracks high-level import status and metadata.';
COMMENT ON COLUMN imports.import_jobs.status_code IS 'Status of the import job (e.g., uploaded, parsing, validating, preview, approved, committing, failed, completed).';

CREATE TABLE imports.import_files (
  id uuid NOT NULL,
  import_job_id uuid NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  CONSTRAINT import_files_pkey PRIMARY KEY (id),
  CONSTRAINT import_files_file_name_not_blank_check CHECK (btrim(file_name) <> ''),
  CONSTRAINT import_files_file_size_non_negative_check CHECK (file_size_bytes >= 0),
  CONSTRAINT import_files_mime_type_not_blank_check CHECK (btrim(mime_type) <> ''),
  CONSTRAINT import_files_storage_path_not_blank_check CHECK (btrim(storage_path) <> ''),
  CONSTRAINT import_files_job_fkey FOREIGN KEY (import_job_id)
    REFERENCES imports.import_jobs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT import_files_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX import_files_job_id_idx ON imports.import_files (import_job_id);

COMMENT ON TABLE imports.import_files IS 'TABLE-074 uploaded file metadata linked to an import job.';

CREATE TABLE imports.import_rows (
  id uuid NOT NULL,
  import_job_id uuid NOT NULL,
  row_number integer NOT NULL,
  raw_data jsonb NOT NULL,
  normalized_data jsonb NULL,
  validation_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_rows_pkey PRIMARY KEY (id),
  CONSTRAINT import_rows_row_number_positive_check CHECK (row_number >= 1),
  CONSTRAINT import_rows_validation_status_not_blank_check CHECK (btrim(validation_status) <> ''),
  CONSTRAINT import_rows_job_fkey FOREIGN KEY (import_job_id)
    REFERENCES imports.import_jobs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX import_rows_job_row_idx ON imports.import_rows (import_job_id, row_number);

COMMENT ON TABLE imports.import_rows IS 'TABLE-075 parsed source rows waiting for validation, match, and preview.';

CREATE TABLE imports.import_errors (
  id uuid NOT NULL,
  import_job_id uuid NOT NULL,
  import_row_id uuid NOT NULL,
  severity text NOT NULL,
  error_code text NOT NULL,
  error_message text NOT NULL,
  field_name text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_errors_pkey PRIMARY KEY (id),
  CONSTRAINT import_errors_severity_check CHECK (severity IN ('error', 'warning')),
  CONSTRAINT import_errors_error_code_not_blank_check CHECK (btrim(error_code) <> ''),
  CONSTRAINT import_errors_error_message_not_blank_check CHECK (btrim(error_message) <> ''),
  CONSTRAINT import_errors_field_name_not_blank_check CHECK (field_name IS NULL OR btrim(field_name) <> ''),
  CONSTRAINT import_errors_job_fkey FOREIGN KEY (import_job_id)
    REFERENCES imports.import_jobs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT import_errors_row_fkey FOREIGN KEY (import_row_id)
    REFERENCES imports.import_rows (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX import_errors_row_idx ON imports.import_errors (import_row_id);
CREATE INDEX import_errors_job_idx ON imports.import_errors (import_job_id);

COMMENT ON TABLE imports.import_errors IS 'TABLE-076 validation errors and warnings identified on specific rows.';

CREATE TABLE imports.import_matches (
  id uuid NOT NULL,
  import_row_id uuid NOT NULL,
  matched_entity_type text NOT NULL,
  matched_entity_id uuid NOT NULL,
  match_score numeric(5,2) NOT NULL,
  match_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_matches_pkey PRIMARY KEY (id),
  CONSTRAINT import_matches_entity_type_not_blank_check CHECK (btrim(matched_entity_type) <> ''),
  CONSTRAINT import_matches_score_range_check CHECK (match_score >= 0.00 AND match_score <= 100.00),
  CONSTRAINT import_matches_type_check CHECK (match_type IN ('exact', 'fuzzy', 'none')),
  CONSTRAINT import_matches_row_fkey FOREIGN KEY (import_row_id)
    REFERENCES imports.import_rows (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX import_matches_row_idx ON imports.import_matches (import_row_id);

COMMENT ON TABLE imports.import_matches IS 'TABLE-077 matching suggestions between imported data rows and existing catalog entities.';

-- Enable Row Level Security (RLS)
ALTER TABLE imports.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports.import_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports.import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports.import_matches ENABLE ROW LEVEL SECURITY;

-- Revoke default public privileges
REVOKE ALL ON TABLE
  imports.import_jobs,
  imports.import_files,
  imports.import_rows,
  imports.import_errors,
  imports.import_matches
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
