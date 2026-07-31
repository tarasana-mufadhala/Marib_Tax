import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  LegalEntitiesRepository,
  StoredLegalEntity,
  StoredTaxNumber,
  StoredTaxpayerLegalEntityAssociation,
} from './legal-entities.repository.js';

@Injectable()
export class LegalEntitiesKyselyRepository implements LegalEntitiesRepository {
  private readonly memoryEntities = new Map<string, StoredLegalEntity>();
  private readonly memoryTaxNumbers = new Map<string, StoredTaxNumber>();
  private readonly memoryAssociations = new Map<
    string,
    StoredTaxpayerLegalEntityAssociation
  >();

  constructor(private readonly dbService: DatabaseService) {}

  async findLegalEntityById(id: string): Promise<StoredLegalEntity | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('legal.legal_entities')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        publicRef: row.public_ref,
        legalName: row.legal_name,
        classificationCode: row.classification_code,
        isActive: row.is_active,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
      };
    }
    return this.memoryEntities.get(id) ?? null;
  }

  async findTaxNumberByValue(value: string): Promise<StoredTaxNumber | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('legal.tax_numbers')
        .selectAll()
        .where('tax_number_value', '=', value)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        legalEntityId: row.legal_entity_id,
        taxpayerId: row.taxpayer_id,
        taxNumberValue: row.tax_number_value,
        statusCode: row.status_code,
        issuedAt: row.issued_at,
        supersededById: row.superseded_by_id,
        correctionReason: row.correction_reason,
      };
    }
    return (
      [...this.memoryTaxNumbers.values()].find(
        (tn) => tn.taxNumberValue === value,
      ) ?? null
    );
  }

  async findTaxNumberByTaxpayerId(
    taxpayerId: string,
  ): Promise<StoredTaxNumber | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('legal.tax_numbers')
        .selectAll()
        .where('taxpayer_id', '=', taxpayerId)
        .where('status_code', '=', 'issued')
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        legalEntityId: row.legal_entity_id,
        taxpayerId: row.taxpayer_id,
        taxNumberValue: row.tax_number_value,
        statusCode: row.status_code,
        issuedAt: row.issued_at,
        supersededById: row.superseded_by_id,
        correctionReason: row.correction_reason,
      };
    }
    return (
      [...this.memoryTaxNumbers.values()].find(
        (tn) => tn.taxpayerId === taxpayerId && tn.statusCode === 'issued',
      ) ?? null
    );
  }

  async findAssociationsByTaxpayerId(
    taxpayerId: string,
  ): Promise<StoredTaxpayerLegalEntityAssociation[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('registry.taxpayer_legal_entity_associations')
        .selectAll()
        .where('taxpayer_id', '=', taxpayerId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        taxpayerId: row.taxpayer_id,
        legalEntityId: row.legal_entity_id,
        associationTypeCode: row.association_type_code,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
      }));
    }
    return [...this.memoryAssociations.values()].filter(
      (a) => a.taxpayerId === taxpayerId,
    );
  }

  async createLegalEntity(
    entity: StoredLegalEntity,
  ): Promise<StoredLegalEntity> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('legal.legal_entities')
        .values({
          id: entity.id,
          public_ref: entity.publicRef,
          legal_name: entity.legalName,
          classification_code: entity.classificationCode,
          is_active: entity.isActive,
          created_by_profile_id: entity.createdByProfileId,
        })
        .execute();
      return entity;
    }
    this.memoryEntities.set(entity.id, entity);
    return entity;
  }

  async createTaxNumber(
    taxNumber: StoredTaxNumber,
    actorProfileId: string,
  ): Promise<StoredTaxNumber> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('legal.tax_numbers')
        .values({
          id: taxNumber.id,
          legal_entity_id: taxNumber.legalEntityId,
          taxpayer_id: taxNumber.taxpayerId,
          tax_number_value: taxNumber.taxNumberValue,
          status_code: taxNumber.statusCode,
          issued_at: taxNumber.issuedAt,
          superseded_by_id: taxNumber.supersededById,
          correction_reason: taxNumber.correctionReason,
          created_by_profile_id: actorProfileId,
        })
        .execute();
      return taxNumber;
    }
    this.memoryTaxNumbers.set(taxNumber.id, taxNumber);
    return taxNumber;
  }

  async createAssociation(
    association: StoredTaxpayerLegalEntityAssociation,
    actorProfileId: string,
  ): Promise<StoredTaxpayerLegalEntityAssociation> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('registry.taxpayer_legal_entity_associations')
        .values({
          id: association.id,
          taxpayer_id: association.taxpayerId,
          legal_entity_id: association.legalEntityId,
          association_type_code: association.associationTypeCode,
          effective_from: association.effectiveFrom,
          effective_to: association.effectiveTo,
          created_by_profile_id: actorProfileId,
        })
        .execute();
      return association;
    }
    this.memoryAssociations.set(association.id, association);
    return association;
  }
}
