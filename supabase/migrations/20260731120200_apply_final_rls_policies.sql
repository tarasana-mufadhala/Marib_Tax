-- MARIB-TAX-DB-FOUNDATION-BATCH-16-FINAL-RLS-POLICIES
-- Revoke all existing positive privileges and grant specific access roles.
-- Define security helper functions.
-- Apply fine-grained RLS policies across all tables.
-- Authoring only; do not apply to production in this task.

BEGIN;

--------------------------------------------------------------------------------
-- 1. SECURITY HELPER FUNCTIONS
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION identity.get_current_user_profile_id()
RETURNS uuid SECURITY DEFINER AS $$
  SELECT id FROM identity.user_profiles 
  WHERE auth_user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION identity.get_current_staff_profile_id()
RETURNS uuid SECURITY DEFINER AS $$
  SELECT sp.id FROM identity.staff_profiles sp
  WHERE sp.user_profile_id = identity.get_current_user_profile_id() AND sp.is_active = true;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION identity.is_staff()
RETURNS boolean SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM identity.staff_profiles 
    WHERE user_profile_id = identity.get_current_user_profile_id() AND is_active = true
  );
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION identity.has_role(role_code text)
RETURNS boolean SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM identity.staff_role_assignments sra
    JOIN identity.roles r ON r.id = sra.role_id
    WHERE sra.staff_profile_id = identity.get_current_staff_profile_id()
      AND r.code = role_code
      AND sra.effective_to IS NULL
      AND sra.revoked_at IS NULL
  );
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION identity.is_manager()
RETURNS boolean SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM identity.staff_role_assignments sra
    JOIN identity.roles r ON r.id = sra.role_id
    WHERE sra.staff_profile_id = identity.get_current_staff_profile_id()
      AND r.code IN ('office_director', 'department_manager', 'technical_admin', 'auditor')
      AND sra.effective_to IS NULL
      AND sra.revoked_at IS NULL
  );
$$ LANGUAGE sql;

--------------------------------------------------------------------------------
-- 2. REGRANT MINIMAL SCHEMA AND TABLE PRIVILEGES
--------------------------------------------------------------------------------

-- Grant schema access
GRANT USAGE ON SCHEMA identity, registry, legal, masterdata, requests, balaghat, visits, dues, notify, imports, content, reporting, audit
TO authenticated, anon;

-- Grant tables access to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA identity, registry, legal, masterdata, requests, balaghat, visits, dues, notify, imports, content, reporting, audit
TO authenticated;

-- Public content tables readable by anonymous (anon)
GRANT SELECT ON ALL TABLES IN SCHEMA content TO anon;

--------------------------------------------------------------------------------
-- 3. APPLY ROW LEVEL SECURITY POLICIES
--------------------------------------------------------------------------------

-- identity.user_profiles
DROP POLICY IF EXISTS user_profiles_policy ON identity.user_profiles;
CREATE POLICY user_profiles_policy ON identity.user_profiles
  FOR ALL TO authenticated
  USING (auth_user_id = auth.uid() OR identity.is_staff() OR identity.is_manager());

-- identity.staff_profiles
DROP POLICY IF EXISTS staff_profiles_policy ON identity.staff_profiles;
CREATE POLICY staff_profiles_policy ON identity.staff_profiles
  FOR ALL TO authenticated
  USING (user_profile_id = identity.get_current_user_profile_id() OR identity.is_staff() OR identity.is_manager());

-- identity.roles & identity.permissions & identity.role_permissions
DROP POLICY IF EXISTS roles_read_policy ON identity.roles;
CREATE POLICY roles_read_policy ON identity.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS permissions_read_policy ON identity.permissions;
CREATE POLICY permissions_read_policy ON identity.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS role_permissions_read_policy ON identity.role_permissions;
CREATE POLICY role_permissions_read_policy ON identity.role_permissions FOR SELECT TO authenticated USING (true);

-- identity.staff_role_assignments
DROP POLICY IF EXISTS staff_role_assignments_policy ON identity.staff_role_assignments;
CREATE POLICY staff_role_assignments_policy ON identity.staff_role_assignments
  FOR SELECT TO authenticated
  USING (staff_profile_id = identity.get_current_staff_profile_id() OR identity.is_manager());

