import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { sql } from 'kysely';
import { isPermissionCode, permissionCodes } from '@marib-tax/contracts';
import { RequirePermission } from '../authz/authorization.decorators.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import { DatabaseService } from '../database/database.service.js';
import { DomainException } from '../http/domain-exception.js';

/** تسميات عربية لمجموعات الصلاحيات، لعرضها مبوّبة في اللوحة. */
const RESOURCE_LABELS: Record<string, string> = {
  taxpayer: 'المكلفون',
  'taxpayer.profile': 'ملف المكلف',
  request: 'الطلبات',
  'request.draft': 'مسودات الطلبات',
  'request.completion': 'استكمال الطلبات',
  'request.decision': 'قرارات الطلبات',
  'request.admin': 'إدارة الطلبات',
  balagh: 'البلاغات',
  'balagh.draft': 'مسودات البلاغات',
  'balagh.completion': 'استكمال البلاغات',
  'balagh.decision': 'قرارات البلاغات',
  'balagh.admin': 'إدارة البلاغات',
  field_visit: 'النزول الميداني',
  'field_visit.result': 'نتائج النزول',
  due: 'المستحقات',
  payment: 'المدفوعات',
  'payment.receipt': 'إيصالات السداد',
  notification: 'الإشعارات',
  content: 'المحتوى',
  import: 'الاستيراد',
  report: 'التقارير',
  audit: 'التدقيق',
  'audit.sensitive': 'التدقيق الحساس',
  user: 'المستخدمون',
  role: 'الأدوار',
  masterdata: 'البيانات المرجعية',
  attachment: 'المرفقات',
};

const ACTION_LABELS: Record<string, string> = {
  read: 'اطلاع',
  update: 'تعديل',
  create: 'إنشاء',
  edit: 'تعديل',
  delete: 'حذف',
  submit: 'إرسال',
  review: 'مراجعة',
  provide: 'استكمال',
  request: 'طلب',
  recommend: 'توصية',
  final: 'قرار نهائي',
  close: 'إغلاق',
  archive: 'أرشفة',
  schedule: 'جدولة',
  record: 'تسجيل',
  register: 'تسجيل',
  correct: 'تصحيح',
  confirm: 'تأكيد',
  upload: 'رفع',
  mark_read: 'تعليم مقروء',
  publish: 'نشر',
  withdraw: 'سحب',
  preview: 'معاينة',
  validate: 'تحقق',
  approve: 'اعتماد',
  commit: 'ترحيل',
  reject: 'رفض',
  view: 'عرض',
  export: 'تصدير',
  manage: 'إدارة',
  assign: 'إسناد',
};

interface CreateRoleBody {
  code?: string;
  nameAr?: string;
  description?: string;
  permissionCodes?: string[];
}

interface CreateUserBody {
  displayName?: string;
  email?: string;
  phone?: string;
  password?: string;
  title?: string;
  roleCodes?: string[];
}

/**
 * إدارة الصلاحيات والأدوار والمستخدمين.
 *
 * النموذج في القاعدة قائم على الأدوار: المستخدم يُسند له دور، والدور يحمل
 * صلاحيات. فليتمكّن المدير من منح «أي صلاحية يريدها» يُنشئ دوراً بالمجموعة
 * التي يختارها ثم يُسنده — بدل صلاحيات سائبة بلا مرجع يُراجَع.
 */
@Controller('api/v1/admin')
export class AccessControlController {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  /** كتالوج الصلاحيات مبوّباً بالمورد، لعرضه في شاشة الأدوار. */
  @Get('permissions')
  @RequirePermission('role.read')
  permissions() {
    const groups = new Map<string, { code: string; label: string; action: string }[]>();

    for (const code of permissionCodes) {
      const parts = code.split('.');
      const action = parts.at(-1) ?? code;
      const resource = parts.slice(0, -1).join('.');
      const list = groups.get(resource) ?? [];
      list.push({
        code,
        action: ACTION_LABELS[action] ?? action,
        label: `${RESOURCE_LABELS[resource] ?? resource} — ${ACTION_LABELS[action] ?? action}`,
      });
      groups.set(resource, list);
    }

    return [...groups.entries()].map(([resource, items]) => ({
      resource,
      resourceLabel: RESOURCE_LABELS[resource] ?? resource,
      permissions: items,
    }));
  }

