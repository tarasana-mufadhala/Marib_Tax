import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ConcreteActorProfileRepository } from '../src/authn/actor-profile.repository.js';
import type { UsersService } from '../src/users/users.service.js';
import type { RolesPermissionsService } from '../src/roles-permissions/roles-permissions.service.js';

const staffUser = { id: 'profile-1', isActive: true };
const staffProfile = { id: 'staff-1', isActive: true };

const build = (overrides: {
  findUser?: () => Promise<unknown>;
  findStaff?: () => Promise<unknown>;
  listAssignments?: () => Promise<unknown>;
}) =>
  new ConcreteActorProfileRepository(
    {
      findUserByAuthUserId: overrides.findUser ?? (() => Promise.resolve(staffUser)),
      findStaffByUserProfileId:
        overrides.findStaff ?? (() => Promise.resolve(staffProfile)),
    } as unknown as UsersService,
    {
      listActiveAssignmentsForStaff:
        overrides.listAssignments ?? (() => Promise.resolve([{ roleId: 'role-1' }])),
      listPermissionsForRole: () =>
        Promise.resolve([{ code: 'report.view', isActive: true }]),
    } as unknown as RolesPermissionsService,
  );

describe('ConcreteActorProfileRepository', () => {
  it('resolves staff permissions from their active role assignments', async () => {
    const actor = await build({}).findActiveByAuthUserId('auth-1');
    expect(actor?.permissions).toEqual(['report.view']);
  });

  it('treats a missing staff profile as a taxpayer', async () => {
    const actor = await build({
      findStaff: () => Promise.reject(new NotFoundException()),
    }).findActiveByAuthUserId('auth-1');
    expect(actor?.permissions).toContain('request.draft.create');
    expect(actor?.permissions).not.toContain('report.view');
  });

  it('returns null when the identity has no user profile', async () => {
    const actor = await build({
      findUser: () => Promise.reject(new NotFoundException()),
    }).findActiveByAuthUserId('auth-1');
    expect(actor).toBeNull();
  });

  it('does not silently downgrade staff to taxpayer when the staff lookup fails', async () => {
    // عطل قاعدة أثناء البحث عن ملف الموظف يجب أن يظهر، لا أن يمنح صلاحيات مكلف.
    await expect(
      build({
        findStaff: () => Promise.reject(new Error('connection terminated')),
      }).findActiveByAuthUserId('auth-1'),
    ).rejects.toThrow(/connection terminated/);
  });

  it('does not translate an infrastructure failure into a denied identity', async () => {
    // لو أعادت null هنا لظهر العطل للمستخدم كـ401 «غير مصادق» وهو تشخيص مضلّل.
    await expect(
      build({
        findUser: () => Promise.reject(new Error('connection terminated')),
      }).findActiveByAuthUserId('auth-1'),
    ).rejects.toThrow(/connection terminated/);
  });

  it('rejects an inactive user profile', async () => {
    const actor = await build({
      findUser: () => Promise.resolve({ id: 'profile-1', isActive: false }),
    }).findActiveByAuthUserId('auth-1');
    expect(actor).toBeNull();
  });
});
