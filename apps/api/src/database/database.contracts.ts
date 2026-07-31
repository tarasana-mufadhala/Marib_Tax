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

export interface DatabaseSchemas {
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
}
