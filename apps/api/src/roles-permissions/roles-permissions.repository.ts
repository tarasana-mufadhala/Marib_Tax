import type { PermissionCode } from '@marib-tax/contracts';

export interface StoredRole {
  id: string;
  code: string;
  nameAr: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  createdByProfileId: string | null;
  updatedAt: Date | null;
  updatedByProfileId: string | null;
  archivedAt: Date | null;
}

export interface StoredPermission {
  id: string;
  code: PermissionCode;
  resource: string;
  action: string;
  nameAr: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  createdByProfileId: string | null;
  updatedAt: Date | null;
  updatedByProfileId: string | null;
  archivedAt: Date | null;
}

export interface StoredRolePermission {
  roleId: string;
  permissionId: string;
  grantedAt: Date;
  grantedByProfileId: string | null;
}

export interface StoredStaffRoleAssignment {
  id: string;
  staffProfileId: string;
  roleId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  assignedAt: Date;
  assignedByProfileId: string | null;
  revokedAt: Date | null;
  revokedByProfileId: string | null;
  revocation_reason: string | null;
}

export interface RolesPermissionsRepository {
  findRoleById(id: string): Promise<StoredRole | null>;
  findRoleByCode(code: string): Promise<StoredRole | null>;
  createRole(
    role: Omit<StoredRole, 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Promise<StoredRole>;
  updateRole(
    id: string,
    updates: Partial<
      Pick<
        StoredRole,
        'nameAr' | 'description' | 'isActive' | 'updatedByProfileId'
      >
    >,
  ): Promise<StoredRole>;

  findPermissionById(id: string): Promise<StoredPermission | null>;
  findPermissionByCode(code: PermissionCode): Promise<StoredPermission | null>;
  createPermission(
    permission: Omit<
      StoredPermission,
      'createdAt' | 'updatedAt' | 'archivedAt'
    >,
  ): Promise<StoredPermission>;

  grantPermissionToRole(rolePermission: StoredRolePermission): Promise<void>;
  revokePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
  listPermissionsForRole(roleId: string): Promise<StoredPermission[]>;

  assignRoleToStaff(
    assignment: Omit<
      StoredStaffRoleAssignment,
      'assignedAt' | 'revokedAt' | 'revokedByProfileId' | 'revocation_reason'
    >,
  ): Promise<StoredStaffRoleAssignment>;
  revokeRoleFromStaff(
    assignmentId: string,
    revokedByProfileId: string,
    revocationReason: string | null,
    revokedAt: Date,
  ): Promise<StoredStaffRoleAssignment>;
  findAssignmentById(id: string): Promise<StoredStaffRoleAssignment | null>;
  listActiveAssignmentsForStaff(
    staffProfileId: string,
  ): Promise<StoredStaffRoleAssignment[]>;
}

export const ROLES_PERMISSIONS_REPOSITORY = Symbol(
  'ROLES_PERMISSIONS_REPOSITORY',
);
