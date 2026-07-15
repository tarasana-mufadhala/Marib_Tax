-- MARIB-TAX-DB-FOUNDATION-BATCH-01A
-- Create the fourteen application-owned PostgreSQL schemas.
-- Documentation-only authoring batch: do not apply in this task.
-- Extensions, tables, grants to clients, RLS, and managed schemas are out of scope.
-- Owner: current migration role (no hardcoded username).

BEGIN;

CREATE SCHEMA identity;
COMMENT ON SCHEMA identity IS
  'Application profiles, staff identities, roles and permissions (Identity and Access).';
REVOKE ALL ON SCHEMA identity FROM PUBLIC;

CREATE SCHEMA registry;
COMMENT ON SCHEMA registry IS
  'Taxpayers, contacts, and taxpayer account links (Taxpayer Registry).';
REVOKE ALL ON SCHEMA registry FROM PUBLIC;

CREATE SCHEMA legal;
COMMENT ON SCHEMA legal IS
  'Legal entities and tax-number records (Legal Entities).';
REVOKE ALL ON SCHEMA legal FROM PUBLIC;

CREATE SCHEMA masterdata;
COMMENT ON SCHEMA masterdata IS
  'Commercial activities, branches, properties, and ownership records (Activities and Branches).';
REVOKE ALL ON SCHEMA masterdata FROM PUBLIC;

CREATE SCHEMA requests;
COMMENT ON SCHEMA requests IS
  'Service-request aggregates and histories (Service Requests). Distinct from balaghat.';
REVOKE ALL ON SCHEMA requests FROM PUBLIC;

CREATE SCHEMA balaghat;
COMMENT ON SCHEMA balaghat IS
  'Business notification/Balagh aggregates and histories (Business Notifications / Balaghat). Distinct from requests.';
REVOKE ALL ON SCHEMA balaghat FROM PUBLIC;

CREATE SCHEMA visits;
COMMENT ON SCHEMA visits IS
  'Field-visit records and evidence references (Field Visits).';
REVOKE ALL ON SCHEMA visits FROM PUBLIC;

CREATE SCHEMA dues;
COMMENT ON SCHEMA dues IS
  'Dues and manual payment-evidence records (Dues and Payment Evidence). No gateway settlement objects.';
REVOKE ALL ON SCHEMA dues FROM PUBLIC;

CREATE SCHEMA files;
COMMENT ON SCHEMA files IS
  'Private attachment metadata and version lineage (Attachments and Private Files). Does not own business aggregates.';
REVOKE ALL ON SCHEMA files FROM PUBLIC;

CREATE SCHEMA notify;
COMMENT ON SCHEMA notify IS
  'Notification messages and delivery processing (Notification Delivery). Does not own domain/case outcomes.';
REVOKE ALL ON SCHEMA notify FROM PUBLIC;

CREATE SCHEMA imports;
COMMENT ON SCHEMA imports IS
  'Controlled import batches, rows, and validation evidence (Imports and Data Quality).';
REVOKE ALL ON SCHEMA imports FROM PUBLIC;

CREATE SCHEMA content;
COMMENT ON SCHEMA content IS
  'Approved public and administrative content (Content Management).';
REVOKE ALL ON SCHEMA content FROM PUBLIC;

CREATE SCHEMA audit;
COMMENT ON SCHEMA audit IS
  'Audit, security evidence, and domain-event outbox infrastructure (Audit and Security). Does not own case decisions.';
REVOKE ALL ON SCHEMA audit FROM PUBLIC;

CREATE SCHEMA reporting;
COMMENT ON SCHEMA reporting IS
  'Read-only, derived reporting objects (Reporting and Analytics). Does not own transactional source of truth.';
REVOKE ALL ON SCHEMA reporting FROM PUBLIC;

COMMIT;
