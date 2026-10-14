import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { PermissionCode } from '@marib-tax/contracts';
import {
  type ActorProfileRepository,
  type ResolvedActorProfile,
} from './authentication.contracts.js';
import { UsersService } from '../users/users.service.js';
import { RolesPermissionsService } from '../roles-permissions/roles-permissions.service.js';

@Injectable()
export class ConcreteActorProfileRepository implements ActorProfileRepository {
  private readonly logger = new Logger(ConcreteActorProfileRepository.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesPermissionsService: RolesPermissionsService,
  ) {}

  async findActiveByAuthUserId(
    authUserId: string,
  ): Promise<ResolvedActorProfile | null> {
    try {
      const user = await this.usersService.findUserByAuthUserId(authUserId);
      if (!user?.isActive) return null;

      // Check if user is staff
      let staff = null;
      try {
        staff = await this.usersService.findStaffByUserProfileId(user.id);
      } catch (error) {
        // «لا يوجد ملف موظف» حالة مشروعة تعني مكلفاً. أي خطأ آخر (عطل قاعدة مثلاً)
        // يجب ألا يُهبط موظفاً إلى صلاحيات مكلف بصمت.
        if (!(error instanceof NotFoundException)) throw error;
      }

      if (staff?.isActive) {
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

      // صلاحيات المكلف الافتراضية. كلها مقيَّدة بالملكية عبر مُقيّمات السياسة
      // أو بتصفية على مستوى الاستعلام — امتلاك الصلاحية لا يعني رؤية بيانات الغير.
      const taxpayerPermissions: PermissionCode[] = [
        'taxpayer.profile.read',
        // لإكمال بيانات ملفه بعد التسجيل (FR-001) وتعديل غير الحرج منها (4.7).
        'taxpayer.profile.update',
        'request.read',
        'request.draft.create',
        'request.draft.edit',
        'request.draft.delete',
        'request.submit',
        // البلاغات الستة في القسم 4.4 يفتحها المكلف بنفسه.
        'balagh.read',
        'balagh.create',
        'balagh.draft.edit',
        'balagh.draft.delete',
        'balagh.submit',
        // المستندات شرط قبول في كل خدمات القسم 4.3.
        'attachment.upload',
        'attachment.read',
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
    } catch (error) {
      // «لا يوجد ملف مستخدم» يعني هوية بلا حساب في النظام ⇒ رفض المصادقة (401).
      if (error instanceof NotFoundException) return null;
      // أي عطل آخر ليس فشل مصادقة: لا يُبتلع صامتاً ولا يُترجم إلى 401 مضلّل.
      this.logger.error(
        `تعذّر حل صلاحيات الفاعل للهوية ${authUserId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
