export interface StoredLegalEntity {
  id: string;
  publicRef: string | null;
  legalName: string;
  classificationCode: string | null;
  isActive: boolean;
  createdAt: Date;
  createdByProfileId: string | null;
}

export interface StoredTaxNumber {
  id: string;
  legalEntityId: string;
  taxpayerId: string | null;
  taxNumberValue: string;
  statusCode: 'issued' | 'invalid' | 'replaced';
  issuedAt: Date | null;
  supersededById: string | null;
  correctionReason: string | null;
}

export interface StoredTaxpayerLegalEntityAssociation {
  id: string;
  taxpayerId: string;
  legalEntityId: string;
  associationTypeCode: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export const LEGAL_ENTITIES_REPOSITORY = Symbol('LEGAL_ENTITIES_REPOSITORY');

export interface LegalEntitiesRepository {
  findLegalEntityById(id: string): Promise<StoredLegalEntity | null>;
  findTaxNumberByValue(value: string): Promise<StoredTaxNumber | null>;
  findTaxNumberByTaxpayerId(
    taxpayerId: string,
  ): Promise<StoredTaxNumber | null>;
  findAssociationsByTaxpayerId(
    taxpayerId: string,
  ): Promise<StoredTaxpayerLegalEntityAssociation[]>;
  createLegalEntity(entity: StoredLegalEntity): Promise<StoredLegalEntity>;
  createTaxNumber(
    taxNumber: StoredTaxNumber,
    actorProfileId: string,
  ): Promise<StoredTaxNumber>;
  createAssociation(
    association: StoredTaxpayerLegalEntityAssociation,
    actorProfileId: string,
  ): Promise<StoredTaxpayerLegalEntityAssociation>;
}
