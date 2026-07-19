import { randomUUID } from 'node:crypto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  maskTaxNumberValue,
  registryReportFieldKeys,
  taxNumberValueSchema,
} from '@marib-tax/contracts';
import {
  type StoredLegalEntityLink,
  type StoredTaxNumberRecord,
  type StoredTaxpayerRecord,
  type TaxpayerRegistryRepository,
} from '../src/registry/taxpayer-registry.repository.js';
import { TaxpayerRegistryService } from '../src/registry/taxpayer-registry.service.js';

class MemoryRepository implements TaxpayerRegistryRepository {
  taxpayers = new Map<string, StoredTaxpayerRecord>();
  entities: StoredLegalEntityLink[] = [];
  numbers: StoredTaxNumberRecord[] = [];

  findOwnedByActor(actorId: string): Promise<StoredTaxpayerRecord | null> {
    return Promise.resolve(
      [...this.taxpayers.values()].find(
        (row) => row.ownerActorId === actorId,
      ) ?? null,
    );
  }

  findTaxpayerById(id: string): Promise<StoredTaxpayerRecord | null> {
    return Promise.resolve(this.taxpayers.get(id) ?? null);
  }

  listLegalEntitiesForTaxpayer(
    taxpayerId: string,
  ): Promise<StoredLegalEntityLink[]> {
    return Promise.resolve(
      this.entities.filter((row) => row.taxpayerId === taxpayerId),
    );
  }

  listTaxNumbersForTaxpayer(
    taxpayerId: string,
  ): Promise<StoredTaxNumberRecord[]> {
    return Promise.resolve(
      this.numbers.filter((row) => row.taxpayerId === taxpayerId),
    );
  }
}

describe('taxpayer registry service', () => {
  it('returns owned taxpayer, legal entities, and masked tax numbers', async () => {
    const repository = new MemoryRepository();
    const actorId = randomUUID();
    const taxpayerId = randomUUID();
    const legalEntityId = randomUUID();
    const taxValue = '0123456789';
    repository.taxpayers.set(taxpayerId, {
      id: taxpayerId,
      ownerActorId: actorId,
      publicRef: 'T-1',
      displayName: 'مكلف تجريبي',
      statusCode: 'active',
      hasTaxNumber: true,
      activeLegalEntityCount: 1,
      openDuesFlag: false,
      registeredAt: '2026-07-19T00:00:00.000Z',
    });
    repository.entities.push({
      id: legalEntityId,
      taxpayerId,
      publicRef: 'L-1',
      legalName: 'منشأة تجريبية',
      classificationCode: 'establishment',
      isActive: true,
      associationTypeCode: 'primary',
    });
    repository.numbers.push({
      id: randomUUID(),
      taxpayerId,
      taxNumberValue: taxValue,
      taxNumberValueMasked: maskTaxNumberValue(taxValue),
      statusCode: 'issued',
      legalEntityId,
      issuedAt: '2026-01-01T00:00:00.000Z',
    });

    const service = new TaxpayerRegistryService(repository);
    const bundle = await service.readOwnedBundle(actorId);
    expect(bundle.taxpayer.id).toBe(taxpayerId);
    expect(bundle.legalEntities).toHaveLength(1);
    expect(bundle.taxNumbers[0]?.taxNumberValueMasked).toBe('******6789');
    expect(taxNumberValueSchema.parse(taxValue)).toBe(taxValue);
  });

  it('rejects cross-owner taxpayer reads', async () => {
    const repository = new MemoryRepository();
    const taxpayerId = randomUUID();
    repository.taxpayers.set(taxpayerId, {
      id: taxpayerId,
      ownerActorId: randomUUID(),
      publicRef: null,
      displayName: 'آخر',
      statusCode: 'active',
      hasTaxNumber: false,
      activeLegalEntityCount: 0,
      openDuesFlag: false,
      registeredAt: '2026-07-19T00:00:00.000Z',
    });
    const service = new TaxpayerRegistryService(repository);
    await expect(
      service.readOwnedTaxpayerById(randomUUID(), taxpayerId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fails closed when the actor has no linked taxpayer', async () => {
    const service = new TaxpayerRegistryService(new MemoryRepository());
    await expect(service.readOwnedBundle(randomUUID())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects non-digit tax numbers at the contract boundary', () => {
    expect(() => taxNumberValueSchema.parse('AB123')).toThrow();
  });

  it('exposes registry report field keys required by the DM-16 matrix', () => {
    expect(registryReportFieldKeys).toEqual(
      expect.arrayContaining([
        'taxpayer_id',
        'has_tax_number',
        'tax_number_value',
        'legal_entity_id',
        'open_dues_flag',
      ]),
    );
  });
});
