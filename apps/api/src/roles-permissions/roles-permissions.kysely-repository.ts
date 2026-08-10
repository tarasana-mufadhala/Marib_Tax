import { Injectable } from '@nestjs/common';
import type { PermissionCode } from '@marib-tax/contracts';
import type { Selectable } from 'kysely';
import { DatabaseService } from '../database/database.service.js';
import type {
  IdentityRolesTable,
  IdentityPermissionsTable,
  IdentityStaffRoleAssignmentsTable,
} from '../database/database.contracts.js';
import type {
  RolesPermissionsRepository,
  StoredRole,
  StoredPermission,
  StoredRolePermission,
  StoredStaffRoleAssignment,
} from './roles-permissions.repository.js';

function mapRole(row: Selectable<IdentityRolesTable>): StoredRole {
  return {
    id: row.id,
    code: row.code,
    nameAr: row.name_ar,
    description: row.description,
    isSystem: row.is_system,
    isActive: row.is_active,
    createdAt: row.created_at,
    createdByProfileId: row.created_by_profile_id,
    updatedAt: row.updated_at,
    updatedByProfileId: row.updated_by_profile_id,
    archivedAt: row.archived_at,
  };
}

function mapPermission(row: Selectable<IdentityPermissionsTable>): StoredPermission {
  return {
    id: row.id,
    code: row.code as PermissionCode,
    resource: row.resource,
    action: row.action,
    nameAr: row.name_ar,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    createdByProfileId: row.created_by_profile_id,
    updatedAt: row.updated_at,
    updatedByProfileId: row.updated_by_profile_id,
    archivedAt: row.archived_at,
  };
}

function mapAssignment(
  row: Selectable<IdentityStaffRoleAssignmentsTable>,
): StoredStaffRoleAssignment {
  return {
    id: row.id,
    staffProfileId: row.staff_profile_id,
    roleId: row.role_id,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    assignedAt: row.assigned_at,
    assignedByProfileId: row.assigned_by_profile_id,
    revokedAt: row.revoked_at,
    revokedByProfileId: row.revoked_by_profile_id,
    revocation_reason: row.revocation_reason,
  };
}