-- registry.taxpayers
DROP POLICY IF EXISTS taxpayers_policy ON registry.taxpayers;
CREATE POLICY taxpayers_policy ON registry.taxpayers
  FOR ALL TO authenticated
  USING (
    id IN (
      SELECT taxpayer_id FROM registry.taxpayer_account_links 
      WHERE user_profile_id = identity.get_current_user_profile_id() AND active_state_code = 'active' AND effective_to IS NULL
    )
    OR identity.is_staff()
    OR identity.is_manager()
  );

-- registry.taxpayer_account_links
DROP POLICY IF EXISTS taxpayer_account_links_policy ON registry.taxpayer_account_links;
CREATE POLICY taxpayer_account_links_policy ON registry.taxpayer_account_links
  FOR ALL TO authenticated
  USING (user_profile_id = identity.get_current_user_profile_id() OR identity.is_staff() OR identity.is_manager());

-- registry.taxpayer_legal_entity_associations
DROP POLICY IF EXISTS taxpayer_legal_entity_associations_policy ON registry.taxpayer_legal_entity_associations;
CREATE POLICY taxpayer_legal_entity_associations_policy ON registry.taxpayer_legal_entity_associations
  FOR ALL TO authenticated
  USING (
    taxpayer_id IN (
      SELECT taxpayer_id FROM registry.taxpayer_account_links 
      WHERE user_profile_id = identity.get_current_user_profile_id() AND active_state_code = 'active' AND effective_to IS NULL
    )
    OR identity.is_staff()
    OR identity.is_manager()
  );

-- legal.legal_entities
DROP POLICY IF EXISTS legal_entities_policy ON legal.legal_entities;
CREATE POLICY legal_entities_policy ON legal.legal_entities
  FOR ALL TO authenticated
  USING (
    id IN (
      SELECT legal_entity_id FROM registry.taxpayer_legal_entity_associations
      WHERE taxpayer_id IN (
        SELECT taxpayer_id FROM registry.taxpayer_account_links 
        WHERE user_profile_id = identity.get_current_user_profile_id() AND active_state_code = 'active' AND effective_to IS NULL
      )
    )
    OR identity.is_staff()
    OR identity.is_manager()
  );

-- legal.tax_numbers
DROP POLICY IF EXISTS tax_numbers_policy ON legal.tax_numbers;
CREATE POLICY tax_numbers_policy ON legal.tax_numbers
  FOR ALL TO authenticated
  USING (
    taxpayer_id IN (
      SELECT taxpayer_id FROM registry.taxpayer_account_links 
      WHERE user_profile_id = identity.get_current_user_profile_id() AND active_state_code = 'active' AND effective_to IS NULL
    )
    OR identity.is_staff()
    OR identity.is_manager()
  );

-- masterdata.commercial_activities & branches & properties & units (general reads, staff writes)
DROP POLICY IF EXISTS commercial_activities_read_policy ON masterdata.commercial_activities;
CREATE POLICY commercial_activities_read_policy ON masterdata.commercial_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY commercial_activities_write_policy ON masterdata.commercial_activities FOR ALL TO authenticated USING (identity.is_staff() OR identity.is_manager());

DROP POLICY IF EXISTS branches_read_policy ON masterdata.branches;
CREATE POLICY branches_read_policy ON masterdata.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY branches_write_policy ON masterdata.branches FOR ALL TO authenticated USING (identity.is_staff() OR identity.is_manager());

DROP POLICY IF EXISTS properties_read_policy ON masterdata.properties;
CREATE POLICY properties_read_policy ON masterdata.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY properties_write_policy ON masterdata.properties FOR ALL TO authenticated USING (identity.is_staff() OR identity.is_manager());

DROP POLICY IF EXISTS property_units_read_policy ON masterdata.property_units;
CREATE POLICY property_units_read_policy ON masterdata.property_units FOR SELECT TO authenticated USING (true);
CREATE POLICY property_units_write_policy ON masterdata.property_units FOR ALL TO authenticated USING (identity.is_staff() OR identity.is_manager());

-- masterdata.property_ownership_records
DROP POLICY IF EXISTS property_ownership_records_policy ON masterdata.property_ownership_records;
CREATE POLICY property_ownership_records_policy ON masterdata.property_ownership_records
  FOR ALL TO authenticated
  USING (
    taxpayer_id IN (
      SELECT taxpayer_id FROM registry.taxpayer_account_links 
      WHERE user_profile_id = identity.get_current_user_profile_id() AND active_state_code = 'active' AND effective_to IS NULL
    )
    OR identity.is_staff()
    OR identity.is_manager()
  );

