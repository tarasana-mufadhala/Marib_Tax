import { randomUUID } from 'node:crypto';
import { Controller, Get, Param, ParseUUIDPipe, Patch, Post, Delete, Body, Req } from '@nestjs/common';
import { ALLOWED_TRANSITIONS } from '../workflow/workflow.service.js';
import { DomainException } from '../http/domain-exception.js';
import { DUE_STATUSES } from '../dues-payments/dues-payments.repository.js';
import { ConfigService } from '@nestjs/config';
import { sql } from 'kysely';
import type { Selectable } from 'kysely';
import {
  AuthenticatedEndpoint,
  RequirePermission,
} from '../authz/authorization.decorators.js';
import type { ActorAuthorizationContext } from '../authz/authorization.contracts.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import { DatabaseService } from '../database/database.service.js';
import type {
  ContentAnnouncementsTable,
  ContentContactMessagesTable,
  ContentContentPagesTable,
  ContentFaqsTable,
  LegalEntitiesTable,
  RequestsRequestStatusHistoriesTable,
  ServiceRequestsTable,
  ServiceTypesTable,
} from '../database/database.contracts.js';

export interface AdminErrorResponse {
  error: string;
}

export interface AdminSuccessResponse {
  success: true;
}

export interface AdminRequestRow {
  id: string;
  public_ref: string | null;
  status_code: string;
  submitted_at: Date | null;
  created_at: Date;
  taxpayer_name: string | null;
  taxpayer_ref: string | null;
  service_type_name: string | null;
}

export interface AdminRequestDetailsResponse {
  request: AdminRequestRow;
  history: Selectable<RequestsRequestStatusHistoriesTable>[];
}

export interface CreateStaffUserResponse {
  success: true;
  staffProfileId: string;
  displayName: string;
}

export interface CurrentUserResponse {
  userProfileId: string;
  displayName: string | null;
  staffCode: string | null;
  title: string | null;
  roles: { code: string; nameAr: string | null }[];
  permissions: ActorAuthorizationContext['permissions'];
}

export interface AdminRoleRow {
  id: string;
  code: string;
  name_ar: string;
}

export interface AdminUserRow {
  id: string;
  staff_code: string | null;
  title: string | null;
  is_active: boolean;
  display_name: string | null;
  role_name: string | null;
}

export interface AdminDecisionRow {
  id: string;
  outcome_code: string;
  decision_summary: string | null;
  decided_at: Date;
  request_ref: string | null;
  taxpayer_name: string | null;
}

export interface AdminBalaghRow {
  id: string;
  public_ref: string | null;
  balagh_type_code: string;
  status_code: string;
  submitted_at: Date | null;
  created_at: Date;
  taxpayer_name: string | null;
  taxpayer_ref: string | null;
}

export interface AdminVisitRow {
  id: string;
  public_ref: string | null;
  status_code: string;
  service_request_id: string | null;
  notes: string | null;
  created_at: Date;
  taxpayer_name: string | null;
}

interface ActiveRoleRow {
  code: string;
  name_ar: string | null;
}

/** قراءة خاصية من جسم JSON مجهول البنية دون افتراض شكله. */
function readJsonProperty(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) return undefined;
  return (value as Record<string, unknown>)[key];
}

@Controller('api/v1/admin')
export class AdminController {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  /** أدوار المستخدم النشطة — استعلام مُعامَل (لا تركيب نصي). */
  private async activeRolesOf(
    userProfileId: string,
  ): Promise<ActiveRoleRow[]> {
    const result = await sql<ActiveRoleRow>`
      select r.code, r.name_ar
      from identity.staff_role_assignments sra
      join identity.roles r on r.id = sra.role_id
      join identity.staff_profiles sp on sp.id = sra.staff_profile_id
      where sp.user_profile_id = ${userProfileId}
        and sra.revoked_at is null
        and r.is_active
    `.execute(this.db.db);
    return result.rows;
  }

