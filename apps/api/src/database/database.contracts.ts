import type { Generated } from 'kysely';

export interface TaxpayersTable {
  id: string;
  public_ref: string | null;
  display_name: string;
  status_code: string;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
  archived_at: Date | null;
}

export interface TaxpayerContactsTable {
  id: string;
  taxpayer_id: string;
  contact_type_code: string;
  contact_value: string;
  is_primary: Generated<boolean>;
  is_active: Generated<boolean>;
  effective_from: Date;
  effective_to: Date | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
}

export interface TaxpayerAccountLinksTable {
  id: string;
  public_ref: string | null;
  user_profile_id: string;
  taxpayer_id: string;
  relationship_type_code: string;
  active_state_code: string;
  verification_status_code: string;
  effective_from: Date;
  effective_to: Date | null;
  approved_by_profile_id: string | null;
  revoked_by_profile_id: string | null;
  reason_reference: string | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface LegalEntitiesTable {
  id: string;
  public_ref: string | null;
  legal_name: string;
  classification_code: string | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
  archived_at: Date | null;
}

export interface TaxNumbersTable {
  id: string;
  legal_entity_id: string;
  taxpayer_id: string | null;
  tax_number_value: string;
  status_code: 'issued' | 'invalid' | 'replaced';
  issued_at: Date | null;
  superseded_by_id: string | null;
  correlation_id: string | null;
  correction_reason: string | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
}

export interface TaxpayerLegalEntityAssociationsTable {
  id: string;
  taxpayer_id: string;
  legal_entity_id: string;
  association_type_code: string;
  effective_from: Date;
  effective_to: Date | null;
  evidence_reference: string | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface CommercialActivitiesTable {
  id: string;
  public_ref: string | null;
  taxpayer_id: string;
  name: string;
  status_code: string;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
  archived_at: Date | null;
}

export interface BranchesTable {
  id: string;
  public_ref: string | null;
  commercial_activity_id: string;
  name: string;
  status_code: string;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
  archived_at: Date | null;
}

export interface ActivityAddressesTable {
  id: string;
  commercial_activity_id: string | null;
  branch_id: string | null;
  address_line: string | null;
  city_code: string | null;
  district_code: string | null;
  geo_payload: string | null; // jsonb payload as string
  effective_from: Date;
  effective_to: Date | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface PropertiesTable {
  id: string;
  public_ref: string | null;
  status_code: string;
  description: string | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
  archived_at: Date | null;
}

export interface PropertyUnitsTable {
  id: string;
  property_id: string;
  public_ref: string | null;
  unit_label: string | null;
  status_code: string;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  archived_at: Date | null;
}

export interface PropertyOwnershipRecordsTable {
  id: string;
  property_id: string;
  taxpayer_id: string;
  party_role_code: string;
  is_current: Generated<boolean>;
  effective_from: Date;
  effective_to: Date | null;
  evidence_reference: string | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface ServiceRequestsTable {
  id: string;
  public_ref: string | null;
  service_type_id: string;
  taxpayer_id: string;
  status_code: string;
  submitted_at: Date | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
  archived_at: Date | null;
  idempotency_key: string | null;
}

export interface ServiceTypesTable {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: Generated<boolean>;
  version_label: string | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
}

export interface FinancialCorrectionsTable {
  id: string;
  payment_due_id: string;
  correction_type: string;
  amount: number;
  currency_code: string;
  notes: string | null;
  created_at: Date;
}

export interface PaymentDuesTable {
  id: string;
  public_ref: string | null;
  taxpayer_id: string;
  service_request_id: string | null;
  balagh_id: string | null;
  amount: number;
  currency_code: string;
  status_code: string;
  assessed_at: Date | null;
  created_at: Date;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
  archived_at: Date | null;
}

export interface DueBasisDocumentReferencesTable {
  id: string;
  payment_due_id: string;
  document_reference: string | null;
  attachment_id: string | null;
  basis_type_code: string;
  created_at: Date;
  created_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface DueCorrectionsTable {
  id: string;
  payment_due_id: string;
  prior_amount: number;
  new_amount: number;
  currency_code: string;
  reason: string;
  corrected_at: Date;
  corrected_by_staff_profile_id: string;
  correlation_id: string | null;
  created_at: Date;
}

export interface PaymentReceiptsTable {
  id: string;
  public_ref: string | null;
  payment_due_id: string;
  amount: number;
  currency_code: string;
  acceptance_status_code: string;
  received_at: Date | null;
  replaces_receipt_id: string | null;
  created_at: Date;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface PaymentConfirmationsTable {
  id: string;
  payment_receipt_id: string;
  outcome_code: string;
  confirmed_at: Date;
  confirmed_by_profile_id: string;
  amount_confirmed: number | null;
  currency_code: string | null;
  created_at: Date;
  created_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface FieldVisitsTable {
  id: string;
  public_ref: string | null;
  service_request_id: string | null;
  balagh_id: string | null;
  status_code: string;
  actual_started_at: Date | null;
  actual_ended_at: Date | null;
  location_snapshot: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: Date;
  created_by_staff_profile_id: string;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
  archived_at: Date | null;
}

export interface VisitSchedulesTable {
  id: string;
  field_visit_id: string;
  scheduled_start_at: Date;
  scheduled_end_at: Date;
  schedule_status_code: string;
  revision_number: number;
  schedule_change_reason: string | null;
  created_at: Date;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface VisitTeamMembersTable {
  id: string;
  field_visit_id: string;
  staff_profile_id: string;
  role_on_visit: string | null;
  effective_from: Date;
  effective_to: Date | null;
  created_at: Date;
  created_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface VisitResultsTable {
  id: string;
  field_visit_id: string;
  result_summary: string | null;
  result_code: string | null;
  recorded_at: Date;
  recorded_by_staff_profile_id: string;
  created_at: Date;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface RequestDecisionRecordsTable {
  id: string;
  service_request_id: string;
  outcome_code: string;
  decision_summary: string | null;
  basis_text: string | null;
  decided_at: Date;
  decided_by_staff_profile_id: string;
  created_at: Date;
  created_by_profile_id: string | null;
  correlation_id: string | null;
}

export interface RequestDecisionRevisionsTable {
  id: string;
  decision_record_id: string;
  revision_number: number;
  revised_outcome_code: string | null;
  revision_summary: string | null;
  revised_at: Date;
  revised_by_staff_profile_id: string;
  reason: string | null;
  correlation_id: string | null;
  created_at: Date;
}

export interface NotificationTemplatesTable {
  id: string;
  code: string;
  name: string;
  channel_code: string;
  is_active: boolean;
  created_at: Date;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
}

export interface NotificationChannelConfigurationsTable {
  id: string;
  channel_code: string;
  is_enabled: boolean;
  config_label: string | null;
  created_at: Date;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
}

export interface NotificationMessagesTable {
  id: string;
  service_request_id: string | null;
  balagh_id: string | null;
  payment_notice_id: string | null;
  template_id: string | null;
  channel_config_id: string | null;
  delivery_status_code: string;
  recipient_profile_id: string | null;
  created_at: Date;
  created_by_profile_id: string | null;
  correlation_id: string | null;
  idempotency_key: string | null;
}

export interface DeliveryAttemptsTable {
  id: string;
  notification_message_id: string;
  attempt_number: number;
  attempt_status_code: string;
  provider_reference: string | null;
  failure_reason_safe: string | null;
  attempted_at: Date;
  correlation_id: string | null;
  created_at: Date;
}

export interface NotificationReadStatesTable {
  id: string;
  notification_message_id: string;
  recipient_profile_id: string;
  read_status_code: string;
  first_read_at: Date | null;
  latest_acknowledged_at: Date | null;
  read_source_channel_code: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface NotificationOutboxMessagesTable {
  id: string;
  notification_message_id: string | null;
  payload_ref: string | null;
  publication_state: string;
  attempt_count: number;
  last_error: string | null;
  next_attempt_at: Date | null;
  published_at: Date | null;
  idempotency_key: string | null;
  created_at: Date;
  correlation_id: string | null;
}

export interface DeviceTokensTable {
  id: string;
  user_profile_id: string;
  device_token: string;
  device_type: string;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Date | null;
}

// =============================================================================
// Identity schema
// =============================================================================

export interface IdentityUserProfilesTable {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  archived_at: Date | null;
}

export interface IdentityStaffProfilesTable {
  id: string;
  user_profile_id: string;
  staff_code: string | null;
  title: string | null;
  is_active: Generated<boolean>;
  effective_from: Date;
  effective_to: Date | null;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  archived_at: Date | null;
}

export interface IdentityRolesTable {
  id: string;
  code: string;
  name_ar: string;
  description: string | null;
  is_system: Generated<boolean>;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  archived_at: Date | null;
}

export interface IdentityPermissionsTable {
  id: string;
  code: string;
  resource: string;
  action: string;
  name_ar: string;
  description: string | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  created_by_profile_id: string | null;
  updated_at: Date | null;
  updated_by_profile_id: string | null;
  archived_at: Date | null;
}

export interface IdentityRolePermissionsTable {
  role_id: string;
  permission_id: string;
  granted_at: Generated<Date>;
  granted_by_profile_id: string | null;
}

export interface IdentityStaffRoleAssignmentsTable {
  id: string;
  staff_profile_id: string;
  role_id: string;
  effective_from: Date;
  effective_to: Date | null;
  assigned_at: Generated<Date>;
  assigned_by_profile_id: string | null;
  revoked_at: Date | null;
  revoked_by_profile_id: string | null;
  revocation_reason: string | null;
}

export interface DatabaseSchemas {
  // Identity schema
  'identity.user_profiles': IdentityUserProfilesTable;
  'identity.staff_profiles': IdentityStaffProfilesTable;
  'identity.roles': IdentityRolesTable;
  'identity.permissions': IdentityPermissionsTable;
  'identity.role_permissions': IdentityRolePermissionsTable;
  'identity.staff_role_assignments': IdentityStaffRoleAssignmentsTable;

  // Registry schema
  'registry.taxpayers': TaxpayersTable;
  'registry.taxpayer_contacts': TaxpayerContactsTable;
  'registry.taxpayer_account_links': TaxpayerAccountLinksTable;
  'registry.taxpayer_legal_entity_associations': TaxpayerLegalEntityAssociationsTable;

  // Legal schema
  'legal.legal_entities': LegalEntitiesTable;
  'legal.tax_numbers': TaxNumbersTable;

  // Masterdata schema
  'masterdata.commercial_activities': CommercialActivitiesTable;
  'masterdata.branches': BranchesTable;
  'masterdata.activity_addresses': ActivityAddressesTable;
  'masterdata.properties': PropertiesTable;
  'masterdata.property_units': PropertyUnitsTable;
  'masterdata.property_ownership_records': PropertyOwnershipRecordsTable;

  // Requests schema
  'requests.service_types': ServiceTypesTable;
  'requests.service_requests': ServiceRequestsTable;

  // Dues schema
  'dues.financial_corrections': FinancialCorrectionsTable;
  'dues.payment_dues': PaymentDuesTable;
  'dues.due_basis_document_references': DueBasisDocumentReferencesTable;
  'dues.due_corrections': DueCorrectionsTable;
  'dues.payment_receipts': PaymentReceiptsTable;
  'dues.payment_confirmations': PaymentConfirmationsTable;

  // Visits schema
  'visits.field_visits': FieldVisitsTable;
  'visits.visit_schedules': VisitSchedulesTable;
  'visits.visit_team_members': VisitTeamMembersTable;
  'visits.visit_results': VisitResultsTable;

  // Decisions schema
  'requests.request_decision_records': RequestDecisionRecordsTable;
  'requests.request_decision_revisions': RequestDecisionRevisionsTable;

  // Notify schema
  'notify.notification_templates': NotificationTemplatesTable;
  'notify.notification_channel_configurations': NotificationChannelConfigurationsTable;
  'notify.notification_messages': NotificationMessagesTable;
  'notify.delivery_attempts': DeliveryAttemptsTable;
  'notify.notification_read_states': NotificationReadStatesTable;
  'notify.notification_outbox_messages': NotificationOutboxMessagesTable;
  'notify.device_tokens': DeviceTokensTable;
}