-- requests.service_requests
DROP POLICY IF EXISTS service_requests_policy ON requests.service_requests;
CREATE POLICY service_requests_policy ON requests.service_requests
  FOR ALL TO authenticated
  USING (
    taxpayer_id IN (
      SELECT taxpayer_id FROM registry.taxpayer_account_links 
      WHERE user_profile_id = identity.get_current_user_profile_id() AND active_state_code = 'active' AND effective_to IS NULL
    )
    OR assignee_id = identity.get_current_staff_profile_id()
    OR identity.is_manager()
  );

-- requests details (status_histories, assignment_histories, completion_requests/responses, decision_records, etc.)
-- We apply a generic helper policy based on service_request select access
CREATE OR REPLACE FUNCTION requests.can_access_request(request_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM requests.service_requests
    WHERE id = request_id
  );
$$ LANGUAGE sql;

-- Apply to request child tables
DROP POLICY IF EXISTS request_selected_activities_policy ON requests.request_selected_activities;
CREATE POLICY request_selected_activities_policy ON requests.request_selected_activities FOR ALL TO authenticated USING (requests.can_access_request(service_request_id));

DROP POLICY IF EXISTS request_selected_branches_policy ON requests.request_selected_branches;
CREATE POLICY request_selected_branches_policy ON requests.request_selected_branches FOR ALL TO authenticated USING (requests.can_access_request(service_request_id));

DROP POLICY IF EXISTS request_form_snapshots_policy ON requests.request_form_snapshots;
CREATE POLICY request_form_snapshots_policy ON requests.request_form_snapshots FOR ALL TO authenticated USING (requests.can_access_request(service_request_id));

DROP POLICY IF EXISTS request_form_snapshot_payloads_policy ON requests.request_form_snapshot_payloads;
CREATE POLICY request_form_snapshot_payloads_policy ON requests.request_form_snapshot_payloads FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM requests.request_form_snapshots WHERE id = request_form_snapshot_id));

DROP POLICY IF EXISTS request_status_histories_policy ON requests.request_status_histories;
CREATE POLICY request_status_histories_policy ON requests.request_status_histories FOR ALL TO authenticated USING (requests.can_access_request(service_request_id));

DROP POLICY IF EXISTS request_assignment_histories_policy ON requests.request_assignment_histories;
CREATE POLICY request_assignment_histories_policy ON requests.request_assignment_histories FOR ALL TO authenticated USING (requests.can_access_request(service_request_id));

DROP POLICY IF EXISTS request_completion_requests_policy ON requests.request_completion_requests;
CREATE POLICY request_completion_requests_policy ON requests.request_completion_requests FOR ALL TO authenticated USING (requests.can_access_request(service_request_id));

DROP POLICY IF EXISTS request_completion_responses_policy ON requests.request_completion_responses;
CREATE POLICY request_completion_responses_policy ON requests.request_completion_responses FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM requests.request_completion_requests WHERE id = completion_request_id));

DROP POLICY IF EXISTS request_decision_records_policy ON requests.request_decision_records;
CREATE POLICY request_decision_records_policy ON requests.request_decision_records FOR ALL TO authenticated USING (requests.can_access_request(service_request_id));

DROP POLICY IF EXISTS request_decision_revisions_policy ON requests.request_decision_revisions;
CREATE POLICY request_decision_revisions_policy ON requests.request_decision_revisions FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM requests.request_decision_records WHERE id = decision_record_id));

DROP POLICY IF EXISTS request_close_archive_records_policy ON requests.request_close_archive_records;
CREATE POLICY request_close_archive_records_policy ON requests.request_close_archive_records FOR ALL TO authenticated USING (requests.can_access_request(service_request_id));

DROP POLICY IF EXISTS request_reopen_records_policy ON requests.request_reopen_records;
CREATE POLICY request_reopen_records_policy ON requests.request_reopen_records FOR ALL TO authenticated USING (requests.can_access_request(service_request_id));


-- balaghat.balaghs & details
DROP POLICY IF EXISTS balaghs_policy ON balaghat.balaghs;
CREATE POLICY balaghs_policy ON balaghat.balaghs
  FOR ALL TO authenticated
  USING (
    taxpayer_id IN (
      SELECT taxpayer_id FROM registry.taxpayer_account_links 
      WHERE user_profile_id = identity.get_current_user_profile_id() AND active_state_code = 'active' AND effective_to IS NULL
    )
    OR identity.is_staff()
    OR identity.is_manager()
  );

CREATE OR REPLACE FUNCTION balaghat.can_access_balagh(balagh_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM balaghat.balaghs
    WHERE id = balagh_id
  );
