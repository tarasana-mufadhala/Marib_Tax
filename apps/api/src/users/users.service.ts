import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  USERS_REPOSITORY,
  type UsersRepository,
  type StoredUserProfile,
  type StoredStaffProfile,
} from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
  ) {}

  async findUserById(id: string): Promise<StoredUserProfile> {
    const user = await this.repository.findUserById(id);
    if (!user) throw new NotFoundException('User profile not found.');
    return user;
  }

  async findUserByAuthUserId(authUserId: string): Promise<StoredUserProfile> {
    const user = await this.repository.findUserByAuthUserId(authUserId);
    if (!user)
      throw new NotFoundException(
        'User profile not found for the given auth identity.',
      );
    return user;
  }

  async createUserProfile(
    authUserId: string,
    displayName: string | null = null,
    createdByProfileId: string | null = null,
  ): Promise<StoredUserProfile> {
    const existing = await this.repository.findUserByAuthUserId(authUserId);
    if (existing) {
      throw new ConflictException(
        'User profile already exists for this authentication identity.',
      );
    }
    const id = randomUUID();
    return this.repository.createUserProfile({
      id,
      authUserId,
      displayName,
      isActive: true,
      createdByProfileId,
      updatedByProfileId: null,
    });
  }

  async updateUserProfile(
    id: string,
    displayName?: string | null,
    isActive?: boolean,
    updatedByProfileId: string | null = null,
  ): Promise<StoredUserProfile> {
    const user = await this.repository.findUserById(id);
    if (!user) throw new NotFoundException('User profile not found.');

    const updates: Partial<
      Pick<StoredUserProfile, 'displayName' | 'isActive' | 'updatedByProfileId'>
    > = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (isActive !== undefined) updates.isActive = isActive;
    updates.updatedByProfileId = updatedByProfileId;

    return this.repository.updateUserProfile(id, updates);
  }

  async findStaffById(id: string): Promise<StoredStaffProfile> {
    const staff = await this.repository.findStaffById(id);
    if (!staff) throw new NotFoundException('Staff profile not found.');
    return staff;
  }

  async findStaffByUserProfileId(
    userProfileId: string,
  ): Promise<StoredStaffProfile> {
    const staff = await this.repository.findStaffByUserProfileId(userProfileId);
    if (!staff)
      throw new NotFoundException(
        'Staff profile not found for this user profile.',
      );
    return staff;
  }

  async createStaffProfile(
    userProfileId: string,
    staffCode: string | null = null,
    title: string | null = null,
    effectiveFrom: Date = new Date(),
    createdByProfileId: string | null = null,
  ): Promise<StoredStaffProfile> {
    const user = await this.repository.findUserById(userProfileId);
    if (!user) throw new NotFoundException('Backing user profile not found.');

    const existing =
      await this.repository.findStaffByUserProfileId(userProfileId);
    if (existing) {
      throw new ConflictException(
        'Staff profile already exists for this user profile.',
      );
    }

    const id = randomUUID();
    return this.repository.createStaffProfile({
      id,
      userProfileId,
      staffCode,
      title,
      isActive: true,
      effectiveFrom,
      effectiveTo: null,
      createdByProfileId,
      updatedByProfileId: null,
    });
  }

  async updateStaffProfile(
    id: string,
    updates: {
      staffCode?: string | null;
      title?: string | null;
      isActive?: boolean;
      effectiveTo?: Date | null;
    },
    updatedByProfileId: string | null = null,
  ): Promise<StoredStaffProfile> {
    const staff = await this.repository.findStaffById(id);
    if (!staff) throw new NotFoundException('Staff profile not found.');

    const cleanUpdates: Partial<
      Pick<
        StoredStaffProfile,
        | 'staffCode'
        | 'title'
        | 'isActive'
        | 'effectiveTo'
        | 'updatedByProfileId'
      >
    > = {
      updatedByProfileId,
    };
    if (updates.staffCode !== undefined)
      cleanUpdates.staffCode = updates.staffCode;
    if (updates.title !== undefined) cleanUpdates.title = updates.title;
    if (updates.isActive !== undefined)
      cleanUpdates.isActive = updates.isActive;
    if (updates.effectiveTo !== undefined)
      cleanUpdates.effectiveTo = updates.effectiveTo;

    return this.repository.updateStaffProfile(id, cleanUpdates);
  }
}
