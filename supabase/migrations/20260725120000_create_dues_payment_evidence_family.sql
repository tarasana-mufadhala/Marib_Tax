-- MARIB-TAX-DB-FOUNDATION-BATCH-10-DUES-PAYMENT-EVIDENCE
-- Create dues.payment_dues through payment_confirmations (TABLE-056…062).
-- Authoring only; do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- No seed/backfill rows are introduced here.
-- No table named cases. No payment gateway/provider/settlement columns.
-- No Storage schema mutation, buckets, policies, or bytes.
-- REL-069 CLOSED: payment_receipts.payment_due_id NOT NULL FK → payment_dues (1 due : N receipts);
-- no due_receipt_links table; payment_due_id is not UNIQUE.
-- Confirmation is not final request/balagh approval (IR-65).
-- Detailed grants and RLS policies remain deferred to Batch 17.
-- Overpayment close rules and exact-one parent upgrade remain open (DM-09 / governance).

BEGIN;

CREATE TABLE dues.payment_dues (
  id uuid NOT NULL,
  public_ref text NULL,
  service_request_id uuid NULL,
  balagh_id uuid NULL,
  amount numeric(18, 2) NOT NULL,
  currency_code text NOT NULL,
  status_code text NOT NULL,
  assessed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  archived_at timestamptz NULL,
  CONSTRAINT payment_dues_pkey PRIMARY KEY (id),
  CONSTRAINT payment_dues_public_ref_key UNIQUE (public_ref),
  CONSTRAINT payment_dues_amount_non_negative_check CHECK (amount >= 0),
  CONSTRAINT payment_dues_currency_not_blank_check CHECK (btrim(currency_code) <> ''),
  CONSTRAINT payment_dues_status_not_blank_check CHECK (btrim(status_code) <> ''),
  CONSTRAINT payment_dues_case_xor_check CHECK (
    NOT (service_request_id IS NOT NULL AND balagh_id IS NOT NULL)
  ),
  CONSTRAINT payment_dues_service_request_fkey FOREIGN KEY (service_request_id)
    REFERENCES requests.service_requests (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_dues_balagh_fkey FOREIGN KEY (balagh_id)
    REFERENCES balaghat.balaghs (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_dues_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_dues_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX payment_dues_service_request_id_idx
  ON dues.payment_dues (service_request_id, created_at DESC)
  WHERE service_request_id IS NOT NULL;
CREATE INDEX payment_dues_balagh_id_idx
  ON dues.payment_dues (balagh_id, created_at DESC)
  WHERE balagh_id IS NOT NULL;
CREATE INDEX payment_dues_status_code_idx ON dues.payment_dues (status_code);
COMMENT ON TABLE dues.payment_dues IS 'TABLE-056 payment due root; manual assessment only; CK-T02 not-both parents; no gateway columns; not named cases.';
COMMENT ON COLUMN dues.payment_dues.id IS 'Application-supplied immutable UUID.';
COMMENT ON COLUMN dues.payment_dues.amount IS 'Assessed amount as numeric(18,2); non-negative; no float money.';
COMMENT ON COLUMN dues.payment_dues.currency_code IS 'Non-blank currency code text; paired with numeric amount.';
COMMENT ON COLUMN dues.payment_dues.status_code IS 'Application-constrained due status; catalogues deferred (DM-09).';
COMMENT ON COLUMN dues.payment_dues.archived_at IS 'Optional soft-archive marker; no hard-delete or purge path in this source.';

CREATE TABLE dues.due_basis_document_references (
  id uuid NOT NULL,
  payment_due_id uuid NOT NULL,
  document_reference text NULL,
  attachment_id uuid NULL,
  basis_type_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT due_basis_document_references_pkey PRIMARY KEY (id),
  CONSTRAINT due_basis_document_references_type_not_blank_check CHECK (btrim(basis_type_code) <> ''),
  CONSTRAINT due_basis_document_references_document_not_blank_check CHECK (
    document_reference IS NULL OR btrim(document_reference) <> ''
  ),
  CONSTRAINT due_basis_document_references_due_fkey FOREIGN KEY (payment_due_id)
    REFERENCES dues.payment_dues (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT due_basis_document_references_attachment_fkey FOREIGN KEY (attachment_id)
    REFERENCES files.attachments (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT due_basis_document_references_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX due_basis_document_references_payment_due_id_idx
  ON dues.due_basis_document_references (payment_due_id);
CREATE INDEX due_basis_document_references_attachment_id_idx
  ON dues.due_basis_document_references (attachment_id)
  WHERE attachment_id IS NOT NULL;
COMMENT ON TABLE dues.due_basis_document_references IS 'TABLE-057 due assessment basis; optional Batch 08 attachment metadata; no Postgres bytes; IR-34 >=1 basis enforced in NestJS.';
COMMENT ON COLUMN dues.due_basis_document_references.attachment_id IS 'Optional FK to files.attachments metadata; reference never grants Storage access.';

CREATE TABLE dues.due_corrections (
  id uuid NOT NULL,
  payment_due_id uuid NOT NULL,
  prior_amount numeric(18, 2) NOT NULL,
  new_amount numeric(18, 2) NOT NULL,
  currency_code text NOT NULL,
  reason text NOT NULL,
  corrected_at timestamptz NOT NULL,
  corrected_by_staff_profile_id uuid NOT NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT due_corrections_pkey PRIMARY KEY (id),
  CONSTRAINT due_corrections_prior_amount_non_negative_check CHECK (prior_amount >= 0),
  CONSTRAINT due_corrections_new_amount_non_negative_check CHECK (new_amount >= 0),
  CONSTRAINT due_corrections_currency_not_blank_check CHECK (btrim(currency_code) <> ''),
  CONSTRAINT due_corrections_reason_not_blank_check CHECK (btrim(reason) <> ''),
  CONSTRAINT due_corrections_due_fkey FOREIGN KEY (payment_due_id)
    REFERENCES dues.payment_dues (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT due_corrections_corrected_by_staff_fkey FOREIGN KEY (corrected_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX due_corrections_payment_due_id_idx ON dues.due_corrections (payment_due_id);
CREATE INDEX due_corrections_corrected_at_idx ON dues.due_corrections (corrected_at);
COMMENT ON TABLE dues.due_corrections IS 'TABLE-058 append-only due amount corrections; prior/new amounts retained; original payment_dues row retained.';
COMMENT ON COLUMN dues.due_corrections.reason IS 'Mandatory non-blank correction reason (IR-35).';
COMMENT ON COLUMN dues.due_corrections.corrected_by_staff_profile_id IS 'Mandatory correcting staff profile.';

CREATE TABLE dues.payment_notices (
  id uuid NOT NULL,
  public_ref text NULL,
  payment_due_id uuid NOT NULL,
  notice_status_code text NOT NULL,
  issued_at timestamptz NULL,
  notice_amount numeric(18, 2) NOT NULL,
  currency_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT payment_notices_pkey PRIMARY KEY (id),
  CONSTRAINT payment_notices_public_ref_key UNIQUE (public_ref),
  CONSTRAINT payment_notices_amount_non_negative_check CHECK (notice_amount >= 0),
  CONSTRAINT payment_notices_currency_not_blank_check CHECK (btrim(currency_code) <> ''),
  CONSTRAINT payment_notices_status_not_blank_check CHECK (btrim(notice_status_code) <> ''),
  CONSTRAINT payment_notices_due_fkey FOREIGN KEY (payment_due_id)
    REFERENCES dues.payment_dues (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_notices_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_notices_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX payment_notices_payment_due_id_idx ON dues.payment_notices (payment_due_id);
CREATE INDEX payment_notices_status_code_idx ON dues.payment_notices (notice_status_code);
COMMENT ON TABLE dues.payment_notices IS 'TABLE-059 payment notice metadata only; delivery is Batch 11; no SMS/WhatsApp/email/push implementation here.';

CREATE TABLE dues.payment_receipts (
  id uuid NOT NULL,
  public_ref text NULL,
  payment_due_id uuid NOT NULL,
  amount numeric(18, 2) NOT NULL,
  currency_code text NOT NULL,
  acceptance_status_code text NOT NULL,
  received_at timestamptz NULL,
  replaces_receipt_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT payment_receipts_pkey PRIMARY KEY (id),
  CONSTRAINT payment_receipts_public_ref_key UNIQUE (public_ref),
  CONSTRAINT payment_receipts_amount_non_negative_check CHECK (amount >= 0),
  CONSTRAINT payment_receipts_currency_not_blank_check CHECK (btrim(currency_code) <> ''),
  CONSTRAINT payment_receipts_status_not_blank_check CHECK (btrim(acceptance_status_code) <> ''),
  CONSTRAINT payment_receipts_payment_due_fkey FOREIGN KEY (payment_due_id)
    REFERENCES dues.payment_dues (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_receipts_replaces_receipt_fkey FOREIGN KEY (replaces_receipt_id)
    REFERENCES dues.payment_receipts (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_receipts_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_receipts_updated_by_fkey FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX payment_receipts_payment_due_received_at_idx
  ON dues.payment_receipts (payment_due_id, received_at DESC);
CREATE INDEX payment_receipts_acceptance_status_code_idx
  ON dues.payment_receipts (acceptance_status_code);
CREATE INDEX payment_receipts_replaces_receipt_id_idx
  ON dues.payment_receipts (replaces_receipt_id)
  WHERE replaces_receipt_id IS NOT NULL;
COMMENT ON TABLE dues.payment_receipts IS 'TABLE-060 payment receipt evidence; each receipt belongs to exactly one due; one due may have many receipts (REL-069 CLOSED); partial payment uses multiple receipts; no due_receipt_links; no gateway columns; confirmation is not final request/balagh approval.';
COMMENT ON COLUMN dues.payment_receipts.payment_due_id IS 'Mandatory parent due; NOT UNIQUE so multiple receipts may attach to one due; a receipt cannot cover multiple dues.';
COMMENT ON COLUMN dues.payment_receipts.replaces_receipt_id IS 'Optional self-lineage pointer; original receipt rows are retained.';

CREATE TABLE dues.receipt_correction_replacements (
  id uuid NOT NULL,
  payment_receipt_id uuid NOT NULL,
  replaces_receipt_id uuid NULL,
  correction_reason text NOT NULL,
  acted_at timestamptz NOT NULL,
  acted_by_staff_profile_id uuid NOT NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT receipt_correction_replacements_pkey PRIMARY KEY (id),
  CONSTRAINT receipt_correction_replacements_reason_not_blank_check CHECK (btrim(correction_reason) <> ''),
  CONSTRAINT receipt_correction_replacements_receipt_fkey FOREIGN KEY (payment_receipt_id)
    REFERENCES dues.payment_receipts (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT receipt_correction_replacements_replaces_fkey FOREIGN KEY (replaces_receipt_id)
    REFERENCES dues.payment_receipts (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT receipt_correction_replacements_acted_by_staff_fkey FOREIGN KEY (acted_by_staff_profile_id)
    REFERENCES identity.staff_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX receipt_correction_replacements_payment_receipt_id_idx
  ON dues.receipt_correction_replacements (payment_receipt_id);
CREATE INDEX receipt_correction_replacements_acted_at_idx
  ON dues.receipt_correction_replacements (acted_at);
COMMENT ON TABLE dues.receipt_correction_replacements IS 'TABLE-061 append-only receipt correction/replacement lineage; originals retained; correction authority (OD-15) enforced in NestJS.';
COMMENT ON COLUMN dues.receipt_correction_replacements.correction_reason IS 'Mandatory non-blank replacement/correction reason.';

CREATE TABLE dues.payment_confirmations (
  id uuid NOT NULL,
  payment_receipt_id uuid NOT NULL,
  outcome_code text NOT NULL,
  confirmed_at timestamptz NOT NULL,
  confirmed_by_profile_id uuid NOT NULL,
  amount_confirmed numeric(18, 2) NULL,
  currency_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  CONSTRAINT payment_confirmations_pkey PRIMARY KEY (id),
  CONSTRAINT payment_confirmations_outcome_not_blank_check CHECK (btrim(outcome_code) <> ''),
  CONSTRAINT payment_confirmations_amount_non_negative_check CHECK (
    amount_confirmed IS NULL OR amount_confirmed >= 0
  ),
  CONSTRAINT payment_confirmations_currency_not_blank_check CHECK (
    currency_code IS NULL OR btrim(currency_code) <> ''
  ),
  CONSTRAINT payment_confirmations_receipt_fkey FOREIGN KEY (payment_receipt_id)
    REFERENCES dues.payment_receipts (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_confirmations_confirmed_by_fkey FOREIGN KEY (confirmed_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE,
  CONSTRAINT payment_confirmations_created_by_fkey FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT DEFERRABLE
);
CREATE INDEX payment_confirmations_payment_receipt_id_idx
  ON dues.payment_confirmations (payment_receipt_id);
CREATE INDEX payment_confirmations_confirmed_at_idx
  ON dues.payment_confirmations (confirmed_at);
COMMENT ON TABLE dues.payment_confirmations IS 'TABLE-062 staff payment confirmation against a receipt; not final request/balagh approval (IR-65); NestJS enforces accepted-receipt precondition.';
COMMENT ON COLUMN dues.payment_confirmations.confirmed_by_profile_id IS 'Mandatory confirming actor profile; no SQL admin-bypass policy.';

ALTER TABLE dues.payment_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues.due_basis_document_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues.due_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues.payment_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues.receipt_correction_replacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues.payment_confirmations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  dues.payment_dues,
  dues.due_basis_document_references,
  dues.due_corrections,
  dues.payment_notices,
  dues.payment_receipts,
  dues.receipt_correction_replacements,
  dues.payment_confirmations
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
