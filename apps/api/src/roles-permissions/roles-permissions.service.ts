import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ROLES_PERMISSIONS_REPOSITORY,
  type RolesPermissionsRepository,
  type StoredRole,
  type StoredPermission,
  type StoredStaffRoleAssignment,
} from './roles-permissions.repository.js';

@Injectable()
export class RolesPermissionsService {
  constructor(
    @Inject(ROLES_PERMISSIONS_REPOSITORY)
    private readonly repository: RolesPermissionsRepository,
  ) {}

  async createRole(
    code: string,
    nameAr: string,
    description: string | null = null,
    createdByProfileId: string | null = null,
  ): Promise<StoredRole> {
    if (!/^[a-z][a-z0-9_]{2,63}$/.test(code)) {
      throw new ForbiddenException(
        'Invalid role code format. Must match ^[a-z][a-z0-9_]{2,63}$',
      );
    }
    const existing = await this.repository.findRoleByCode(code);
    if (existing) {
      throw new ConflictException('Role with this code already exists.');
    }
    const id = randomUUID();
    return this.repository.createRole({
      id,
      code,
      nameAr,
      description,
      isSystem: false,
      isActive: true,
      createdByProfileId,
      updatedByProfileId: null,
    });
  }

  async updateRole(
    id: string,
    updates: {
      nameAr?: string;
      description?: string | null;
      isActive?: boolean;
    },
    updatedByProfileId: string | null = null,
  ): Promise<StoredRole> {
    const role = await this.repository.findRoleById(id);
    if (!role) throw new NotFoundException('Role not found.');

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be modified.');
    }

    const cleanUpdates: Partial<
      Pick<
        StoredRole,
        'nameAr' | 'description' | 'isActive' | 'updatedByProfileId'
      >
    > = {
      updatedByProfileId,
    };
    if (updates.nameAr !== undefined) cleanUpdates.nameAr = updates.nameAr;
    if (updates.description !== undefined)
      cleanUpdates.description = updates.description;
    if (updates.isActive !== undefined)
      cleanUpdates.isActive = updates.isActive;

    return this.repository.updateRole(id, cleanUpdates);
  }

  async grantPermissionToRole(
    roleId: string,
    permissionId: string,
    grantedByProfileId: string | null = null,
  ): Promise<void> {
    const role = await this.repository.findRoleById(roleId);
    if (!role) throw new NotFoundException('Role not found.');

    if (role.isSystem) {
      throw new ForbiddenException(
        'Cannot grant permissions to system roles programmatically.',
      );
    }

    const permission = await this.repository.findPermissionById(permissionId);
    if (!permission) throw new NotFoundException('Permission not found.');

    await this.repository.grantPermissionToRole({
      roleId,
      permissionId,
      grantedAt: new Date(),
      grantedByProfileId,
    });
  }

  async revokePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const role = await this.repository.findRoleById(roleId);
    if (!role) throw new NotFoundException('Role not found.');

    if (role.isSystem) {
      throw new ForbiddenException(
        'Cannot revoke permissions from system roles programmatically.',
      );
    }

    await this.repository.revokePermissionFromRole(roleId, permissionId);
  }

  async assignRoleToStaff(
    staffProfileId: string,
    roleId: string,
    effectiveFrom: Date = new Date(),
    effectiveTo: Date | null = null,
    assignedByProfileId: string | null = null,
  ): Promise<StoredStaffRoleAssignment> {
    if (effectiveTo && effectiveTo <= effectiveFrom) {
      throw new ForbiddenException(
        'Effective end date must be later than start date.',
      );
    }

    const role = await this.repository.findRoleById(roleId);
    if (!role) throw new NotFoundException('Role not found.');
    if (!role.isActive)
      throw new ForbiddenException('Cannot assign an inactive role.');

    const activeAssignments =
      await this.repository.listActiveAssignmentsForStaff(staffProfileId);
    const alreadyAssigned = activeAssignments.some(
      (a) =>
        a.roleId === roleId && a.effectiveTo === null && a.revokedAt === null,
    );
    if (alreadyAssigned) {
      throw new ConflictException(
        'This role is already actively assigned to the staff member.',
      );
    }

    const id = randomUUID();
    return this.repository.assignRoleToStaff({
      id,
      staffProfileId,
      roleId,
      effectiveFrom,
      effectiveTo,
      assignedByProfileId,
    });
  }

  async revokeRoleFromStaff(
    assignmentId: string,
    revokedByProfileId: string,
    revocationReason: string | null = null,
    revokedAt: Date = new Date(),
  ): Promise<StoredStaffRoleAssignment> {
    const assignment = await this.repository.findAssignmentById(assignmentId);
    if (!assignment) throw new NotFoundException('Role assignment not found.');
    if (assignment.revokedAt !== null) {
      throw new ConflictException('Role assignment is already revoked.');
    }

    if (revokedAt < assignment.effectiveFrom) {
      throw new ForbiddenException(
        'Revocation date cannot be earlier than assignment effective start date.',
      );
    }

    return this.repository.revokeRoleFromStaff(
      assignmentId,
      revokedByProfileId,
      revocationReason,
      revokedAt,
    );
  }

  async listPermissionsForRole(roleId: string): Promise<StoredPermission[]> {
    return this.repository.listPermissionsForRole(roleId);
  }

  async findRoleByCode(code: string): Promise<StoredRole | null> {
    return this.repository.findRoleByCode(code);
  }

  async findRoleById(id: string): Promise<StoredRole | null> {
    return this.repository.findRoleById(id);
  }

  async listActiveAssignmentsForStaff(
    staffProfileId: string,
  ): Promise<StoredStaffRoleAssignment[]> {
    return this.repository.listActiveAssignmentsForStaff(staffProfileId);
  }
}