  // request.review صلاحية موظف: request.read وحدها ممنوحة لكل مكلف،
  // وهذه النقطة تكشف تفاصيل أي طلب في النظام.
  @RequirePermission('request.review')
  @Get('requests/:id/details')
  async getRequestDetails(
    @Param('id') id: string,
  ): Promise<AdminRequestDetailsResponse | null> {
    if (!this.db.isInitialized) return null;
    try {
      const request: AdminRequestRow | undefined = await this.db.db
        .selectFrom('requests.service_requests')
        .leftJoin('registry.taxpayers', 'registry.taxpayers.id', 'requests.service_requests.taxpayer_id')
        .leftJoin('requests.service_types', 'requests.service_types.id', 'requests.service_requests.service_type_id')
        .select([
          'requests.service_requests.id as id',
          'requests.service_requests.public_ref as public_ref',
          'requests.service_requests.status_code as status_code',
          'requests.service_requests.submitted_at as submitted_at',
          'requests.service_requests.created_at as created_at',
          'registry.taxpayers.display_name as taxpayer_name',
          'registry.taxpayers.public_ref as taxpayer_ref',
          'requests.service_types.name as service_type_name',
        ])
        .where('requests.service_requests.id', '=', id)
        .executeTakeFirst();
      if (!request) return null;

      const history: Selectable<RequestsRequestStatusHistoriesTable>[] = await this.db.db
        .selectFrom('requests.request_status_histories')
        .selectAll()
        .where('service_request_id', '=', id)
        .orderBy('changed_at', 'desc')
        .limit(50)
        .execute()
        .catch(() => []);

      return { request, history };
    } catch {
      return null;
    }
  }

