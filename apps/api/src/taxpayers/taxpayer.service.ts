import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  TAXPAYER_REPOSITORY,
  type TaxpayerRepository,
  type StoredTaxpayer,
  type StoredTaxpayerAccountLink,
} from './taxpayer.repository.js';

@Injectable()
export class TaxpayerService {
  constructor(
    @Inject(TAXPAYER_REPOSITORY)
    private readonly repository: TaxpayerRepository,
  ) {}

  async findTaxpayer(id: string): Promise<StoredTaxpayer> {
    const taxpayer = await this.repository.findById(id);
    if (!taxpayer) {
      throw new NotFoundException('Taxpayer registry record not found.');
    }
    return taxpayer;
  }

  async searchTaxpayers(query: string): Promise<StoredTaxpayer[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException(
        'Search query must be at least 2 characters long.',
      );
    }
    return this.repository.search(query.trim());
  }

  async listTaxpayers(limit = 50): Promise<StoredTaxpayer[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    return this.repository.list(safeLimit);
  }

  async getAccountLink(
    userProfileId: string,
  ): Promise<StoredTaxpayerAccountLink | null> {
    return this.repository.findActiveLinkByProfileId(userProfileId);
  }

  async linkAccount(
    input: {
      userProfileId: string;
      taxpayerId: string;
      relationshipType: string;
    },
    actorProfileId: string,
  ): Promise<StoredTaxpayerAccountLink> {
    const taxpayer = await this.repository.findById(input.taxpayerId);
    if (!taxpayer) {
      throw new NotFoundException('Target taxpayer registry record not found.');
    }

    const existingLink = await this.repository.findActiveLinkByProfileId(
      input.userProfileId,
    );
    if (existingLink) {
      throw new ConflictException(
        'An active taxpayer link already exists for this profile.',
      );
    }

    const link: StoredTaxpayerAccountLink = {
      id: randomUUID(),
      publicRef: `LNK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userProfileId: input.userProfileId,
      taxpayerId: input.taxpayerId,
      relationshipTypeCode: input.relationshipType,
      activeStateCode: 'active',
      verificationStatusCode: 'verified',
      effectiveFrom: new Date(),
      effectiveTo: null,
    };

    return this.repository.createLink(link, actorProfileId);
  }

  async createTaxpayer(
    input: {
      displayName: string;
      statusCode: string;
    },
    actorProfileId: string | null = null,
  ): Promise<StoredTaxpayer> {
    if (!input.displayName || input.displayName.trim() === '') {
      throw new BadRequestException('Display name cannot be empty.');
    }

    const taxpayer: StoredTaxpayer = {
      id: randomUUID(),
      publicRef: `TXP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      displayName: input.displayName.trim(),
      statusCode: input.statusCode,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
    };

    return this.repository.createTaxpayer(taxpayer);
  }
}
