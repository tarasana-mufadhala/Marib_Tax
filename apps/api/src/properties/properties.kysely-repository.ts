import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  PropertiesRepository,
  StoredProperty,
  StoredPropertyUnit,
  StoredPropertyOwnershipRecord,
} from './properties.repository.js';

@Injectable()
export class PropertiesKyselyRepository implements PropertiesRepository {
  private readonly memoryProperties = new Map<string, StoredProperty>();
  private readonly memoryUnits = new Map<string, StoredPropertyUnit>();
  private readonly memoryOwnerships = new Map<
    string,
    StoredPropertyOwnershipRecord
  >();

  constructor(private readonly dbService: DatabaseService) {}

  async findPropertyById(id: string): Promise<StoredProperty | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('masterdata.properties')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        publicRef: row.public_ref,
        statusCode: row.status_code,
        description: row.description,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
      };
    }
    return this.memoryProperties.get(id) ?? null;
  }

  async findPropertyUnitsByPropertyId(
    propertyId: string,
  ): Promise<StoredPropertyUnit[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('masterdata.property_units')
        .selectAll()
        .where('property_id', '=', propertyId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        propertyId: row.property_id,
        publicRef: row.public_ref,
        unitLabel: row.unit_label,
        statusCode: row.status_code,
      }));
    }
    return [...this.memoryUnits.values()].filter(
      (u) => u.propertyId === propertyId,
    );
  }

  async findOwnershipRecordsByPropertyId(
    propertyId: string,
  ): Promise<StoredPropertyOwnershipRecord[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('masterdata.property_ownership_records')
        .selectAll()
        .where('property_id', '=', propertyId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        propertyId: row.property_id,
        taxpayerId: row.taxpayer_id,
        partyRoleCode: row.party_role_code,
        isCurrent: row.is_current,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
      }));
    }
    return [...this.memoryOwnerships.values()].filter(
      (o) => o.propertyId === propertyId,
    );
  }

  async findOwnershipRecordsByTaxpayerId(
    taxpayerId: string,
  ): Promise<StoredPropertyOwnershipRecord[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('masterdata.property_ownership_records')
        .selectAll()
        .where('taxpayer_id', '=', taxpayerId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        propertyId: row.property_id,
        taxpayerId: row.taxpayer_id,
        partyRoleCode: row.party_role_code,
        isCurrent: row.is_current,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
      }));
    }
    return [...this.memoryOwnerships.values()].filter(
      (o) => o.taxpayerId === taxpayerId,
    );
  }

  async createProperty(property: StoredProperty): Promise<StoredProperty> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('masterdata.properties')
        .values({
          id: property.id,
          public_ref: property.publicRef,
          status_code: property.statusCode,
          description: property.description,
          created_by_profile_id: property.createdByProfileId,
        })
        .execute();
      return property;
    }
    this.memoryProperties.set(property.id, property);
    return property;
  }

  async createPropertyUnit(
    unit: StoredPropertyUnit,
  ): Promise<StoredPropertyUnit> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('masterdata.property_units')
        .values({
          id: unit.id,
          property_id: unit.propertyId,
          public_ref: unit.publicRef,
          unit_label: unit.unitLabel,
          status_code: unit.statusCode,
        })
        .execute();
      return unit;
    }
    this.memoryUnits.set(unit.id, unit);
    return unit;
  }

  async createOwnershipRecord(
    record: StoredPropertyOwnershipRecord,
    actorProfileId: string,
  ): Promise<StoredPropertyOwnershipRecord> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('masterdata.property_ownership_records')
        .values({
          id: record.id,
          property_id: record.propertyId,
          taxpayer_id: record.taxpayerId,
          party_role_code: record.partyRoleCode,
          is_current: record.isCurrent,
          effective_from: record.effectiveFrom,
          effective_to: record.effectiveTo,
          created_by_profile_id: actorProfileId,
        })
        .execute();
      return record;
    }
    this.memoryOwnerships.set(record.id, record);
    return record;
  }
}
