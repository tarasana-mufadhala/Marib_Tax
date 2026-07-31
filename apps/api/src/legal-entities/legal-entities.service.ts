import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  LEGAL_ENTITIES_REPOSITORY,
  type LegalEntitiesRepository,
  type StoredLegalEntity,
  type StoredTaxNumber,
  type StoredTaxpayerLegalEntityAssociation,
} from './legal-entities.repository.js';

@Injectable()
export class LegalEntitiesService {
  constructor(
    @Inject(LEGAL_ENTITIES_REPOSITORY)
    private readonly repository: LegalEntitiesRepository,
  ) {}

  async getLegalEntity(id: string): Promise<StoredLegalEntity> {
    const entity = await this.repository.findLegalEntityById(id);
    if (!entity) {
      throw new NotFoundException('Legal entity record not found.');
    }
    return entity;
  }

  async getTaxNumberByValue(value: string): Promise<StoredTaxNumber> {
    const taxNumber = await this.repository.findTaxNumberByValue(value);
    if (!taxNumber) {
      throw new NotFoundException('Tax number record not found.');
    }
    return taxNumber;
  }

  async getTaxNumberForTaxpayer(taxpayerId: string): Promise<StoredTaxNumber> {
    const taxNumber =
      await this.repository.findTaxNumberByTaxpayerId(taxpayerId);
    if (!taxNumber) {
      throw new NotFoundException(
        'Active tax number not found for this taxpayer.',
      );
    }
    return taxNumber;
  }

  async listAssociations(
    taxpayerId: string,
  ): Promise<StoredTaxpayerLegalEntityAssociation[]> {
    return this.repository.findAssociationsByTaxpayerId(taxpayerId);
  }

  async createLegalEntity(
    input: {
      legalName: string;
      classificationCode?: string | null;
    },
    actorProfileId: string,
  ): Promise<StoredLegalEntity> {
    if (!input.legalName || input.legalName.trim() === '') {
      throw new BadRequestException('Legal name cannot be empty.');
    }

    const entity: StoredLegalEntity = {
      id: randomUUID(),
      publicRef: `LGE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      legalName: input.legalName.trim(),
      classificationCode: input.classificationCode ?? null,
      isActive: true,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
    };

    return this.repository.createLegalEntity(entity);
  }

  async issueTaxNumber(
    input: {
      legalEntityId: string;
      taxpayerId?: string | null;
      taxNumberValue: string;
    },
    actorProfileId: string,
  ): Promise<StoredTaxNumber> {
    const entity = await this.repository.findLegalEntityById(
      input.legalEntityId,
    );
    if (!entity) {
      throw new NotFoundException('Target legal entity not found.');
    }

    const existing = await this.repository.findTaxNumberByValue(
      input.taxNumberValue,
    );
    if (existing && existing.statusCode === 'issued') {
      throw new ConflictException('This tax number is already active.');
    }

    const taxNumber: StoredTaxNumber = {
      id: randomUUID(),
      legalEntityId: input.legalEntityId,
      taxpayerId: input.taxpayerId ?? null,
      taxNumberValue: input.taxNumberValue,
      statusCode: 'issued',
      issuedAt: new Date(),
      supersededById: null,
      correctionReason: null,
    };

    return this.repository.createTaxNumber(taxNumber, actorProfileId);
  }

  async associateTaxpayer(
    input: {
      taxpayerId: string;
      legalEntityId: string;
      associationTypeCode: string;
    },
    actorProfileId: string,
  ): Promise<StoredTaxpayerLegalEntityAssociation> {
    const entity = await this.repository.findLegalEntityById(
      input.legalEntityId,
    );
    if (!entity) {
      throw new NotFoundException('Target legal entity not found.');
    }

    const association: StoredTaxpayerLegalEntityAssociation = {
      id: randomUUID(),
      taxpayerId: input.taxpayerId,
      legalEntityId: input.legalEntityId,
      associationTypeCode: input.associationTypeCode,
      effectiveFrom: new Date(),
      effectiveTo: null,
    };

    return this.repository.createAssociation(association, actorProfileId);
  }
}