$$ LANGUAGE sql;

-- Apply to balaghat child tables
DROP POLICY IF EXISTS balagh_selected_activities_policy ON balaghat.balagh_selected_activities;
CREATE POLICY balagh_selected_activities_policy ON balaghat.balagh_selected_activities FOR ALL TO authenticated USING (balaghat.can_access_balagh(balagh_id));

DROP POLICY IF EXISTS balagh_selected_branches_policy ON balaghat.balagh_selected_branches;
CREATE POLICY balagh_selected_branches_policy ON balaghat.balagh_selected_branches FOR ALL TO authenticated USING (balaghat.can_access_balagh(balagh_id));

DROP POLICY IF EXISTS balagh_form_snapshots_policy ON balaghat.balagh_form_snapshots;
CREATE POLICY balagh_form_snapshots_policy ON balaghat.balagh_form_snapshots FOR ALL TO authenticated USING (balaghat.can_access_balagh(balagh_id));

DROP POLICY IF EXISTS balagh_form_snapshot_payloads_policy ON balaghat.balagh_form_snapshot_payloads;
CREATE POLICY balagh_form_snapshot_payloads_policy ON balaghat.balagh_form_snapshot_payloads FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM balaghat.balagh_form_snapshots WHERE id = balagh_form_snapshot_id));

DROP POLICY IF EXISTS balagh_status_histories_policy ON balaghat.balagh_status_histories;
CREATE POLICY balagh_status_histories_policy ON balaghat.balagh_status_histories FOR ALL TO authenticated USING (balaghat.can_access_balagh(balagh_id));

DROP POLICY IF EXISTS balagh_assignment_histories_policy ON balaghat.balagh_assignment_histories;
CREATE POLICY balagh_assignment_histories_policy ON balaghat.balagh_assignment_histories FOR ALL TO authenticated USING (balaghat.can_access_balagh(balagh_id));

DROP POLICY IF EXISTS balagh_completion_requests_policy ON balaghat.balagh_completion_requests;
CREATE POLICY balagh_completion_requests_policy ON balaghat.balagh_completion_requests FOR ALL TO authenticated USING (balaghat.can_access_balagh(balagh_id));

DROP POLICY IF EXISTS balagh_completion_responses_policy ON balaghat.balagh_completion_responses;
CREATE POLICY balagh_completion_responses_policy ON balaghat.balagh_completion_responses FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM balaghat.balagh_completion_requests WHERE id = completion_request_id));

DROP POLICY IF EXISTS balagh_decision_records_policy ON balaghat.balagh_decision_records;
CREATE POLICY balagh_decision_records_policy ON balaghat.balagh_decision_records FOR ALL TO authenticated USING (balaghat.can_access_balagh(balagh_id));

DROP POLICY IF EXISTS balagh_decision_revisions_policy ON balaghat.balagh_decision_revisions;
CREATE POLICY balagh_decision_revisions_policy ON balaghat.balagh_decision_revisions FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM balaghat.balagh_decision_records WHERE id = decision_record_id));


-- visits.field_visits
DROP POLICY IF EXISTS field_visits_policy ON visits.field_visits;
CREATE POLICY field_visits_policy ON visits.field_visits
  FOR ALL TO authenticated
  USING (
    (service_request_id IS NOT NULL AND requests.can_access_request(service_request_id))
    OR (balagh_id IS NOT NULL AND balaghat.can_access_balagh(balagh_id))
    -- Employee role
    OR team_lead_id = identity.get_current_staff_profile_id()
    OR EXISTS (
      SELECT 1 FROM visits.visit_team_members 
      WHERE field_visit_id = field_visits.id AND staff_profile_id = identity.get_current_staff_profile_id() AND effective_to IS NULL
    )
    OR identity.is_manager()
  );

CREATE OR REPLACE FUNCTION visits.can_access_visit(visit_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM visits.field_visits
    WHERE id = visit_id
  );
$$ LANGUAGE sql;

-- visits detail tables
DROP POLICY IF EXISTS visit_schedules_policy ON visits.visit_schedules;
CREATE POLICY visit_schedules_policy ON visits.visit_schedules FOR ALL TO authenticated USING (visits.can_access_visit(field_visit_id));

DROP POLICY IF EXISTS visit_team_members_policy ON visits.visit_team_members;
CREATE POLICY visit_team_members_policy ON visits.visit_team_members FOR ALL TO authenticated USING (visits.can_access_visit(field_visit_id));

