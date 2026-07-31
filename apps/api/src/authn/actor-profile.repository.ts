import { Injectable } from '@nestjs/common';
import type { PermissionCode } from '@marib-tax/contracts';
import {
  type ActorProfileRepository,
  type ResolvedActorProfile,
} from './authentication.contracts.js';
import { UsersService } from '../users/users.service.js';
import { RolesPermissionsService } from '../roles-permissions/roles-permissions.service.js';

@Injectable()
export class ConcreteActorProfileRepository implements ActorProfileRepository {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesPermissionsService: RolesPermissionsService,
  ) {}

  async findActiveByAuthUserId(
    authUserId: string,
  ): Promise<ResolvedActorProfile | null> {
    try {
      const user = await this.usersService.findUserByAuthUserId(authUserId);
      if (!user || !user.isActive) return null;

      // Check if user is staff
      try {
        const staff = await this.usersService.findStaffByUserProfileId(user.id);
        if (staff && staff.isActive) {
          // Resolve staff permissions
          const assignments =
            await this.rolesPermissionsService.listActiveAssignmentsForStaff(
              staff.id,
            );
          const permissionsSet = new Set<PermissionCode>();

          for (const assignment of assignments) {
            const rolePerms =
              await this.rolesPermissionsService.listPermissionsForRole(
                assignment.roleId,
              );
            for (const perm of rolePerms) {
              if (perm.isActive) {
                permissionsSet.add(perm.code);
              }
            }
          }

          return {
            actorId: user.id,
            permissions: Array.from(permissionsSet),
            roleActive: true,
            assignmentActive: true,
          };
        }
      } catch {
        // Not a staff user, treat as normal taxpayer
      }

      // Default taxpayer permissions
      const taxpayerPermissions: PermissionCode[] = [
        'taxpayer.profile.read',
        'request.read',
        'request.draft.create',
        'request.draft.edit',
        'request.draft.delete',
        'request.submit',
        'payment.receipt.upload',
        'notification.read',
        'notification.mark_read',
      ];

      return {
        actorId: user.id,
        permissions: taxpayerPermissions,
        roleActive: true,
        assignmentActive: true,
      };
    } catch {
      return null;
    }
  }
}
