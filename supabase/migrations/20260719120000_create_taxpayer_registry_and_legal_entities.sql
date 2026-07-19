-- MARIB-TAX-DB-FOUNDATION-BATCH-04-TAXPAYER-REGISTRY-AND-LEGAL-ENTITIES
-- Create registry taxpayers/contacts/account-links/associations and legal entities/tax numbers.
-- Authoring batch: do not apply to production in this task.
-- IDs are supplied by NestJS; no UUID-generating extension or database default is introduced.
-- Tax numbers are authority-issued digits-only numeric text; the database never generates them (ADR-015).
-- No seed rows are introduced in Batch 04.
-- Detailed grants and RLS policies remain deferred to Batch 17.

BEGIN;

CREATE TABLE registry.taxpayers (
  id uuid NOT NULL,
  public_ref text NULL,
  display_name text NOT NULL,
  status_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  archived_at timestamptz NULL,

  CONSTRAINT taxpayers_pkey
    PRIMARY KEY (id),
  CONSTRAINT taxpayers_public_ref_key
    UNIQUE (public_ref),
  CONSTRAINT taxpayers_display_name_not_blank_check
    CHECK (btrim(display_name) <> ''),
  CONSTRAINT taxpayers_status_code_not_blank_check
    CHECK (btrim(status_code) <> ''),
  CONSTRAINT taxpayers_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayers_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

COMMENT ON TABLE registry.taxpayers IS
  'Taxpayer registry root. Own-data authorization uses Account Links, not phone or tax number. Merge/split policy remains separately governed (DM-03).';

COMMENT ON COLUMN registry.taxpayers.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN registry.taxpayers.public_ref IS
  'Optional public business reference; UNIQUE permits multiple NULL values until issuance policy is finalized (DM-01).';
COMMENT ON COLUMN registry.taxpayers.display_name IS
  'Taxpayer display name; highly sensitive; not an authentication key.';
COMMENT ON COLUMN registry.taxpayers.status_code IS
  'Lifecycle status code as constrained text; catalogue seeds are out of scope for Batch 04.';
COMMENT ON COLUMN registry.taxpayers.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN registry.taxpayers.created_by_profile_id IS
  'Optional creating application profile; nullable for controlled bootstrap.';
COMMENT ON COLUMN registry.taxpayers.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN registry.taxpayers.updated_by_profile_id IS
  'Optional application profile that performed the last update.';
COMMENT ON COLUMN registry.taxpayers.correlation_id IS
  'Optional operation correlation identifier when supplied by NestJS.';
COMMENT ON COLUMN registry.taxpayers.archived_at IS
  'Soft-archive timestamp; hard deletion is not the normal lifecycle.';

CREATE TABLE legal.legal_entities (
  id uuid NOT NULL,
  public_ref text NULL,
  legal_name text NOT NULL,
  classification_code text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,
  archived_at timestamptz NULL,

  CONSTRAINT legal_entities_pkey
    PRIMARY KEY (id),
  CONSTRAINT legal_entities_public_ref_key
    UNIQUE (public_ref),
  CONSTRAINT legal_entities_legal_name_not_blank_check
    CHECK (btrim(legal_name) <> ''),
  CONSTRAINT legal_entities_classification_code_not_blank_check
    CHECK (classification_code IS NULL OR btrim(classification_code) <> ''),
  CONSTRAINT legal_entities_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT legal_entities_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

COMMENT ON TABLE legal.legal_entities IS
  'Legal entity root owned by the Legal module. Associations to taxpayers are owned by registry.';

COMMENT ON COLUMN legal.legal_entities.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN legal.legal_entities.public_ref IS
  'Optional public business reference; UNIQUE permits multiple NULL values until issuance policy is finalized (DM-01).';
COMMENT ON COLUMN legal.legal_entities.legal_name IS
  'Legal name; highly sensitive operational identifier, not an authentication key.';
COMMENT ON COLUMN legal.legal_entities.classification_code IS
  'Optional legal classification code as constrained text.';
COMMENT ON COLUMN legal.legal_entities.is_active IS
  'Catalogue/active flag; authorization still requires backend checks.';
COMMENT ON COLUMN legal.legal_entities.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN legal.legal_entities.created_by_profile_id IS
  'Optional creating application profile; nullable for controlled bootstrap.';
COMMENT ON COLUMN legal.legal_entities.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN legal.legal_entities.updated_by_profile_id IS
  'Optional application profile that performed the last update.';
COMMENT ON COLUMN legal.legal_entities.correlation_id IS
  'Optional operation correlation identifier when supplied by NestJS.';
COMMENT ON COLUMN legal.legal_entities.archived_at IS
  'Soft-archive timestamp; hard deletion is not the normal lifecycle.';

CREATE TABLE registry.taxpayer_contacts (
  id uuid NOT NULL,
  taxpayer_id uuid NOT NULL,
  contact_type_code text NOT NULL,
  contact_value text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,

  CONSTRAINT taxpayer_contacts_pkey
    PRIMARY KEY (id),
  CONSTRAINT taxpayer_contacts_contact_type_code_not_blank_check
    CHECK (btrim(contact_type_code) <> ''),
  CONSTRAINT taxpayer_contacts_contact_value_not_blank_check
    CHECK (btrim(contact_value) <> ''),
  CONSTRAINT taxpayer_contacts_effective_period_check
    CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT taxpayer_contacts_taxpayer_id_fkey
    FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_contacts_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_contacts_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

COMMENT ON TABLE registry.taxpayer_contacts IS
  'Taxpayer contact channels. Phone and other contact values are not authentication keys.';

COMMENT ON COLUMN registry.taxpayer_contacts.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN registry.taxpayer_contacts.taxpayer_id IS
  'Owning taxpayer registry root.';
COMMENT ON COLUMN registry.taxpayer_contacts.contact_type_code IS
  'Contact type or channel code as constrained text.';
COMMENT ON COLUMN registry.taxpayer_contacts.contact_value IS
  'Contact value; highly sensitive; purpose-limited; not an auth proof.';
COMMENT ON COLUMN registry.taxpayer_contacts.is_primary IS
  'Primary contact flag for operational display.';
COMMENT ON COLUMN registry.taxpayer_contacts.is_active IS
  'Active contact flag.';
COMMENT ON COLUMN registry.taxpayer_contacts.effective_from IS
  'Contact effectiveness start timestamp supplied explicitly by NestJS.';
COMMENT ON COLUMN registry.taxpayer_contacts.effective_to IS
  'Optional contact effectiveness end; must be later than effective_from.';
COMMENT ON COLUMN registry.taxpayer_contacts.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN registry.taxpayer_contacts.created_by_profile_id IS
  'Optional creating application profile; nullable for controlled bootstrap.';
COMMENT ON COLUMN registry.taxpayer_contacts.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN registry.taxpayer_contacts.updated_by_profile_id IS
  'Optional application profile that performed the last update.';

CREATE TABLE registry.taxpayer_account_links (
  id uuid NOT NULL,
  public_ref text NULL,
  user_profile_id uuid NOT NULL,
  taxpayer_id uuid NOT NULL,
  relationship_type_code text NOT NULL,
  active_state_code text NOT NULL,
  verification_status_code text NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  approved_by_profile_id uuid NULL,
  revoked_by_profile_id uuid NULL,
  reason_reference text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,

  CONSTRAINT taxpayer_account_links_pkey
    PRIMARY KEY (id),
  CONSTRAINT taxpayer_account_links_public_ref_key
    UNIQUE (public_ref),
  CONSTRAINT taxpayer_account_links_relationship_type_code_not_blank_check
    CHECK (btrim(relationship_type_code) <> ''),
  CONSTRAINT taxpayer_account_links_active_state_code_not_blank_check
    CHECK (btrim(active_state_code) <> ''),
  CONSTRAINT taxpayer_account_links_verification_status_code_not_blank_check
    CHECK (btrim(verification_status_code) <> ''),
  CONSTRAINT taxpayer_account_links_effective_period_check
    CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT taxpayer_account_links_reason_reference_not_blank_check
    CHECK (reason_reference IS NULL OR btrim(reason_reference) <> ''),
  CONSTRAINT taxpayer_account_links_user_profile_id_fkey
    FOREIGN KEY (user_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_account_links_taxpayer_id_fkey
    FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_account_links_approved_by_profile_id_fkey
    FOREIGN KEY (approved_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_account_links_revoked_by_profile_id_fkey
    FOREIGN KEY (revoked_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_account_links_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_account_links_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

-- ADR-015 / DM-21 v1: one account represents exactly one taxpayer while the link is open/active.
CREATE UNIQUE INDEX taxpayer_account_links_one_active_taxpayer_per_profile_idx
  ON registry.taxpayer_account_links (user_profile_id)
  WHERE active_state_code = 'active'
    AND effective_to IS NULL;

CREATE INDEX taxpayer_account_links_taxpayer_id_idx
  ON registry.taxpayer_account_links (taxpayer_id);

CREATE INDEX taxpayer_account_links_user_profile_id_idx
  ON registry.taxpayer_account_links (user_profile_id);

COMMENT ON TABLE registry.taxpayer_account_links IS
  'Authority link from one user profile to one taxpayer (ADR-015 v1). Phone/tax match is insufficient proof. Grant/revoke history is retained; hard deletion is not the normal lifecycle.';

COMMENT ON COLUMN registry.taxpayer_account_links.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN registry.taxpayer_account_links.public_ref IS
  'Optional public business reference; UNIQUE permits multiple NULL values until issuance policy is finalized (DM-01).';
COMMENT ON COLUMN registry.taxpayer_account_links.user_profile_id IS
  'Linked application user profile; at most one open active link per profile in v1.';
COMMENT ON COLUMN registry.taxpayer_account_links.taxpayer_id IS
  'Linked taxpayer; own-data authorization path Identity→Profile→Link→Taxpayer.';
COMMENT ON COLUMN registry.taxpayer_account_links.relationship_type_code IS
  'Authority relationship type as constrained text.';
COMMENT ON COLUMN registry.taxpayer_account_links.active_state_code IS
  'Active or inactive state code; open active rows participate in the one-account/one-taxpayer unique index.';
COMMENT ON COLUMN registry.taxpayer_account_links.verification_status_code IS
  'Verification status as constrained text.';
COMMENT ON COLUMN registry.taxpayer_account_links.effective_from IS
  'Link effectiveness start timestamp supplied explicitly by NestJS.';
COMMENT ON COLUMN registry.taxpayer_account_links.effective_to IS
  'Optional link effectiveness end; must be later than effective_from.';
COMMENT ON COLUMN registry.taxpayer_account_links.approved_by_profile_id IS
  'Optional approving application profile.';
COMMENT ON COLUMN registry.taxpayer_account_links.revoked_by_profile_id IS
  'Optional revoking application profile.';
COMMENT ON COLUMN registry.taxpayer_account_links.reason_reference IS
  'Optional non-blank reason or reference for grant/revoke.';
COMMENT ON COLUMN registry.taxpayer_account_links.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN registry.taxpayer_account_links.created_by_profile_id IS
  'Optional creating application profile; nullable for controlled bootstrap.';
COMMENT ON COLUMN registry.taxpayer_account_links.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN registry.taxpayer_account_links.updated_by_profile_id IS
  'Optional application profile that performed the last update.';
COMMENT ON COLUMN registry.taxpayer_account_links.correlation_id IS
  'Optional operation correlation identifier when supplied by NestJS.';

CREATE TABLE registry.taxpayer_legal_entity_associations (
  id uuid NOT NULL,
  taxpayer_id uuid NOT NULL,
  legal_entity_id uuid NOT NULL,
  association_type_code text NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  evidence_reference text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,

  CONSTRAINT taxpayer_legal_entity_associations_pkey
    PRIMARY KEY (id),
  CONSTRAINT taxpayer_legal_entity_associations_association_type_code_not_blank_check
    CHECK (btrim(association_type_code) <> ''),
  CONSTRAINT taxpayer_legal_entity_associations_effective_period_check
    CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT taxpayer_legal_entity_associations_evidence_reference_not_blank_check
    CHECK (evidence_reference IS NULL OR btrim(evidence_reference) <> ''),
  CONSTRAINT taxpayer_legal_entity_associations_taxpayer_id_fkey
    FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_legal_entity_associations_legal_entity_id_fkey
    FOREIGN KEY (legal_entity_id)
    REFERENCES legal.legal_entities (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_legal_entity_associations_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_legal_entity_associations_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

CREATE INDEX taxpayer_legal_entity_associations_taxpayer_id_idx
  ON registry.taxpayer_legal_entity_associations (taxpayer_id);

CREATE INDEX taxpayer_legal_entity_associations_legal_entity_id_idx
  ON registry.taxpayer_legal_entity_associations (legal_entity_id);

COMMENT ON TABLE registry.taxpayer_legal_entity_associations IS
  'Registry-owned effective-dated association between a taxpayer and a legal entity. Legal module does not mutate these rows.';

COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.taxpayer_id IS
  'Associated taxpayer registry root.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.legal_entity_id IS
  'Associated legal entity root.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.association_type_code IS
  'Association type as constrained text.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.effective_from IS
  'Association effectiveness start timestamp supplied explicitly by NestJS.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.effective_to IS
  'Optional association effectiveness end; must be later than effective_from.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.evidence_reference IS
  'Optional non-blank evidence reference for the association.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.created_by_profile_id IS
  'Optional creating application profile; nullable for controlled bootstrap.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.updated_by_profile_id IS
  'Optional application profile that performed the last update.';
COMMENT ON COLUMN registry.taxpayer_legal_entity_associations.correlation_id IS
  'Optional operation correlation identifier when supplied by NestJS.';

CREATE TABLE legal.tax_numbers (
  id uuid NOT NULL,
  legal_entity_id uuid NOT NULL,
  taxpayer_id uuid NULL,
  tax_number_value text NOT NULL,
  status_code text NOT NULL,
  issued_at timestamptz NULL,
  superseded_by_id uuid NULL,
  correction_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid NULL,
  updated_at timestamptz NULL,
  updated_by_profile_id uuid NULL,
  correlation_id uuid NULL,

  CONSTRAINT tax_numbers_pkey
    PRIMARY KEY (id),
  CONSTRAINT tax_numbers_value_digits_only_check
    CHECK (tax_number_value ~ '^[0-9]+$'),
  CONSTRAINT tax_numbers_status_code_check
    CHECK (status_code IN ('issued', 'invalid', 'replaced')),
  CONSTRAINT tax_numbers_correction_reason_not_blank_check
    CHECK (correction_reason IS NULL OR btrim(correction_reason) <> ''),
  CONSTRAINT tax_numbers_legal_entity_id_fkey
    FOREIGN KEY (legal_entity_id)
    REFERENCES legal.legal_entities (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT tax_numbers_taxpayer_id_fkey
    FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT tax_numbers_superseded_by_id_fkey
    FOREIGN KEY (superseded_by_id)
    REFERENCES legal.tax_numbers (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT tax_numbers_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT tax_numbers_updated_by_profile_id_fkey
    FOREIGN KEY (updated_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

-- ADR-015 / PHY-06: unique among currently issued (active) tax-number rows; prior values retained via lineage.
CREATE UNIQUE INDEX tax_numbers_issued_value_uidx
  ON legal.tax_numbers (tax_number_value)
  WHERE status_code = 'issued';

CREATE INDEX tax_numbers_legal_entity_id_idx
  ON legal.tax_numbers (legal_entity_id);

CREATE INDEX tax_numbers_taxpayer_id_idx
  ON legal.tax_numbers (taxpayer_id);

COMMENT ON TABLE legal.tax_numbers IS
  'Authority-issued tax numbers owned by Legal. Stored as digits-only numeric text to preserve leading zeros. The database never generates tax_number_value. Corrections retain prior rows, reason, and actor (ADR-015). Not an authentication key.';

COMMENT ON COLUMN legal.tax_numbers.id IS
  'Internal UUID supplied by the owning NestJS module; immutable after creation.';
COMMENT ON COLUMN legal.tax_numbers.legal_entity_id IS
  'Owning legal entity; tax numbers are not owned by registry.';
COMMENT ON COLUMN legal.tax_numbers.taxpayer_id IS
  'Optional display association to a taxpayer; not the ownership locus.';
COMMENT ON COLUMN legal.tax_numbers.tax_number_value IS
  'Digits-only numeric text as issued by the Tax Authority in Aden; NestJS stores the value as entered with no database generation.';
COMMENT ON COLUMN legal.tax_numbers.status_code IS
  'issued, invalid, or replaced. Only issued rows participate in the active uniqueness index.';
COMMENT ON COLUMN legal.tax_numbers.issued_at IS
  'Optional authority issuance timestamp when known.';
COMMENT ON COLUMN legal.tax_numbers.superseded_by_id IS
  'Replacement lineage pointer; prior rows remain retained.';
COMMENT ON COLUMN legal.tax_numbers.correction_reason IS
  'Non-blank reason retained with correction/invalidation/replacement (ADR-015).';
COMMENT ON COLUMN legal.tax_numbers.created_at IS
  'Database insertion timestamp.';
COMMENT ON COLUMN legal.tax_numbers.created_by_profile_id IS
  'Creating/correcting application profile actor when supplied; nullable for controlled bootstrap.';
COMMENT ON COLUMN legal.tax_numbers.updated_at IS
  'Last application update timestamp when supplied by the backend.';
COMMENT ON COLUMN legal.tax_numbers.updated_by_profile_id IS
  'Optional application profile that performed the last update.';
COMMENT ON COLUMN legal.tax_numbers.correlation_id IS
  'Optional operation correlation identifier when supplied by NestJS.';

ALTER TABLE registry.taxpayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.taxpayer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.taxpayer_account_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.taxpayer_legal_entity_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal.legal_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal.tax_numbers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  registry.taxpayers,
  registry.taxpayer_contacts,
  registry.taxpayer_account_links,
  registry.taxpayer_legal_entity_associations,
  legal.legal_entities,
  legal.tax_numbers
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
