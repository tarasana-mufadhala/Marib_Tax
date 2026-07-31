export interface StoredUserProfile {
  id: string;
  authUserId: string;
  displayName: string | null;
  isActive: boolean;
  createdAt: Date;
  createdByProfileId: string | null;
  updatedAt: Date | null;
  updatedByProfileId: string | null;
  archivedAt: Date | null;
}

export interface StoredStaffProfile {
  id: string;
  userProfileId: string;
  staffCode: string | null;
  title: string | null;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  createdByProfileId: string | null;
  updatedAt: Date | null;
  updatedByProfileId: string | null;
  archivedAt: Date | null;
}

export interface UsersRepository {
  findUserById(id: string): Promise<StoredUserProfile | null>;
  findUserByAuthUserId(authUserId: string): Promise<StoredUserProfile | null>;
  createUserProfile(
    profile: Omit<StoredUserProfile, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredUserProfile>;
  updateUserProfile(
    id: string,
    updates: Partial<
      Pick<StoredUserProfile, 'displayName' | 'isActive' | 'updatedByProfileId'>
    >,
  ): Promise<StoredUserProfile>;

  findStaffById(id: string): Promise<StoredStaffProfile | null>;
  findStaffByUserProfileId(
    userProfileId: string,
  ): Promise<StoredStaffProfile | null>;
  createStaffProfile(
    profile: Omit<StoredStaffProfile, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredStaffProfile>;
  updateStaffProfile(
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
  ): Promise<StoredStaffProfile>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
