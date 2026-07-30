import { Injectable } from '@nestjs/common';
import {
  type MasterdataRepository,
  type StoredCommercialActivity,
  type StoredBranch,
  type StoredActivityAddress,
  type StoredProperty,
  type StoredPropertyOwnership,
} from './masterdata.repository.js';

@Injectable()
export class MasterdataMemoryRepository implements MasterdataRepository {
  private readonly activities: StoredCommercialActivity[] = [];
  private readonly branches: StoredBranch[] = [];
  private readonly addresses: StoredActivityAddress[] = [];
  private readonly properties: StoredProperty[] = [];
  private readonly ownerships: StoredPropertyOwnership[] = [];

  async listOwnedActivities(
    actorId: string,
  ): Promise<StoredCommercialActivity[]> {
    await Promise.resolve();
    return this.activities.filter((a) => a.ownerActorId === actorId);
  }

  async listOwnedBranches(actorId: string): Promise<StoredBranch[]> {
    await Promise.resolve();
    return this.branches.filter((b) => b.ownerActorId === actorId);
  }

  async listOwnedAddresses(actorId: string): Promise<StoredActivityAddress[]> {
    await Promise.resolve();
    return this.addresses.filter((a) => a.ownerActorId === actorId);
  }

  async listOwnedProperties(actorId: string): Promise<StoredProperty[]> {
    await Promise.resolve();
    return this.properties.filter((p) => p.ownerActorId === actorId);
  }

  async listOwnedOwnershipRecords(
    actorId: string,
  ): Promise<StoredPropertyOwnership[]> {
    await Promise.resolve();
    return this.ownerships.filter((o) => o.ownerActorId === actorId);
  }

  async findActivityById(id: string): Promise<StoredCommercialActivity | null> {
    await Promise.resolve();
    return this.activities.find((a) => a.id === id) ?? null;
  }

  // Helpers for seeding/testing
  addActivity(activity: StoredCommercialActivity): void {
    this.activities.push(activity);
  }
  addBranch(branch: StoredBranch): void {
    this.branches.push(branch);
  }
  addAddress(address: StoredActivityAddress): void {
    this.addresses.push(address);
  }
  addProperty(property: StoredProperty): void {
    this.properties.push(property);
  }
  addOwnership(ownership: StoredPropertyOwnership): void {
    this.ownerships.push(ownership);
  }
}