DROP POLICY IF EXISTS visit_results_policy ON visits.visit_results;
CREATE POLICY visit_results_policy ON visits.visit_results FOR ALL TO authenticated USING (visits.can_access_visit(field_visit_id));

DROP POLICY IF EXISTS visit_result_corrections_policy ON visits.visit_result_corrections;
CREATE POLICY visit_result_corrections_policy ON visits.visit_result_corrections FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM visits.visit_results WHERE id = visit_result_id));

DROP POLICY IF EXISTS visit_evidences_policy ON visits.visit_evidences;
CREATE POLICY visit_evidences_policy ON visits.visit_evidences FOR ALL TO authenticated USING (visits.can_access_visit(field_visit_id));


-- dues.payment_dues & related
DROP POLICY IF EXISTS payment_dues_policy ON dues.payment_dues;
CREATE POLICY payment_dues_policy ON dues.payment_dues
  FOR ALL TO authenticated
  USING (
    service_request_id IN (
      SELECT id FROM requests.service_requests
      WHERE taxpayer_id IN (
        SELECT taxpayer_id FROM registry.taxpayer_account_links 
        WHERE user_profile_id = identity.get_current_user_profile_id() AND active_state_code = 'active' AND effective_to IS NULL
      )
    )
    OR balagh_id IN (
      SELECT id FROM balaghat.balaghs
      WHERE taxpayer_id IN (
        SELECT taxpayer_id FROM registry.taxpayer_account_links 
        WHERE user_profile_id = identity.get_current_user_profile_id() AND active_state_code = 'active' AND effective_to IS NULL
      )
    )
    -- Employees and Finance Officers can see dues
    OR identity.is_staff()
    OR identity.is_manager()
  );

CREATE OR REPLACE FUNCTION dues.can_access_due(due_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM dues.payment_dues
    WHERE id = due_id
  );
$$ LANGUAGE sql;

DROP POLICY IF EXISTS due_basis_document_references_policy ON dues.due_basis_document_references;
CREATE POLICY due_basis_document_references_policy ON dues.due_basis_document_references FOR ALL TO authenticated USING (dues.can_access_due(payment_due_id));

DROP POLICY IF EXISTS due_corrections_policy ON dues.due_corrections;
CREATE POLICY due_corrections_policy ON dues.due_corrections FOR ALL TO authenticated USING (dues.can_access_due(payment_due_id));

DROP POLICY IF EXISTS payment_notices_policy ON dues.payment_notices;
CREATE POLICY payment_notices_policy ON dues.payment_notices FOR ALL TO authenticated USING (dues.can_access_due(payment_due_id));

DROP POLICY IF EXISTS payment_receipts_policy ON dues.payment_receipts;
CREATE POLICY payment_receipts_policy ON dues.payment_receipts FOR ALL TO authenticated USING (dues.can_access_due(payment_due_id));

DROP POLICY IF EXISTS receipt_correction_replacements_policy ON dues.receipt_correction_replacements;
CREATE POLICY receipt_correction_replacements_policy ON dues.receipt_correction_replacements FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM dues.payment_receipts WHERE id = payment_receipt_id));

DROP POLICY IF EXISTS payment_confirmations_policy ON dues.payment_confirmations;
CREATE POLICY payment_confirmations_policy ON dues.payment_confirmations FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM dues.payment_receipts WHERE id = payment_receipt_id));


-- notify.notification_messages
DROP POLICY IF EXISTS notification_messages_policy ON notify.notification_messages;
CREATE POLICY notification_messages_policy ON notify.notification_messages
  FOR ALL TO authenticated
  USING (
    id IN (
      SELECT notification_message_id FROM notify.notification_read_states 
      WHERE recipient_profile_id = identity.get_current_user_profile_id()
    )
    OR identity.is_staff()
    OR identity.is_manager()
  );

DROP POLICY IF EXISTS notification_read_states_policy ON notify.notification_read_states;
CREATE POLICY notification_read_states_policy ON notify.notification_read_states
  FOR ALL TO authenticated
  USING (recipient_profile_id = identity.get_current_user_profile_id() OR identity.is_manager());

-- notify templates / config (general read)
DROP POLICY IF EXISTS notification_templates_read_policy ON notify.notification_templates;
CREATE POLICY notification_templates_read_policy ON notify.notification_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS notification_channel_configurations_read_policy ON notify.notification_channel_configurations;
CREATE POLICY notification_channel_configurations_read_policy ON notify.notification_channel_configurations FOR SELECT TO authenticated USING (true);


