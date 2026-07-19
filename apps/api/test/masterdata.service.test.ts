import { randomUUID } from 'node:crypto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { masterdataReportFieldKeys } from '@marib-tax/contracts';
import {
  type MasterdataRepository,
  type StoredActivityAddress,
  type StoredBranch,
  type StoredCommercialActivity,
  type StoredProperty,
  type StoredPropertyOwnership,
} from '../src/masterdata/masterdata.repository.js';
import { MasterdataService } from '../src/masterdata/masterdata.service.js';

class MemoryRepository implements MasterdataRepository {
  activities: StoredCommercialActivity[] = [];
  branches: StoredBranch[] = [];
  addresses: StoredActivityAddress[] = [];
  properties: StoredProperty[] = [];
  ownershipRecords: StoredPropertyOwnership[] = [];

  listOwnedActivities(actorId: string): Promise<StoredCommercialActivity[]> {
    return Promise.resolve(
      this.activities.filter((row) => row.ownerActorId === actorId),
    );
  }

  listOwnedBranches(actorId: string): Promise<StoredBranch[]> {
    return Promise.resolve(
      this.branches.filter((row) => row.ownerActorId === actorId),
    );
  }

  listOwnedAddresses(actorId: string): Promise<StoredActivityAddress[]> {
    return Promise.resolve(
      this.addresses.filter((row) => row.ownerActorId === actorId),
    );
  }

  listOwnedProperties(actorId: string): Promise<StoredProperty[]> {
    return Promise.resolve(
      this.properties.filter((row) => row.ownerActorId === actorId),
    );
  }

  listOwnedOwnershipRecords(
    actorId: string,
  ): Promise<StoredPropertyOwnership[]> {
    return Promise.resolve(
      this.ownershipRecords.filter((row) => row.ownerActorId === actorId),
    );
  }

  findActivityById(id: string): Promise<StoredCommercialActivity | null> {
    return Promise.resolve(
      this.activities.find((row) => row.id === id) ?? null,
    );
  }
}

describe('masterdata service', () => {
  it('returns only owned activities, branches, properties, and ownership', async () => {
    const repository = new MemoryRepository();
    const actorId = randomUUID();
    const otherActorId = randomUUID();
    const taxpayerId = randomUUID();
    const activityId = randomUUID();
    const propertyId = randomUUID();

    repository.activities.push(
      {
        id: activityId,
        ownerActorId: actorId,
        publicRef: 'A-1',
        taxpayerId,
        name: 'نشاطي',
        statusCode: 'active',
      },
      {
        id: randomUUID(),
        ownerActorId: otherActorId,
        publicRef: 'A-X',
        taxpayerId: randomUUID(),
        name: 'نشاط آخر',
        statusCode: 'active',
      },
    );
    repository.branches.push({
      id: randomUUID(),
      ownerActorId: actorId,
      publicRef: 'B-1',
      commercialActivityId: activityId,
      name: 'فرع',
      statusCode: 'active',
    });
    repository.addresses.push({
      id: randomUUID(),
      ownerActorId: actorId,
      commercialActivityId: activityId,
      branchId: null,
      addressLine: 'شارع',
      districtCode: 'D-1',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      effectiveTo: null,
    });
    repository.properties.push({
      id: propertyId,
      ownerActorId: actorId,
      publicRef: 'P-1',
      statusCode: 'active',
      description: 'عقار',
    });
    repository.ownershipRecords.push({
      id: randomUUID(),
      ownerActorId: actorId,
      propertyId,
      taxpayerId,
      partyRoleCode: 'owner',
      isCurrent: true,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      effectiveTo: null,
    });

    const service = new MasterdataService(repository);
    const bundle = await service.readOwnedBundle(actorId);
    expect(bundle.activities).toHaveLength(1);
    expect(bundle.activities[0]?.id).toBe(activityId);
    expect(bundle.branches).toHaveLength(1);
    expect(bundle.addresses).toHaveLength(1);
    expect(bundle.properties).toHaveLength(1);
    expect(bundle.ownershipRecords[0]?.isCurrent).toBe(true);
  });

  it('rejects cross-owner activity reads', async () => {
    const repository = new MemoryRepository();
    const activityId = randomUUID();
    repository.activities.push({
      id: activityId,
      ownerActorId: randomUUID(),
      publicRef: null,
      taxpayerId: randomUUID(),
      name: 'نشاط محمي',
      statusCode: 'active',
    });
    const service = new MasterdataService(repository);
    await expect(
      service.readOwnedActivityById(randomUUID(), activityId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fails closed when the activity is missing', async () => {
    const service = new MasterdataService(new MemoryRepository());
    await expect(
      service.readOwnedActivityById(randomUUID(), randomUUID()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('exposes masterdata report field keys required by the DM-16 matrix', () => {
    expect(masterdataReportFieldKeys).toEqual(
      expect.arrayContaining([
        'activity_id',
        'taxpayer_id',
        'status_code',
        'address_changed_flag',
      ]),
    );
  });
});
