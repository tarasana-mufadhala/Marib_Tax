import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  PROPERTIES_REPOSITORY,
  type PropertiesRepository,
  type StoredProperty,
  type StoredPropertyUnit,
  type StoredPropertyOwnershipRecord,
} from './properties.repository.js';

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PROPERTIES_REPOSITORY)
    private readonly repository: PropertiesRepository,
  ) {}

  async getProperty(id: string): Promise<StoredProperty> {
    const property = await this.repository.findPropertyById(id);
    if (!property) {
      throw new NotFoundException('Property record not found.');
    }
    return property;
  }

  async getPropertyWithUnitsAndOwners(id: string): Promise<
    StoredProperty & {
      units: StoredPropertyUnit[];
      owners: StoredPropertyOwnershipRecord[];
    }
  > {
    const property = await this.getProperty(id);
    const units = await this.repository.findPropertyUnitsByPropertyId(id);
    const owners = await this.repository.findOwnershipRecordsByPropertyId(id);
    return {
      ...property,
      units,
      owners,
    };
  }

  async listOwnershipsForTaxpayer(
    taxpayerId: string,
  ): Promise<StoredPropertyOwnershipRecord[]> {
    return this.repository.findOwnershipRecordsByTaxpayerId(taxpayerId);
  }

  async createProperty(
    input: {
      statusCode: string;
      description?: string | null;
    },
    actorProfileId: string,
  ): Promise<StoredProperty> {
    const property: StoredProperty = {
      id: randomUUID(),
      publicRef: `PRP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      statusCode: input.statusCode,
      description: input.description ?? null,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
    };

    return this.repository.createProperty(property);
  }

  async createPropertyUnit(input: {
    propertyId: string;
    unitLabel: string;
    statusCode: string;
  }): Promise<StoredPropertyUnit> {
    const property = await this.repository.findPropertyById(input.propertyId);
    if (!property) {
      throw new NotFoundException('Parent property not found.');
    }

    if (!input.unitLabel || input.unitLabel.trim() === '') {
      throw new BadRequestException('Unit label cannot be empty.');
    }

    const unit: StoredPropertyUnit = {
      id: randomUUID(),
      propertyId: input.propertyId,
      publicRef: `UNT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      unitLabel: input.unitLabel.trim(),
      statusCode: input.statusCode,
    };

    return this.repository.createPropertyUnit(unit);
  }

  async createOwnershipRecord(
    input: {
      propertyId: string;
      taxpayerId: string;
      partyRoleCode: string;
    },
    actorProfileId: string,
  ): Promise<StoredPropertyOwnershipRecord> {
    const property = await this.repository.findPropertyById(input.propertyId);
    if (!property) {
      throw new NotFoundException('Target property not found.');
    }

    const record: StoredPropertyOwnershipRecord = {
      id: randomUUID(),
      propertyId: input.propertyId,
      taxpayerId: input.taxpayerId,
      partyRoleCode: input.partyRoleCode,
      isCurrent: true,
      effectiveFrom: new Date(),
      effectiveTo: null,
    };

    return this.repository.createOwnershipRecord(record, actorProfileId);
  }
}