-- imports
DROP POLICY IF EXISTS import_jobs_policy ON imports.import_jobs;
CREATE POLICY import_jobs_policy ON imports.import_jobs
  FOR ALL TO authenticated
  USING (identity.is_staff() OR identity.is_manager());

DROP POLICY IF EXISTS import_files_policy ON imports.import_files;
CREATE POLICY import_files_policy ON imports.import_files
  FOR ALL TO authenticated
  USING (identity.is_staff() OR identity.is_manager());

DROP POLICY IF EXISTS import_rows_policy ON imports.import_rows;
CREATE POLICY import_rows_policy ON imports.import_rows
  FOR ALL TO authenticated
  USING (identity.is_staff() OR identity.is_manager());

DROP POLICY IF EXISTS import_errors_policy ON imports.import_errors;
CREATE POLICY import_errors_policy ON imports.import_errors
  FOR ALL TO authenticated
  USING (identity.is_staff() OR identity.is_manager());


-- content (Public read policy)
DROP POLICY IF EXISTS content_pages_read_policy ON content.content_pages;
CREATE POLICY content_pages_read_policy ON content.content_pages FOR SELECT USING (true);
CREATE POLICY content_pages_write_policy ON content.content_pages FOR ALL TO authenticated USING (identity.has_role('content_manager') OR identity.is_manager());

DROP POLICY IF EXISTS content_versions_read_policy ON content.content_versions;
CREATE POLICY content_versions_read_policy ON content.content_versions FOR SELECT USING (true);
CREATE POLICY content_versions_write_policy ON content.content_versions FOR ALL TO authenticated USING (identity.has_role('content_manager') OR identity.is_manager());

DROP POLICY IF EXISTS announcements_read_policy ON content.announcements;
CREATE POLICY announcements_read_policy ON content.announcements FOR SELECT USING (true);
CREATE POLICY announcements_write_policy ON content.announcements FOR ALL TO authenticated USING (identity.has_role('content_manager') OR identity.is_manager());

DROP POLICY IF EXISTS library_documents_read_policy ON content.library_documents;
CREATE POLICY library_documents_read_policy ON content.library_documents FOR SELECT USING (true);
CREATE POLICY library_documents_write_policy ON content.library_documents FOR ALL TO authenticated USING (identity.has_role('content_manager') OR identity.is_manager());

DROP POLICY IF EXISTS faqs_read_policy ON content.faqs;
CREATE POLICY faqs_read_policy ON content.faqs FOR SELECT USING (true);
CREATE POLICY faqs_write_policy ON content.faqs FOR ALL TO authenticated USING (identity.has_role('content_manager') OR identity.is_manager());


-- reporting
-- DROP POLICY IF EXISTS saved_report_filters_policy ON reporting.saved_report_filters;
-- CREATE POLICY saved_report_filters_policy ON reporting.saved_report_filters
--   FOR ALL TO authenticated
--   USING (user_profile_id = identity.get_current_user_profile_id() OR identity.is_manager());

-- DROP POLICY IF EXISTS report_export_records_policy ON reporting.report_export_records;
-- CREATE POLICY report_export_records_policy ON reporting.report_export_records
--   FOR ALL TO authenticated
--   USING (requested_by_user_profile_id = identity.get_current_user_profile_id() OR identity.is_manager());

-- DROP POLICY IF EXISTS reporting_projection_definitions_policy ON reporting.reporting_projection_definitions;
-- CREATE POLICY reporting_projection_definitions_policy ON reporting.reporting_projection_definitions
--   FOR ALL TO authenticated
--   USING (identity.is_staff() OR identity.is_manager());


-- audit (auditor and manager read access only)
DROP POLICY IF EXISTS audit_logs_policy ON audit.audit_logs;
CREATE POLICY audit_logs_policy ON audit.audit_logs
  FOR ALL TO authenticated
  USING (identity.has_role('auditor') OR identity.is_manager());

DROP POLICY IF EXISTS log_events_policy ON audit.log_events;
CREATE POLICY log_events_policy ON audit.log_events
  FOR ALL TO authenticated
  USING (identity.has_role('auditor') OR identity.is_manager());

DROP POLICY IF EXISTS event_outbox_policy ON audit.event_outbox;
CREATE POLICY event_outbox_policy ON audit.event_outbox
  FOR ALL TO authenticated
  USING (identity.has_role('technical_admin') OR identity.is_manager());

COMMIT;
