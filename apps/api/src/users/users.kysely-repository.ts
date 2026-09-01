import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  UsersRepository,
  StoredUserProfile,
  StoredStaffProfile,
} from './users.repository.js';
import type {
  IdentityUserProfilesTable,
  IdentityStaffProfilesTable,
} from '../database/database.contracts.js';
import type { Selectable } from 'kysely';

function mapUserProfile(row: Selectable<IdentityUserProfilesTable>): StoredUserProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    displayName: row.display_name,
    isActive: row.is_active,
    createdAt: row.created_at,
    createdByProfileId: row.created_by_profile_id,
    updatedAt: row.updated_at,
    updatedByProfileId: row.updated_by_profile_id,
    archivedAt: row.archived_at,
  };
}

function mapStaffProfile(row: Selectable<IdentityStaffProfilesTable>): StoredStaffProfile {
  return {
    id: row.id,
    userProfileId: row.user_profile_id,
    staffCode: row.staff_code,
    title: row.title,
    isActive: row.is_active,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    createdAt: row.created_at,
    createdByProfileId: row.created_by_profile_id,
    updatedAt: row.updated_at,
    updatedByProfileId: row.updated_by_profile_id,
    archivedAt: row.archived_at,
  };
}

@Injectable()
export class UsersKyselyRepository implements UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findUserById(id: string): Promise<StoredUserProfile | null> {
    const row = await this.databaseService.db
      .selectFrom('identity.user_profiles')
      .selectAll()
      .where('id', '=', id)
      .where('archived_at', 'is', null)
      .executeTakeFirst();
    return row ? mapUserProfile(row) : null;
  }

  async findUserByAuthUserId(authUserId: string): Promise<StoredUserProfile | null> {
    const row = await this.databaseService.db
      .selectFrom('identity.user_profiles')
      .selectAll()
      .where('auth_user_id', '=', authUserId)
      .where('archived_at', 'is', null)
      .executeTakeFirst();
    return row ? mapUserProfile(row) : null;
  }

  async createUserProfile(
    profile: Omit<StoredUserProfile, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredUserProfile> {
    const row = await this.databaseService.db
      .insertInto('identity.user_profiles')
      .values({
        id: profile.id,
        auth_user_id: profile.authUserId,
        display_name: profile.displayName,
        is_active: profile.isActive,
        created_by_profile_id: profile.createdByProfileId,
        updated_at: null,
        updated_by_profile_id: profile.updatedByProfileId,
        archived_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapUserProfile(row);
  }

  async updateUserProfile(
    id: string,
    updates: Partial<
      Pick<StoredUserProfile, 'displayName' | 'isActive' | 'updatedByProfileId'>
    >,
  ): Promise<StoredUserProfile> {
    const row = await this.databaseService.db
      .updateTable('identity.user_profiles')
      .set({
        ...(updates.displayName !== undefined
          ? { display_name: updates.displayName }
          : {}),
        ...(updates.isActive !== undefined
          ? { is_active: updates.isActive }
          : {}),
        updated_at: new Date(),
        ...(updates.updatedByProfileId !== undefined
          ? { updated_by_profile_id: updates.updatedByProfileId }
          : {}),
      })
      .where('id', '=', id)
      .where('archived_at', 'is', null)
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapUserProfile(row);
  }

  async findStaffById(id: string): Promise<StoredStaffProfile | null> {
    const row = await this.databaseService.db
      .selectFrom('identity.staff_profiles')
      .selectAll()
      .where('id', '=', id)
      .where('archived_at', 'is', null)
      .executeTakeFirst();
    return row ? mapStaffProfile(row) : null;
  }

  async findStaffByUserProfileId(userProfileId: string): Promise<StoredStaffProfile | null> {
    const row = await this.databaseService.db
      .selectFrom('identity.staff_profiles')
      .selectAll()
      .where('user_profile_id', '=', userProfileId)
      .where('archived_at', 'is', null)
      .executeTakeFirst();
    return row ? mapStaffProfile(row) : null;
  }

  async createStaffProfile(
    profile: Omit<StoredStaffProfile, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredStaffProfile> {
    const row = await this.databaseService.db
      .insertInto('identity.staff_profiles')
      .values({
        id: profile.id,
        user_profile_id: profile.userProfileId,
        staff_code: profile.staffCode,
        title: profile.title,
        is_active: profile.isActive,
        effective_from: profile.effectiveFrom,
        effective_to: profile.effectiveTo,
        created_by_profile_id: profile.createdByProfileId,
        updated_at: null,
        updated_by_profile_id: profile.updatedByProfileId,
        archived_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapStaffProfile(row);
  }

  async updateStaffProfile(
    id: string,
    updates: Partial<
      Pick<
        StoredStaffProfile,
        'staffCode' | 'title' | 'isActive' | 'effectiveTo' | 'updatedByProfileId'
      >
    >,
  ): Promise<StoredStaffProfile> {
    const row = await this.databaseService.db
      .updateTable('identity.staff_profiles')
      .set({
        ...(updates.staffCode !== undefined
          ? { staff_code: updates.staffCode }
          : {}),
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.isActive !== undefined
          ? { is_active: updates.isActive }
          : {}),
        ...(updates.effectiveTo !== undefined
          ? { effective_to: updates.effectiveTo }
          : {}),
        updated_at: new Date(),
        ...(updates.updatedByProfileId !== undefined
          ? { updated_by_profile_id: updates.updatedByProfileId }
          : {}),
      })
      .where('id', '=', id)
      .where('archived_at', 'is', null)
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapStaffProfile(row);
  }
}
