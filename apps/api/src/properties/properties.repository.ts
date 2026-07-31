export interface StoredProperty {
  id: string;
  publicRef: string | null;
  statusCode: string;
  description: string | null;
  createdAt: Date;
  createdByProfileId: string | null;
}

export interface StoredPropertyUnit {
  id: string;
  propertyId: string;
  publicRef: string | null;
  unitLabel: string | null;
  statusCode: string;
}

export interface StoredPropertyOwnershipRecord {
  id: string;
  propertyId: string;
  taxpayerId: string;
  partyRoleCode: string;
  isCurrent: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export const PROPERTIES_REPOSITORY = Symbol('PROPERTIES_REPOSITORY');

export interface PropertiesRepository {
  findPropertyById(id: string): Promise<StoredProperty | null>;
  findPropertyUnitsByPropertyId(
    propertyId: string,
  ): Promise<StoredPropertyUnit[]>;
  findOwnershipRecordsByPropertyId(
    propertyId: string,
  ): Promise<StoredPropertyOwnershipRecord[]>;
  findOwnershipRecordsByTaxpayerId(
    taxpayerId: string,
  ): Promise<StoredPropertyOwnershipRecord[]>;
  createProperty(property: StoredProperty): Promise<StoredProperty>;
  createPropertyUnit(unit: StoredPropertyUnit): Promise<StoredPropertyUnit>;
  createOwnershipRecord(
    record: StoredPropertyOwnershipRecord,
    actorProfileId: string,
  ): Promise<StoredPropertyOwnershipRecord>;
}
