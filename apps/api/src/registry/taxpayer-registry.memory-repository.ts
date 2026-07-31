import { Injectable } from '@nestjs/common';
import {
  type TaxpayerRegistryRepository,
  type StoredTaxpayerRecord,
  type StoredLegalEntityLink,
  type StoredTaxNumberRecord,
} from './taxpayer-registry.repository.js';

@Injectable()
export class TaxpayerRegistryMemoryRepository implements TaxpayerRegistryRepository {
  private readonly taxpayers = new Map<string, StoredTaxpayerRecord>();
  private readonly legalEntities: StoredLegalEntityLink[] = [];
  private readonly taxNumbers: StoredTaxNumberRecord[] = [];

  async findOwnedByActor(
    actorId: string,
  ): Promise<StoredTaxpayerRecord | null> {
    await Promise.resolve();
    return (
      [...this.taxpayers.values()].find((t) => t.ownerActorId === actorId) ??
      null
    );
  }

  async findTaxpayerById(id: string): Promise<StoredTaxpayerRecord | null> {
    await Promise.resolve();
    return this.taxpayers.get(id) ?? null;
  }

  async listLegalEntitiesForTaxpayer(
    taxpayerId: string,
  ): Promise<StoredLegalEntityLink[]> {
    await Promise.resolve();
    return this.legalEntities.filter((l) => l.taxpayerId === taxpayerId);
  }

  async listTaxNumbersForTaxpayer(
    taxpayerId: string,
  ): Promise<StoredTaxNumberRecord[]> {
    await Promise.resolve();
    return this.taxNumbers.filter((t) => t.taxpayerId === taxpayerId);
  }

  // Helpers for seeding/testing
  addTaxpayer(taxpayer: StoredTaxpayerRecord): void {
    this.taxpayers.set(taxpayer.id, taxpayer);
  }
  addLegalEntity(entity: StoredLegalEntityLink): void {
    this.legalEntities.push(entity);
  }
  addTaxNumber(number: StoredTaxNumberRecord): void {
    this.taxNumbers.push(number);
  }
}