  /** الأدوار مع صلاحيات كل دور وعدد من يحملونه. */
  @Get('roles/detailed')
  @RequirePermission('role.read')
  async rolesDetailed() {
    this.assertDatabase();
    const result = await sql<{
      id: string;
      code: string;
      name_ar: string | null;
      description: string | null;
      is_system: boolean;
      permission_codes: string[] | null;
      holders: number;
    }>`
      select r.id, r.code, r.name_ar, r.description, r.is_system,
             array_remove(array_agg(distinct p.code), null) as permission_codes,
             (select count(*)::int from identity.staff_role_assignments sra
              where sra.role_id = r.id and sra.revoked_at is null) as holders
      from identity.roles r
      left join identity.role_permissions rp on rp.role_id = r.id
      left join identity.permissions p on p.id = rp.permission_id and p.is_active
      where r.archived_at is null
      group by r.id
      order by r.is_system desc, r.name_ar
    `.execute(this.db.db);

    return result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      nameAr: row.name_ar,
      description: row.description,
      isSystem: row.is_system,
      permissionCodes: row.permission_codes ?? [],
      holders: row.holders,
    }));
  }

  /** إنشاء دور بمجموعة الصلاحيات التي يختارها المدير. */
  @Post('roles')
  @RequirePermission('role.assign')
  async createRole(@Body() body: CreateRoleBody) {
    this.assertDatabase();

    const code = (body.code ?? '').trim().toLowerCase();
    const nameAr = (body.nameAr ?? '').trim();
    const granted = this.validatedPermissions(body.permissionCodes);

    if (!/^[a-z][a-z0-9_]{2,40}$/.test(code)) {
      throw DomainException.badRequest(
        'رمز الدور يجب أن يبدأ بحرف إنجليزي صغير ويتكوّن من حروف صغيرة وأرقام وشرطة سفلية (3–41 خانة)',
        'INVALID_ROLE_CODE',
      );
    }
    if (nameAr === '') {
      throw DomainException.badRequest('اسم الدور بالعربية مطلوب', 'ROLE_NAME_REQUIRED');
    }

    const existing = await sql<{ id: string }>`
      select id from identity.roles where code = ${code} limit 1
    `.execute(this.db.db);
    if (existing.rows[0]) {
      throw DomainException.conflict('يوجد دور بهذا الرمز مسبقاً', 'ROLE_CODE_TAKEN');
    }

    const roleId = randomUUID();
    await this.db.db.transaction().execute(async (trx) => {
      await sql`
        insert into identity.roles (id, code, name_ar, description, is_system, is_active, created_at)
        values (${roleId}::uuid, ${code}, ${nameAr},
                ${(body.description ?? '').trim() || null}, false, true, now())
      `.execute(trx);
      await this.replacePermissions(trx, roleId, granted);
    });

    return { id: roleId, code, nameAr, permissionCodes: granted };
  }

  /** تعديل صلاحيات دور قائم. الأدوار النظامية لا تُمس. */
  @Patch('roles/:id/permissions')
  @RequirePermission('role.assign')
  async updateRolePermissions(
    @Param('id', new ParseUUIDPipe()) roleId: string,
    @Body() body: { permissionCodes?: string[] },
  ) {
    this.assertDatabase();
    const granted = this.validatedPermissions(body.permissionCodes);

    const role = await sql<{ is_system: boolean }>`
      select is_system from identity.roles where id = ${roleId}::uuid limit 1
    `.execute(this.db.db);
    if (!role.rows[0]) throw DomainException.notFound('الدور غير موجود');
    if (role.rows[0].is_system) {
      throw DomainException.conflict(
        'لا يمكن تعديل صلاحيات دور نظامي. أنشئ دوراً جديداً بدلاً منه',
        'SYSTEM_ROLE_IMMUTABLE',
      );
    }

    await this.db.db.transaction().execute(async (trx) => {
      await this.replacePermissions(trx, roleId, granted);
    });
    return { id: roleId, permissionCodes: granted };
  }

  /**
   * إنشاء مستخدم بالبريد (مسار دخول الموظفين) مع إسناد أدوار.
   *
   * الهاتف اختياري: بعض الموظفين يدخلون بالبريد فقط.
   */
  @Post('staff-users')
  @RequirePermission('user.manage')
  async createStaffUser(
    @Body() body: CreateUserBody,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertDatabase();

    const displayName = (body.displayName ?? '').trim();
    const email = (body.email ?? '').trim().toLowerCase();
    const phone = (body.phone ?? '').trim();
    const password = body.password ?? '';
    const roleCodes = (body.roleCodes ?? []).filter((c) => typeof c === 'string');

    if (displayName === '') {
      throw DomainException.badRequest('اسم المستخدم مطلوب', 'NAME_REQUIRED');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw DomainException.badRequest('أدخل بريداً إلكترونياً صحيحاً', 'INVALID_EMAIL');
    }
    if (!this.isStrongPassword(password)) {
      throw DomainException.badRequest(
        'كلمة المرور يجب ألا تقل عن 8 خانات وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص',
        'WEAK_PASSWORD',
      );
    }
    if (roleCodes.length === 0) {
      throw DomainException.badRequest(
        'اختر دوراً واحداً على الأقل للمستخدم',
        'ROLE_REQUIRED',
      );
    }

    const roles = await sql<{ id: string; code: string }>`
      select id, code from identity.roles
      where code = any(${roleCodes}) and is_active and archived_at is null
    `.execute(this.db.db);
    const missing = roleCodes.filter(
      (code) => !roles.rows.some((row) => row.code === code),
    );
    if (missing.length > 0) {
      throw DomainException.badRequest(
        `أدوار غير معروفة: ${missing.join('، ')}`,
        'UNKNOWN_ROLE',
      );
    }

    const authUserId = await this.createAuthIdentity(email, phone, password, displayName);
    const actorId = request[VERIFIED_ACTOR]?.actorId ?? null;
    const userProfileId = randomUUID();
    const staffProfileId = randomUUID();

    try {
      await this.db.db.transaction().execute(async (trx) => {
        await sql`
          insert into identity.user_profiles
            (id, auth_user_id, display_name, is_active, created_at, created_by_profile_id)
          values (${userProfileId}::uuid, ${authUserId}::uuid, ${displayName}, true,
                  now(), ${actorId}::uuid)
        `.execute(trx);

        await sql`
          insert into identity.staff_profiles
            (id, user_profile_id, staff_code, title, is_active, effective_from,
             created_at, created_by_profile_id)
          values (${staffProfileId}::uuid, ${userProfileId}::uuid,
                  ${`EMP-${Date.now().toString().slice(-6)}`},
                  ${(body.title ?? '').trim() || 'موظف'}, true, now(), now(),
                  ${actorId}::uuid)
        `.execute(trx);

        for (const role of roles.rows) {
          await sql`
            insert into identity.staff_role_assignments
              (id, staff_profile_id, role_id, assigned_at, assigned_by_profile_id, effective_from)
            values (${randomUUID()}::uuid, ${staffProfileId}::uuid, ${role.id}::uuid,
                    now(), ${actorId}::uuid, now())
          `.execute(trx);
        }
      });
    } catch (error) {
      // حساب المصادقة أُنشئ خارج المعاملة؛ نزيله حتى لا يبقى يتيماً يمنع
      // إعادة المحاولة بنفس البريد.
      await this.deleteAuthIdentity(authUserId);
      throw error;
    }

    return { userProfileId, staffProfileId, email, roleCodes };
  }

  /** تغيير أدوار مستخدم قائم. */
  @Patch('staff-users/:id/roles')
  @RequirePermission('role.assign')
  async updateUserRoles(
    @Param('id', new ParseUUIDPipe()) userProfileId: string,
    @Body() body: { roleCodes?: string[] },
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertDatabase();
    const roleCodes = (body.roleCodes ?? []).filter((c) => typeof c === 'string');
    if (roleCodes.length === 0) {
      throw DomainException.badRequest(
        'اختر دوراً واحداً على الأقل',
        'ROLE_REQUIRED',
      );
    }

    const staff = await sql<{ id: string }>`
      select id from identity.staff_profiles
      where user_profile_id = ${userProfileId}::uuid limit 1
    `.execute(this.db.db);
    if (!staff.rows[0]) {
      throw DomainException.notFound('لا يوجد ملف موظف لهذا المستخدم');
    }

    const roles = await sql<{ id: string; code: string }>`
      select id, code from identity.roles
      where code = any(${roleCodes}) and is_active and archived_at is null
    `.execute(this.db.db);
    if (roles.rows.length !== roleCodes.length) {
      throw DomainException.badRequest('أدوار غير معروفة', 'UNKNOWN_ROLE');
    }

    const actorId = request[VERIFIED_ACTOR]?.actorId ?? null;
    const staffProfileId = staff.rows[0].id;

    await this.db.db.transaction().execute(async (trx) => {
      // السحب يُسجَّل ولا يُحذف، فيبقى أثر من غيّر الصلاحيات ومتى.
      await sql`
        update identity.staff_role_assignments
        set revoked_at = now(), revoked_by_profile_id = ${actorId}::uuid
        where staff_profile_id = ${staffProfileId}::uuid and revoked_at is null
      `.execute(trx);

      for (const role of roles.rows) {
        await sql`
          insert into identity.staff_role_assignments
            (id, staff_profile_id, role_id, assigned_at, assigned_by_profile_id, effective_from)
          values (${randomUUID()}::uuid, ${staffProfileId}::uuid, ${role.id}::uuid,
                  now(), ${actorId}::uuid, now())
        `.execute(trx);
      }
    });

    return { userProfileId, roleCodes };
  }

  // ---- أدوات داخلية ----

  private assertDatabase(): void {
    if (!this.db.isInitialized) {
      throw DomainException.unavailable('قاعدة البيانات غير متاحة');
    }
  }

  /** يقبل رموز الصلاحيات المعروفة في العقود وحدها. */
  private validatedPermissions(codes: string[] | undefined): string[] {
    const list = [...new Set((codes ?? []).filter((c) => typeof c === 'string'))];
    if (list.length === 0) {
      throw DomainException.badRequest(
        'اختر صلاحية واحدة على الأقل للدور',
        'PERMISSIONS_REQUIRED',
      );
    }
    const unknown = list.filter((code) => !isPermissionCode(code));
    if (unknown.length > 0) {
      throw DomainException.badRequest(
        `صلاحيات غير معروفة: ${unknown.join('، ')}`,
        'UNKNOWN_PERMISSION',
      );
    }
    return list;
  }

  private async replacePermissions(
    trx: unknown,
    roleId: string,
    codes: string[],
  ): Promise<void> {
    await sql`
      delete from identity.role_permissions where role_id = ${roleId}::uuid
    `.execute(trx as never);
    await sql`
      insert into identity.role_permissions (role_id, permission_id, granted_at)
      select ${roleId}::uuid, p.id, now()
      from identity.permissions p
      where p.code = any(${codes})
    `.execute(trx as never);
  }

  private isStrongPassword(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  private supabase(): { url: string; key: string } {
    const url = (this.config.get<string>('SUPABASE_URL') ?? '').replace(/\/$/, '');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!url || !key) {
      throw DomainException.unavailable('إعدادات المصادقة غير مكتملة');
    }
    return { url, key };
  }

  private async createAuthIdentity(
    email: string,
    phone: string,
    password: string,
    displayName: string,
  ): Promise<string> {
    const { url, key } = this.supabase();
    const res = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        email_confirm: true,
        ...(phone ? { phone, phone_confirm: true } : {}),
        password,
        user_metadata: { display_name: displayName },
      }),
    });

    const data = (await res.json()) as { id?: string; msg?: string; message?: string };
    if (res.status === 422) {
      throw DomainException.conflict(
        'يوجد حساب بهذا البريد أو الهاتف مسبقاً',
        'IDENTITY_ALREADY_EXISTS',
      );
    }
    if (!res.ok || !data.id) {
      throw DomainException.unavailable(
        data.msg ?? data.message ?? 'تعذّر إنشاء حساب المصادقة',
        'IDENTITY_CREATE_FAILED',
      );
    }
    return data.id;
  }

  private async deleteAuthIdentity(authUserId: string): Promise<void> {
    try {
      const { url, key } = this.supabase();
      await fetch(`${url}/auth/v1/admin/users/${authUserId}`, {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
    } catch {
      // التنظيف best-effort؛ الخطأ الأصلي هو ما يُبلَّغ به.
    }
  }
}
