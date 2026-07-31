import { Injectable } from '@nestjs/common';
import {
  type UsersRepository,
  type StoredUserProfile,
  type StoredStaffProfile,
} from './users.repository.js';

@Injectable()
export class UsersMemoryRepository implements UsersRepository {
  private readonly users = new Map<string, StoredUserProfile>();
  private readonly staff = new Map<string, StoredStaffProfile>();

  async findUserById(id: string): Promise<StoredUserProfile | null> {
    await Promise.resolve();
    return this.users.get(id) ?? null;
  }

  async findUserByAuthUserId(
    authUserId: string,
  ): Promise<StoredUserProfile | null> {
    await Promise.resolve();
    return (
      [...this.users.values()].find((u) => u.authUserId === authUserId) ?? null
    );
  }

  async createUserProfile(
    profile: Omit<StoredUserProfile, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredUserProfile> {
    await Promise.resolve();
    const record: StoredUserProfile = {
      ...profile,
      createdAt: new Date(),
      updatedAt: null,
      archivedAt: null,
    };
    this.users.set(profile.id, record);
    return record;
  }

  async updateUserProfile(
    id: string,
    updates: Partial<
      Pick<StoredUserProfile, 'displayName' | 'isActive' | 'updatedByProfileId'>
    >,
  ): Promise<StoredUserProfile> {
    await Promise.resolve();
    const existing = this.users.get(id);
    if (!existing)
      throw new Error('User profile not found in memory database.');
    const updated: StoredUserProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async findStaffById(id: string): Promise<StoredStaffProfile | null> {
    await Promise.resolve();
    return this.staff.get(id) ?? null;
  }

  async findStaffByUserProfileId(
    userProfileId: string,
  ): Promise<StoredStaffProfile | null> {
    await Promise.resolve();
    return (
      [...this.staff.values()].find((s) => s.userProfileId === userProfileId) ??
      null
    );
  }

  async createStaffProfile(
    profile: Omit<StoredStaffProfile, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredStaffProfile> {
    await Promise.resolve();
    const record: StoredStaffProfile = {
      ...profile,
      createdAt: new Date(),
      updatedAt: null,
      archivedAt: null,
    };
    this.staff.set(profile.id, record);
    return record;
  }

  async updateStaffProfile(
    id: string,
    updates: Partial<
      Pick<
        StoredStaffProfile,
        | 'staffCode'
        | 'title'
        | 'isActive'
        | 'effectiveTo'
        | 'updatedByProfileId'
      >
    >,
  ): Promise<StoredStaffProfile> {
    await Promise.resolve();
    const existing = this.staff.get(id);
    if (!existing)
      throw new Error('Staff profile not found in memory database.');
    const updated: StoredStaffProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.staff.set(id, updated);
    return updated;
  }
}
