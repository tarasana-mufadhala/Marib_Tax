import { Injectable } from '@nestjs/common';
import type { PermissionCode } from '@marib-tax/contracts';
import {
  type RolesPermissionsRepository,
  type StoredRole,
  type StoredPermission,
  type StoredRolePermission,
  type StoredStaffRoleAssignment,
} from './roles-permissions.repository.js';

@Injectable()
export class RolesPermissionsMemoryRepository implements RolesPermissionsRepository {
  private readonly roles = new Map<string, StoredRole>();
  private readonly permissions = new Map<string, StoredPermission>();
  private readonly rolePermissions: StoredRolePermission[] = [];
  private readonly assignments = new Map<string, StoredStaffRoleAssignment>();

  async findRoleById(id: string): Promise<StoredRole | null> {
    await Promise.resolve();
    return this.roles.get(id) ?? null;
  }

  async findRoleByCode(code: string): Promise<StoredRole | null> {
    await Promise.resolve();
    return [...this.roles.values()].find((r) => r.code === code) ?? null;
  }

  async createRole(
    role: Omit<StoredRole, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredRole> {
    await Promise.resolve();
    const record: StoredRole = {
      ...role,
      createdAt: new Date(),
      updatedAt: null,
      archivedAt: null,
    };
    this.roles.set(role.id, record);
    return record;
  }

  async updateRole(
    id: string,
    updates: Partial<
      Pick<
        StoredRole,
        'nameAr' | 'description' | 'isActive' | 'updatedByProfileId'
      >
    >,
  ): Promise<StoredRole> {
    await Promise.resolve();
    const existing = this.roles.get(id);
    if (!existing) throw new Error('Role not found.');
    const updated: StoredRole = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.roles.set(id, updated);
    return updated;
  }

  async findPermissionById(id: string): Promise<StoredPermission | null> {
    await Promise.resolve();
    return this.permissions.get(id) ?? null;
  }

  async findPermissionByCode(
    code: PermissionCode,
  ): Promise<StoredPermission | null> {
    await Promise.resolve();
    return [...this.permissions.values()].find((p) => p.code === code) ?? null;
  }

  async createPermission(
    permission: Omit<
      StoredPermission,
      'createdAt' | 'updatedAt' | 'archivedAt'
    >,
  ): Promise<StoredPermission> {
    await Promise.resolve();
    const record: StoredPermission = {
      ...permission,
      createdAt: new Date(),
      updatedAt: null,
      archivedAt: null,
    };
    this.permissions.set(permission.id, record);
    return record;
  }

  async grantPermissionToRole(
    rolePermission: StoredRolePermission,
  ): Promise<void> {
    await Promise.resolve();
    const exists = this.rolePermissions.some(
      (rp) =>
        rp.roleId === rolePermission.roleId &&
        rp.permissionId === rolePermission.permissionId,
    );
    if (!exists) {
      this.rolePermissions.push(rolePermission);
    }
  }

  async revokePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    await Promise.resolve();
    const index = this.rolePermissions.findIndex(
      (rp) => rp.roleId === roleId && rp.permissionId === permissionId,
    );
    if (index !== -1) {
      this.rolePermissions.splice(index, 1);
    }
  }

  async listPermissionsForRole(roleId: string): Promise<StoredPermission[]> {
    await Promise.resolve();
    const allowedIds = this.rolePermissions
      .filter((rp) => rp.roleId === roleId)
      .map((rp) => rp.permissionId);
    return [...this.permissions.values()].filter((p) =>
      allowedIds.includes(p.id),
    );
  }

  async assignRoleToStaff(
    assignment: Omit<
      StoredStaffRoleAssignment,
      'assignedAt' | 'revokedAt' | 'revokedByProfileId' | 'revocation_reason'
    >,
  ): Promise<StoredStaffRoleAssignment> {
    await Promise.resolve();
    const record: StoredStaffRoleAssignment = {
      ...assignment,
      assignedAt: new Date(),
      revokedAt: null,
      revokedByProfileId: null,
      revocation_reason: null,
    };
    this.assignments.set(assignment.id, record);
    return record;
  }

  async revokeRoleFromStaff(
    assignmentId: string,
    revokedByProfileId: string,
    revocationReason: string | null,
    revokedAt: Date,
  ): Promise<StoredStaffRoleAssignment> {
    await Promise.resolve();
    const existing = this.assignments.get(assignmentId);
    if (!existing) throw new Error('Role assignment not found.');
    const updated: StoredStaffRoleAssignment = {
      ...existing,
      revokedAt,
      revokedByProfileId,
      revocation_reason: revocationReason,
    };
    this.assignments.set(assignmentId, updated);
    return updated;
  }

  async findAssignmentById(
    id: string,
  ): Promise<StoredStaffRoleAssignment | null> {
    await Promise.resolve();
    return this.assignments.get(id) ?? null;
  }

  async listActiveAssignmentsForStaff(
    staffProfileId: string,
  ): Promise<StoredStaffRoleAssignment[]> {
    await Promise.resolve();
    return [...this.assignments.values()].filter(
      (a) => a.staffProfileId === staffProfileId && a.revokedAt === null,
    );
  }
}