@Injectable()
export class RolesPermissionsKyselyRepository implements RolesPermissionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findRoleById(id: string): Promise<StoredRole | null> {
    const row = await this.databaseService.db
      .selectFrom('identity.roles')
      .selectAll()
      .where('id', '=', id)
      .where('archived_at', 'is', null)
      .executeTakeFirst();
    return row ? mapRole(row) : null;
  }

  async findRoleByCode(code: string): Promise<StoredRole | null> {
    const row = await this.databaseService.db
      .selectFrom('identity.roles')
      .selectAll()
      .where('code', '=', code)
      .where('archived_at', 'is', null)
      .executeTakeFirst();
    return row ? mapRole(row) : null;
  }

  async createRole(
    role: Omit<StoredRole, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredRole> {
    const row = await this.databaseService.db
      .insertInto('identity.roles')
      .values({
        id: role.id,
        code: role.code,
        name_ar: role.nameAr,
        description: role.description,
        is_system: role.isSystem,
        is_active: role.isActive,
        created_by_profile_id: role.createdByProfileId,
        updated_at: null,
        updated_by_profile_id: role.updatedByProfileId,
        archived_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapRole(row);
  }

  async updateRole(
    id: string,
    updates: Partial<
      Pick<StoredRole, 'nameAr' | 'description' | 'isActive' | 'updatedByProfileId'>
    >,
  ): Promise<StoredRole> {
    const row = await this.databaseService.db
      .updateTable('identity.roles')
      .set({
        ...(updates.nameAr !== undefined ? { name_ar: updates.nameAr } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
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
    return mapRole(row);
  }

  async findPermissionById(id: string): Promise<StoredPermission | null> {
    const row = await this.databaseService.db
      .selectFrom('identity.permissions')
      .selectAll()
      .where('id', '=', id)
      .where('archived_at', 'is', null)
      .executeTakeFirst();
    return row ? mapPermission(row) : null;
  }

  async findPermissionByCode(code: PermissionCode): Promise<StoredPermission | null> {
    const row = await this.databaseService.db
      .selectFrom('identity.permissions')
      .selectAll()
      .where('code', '=', code)
      .where('archived_at', 'is', null)
      .executeTakeFirst();
    return row ? mapPermission(row) : null;
  }

  async createPermission(
    permission: Omit<StoredPermission, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredPermission> {
    const row = await this.databaseService.db
      .insertInto('identity.permissions')
      .values({
        id: permission.id,
        code: permission.code,
        resource: permission.resource,
        action: permission.action,
        name_ar: permission.nameAr,
        description: permission.description,
        is_active: permission.isActive,
        created_by_profile_id: permission.createdByProfileId,
        updated_at: null,
        updated_by_profile_id: permission.updatedByProfileId,
        archived_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapPermission(row);
  }

  async grantPermissionToRole(rolePermission: StoredRolePermission): Promise<void> {
    await this.databaseService.db
      .insertInto('identity.role_permissions')
      .values({
        role_id: rolePermission.roleId,
        permission_id: rolePermission.permissionId,
        granted_at: rolePermission.grantedAt,
        granted_by_profile_id: rolePermission.grantedByProfileId,
      })
      .onConflict((oc) => oc.columns(['role_id', 'permission_id']).doNothing())
      .execute();
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.databaseService.db
      .deleteFrom('identity.role_permissions')
      .where('role_id', '=', roleId)
      .where('permission_id', '=', permissionId)
      .execute();
  }

  async listPermissionsForRole(roleId: string): Promise<StoredPermission[]> {
    const rows = await this.databaseService.db
      .selectFrom('identity.role_permissions')
      .innerJoin(
        'identity.permissions',
        'identity.permissions.id',
        'identity.role_permissions.permission_id',
      )
      .selectAll('identity.permissions')
      .where('identity.role_permissions.role_id', '=', roleId)
      .where('identity.permissions.archived_at', 'is', null)
      .execute();
    return rows.map(mapPermission);
  }

  async assignRoleToStaff(
    assignment: Omit<
      StoredStaffRoleAssignment,
      'assignedAt' | 'revokedAt' | 'revokedByProfileId' | 'revocation_reason'
    >,
  ): Promise<StoredStaffRoleAssignment> {
    const row = await this.databaseService.db
      .insertInto('identity.staff_role_assignments')
      .values({
        id: assignment.id,
        staff_profile_id: assignment.staffProfileId,
        role_id: assignment.roleId,
        effective_from: assignment.effectiveFrom,
        effective_to: assignment.effectiveTo,
        assigned_by_profile_id: assignment.assignedByProfileId,
        revoked_at: null,
        revoked_by_profile_id: null,
        revocation_reason: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapAssignment(row);
  }

  async revokeRoleFromStaff(
    assignmentId: string,
    revokedByProfileId: string,
    revocationReason: string | null,
    revokedAt: Date,
  ): Promise<StoredStaffRoleAssignment> {
    const row = await this.databaseService.db
      .updateTable('identity.staff_role_assignments')
      .set({
        revoked_at: revokedAt,
        revoked_by_profile_id: revokedByProfileId,
        revocation_reason: revocationReason,
      })
      .where('id', '=', assignmentId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapAssignment(row);
  }

  async findAssignmentById(id: string): Promise<StoredStaffRoleAssignment | null> {
    const row = await this.databaseService.db
      .selectFrom('identity.staff_role_assignments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? mapAssignment(row) : null;
  }

  async listActiveAssignmentsForStaff(
    staffProfileId: string,
  ): Promise<StoredStaffRoleAssignment[]> {
    const now = new Date();
    const rows = await this.databaseService.db
      .selectFrom('identity.staff_role_assignments')
      .selectAll()
      .where('staff_profile_id', '=', staffProfileId)
      .where('revoked_at', 'is', null)
      .where('effective_from', '<=', now)
      .where((eb) =>
        eb.or([
          eb('effective_to', 'is', null),
          eb('effective_to', '>', now),
        ]),
      )
      .execute();
    return rows.map(mapAssignment);
  }
}