  @RequirePermission('request.read')
  @Get('services')
  async getServices(): Promise<Selectable<ServiceTypesTable>[]> {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('requests.service_types')
        .selectAll()
        .orderBy('created_at', 'asc')
        .limit(100)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('masterdata.manage')
  @Patch('services/:id/toggle')
  async toggleService(
    @Param('id') id: string,
  ): Promise<Selectable<ServiceTypesTable> | undefined | AdminErrorResponse> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const current = await this.db.db
        .selectFrom('requests.service_types')
        .select(['is_active'])
        .where('id', '=', id)
        .executeTakeFirst();
      if (!current) return { error: 'الخدمة غير موجودة' };
      return await this.db.db
        .updateTable('requests.service_types')
        .set({ is_active: !current.is_active, updated_at: new Date() })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر تحديث الخدمة' };
    }
  }

  @RequirePermission('taxpayer.profile.read')
  @Get('legal-entities')
  async getLegalEntities(): Promise<Selectable<LegalEntitiesTable>[]> {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('legal.legal_entities')
        .selectAll()
        .where('archived_at', 'is', null)
        .orderBy('created_at', 'asc')
        .limit(100)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('taxpayer.profile.update')
  @Post('legal-entities')
  async createLegalEntity(
    @Body() body: { legal_name: string; classification_code?: string },
  ): Promise<Selectable<LegalEntitiesTable> | undefined | AdminErrorResponse> {
    if (!body?.legal_name?.trim()) return { error: 'اسم الكيان مطلوب' };
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      return await this.db.db
        .insertInto('legal.legal_entities')
        .values({
          id: crypto.randomUUID(),
          legal_name: body.legal_name.trim(),
          classification_code: body.classification_code ?? 'other',
          is_active: true,
        })
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر حفظ الكيان القانوني' };
    }
  }

  @RequirePermission('user.manage')
  @Post('users')
  async createStaffUser(
    @Body() body: { displayName: string; phone: string; password: string; title?: string; roleCode?: string },
  ): Promise<CreateStaffUserResponse | AdminErrorResponse> {
    if (!body?.displayName?.trim() || !body?.phone?.trim() || !body?.password) {
      return { error: 'الاسم ورقم الهاتف وكلمة المرور مطلوبة' };
    }
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };

    const supabaseUrl = (this.config.get<string>('SUPABASE_URL') ?? '').replace(/\/$/, '');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) return { error: 'إعدادات Supabase غير مكتملة' };

    try {
      // 1. إنشاء حساب المصادقة في GoTrue
      const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: body.phone.trim(),
          password: body.password,
          phone_confirm: true,
        }),
      });
      const authData: unknown = await authRes.json();
      const authUserId = readJsonProperty(authData, 'id');
      if (!authRes.ok || typeof authUserId !== 'string' || !authUserId) {
        const msg = readJsonProperty(authData, 'msg');
        const message = readJsonProperty(authData, 'message');
        return {
          error:
            (typeof msg === 'string' && msg) ||
            (typeof message === 'string' && message) ||
            'تعذر إنشاء حساب المصادقة — تحقق من تفعيل مزود الهاتف',
        };
      }

      // 2. ملف المستخدم
      const userProfileId = crypto.randomUUID();
      await this.db.db
        .insertInto('identity.user_profiles')
        .values({ id: userProfileId, auth_user_id: authUserId, display_name: body.displayName.trim(), is_active: true })
        .execute();

      // 3. الملف الوظيفي
      const staffProfileId = crypto.randomUUID();
      await this.db.db
        .insertInto('identity.staff_profiles')
        .values({
          id: staffProfileId,
          user_profile_id: userProfileId,
          staff_code: `EMP-${Date.now().toString().slice(-6)}`,
          title: body.title?.trim() ?? 'موظف',
          is_active: true,
          effective_from: new Date(),
        })
        .execute();

      // 4. إسناد الدور إن وُجد
      if (body.roleCode) {
        const role = await this.db.db
          .selectFrom('identity.roles')
          .select(['id'])
          .where('code', '=', body.roleCode)
          .executeTakeFirst();
        if (role) {
          await this.db.db
            .insertInto('identity.staff_role_assignments')
            .values({
              id: crypto.randomUUID(),
              staff_profile_id: staffProfileId,
              role_id: role.id,
              effective_from: new Date(),
              assigned_at: new Date(),
            })
            .execute();
        }
      }

      return { success: true, staffProfileId, displayName: body.displayName.trim() };
    } catch {
      return { error: 'تعذر إنشاء الموظف' };
    }
  }

  /**
   * هوية المستخدم الحالي وصلاحياته الفعلية — تستعملها اللوحة بدل أي بيانات
   * مثبّتة في الواجهة. لا تتطلب صلاحية بعينها: مجرد جلسة صالحة (يتكفّل الحارس بذلك).
   */
  @AuthenticatedEndpoint()
  @Get('me')
  async getCurrentUser(
    @Req() request: AuthenticatedRequest,
  ): Promise<CurrentUserResponse | null> {
    const actor = request[VERIFIED_ACTOR];
    if (!actor) return null;
    const empty: CurrentUserResponse = {
      userProfileId: actor.actorId,
      displayName: null,
      staffCode: null,
      title: null,
      roles: [],
      permissions: actor.permissions,
    };
    if (!this.db.isInitialized) return empty;
    try {
      const profile = await this.db.db
        .selectFrom('identity.user_profiles')
        .leftJoin(
          'identity.staff_profiles',
          'identity.staff_profiles.user_profile_id',
          'identity.user_profiles.id',
        )
        .select([
          'identity.user_profiles.display_name as display_name',
          'identity.staff_profiles.staff_code as staff_code',
          'identity.staff_profiles.title as title',
        ])
        .where('identity.user_profiles.id', '=', actor.actorId)
        .executeTakeFirst();

      const roles = await this.activeRolesOf(actor.actorId);

      return {
        ...empty,
        displayName: profile?.display_name ?? null,
        staffCode: profile?.staff_code ?? null,
        title: profile?.title ?? null,
        roles: roles.map((r) => ({ code: r.code, nameAr: r.name_ar ?? null })),
      };
    } catch {
      return empty;
    }
  }

  @RequirePermission('role.read')
  @Get('roles')
  async getRoles(): Promise<AdminRoleRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('identity.roles')
        .select(['id', 'code', 'name_ar'])
        .where('is_active', '=', true)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Get('content-pages')
  async getContentPages(): Promise<Selectable<ContentContentPagesTable>[]> {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.content_pages')
        .selectAll()
        .orderBy('created_at', 'asc')
        .limit(50)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Post('content-pages')
  async saveContentPage(
    @Body() body: { key: string; title: string; body: string },
  ): Promise<Selectable<ContentContentPagesTable> | undefined | AdminErrorResponse> {
    if (!body?.key?.trim() || !body?.title?.trim()) return { error: 'المفتاح والعنوان مطلوبان' };
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const existing = await this.db.db
        .selectFrom('content.content_pages')
        .select(['id'])
        .where('key', '=', body.key.trim())
        .executeTakeFirst();
      if (existing) {
        return await this.db.db
          .updateTable('content.content_pages')
          .set({ title: body.title.trim(), body: body.body ?? '', status: 'published', updated_at: new Date() })
          .where('id', '=', existing.id)
          .returningAll()
          .executeTakeFirst();
      }
      return await this.db.db
        .insertInto('content.content_pages')
        .values({
          id: crypto.randomUUID(),
          key: body.key.trim(),
          title: body.title.trim(),
          body: body.body ?? '',
          status: 'published',
          published_at: new Date(),
        })
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر حفظ الصفحة' };
    }
  }

  @RequirePermission('content.publish')
  @Get('contact-messages')
  async getContactMessages(): Promise<Selectable<ContentContactMessagesTable>[]> {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.contact_messages')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(200)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Patch('contact-messages/:id/read')
  async markContactMessageRead(
    @Param('id') id: string,
  ): Promise<Selectable<ContentContactMessagesTable> | undefined | AdminErrorResponse> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      return await this.db.db
        .updateTable('content.contact_messages')
        .set({ status: 'read', read_at: new Date() })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر تحديث حالة الرسالة' };
    }
  }

  @RequirePermission('user.read')
  @Get('users')
  async getUsers(): Promise<AdminUserRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      const rows: AdminUserRow[] = await this.db.db
        .selectFrom('identity.staff_profiles')
        .leftJoin(
          'identity.user_profiles',
          'identity.user_profiles.id',
          'identity.staff_profiles.user_profile_id',
        )
        .leftJoin(
          'identity.staff_role_assignments',
          'identity.staff_role_assignments.staff_profile_id',
          'identity.staff_profiles.id',
        )
        .leftJoin(
          'identity.roles',
          'identity.roles.id',
          'identity.staff_role_assignments.role_id',
        )
        .select([
          'identity.staff_profiles.id as id',
          'identity.staff_profiles.staff_code as staff_code',
          'identity.staff_profiles.title as title',
          'identity.staff_profiles.is_active as is_active',
          'identity.user_profiles.display_name as display_name',
          'identity.roles.name_ar as role_name',
        ])
        .where('identity.staff_profiles.archived_at', 'is', null)
        .orderBy('identity.staff_profiles.created_at', 'desc')
        .limit(100)
        .execute();
      return rows;
    } catch {
      return [];
    }
  }

  @RequirePermission('request.review')
  @Get('decisions')
  async getDecisions(): Promise<AdminDecisionRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      const rows: AdminDecisionRow[] = await this.db.db
        .selectFrom('requests.request_decision_records')
        .leftJoin(
          'requests.service_requests',
          'requests.service_requests.id',
          'requests.request_decision_records.service_request_id',
        )
        .leftJoin(
          'registry.taxpayers',
          'registry.taxpayers.id',
          'requests.service_requests.taxpayer_id',
        )
        .select([
          'requests.request_decision_records.id as id',
          'requests.request_decision_records.outcome_code as outcome_code',
          'requests.request_decision_records.decision_summary as decision_summary',
          'requests.request_decision_records.decided_at as decided_at',
          'requests.service_requests.public_ref as request_ref',
          'registry.taxpayers.display_name as taxpayer_name',
        ])
        .orderBy('requests.request_decision_records.decided_at', 'desc')
        .limit(100)
        .execute();
      return rows;
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Get('announcements')
  async getAnnouncements(): Promise<Selectable<ContentAnnouncementsTable>[]> {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await this.db.db
        .selectFrom('content.announcements')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(50)
        .execute();
      return rows;
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Post('announcements')
  async createAnnouncement(
    @Body() body: { title: string; body: string; priority?: number },
  ): Promise<Selectable<ContentAnnouncementsTable> | undefined | AdminErrorResponse> {
    if (!body?.title || !body?.body) {
      return { error: 'العنوان والنص مطلوبان' };
    }
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const row = await this.db.db
        .insertInto('content.announcements')
        .values({
          id: crypto.randomUUID(),
          title: body.title,
          body: body.body,
          priority: body.priority ?? 0,
          is_active: true,
          published_at: new Date(),
        })
        .returningAll()
        .executeTakeFirst();
      return row;
    } catch {
      return { error: 'تعذر حفظ الإعلان' };
    }
  }

  @RequirePermission('content.publish')
  @Patch('announcements/:id/toggle')
  async toggleAnnouncement(
    @Param('id') id: string,
  ): Promise<Selectable<ContentAnnouncementsTable> | undefined | AdminErrorResponse> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const existing = await this.db.db
        .selectFrom('content.announcements')
        .select(['is_active'])
        .where('id', '=', id)
        .executeTakeFirst();
      if (!existing) return { error: 'الإعلان غير موجود' };
      const updated = await this.db.db
        .updateTable('content.announcements')
        .set({ is_active: !existing.is_active, updated_at: new Date() })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
      return updated;
    } catch {
      return { error: 'تعذر تحديث حالة الإعلان' };
    }
  }

  @RequirePermission('content.publish')
  @Delete('announcements/:id')
  async deleteAnnouncement(
    @Param('id') id: string,
  ): Promise<AdminSuccessResponse | AdminErrorResponse> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      await this.db.db
        .deleteFrom('content.announcements')
        .where('id', '=', id)
        .execute();
      return { success: true };
    } catch {
      return { error: 'تعذر حذف الإعلان' };
    }
  }

  @RequirePermission('content.publish')
  @Get('faqs')
  async getFaqs(): Promise<Selectable<ContentFaqsTable>[]> {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.faqs')
        .selectAll()
        .orderBy('display_order', 'asc')
        .orderBy('created_at', 'desc')
        .limit(100)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Post('faqs')
  async createFaq(
    @Body() body: { question: string; answer: string; category?: string; displayOrder?: number },
  ): Promise<Selectable<ContentFaqsTable> | undefined | AdminErrorResponse> {
    if (!body?.question?.trim() || !body?.answer?.trim()) {
      return { error: 'السؤال والإجابة حقول مطلوبة' };
    }
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      return await this.db.db
        .insertInto('content.faqs')
        .values({
          id: crypto.randomUUID(),
          question: body.question.trim(),
          answer: body.answer.trim(),
          category_code: body.category?.trim() || 'general',
          display_order: body.displayOrder ?? 0,
          is_active: true,
        })
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر حفظ السؤال الشائع' };
    }
  }

  @RequirePermission('content.publish')
  @Patch('faqs/:id/toggle')
  async toggleFaq(
    @Param('id') id: string,
  ): Promise<Selectable<ContentFaqsTable> | undefined | AdminErrorResponse> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const existing = await this.db.db
        .selectFrom('content.faqs')
        .select(['is_active'])
        .where('id', '=', id)
        .executeTakeFirst();
      if (!existing) return { error: 'السؤال غير موجود' };
      return await this.db.db
        .updateTable('content.faqs')
        .set({ is_active: !existing.is_active, updated_at: new Date() })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر تحديث حالة السؤال' };
    }
  }

  @RequirePermission('content.publish')
  @Delete('faqs/:id')
  async deleteFaq(
    @Param('id') id: string,
  ): Promise<AdminSuccessResponse | AdminErrorResponse> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      await this.db.db
        .deleteFrom('content.faqs')
        .where('id', '=', id)
        .execute();
      return { success: true };
    } catch {
      return { error: 'تعذر حذف السؤال' };
    }
  }

  @RequirePermission('import.validate')
  @Get('imports')
  async getImportJobs(): Promise<Record<string, unknown>[]> {
    if (!this.db.isInitialized) return [];
    try {
      const result = await sql<Record<string, unknown>>`
        select
          j.*,
          (select count(*) from imports.import_rows r where r.import_job_id = j.id) as total_rows,
          (select count(*) from imports.import_rows r where r.import_job_id = j.id and r.validation_status = 'valid') as valid_rows,
          (select count(*) from imports.import_rows r where r.import_job_id = j.id and r.validation_status = 'rejected') as rejected_rows
        from imports.import_jobs j
        order by j.created_at desc
        limit 50
      `.execute(this.db.db);
      return result.rows;
    } catch {
      return [];
    }
  }

  // تعيد طلبات كل المكلفين بأسمائهم ⇒ صلاحية موظف لا صلاحية مكلف.
  @RequirePermission('request.review')
  @Get('requests')
  async getRequests(): Promise<AdminRequestRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      const rows: AdminRequestRow[] = await this.db.db
        .selectFrom('requests.service_requests')
        .leftJoin(
          'registry.taxpayers',
          'registry.taxpayers.id',
          'requests.service_requests.taxpayer_id',
        )
        .leftJoin(
          'requests.service_types',
          'requests.service_types.id',
          'requests.service_requests.service_type_id',
        )
        .select([
          'requests.service_requests.id as id',
          'requests.service_requests.public_ref as public_ref',
          'requests.service_requests.status_code as status_code',
          'requests.service_requests.submitted_at as submitted_at',
          'requests.service_requests.created_at as created_at',
          'registry.taxpayers.display_name as taxpayer_name',
          'registry.taxpayers.public_ref as taxpayer_ref',
          'requests.service_types.name as service_type_name',
        ])
        .where('requests.service_requests.archived_at', 'is', null)
        .orderBy('requests.service_requests.created_at', 'desc')
        .limit(50)
        .execute();
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * البلاغات الستة كما تصل من التطبيق.
   *
   * كانت اللوحة تقرأ `requests.service_requests` وحدها، فبلاغ المكلف يُحفظ
   * في `balaghat.balaghs` ولا يراه موظف قط رغم أن القسم اسمه «الطلبات
   * والبلاغات» — أي أن البلاغ يُقدَّم ويُنسى.
   */
  @RequirePermission('balagh.review')
  @Get('balaghs')
  async getBalaghs(): Promise<AdminBalaghRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await sql<AdminBalaghRow>`
        select b.id,
               b.public_ref,
               b.balagh_type_code,
               b.status_code,
               b.submitted_at,
               b.created_at,
               tp.display_name as taxpayer_name,
               tp.public_ref as taxpayer_ref
        from balaghat.balaghs b
        left join registry.taxpayers tp on tp.id = b.taxpayer_id
        where b.archived_at is null
          -- المسودة ملك صاحبها حتى يرسلها: عرضها للموظف كشفٌ لما لم يُقدَّم بعد.
          and b.status_code <> 'draft'
        order by b.created_at desc
        limit 50
      `.execute(this.db.db);
      return rows.rows;
    } catch {
      return [];
    }
  }

  @RequirePermission('field_visit.schedule')
  @Get('visits')
  async getVisits(): Promise<AdminVisitRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      const rows: AdminVisitRow[] = await this.db.db
        .selectFrom('visits.field_visits')
        .leftJoin(
          'requests.service_requests',
          'requests.service_requests.id',
          'visits.field_visits.service_request_id',
        )
        .leftJoin(
          'registry.taxpayers',
          'registry.taxpayers.id',
          'requests.service_requests.taxpayer_id',
        )
        .select([
          'visits.field_visits.id as id',
          'visits.field_visits.public_ref as public_ref',
          'visits.field_visits.status_code as status_code',
          'visits.field_visits.service_request_id as service_request_id',
          'visits.field_visits.notes as notes',
          'visits.field_visits.created_at as created_at',
          'registry.taxpayers.display_name as taxpayer_name',
        ])
        .where('visits.field_visits.archived_at', 'is', null)
        .orderBy('visits.field_visits.created_at', 'desc')
        .limit(50)
        .execute();
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * حالة المستحق تُشتق من المدفوعات (`POST /dues/:id/payments`) أو تُكتب
   * بالإلغاء المُعلَّل (`POST /dues/:id/cancel`)؛ لا قاعدة تسمح بتعيينها
   * يدوياً، فتُرفض هنا بدل أن تُكتب بلا سند في الدفتر.
   */
  @RequirePermission('payment.confirm')
  @Patch('dues/:id/status')
  async updateDueStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { status?: string },
  ): Promise<never> {
    if (!this.db.isInitialized) {
      throw DomainException.unavailable('قاعدة البيانات غير متاحة');
    }
    const status = (body.status ?? '').trim();
    if (!(Object.values(DUE_STATUSES) as string[]).includes(status)) {
      throw DomainException.badRequest('حالة المستحق غير معروفة');
    }
    const due = await this.db.db
      .selectFrom('dues.payment_dues')
      .select(['status_code'])
      .where('id', '=', id)
      .executeTakeFirst();
    if (!due) throw DomainException.notFound('المستحق غير موجود');
    throw DomainException.conflict(
      'لا تُعدَّل حالة المستحق يدوياً: تُشتق من تسجيل السداد، أو تُلغى بسبب مكتوب',
    );
  }

  /**
   * تغيير حالة طلب: الحالات المعتمدة وانتقالاتها فقط (نفس جدول WorkflowService)،
   * والتغيير وسطر السجل في معاملة واحدة. الأخطاء تُرفع ولا تُبتلع.
   */
  @RequirePermission('request.review')
  @Patch('requests/:id/status')
  async updateRequestStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { status?: string; notes?: string },
    @Req() request: AuthenticatedRequest,
  ): Promise<Selectable<ServiceRequestsTable>> {
    if (!this.db.isInitialized) {
      throw DomainException.unavailable('قاعدة البيانات غير متاحة');
    }
    const target = (body.status ?? '').trim();
    const knownStates = new Set(Object.values(ALLOWED_TRANSITIONS).flat());
    if (!knownStates.has(target)) {
      throw DomainException.badRequest('حالة الطلب غير معروفة');
    }
    const actorId = request[VERIFIED_ACTOR]?.actorId ?? null;
    return this.db.db.transaction().execute(async (trx) => {
      const current = await trx
        .selectFrom('requests.service_requests')
        .select(['status_code'])
        .where('id', '=', id)
        .forUpdate()
        .executeTakeFirst();
      if (!current) throw DomainException.notFound('الطلب غير موجود');
      const from = String(current.status_code);
      if (!ALLOWED_TRANSITIONS[from]?.includes(target)) {
        throw DomainException.conflict(
          `لا يمكن الانتقال من «${from}» إلى «${target}»`,
        );
      }
      const now = new Date();
      const updated = await trx
        .updateTable('requests.service_requests')
        .set({ status_code: target, updated_at: now })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();
      await trx
        .insertInto('requests.request_status_histories')
        .values({
          id: randomUUID(),
          service_request_id: id,
          changed_at: now,
          changed_by_profile_id: actorId,
          from_status_code: from,
          to_status_code: target,
          reason: body.notes?.trim() || null,
        })
        .execute();
      return updated;
    });
  }
}
