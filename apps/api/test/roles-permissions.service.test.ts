import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { RolesPermissionsMemoryRepository } from '../src/roles-permissions/roles-permissions.memory-repository.js';
import { RolesPermissionsService } from '../src/roles-permissions/roles-permissions.service.js';

describe('RolesPermissionsService', () => {
  it('manages roles, permissions, and assignments', async () => {
    const repository = new RolesPermissionsMemoryRepository();
    const service = new RolesPermissionsService(repository);

    // Create custom role
    const role = await service.createRole('tax_reviewer', 'مراجع ضرائب');
    expect(role.code).toBe('tax_reviewer');
    expect(role.isSystem).toBe(false);

    // Update role
    const updatedRole = await service.updateRole(role.id, {
      nameAr: 'مراجع ضرائب معتمد',
    });
    expect(updatedRole.nameAr).toBe('مراجع ضرائب معتمد');

    // Create permission
    const permission = await repository.createPermission({
      id: randomUUID(),
      code: 'request.review',
      resource: 'request',
      action: 'review',
      nameAr: 'مراجعة الطلبات',
      description: null,
      isActive: true,
      createdByProfileId: null,
      updatedByProfileId: null,
    });

    // Grant permission to role
    await service.grantPermissionToRole(role.id, permission.id);
    const perms = await service.listPermissionsForRole(role.id);
    expect(perms).toHaveLength(1);
    expect(perms[0]?.code).toBe('request.review');

    // Assign role to staff
    const staffId = randomUUID();
    const assignment = await service.assignRoleToStaff(staffId, role.id);
    expect(assignment.staffProfileId).toBe(staffId);
    expect(assignment.roleId).toBe(role.id);

    const activeAssignments =
      await repository.listActiveAssignmentsForStaff(staffId);
    expect(activeAssignments).toHaveLength(1);

    // Revoke assignment
    await service.revokeRoleFromStaff(
      assignment.id,
      randomUUID(),
      'إلغاء تكليف',
    );
    const activeAssignmentsAfterRevoke =
      await repository.listActiveAssignmentsForStaff(staffId);
    expect(activeAssignmentsAfterRevoke).toHaveLength(0);
  });
});
