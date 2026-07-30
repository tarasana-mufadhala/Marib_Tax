import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { UsersMemoryRepository } from '../src/users/users.memory-repository.js';
import { UsersService } from '../src/users/users.service.js';

describe('UsersService', () => {
  it('creates and manages user profiles and staff profiles', async () => {
    const repository = new UsersMemoryRepository();
    const service = new UsersService(repository);

    const authUserId = randomUUID();
    const user = await service.createUserProfile(authUserId, 'محمد مارب');
    expect(user.displayName).toBe('محمد مارب');
    expect(user.isActive).toBe(true);

    const retrieved = await service.findUserById(user.id);
    expect(retrieved.id).toBe(user.id);

    const byAuth = await service.findUserByAuthUserId(authUserId);
    expect(byAuth.id).toBe(user.id);

    const updated = await service.updateUserProfile(
      user.id,
      'محمد المأربي',
      false,
    );
    expect(updated.displayName).toBe('محمد المأربي');
    expect(updated.isActive).toBe(false);

    // Create staff profile
    const staff = await service.createStaffProfile(
      user.id,
      'ST-001',
      'مفتش ضرائب',
    );
    expect(staff.staffCode).toBe('ST-001');
    expect(staff.title).toBe('مفتش ضرائب');

    const staffRetrieved = await service.findStaffById(staff.id);
    expect(staffRetrieved.id).toBe(staff.id);

    const staffByUserId = await service.findStaffByUserProfileId(user.id);
    expect(staffByUserId.id).toBe(staff.id);

    const staffUpdated = await service.updateStaffProfile(staff.id, {
      title: 'رئيس قسم الفحص',
    });
    expect(staffUpdated.title).toBe('رئيس قسم الفحص');
  });
});
