import { Controller, Get, Param, Patch, Post, Delete, Body, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'kysely';
import {
  AuthenticatedEndpoint,
  RequirePermission,
} from '../authz/authorization.decorators.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import { DatabaseService } from '../database/database.service.js';

@Controller('api/v1/admin')
export class AdminController {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  /** أدوار المستخدم النشطة — استعلام مُعامَل (لا تركيب نصي). */
  private async activeRolesOf(
    userProfileId: string,
  ): Promise<{ code: string; name_ar: string | null }[]> {
    const result = await sql<{ code: string; name_ar: string | null }>`
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
  async getRequestDetails(@Param('id') id: string) {
    if (!this.db.isInitialized) return null;
    try {
      const request = await (this.db.db
        .selectFrom('requests.service_requests' as any) as any)
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

      const history = await this.db.db
        .selectFrom('requests.request_status_histories' as any)
        .selectAll()
        .where('service_request_id' as any, '=', id)
        .orderBy('changed_at' as any, 'desc')
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
  async getServices() {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('requests.service_types' as any)
        .selectAll()
        .orderBy('created_at' as any, 'asc')
        .limit(100)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('masterdata.manage')
  @Patch('services/:id/toggle')
  async toggleService(@Param('id') id: string) {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const current = await this.db.db
        .selectFrom('requests.service_types' as any)
        .select(['is_active'] as any)
        .where('id' as any, '=', id)
        .executeTakeFirst();
      if (!current) return { error: 'الخدمة غير موجودة' };
      return await this.db.db
        .updateTable('requests.service_types' as any)
        .set({ is_active: !(current as any).is_active, updated_at: new Date() } as any)
        .where('id' as any, '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر تحديث الخدمة' };
    }
  }

  @RequirePermission('taxpayer.profile.read')
  @Get('legal-entities')
  async getLegalEntities() {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('legal.legal_entities' as any)
        .selectAll()
        .where('archived_at' as any, 'is', null)
        .orderBy('created_at' as any, 'asc')
        .limit(100)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('taxpayer.profile.update')
  @Post('legal-entities')
  async createLegalEntity(@Body() body: { legal_name: string; classification_code?: string }) {
    if (!body?.legal_name?.trim()) return { error: 'اسم الكيان مطلوب' };
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      return await this.db.db
        .insertInto('legal.legal_entities' as any)
        .values({
          id: crypto.randomUUID(),
          legal_name: body.legal_name.trim(),
          classification_code: body.classification_code ?? 'other',
          is_active: true,
        } as any)
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
  ) {
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
      const authData: any = await authRes.json();
      if (!authRes.ok || !authData?.id) {
        return { error: authData?.msg || authData?.message || 'تعذر إنشاء حساب المصادقة — تحقق من تفعيل مزود الهاتف' };
      }

      // 2. ملف المستخدم
      const userProfileId = crypto.randomUUID();
      await this.db.db
        .insertInto('identity.user_profiles' as any)
        .values({ id: userProfileId, auth_user_id: authData.id, display_name: body.displayName.trim(), is_active: true } as any)
        .execute();

      // 3. الملف الوظيفي
      const staffProfileId = crypto.randomUUID();
      await this.db.db
        .insertInto('identity.staff_profiles' as any)
        .values({
          id: staffProfileId,
          user_profile_id: userProfileId,
          staff_code: `EMP-${Date.now().toString().slice(-6)}`,
          title: body.title?.trim() ?? 'موظف',
          is_active: true,
          effective_from: new Date(),
        } as any)
        .execute();

      // 4. إسناد الدور إن وُجد
      if (body.roleCode) {
        const role = await this.db.db
          .selectFrom('identity.roles' as any)
          .select(['id'] as any)
          .where('code' as any, '=', body.roleCode)
          .executeTakeFirst();
        if (role) {
          await this.db.db
            .insertInto('identity.staff_role_assignments' as any)
            .values({
              id: crypto.randomUUID(),
              staff_profile_id: staffProfileId,
              role_id: (role as any).id,
              effective_from: new Date(),
              assigned_at: new Date(),
            } as any)
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
  async getCurrentUser(@Req() request: AuthenticatedRequest) {
    const actor = request[VERIFIED_ACTOR];
    if (!actor) return null;
    const empty = {
      userProfileId: actor.actorId,
      displayName: null as string | null,
      staffCode: null as string | null,
      title: null as string | null,
      roles: [] as { code: string; nameAr: string | null }[],
      permissions: actor.permissions,
    };
    if (!this.db.isInitialized) return empty;
    try {
      const profile = await (this.db.db
        .selectFrom('identity.user_profiles' as any) as any)
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
  async getRoles() {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('identity.roles' as any)
        .select(['id', 'code', 'name_ar'] as any)
        .where('is_active' as any, '=', true)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Get('content-pages')
  async getContentPages() {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.content_pages' as any)
        .selectAll()
        .orderBy('created_at' as any, 'asc')
        .limit(50)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Post('content-pages')
  async saveContentPage(@Body() body: { key: string; title: string; body: string }) {
    if (!body?.key?.trim() || !body?.title?.trim()) return { error: 'المفتاح والعنوان مطلوبان' };
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const existing = await this.db.db
        .selectFrom('content.content_pages' as any)
        .select(['id'] as any)
        .where('key' as any, '=', body.key.trim())
        .executeTakeFirst();
      if (existing) {
        return await this.db.db
          .updateTable('content.content_pages' as any)
          .set({ title: body.title.trim(), body: body.body ?? '', status: 'published', updated_at: new Date() } as any)
          .where('id' as any, '=', (existing as any).id)
          .returningAll()
          .executeTakeFirst();
      }
      return await this.db.db
        .insertInto('content.content_pages' as any)
        .values({
          id: crypto.randomUUID(),
          key: body.key.trim(),
          title: body.title.trim(),
          body: body.body ?? '',
          status: 'published',
          published_at: new Date(),
        } as any)
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر حفظ الصفحة' };
    }
  }

  @RequirePermission('content.publish')
  @Get('contact-messages')
  async getContactMessages() {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.contact_messages' as any)
        .selectAll()
        .orderBy('created_at' as any, 'desc')
        .limit(200)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Patch('contact-messages/:id/read')
  async markContactMessageRead(@Param('id') id: string) {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      return await this.db.db
        .updateTable('content.contact_messages' as any)
        .set({ status: 'read', read_at: new Date() } as any)
        .where('id' as any, '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر تحديث حالة الرسالة' };
    }
  }

  @RequirePermission('user.read')
  @Get('users')
  async getUsers() {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await (this.db.db
        .selectFrom('identity.staff_profiles' as any) as any)
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
  async getDecisions() {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await (this.db.db
        .selectFrom('requests.request_decision_records' as any) as any)
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
  async getAnnouncements() {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await this.db.db
        .selectFrom('content.announcements' as any)
        .selectAll()
        .orderBy('created_at' as any, 'desc')
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
  ) {
    if (!body?.title || !body?.body) {
      return { error: 'العنوان والنص مطلوبان' };
    }
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const row = await this.db.db
        .insertInto('content.announcements' as any)
        .values({
          id: crypto.randomUUID(),
          title: body.title,
          body: body.body,
          priority: body.priority ?? 0,
          is_active: true,
          published_at: new Date(),
        } as any)
        .returningAll()
        .executeTakeFirst();
      return row;
    } catch {
      return { error: 'تعذر حفظ الإعلان' };
    }
  }

  @RequirePermission('content.publish')
  @Patch('announcements/:id/toggle')
  async toggleAnnouncement(@Param('id') id: string) {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const existing = (await this.db.db
        .selectFrom('content.announcements' as any)
        .select(['is_active'] as any)
        .where('id' as any, '=', id)
        .executeTakeFirst()) as any;
      if (!existing) return { error: 'الإعلان غير موجود' };
      const updated = await this.db.db
        .updateTable('content.announcements' as any)
        .set({ is_active: !existing.is_active, updated_at: new Date() } as any)
        .where('id' as any, '=', id)
        .returningAll()
        .executeTakeFirst();
      return updated;
    } catch {
      return { error: 'تعذر تحديث حالة الإعلان' };
    }
  }

  @RequirePermission('content.publish')
  @Delete('announcements/:id')
  async deleteAnnouncement(@Param('id') id: string) {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      await this.db.db
        .deleteFrom('content.announcements' as any)
        .where('id' as any, '=', id)
        .execute();
      return { success: true };
    } catch {
      return { error: 'تعذر حذف الإعلان' };
    }
  }

  @RequirePermission('content.publish')
  @Get('faqs')
  async getFaqs() {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.faqs' as any)
        .selectAll()
        .orderBy('display_order' as any, 'asc')
        .orderBy('created_at' as any, 'desc')
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
  ) {
    if (!body?.question?.trim() || !body?.answer?.trim()) {
      return { error: 'السؤال والإجابة حقول مطلوبة' };
    }
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      return await this.db.db
        .insertInto('content.faqs' as any)
        .values({
          id: crypto.randomUUID(),
          question: body.question.trim(),
          answer: body.answer.trim(),
          category_code: body.category?.trim() || 'general',
          display_order: body.displayOrder ?? 0,
          is_active: true,
        } as any)
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر حفظ السؤال الشائع' };
    }
  }

  @RequirePermission('content.publish')
  @Patch('faqs/:id/toggle')
  async toggleFaq(@Param('id') id: string) {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const existing = (await this.db.db
        .selectFrom('content.faqs' as any)
        .select(['is_active'] as any)
        .where('id' as any, '=', id)
        .executeTakeFirst()) as any;
      if (!existing) return { error: 'السؤال غير موجود' };
      return await this.db.db
        .updateTable('content.faqs' as any)
        .set({ is_active: !existing.is_active, updated_at: new Date() } as any)
        .where('id' as any, '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch {
      return { error: 'تعذر تحديث حالة السؤال' };
    }
  }

  @RequirePermission('content.publish')
  @Delete('faqs/:id')
  async deleteFaq(@Param('id') id: string) {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      await this.db.db
        .deleteFrom('content.faqs' as any)
        .where('id' as any, '=', id)
        .execute();
      return { success: true };
    } catch {
      return { error: 'تعذر حذف السؤال' };
    }
  }

  @RequirePermission('import.validate')
  @Get('imports')
  async getImportJobs() {
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
  async getRequests() {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await (this.db.db
        .selectFrom('requests.service_requests' as any) as any)
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
        .where('requests.service_requests.archived_at' as any, 'is', null)
        .orderBy('requests.service_requests.created_at' as any, 'desc')
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
  async getBalaghs() {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await sql<{
        id: string;
        public_ref: string | null;
        balagh_type_code: string;
        status_code: string;
        submitted_at: Date | null;
        created_at: Date;
        taxpayer_name: string | null;
        taxpayer_ref: string | null;
      }>`
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
  async getVisits() {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await (this.db.db
        .selectFrom('visits.field_visits' as any) as any)
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
        .where('visits.field_visits.archived_at' as any, 'is', null)
        .orderBy('visits.field_visits.created_at' as any, 'desc')
        .limit(50)
        .execute();
      return rows;
    } catch {
      return [];
    }
  }

  @RequirePermission('payment.confirm')
  @Patch('dues/:id/status')
  async updateDueStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    if (!this.db.isInitialized) return { id, ...body };
    try {
      const result = await this.db.db
        .updateTable('dues.payment_dues' as any)
        .set({ status_code: body.status, updated_at: new Date() } as any)
        .where('id' as any, '=', id)
        .returningAll()
        .executeTakeFirst();
      return result || { id, ...body };
    } catch {
      return { id, ...body };
    }
  }

  @RequirePermission('request.review')
  @Patch('requests/:id/status')
  async updateRequestStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    if (!this.db.isInitialized) return { id, ...body };
    try {
      const result = await this.db.db
        .updateTable('requests.service_requests' as any)
        .set({ status_code: body.status, updated_at: new Date() } as any)
        .where('id' as any, '=', id)
        .returningAll()
        .executeTakeFirst();
      return result || { id, ...body };
    } catch {
      return { id, ...body };
    }
  }
}
