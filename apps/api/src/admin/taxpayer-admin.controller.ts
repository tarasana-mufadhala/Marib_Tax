import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { RequirePermission } from '../authz/authorization.decorators.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import { AuthnService } from '../authn/authn.service.js';
import { DatabaseService } from '../database/database.service.js';
import { DomainException } from '../http/domain-exception.js';

/**
 * حالات ملف المكلف والانتقالات المسموحة بينها.
 *
 * قائمة صريحة لا انتقال حر: بدونها يستطيع الموظف إعادة مكلف موقوف إلى
 * «قيد المراجعة» أو اعتماد ملف مرفوض بلا مسار، فتفقد الحالة معناها.
 */
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  under_review: ['active', 'rejected'],
  active: ['suspended'],
  suspended: ['active'],
  rejected: ['under_review'],
};

const STATUS_LABELS: Record<string, string> = {
  under_review: 'قيد المراجعة',
  active: 'معتمد',
  suspended: 'موقوف',
  rejected: 'مرفوض',
};

/** الحالات التي يلزم معها تعليل مكتوب. */
const REASON_REQUIRED = new Set(['suspended', 'rejected']);

interface StatusChangeBody {
  toStatus?: string;
  reason?: string;
}

/** انتقال متاح على حالة، بصيغة تعرضها اللوحة أزراراً. */
export interface TaxpayerTransitionOption {
  code: string;
  label: string;
  reasonRequired: boolean;
}

export function transitionsFrom(
  statusCode: string,
): TaxpayerTransitionOption[] {
  return (ALLOWED_TRANSITIONS[statusCode] ?? []).map((code) => ({
    code,
    label: STATUS_LABELS[code] ?? code,
    reasonRequired: REASON_REQUIRED.has(code),
  }));
}

export function labelOf(statusCode: string): string {
  return STATUS_LABELS[statusCode] ?? statusCode;
}

/**
 * قواعد تغيير حالة ملف المكلف، مفصولة عن الاستعلامات لتُختبر وحدها.
 *
 * ترمي عند المخالفة ولا تعيد قيمة: القرار إما مسموح فيمضي، أو ممنوع
 * برسالة تشرح السبب للموظف.
 */
export function assertTransitionAllowed(
  fromStatus: string,
  toStatus: string,
  reason: string,
): void {
  if (!(toStatus in STATUS_LABELS)) {
    throw DomainException.badRequest('الحالة المطلوبة غير معروفة');
  }

  if (fromStatus === toStatus) {
    throw DomainException.conflict(
      `الملف بالفعل في حالة «${STATUS_LABELS[toStatus]}»`,
    );
  }

  const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus)) {
    throw DomainException.conflict(
      `لا يمكن الانتقال من «${STATUS_LABELS[fromStatus] ?? fromStatus}» ` +
        `إلى «${STATUS_LABELS[toStatus]}»`,
    );
  }

  // الإيقاف والرفض يمسّان حق المكلف في مزاولة نشاطه، فلا يُقبلان بلا سبب
  // مكتوب يُراجَع لاحقاً.
  if (REASON_REQUIRED.has(toStatus) && reason.length === 0) {
    throw DomainException.badRequest(
      `يجب كتابة سبب عند «${STATUS_LABELS[toStatus]}»`,
    );
  }
  if (reason.length > 1000) {
    throw DomainException.badRequest('السبب أطول من المسموح');
  }
}

/**
 * إدارة ملفات المكلفين: الاطلاع والاعتماد والإيقاف.
 *
 * الصلاحيتان `taxpayer.admin.read/status` جديدتان ومقصورتان على الموظفين.
 * `taxpayer.profile.read` لا تصلح هنا لأنها ممنوحة لكل مكلف ليقرأ ملفه هو،
 * فالاكتفاء بها كان يجعل سجل المكلفين كله — بأسمائهم وأرقامهم الضريبية
 * وهواتفهم — مقروءاً لأي صاحب حساب.
 */
@Controller('api/v1/admin/taxpayers')
export class TaxpayerAdminController {
  constructor(
    private readonly db: DatabaseService,
    private readonly authn: AuthnService,
  ) {}

  private actorId(request: AuthenticatedRequest): string {
    const actorId = request[VERIFIED_ACTOR]?.actorId;
    if (!actorId) throw DomainException.forbidden('تعذّر التحقق من هويتك');
    return actorId;
  }

  private ensureDatabase(): void {
    if (!this.db.isInitialized) {
      throw DomainException.unavailable('قاعدة البيانات غير متاحة');
    }
  }

  /** سجل المكلفين مع حالته وقنوات اتصاله الأساسية. */
  @Get()
  @RequirePermission('taxpayer.admin.read')
  async list(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    this.ensureDatabase();

    const statusFilter = (status ?? '').trim();
    const term = (search ?? '').trim();

    const result = await sql<{
      id: string;
      public_ref: string | null;
      display_name: string;
      status_code: string;
      created_at: Date;
      primary_phone: string | null;
      primary_email: string | null;
      activity_count: number;
      open_requests: number;
    }>`
      select tp.id,
             tp.public_ref,
             tp.display_name,
             tp.status_code,
             tp.created_at,
             (select tc.contact_value from registry.taxpayer_contacts tc
               where tc.taxpayer_id = tp.id and tc.contact_type_code = 'phone'
                 and tc.is_active
               order by tc.is_primary desc, tc.created_at
               limit 1) as primary_phone,
             (select tc.contact_value from registry.taxpayer_contacts tc
               where tc.taxpayer_id = tp.id and tc.contact_type_code = 'email'
                 and tc.is_active
               order by tc.is_primary desc, tc.created_at
               limit 1) as primary_email,
             (select count(*)::int from masterdata.commercial_activities ca
               where ca.taxpayer_id = tp.id and ca.archived_at is null)
               as activity_count,
             (select count(*)::int from requests.service_requests sr
               where sr.taxpayer_id = tp.id
                 and sr.archived_at is null
                 and sr.status_code not in
                     ('completed', 'rejected', 'archived', 'cancelled'))
               as open_requests
      from registry.taxpayers tp
      where tp.archived_at is null
        and (${statusFilter} = '' or tp.status_code = ${statusFilter})
        and (${term} = ''
             or tp.display_name ilike ${'%' + term + '%'}
             or coalesce(tp.public_ref, '') ilike ${'%' + term + '%'})
      order by
        -- ما ينتظر قراراً يتصدّر القائمة: هو ما على الموظف فعله اليوم.
        case when tp.status_code = 'under_review' then 0 else 1 end,
        tp.created_at desc
      limit 200
    `.execute(this.db.db);

    return result.rows.map((row) => ({
      id: row.id,
      taxNumber: row.public_ref,
      displayName: row.display_name,
      statusCode: row.status_code,
      statusLabel: STATUS_LABELS[row.status_code] ?? row.status_code,
      createdAt: row.created_at,
      phone: row.primary_phone,
      email: row.primary_email,
      activityCount: row.activity_count,
      openRequests: row.open_requests,
      allowedTransitions: transitionsFrom(row.status_code),
    }));
  }

  /** ملف مكلف واحد بتفاصيله وسجل قراراته. */
  @Get(':id')
  @RequirePermission('taxpayer.admin.read')
  async details(@Param('id', new ParseUUIDPipe()) id: string) {
    this.ensureDatabase();

    const taxpayer = await sql<{
      id: string;
      public_ref: string | null;
      display_name: string;
      status_code: string;
      created_at: Date;
      legal_entity_name: string | null;
    }>`
      select tp.id, tp.public_ref, tp.display_name, tp.status_code,
             tp.created_at, le.legal_name as legal_entity_name
      from registry.taxpayers tp
      left join registry.taxpayer_legal_entity_associations tlea
        on tlea.taxpayer_id = tp.id
      left join legal.legal_entities le on le.id = tlea.legal_entity_id
      where tp.id = ${id}::uuid and tp.archived_at is null
      limit 1
    `.execute(this.db.db);

    const row = taxpayer.rows[0];
    if (!row) throw DomainException.notFound('ملف المكلف غير موجود');

    const contacts = await sql<{
      contact_type_code: string;
      contact_value: string;
      is_primary: boolean;
    }>`
      select contact_type_code, contact_value, is_primary
      from registry.taxpayer_contacts
      where taxpayer_id = ${id}::uuid and is_active
      order by contact_type_code, is_primary desc
    `.execute(this.db.db);

    // النشاط وعنوانه معاً: المكتب يحتاج «أين هذا النشاط» بقدر ما يحتاج اسمه.
    const activities = await sql<{
      id: string;
      public_ref: string | null;
      name: string | null;
      activity_type: string | null;
      status_code: string | null;
      created_at: Date;
      address_line: string | null;
      city_code: string | null;
      district_code: string | null;
    }>`
      select ca.id,
             ca.public_ref,
             ca.name,
             ca.activity_type,
             ca.status_code,
             ca.created_at,
             aa.address_line,
             aa.city_code,
             aa.district_code
      from masterdata.commercial_activities ca
      left join masterdata.activity_addresses aa
        on aa.commercial_activity_id = ca.id and aa.effective_to is null
      where ca.taxpayer_id = ${id}::uuid and ca.archived_at is null
      order by ca.created_at
    `.execute(this.db.db);

    /**
     * الحسابات المرتبطة بهذا الملف.
     *
     * هاتف المكلف يعيش في خدمة الحسابات لا في السجل، ولذلك كان يظهر فارغاً.
     * يُقرأ هنا لكل حساب مرتبط — نداء أو اثنان لملف واحد، مقبولان في شاشة
     * تفاصيل ولا يصلحان لقائمة من مئتي سطر.
     */
    const links = await sql<{
      user_profile_id: string;
      display_name: string | null;
      auth_user_id: string;
      relationship_type_code: string;
      verification_status_code: string;
      linked_at: Date;
    }>`
      select tal.user_profile_id,
             up.display_name,
             up.auth_user_id,
             tal.relationship_type_code,
             tal.verification_status_code,
             tal.created_at as linked_at
      from registry.taxpayer_account_links tal
      join identity.user_profiles up on up.id = tal.user_profile_id
      where tal.taxpayer_id = ${id}::uuid
        and tal.active_state_code = 'active'
      order by tal.created_at
    `.execute(this.db.db);

    const accounts = await Promise.all(
      links.rows.map(async (link) => {
        const contact = await this.authn
          .accountContact(link.auth_user_id)
          .catch(() => ({ phone: null, email: null }));
        return {
          userProfileId: link.user_profile_id,
          displayName: link.display_name,
          phone: contact.phone,
          email: contact.email,
          relationship: link.relationship_type_code,
          verificationStatus: link.verification_status_code,
          linkedAt: link.linked_at,
        };
      }),
    );

    const history = await sql<{
      from_status_code: string | null;
      to_status_code: string;
      reason: string | null;
      changed_at: Date;
      officer_name: string | null;
    }>`
      select h.from_status_code, h.to_status_code, h.reason, h.changed_at,
             up.display_name as officer_name
      from registry.taxpayer_status_histories h
      left join identity.user_profiles up on up.id = h.changed_by_profile_id
      where h.taxpayer_id = ${id}::uuid
      order by h.changed_at desc
      limit 50
    `.execute(this.db.db);

    return {
      id: row.id,
      taxNumber: row.public_ref,
      displayName: row.display_name,
      statusCode: row.status_code,
      statusLabel: STATUS_LABELS[row.status_code] ?? row.status_code,
      legalEntityName: row.legal_entity_name,
      createdAt: row.created_at,
      accounts,
      contacts: contacts.rows.map((contact) => ({
        type: contact.contact_type_code,
        value: contact.contact_value,
        isPrimary: contact.is_primary,
      })),
      activities: activities.rows.map((activity) => ({
        id: activity.id,
        publicRef: activity.public_ref,
        name: activity.name,
        activityType: activity.activity_type,
        statusCode: activity.status_code,
        createdAt: activity.created_at,
        address: activity.address_line,
        cityCode: activity.city_code,
        districtCode: activity.district_code,
      })),
      allowedTransitions: transitionsFrom(row.status_code),
      history: history.rows.map((entry) => ({
        fromStatus: entry.from_status_code,
        toStatus: entry.to_status_code,
        fromLabel: entry.from_status_code
          ? (STATUS_LABELS[entry.from_status_code] ?? entry.from_status_code)
          : null,
        toLabel: STATUS_LABELS[entry.to_status_code] ?? entry.to_status_code,
        reason: entry.reason,
        changedAt: entry.changed_at,
        officerName: entry.officer_name,
      })),
    };
  }

  /**
   * اعتماد المكلف أو إيقافه أو رفضه.
   *
   * الحالة والسجل يُكتبان في معاملة واحدة: حالة تتغيّر بلا سطر في السجل
   * تعني قراراً بلا صاحب، وسطر بلا تغيّر حالة يعني سجلاً يكذب.
   */
  @Post(':id/status')
  @HttpCode(200)
  @RequirePermission('taxpayer.admin.status')
  async changeStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: StatusChangeBody,
  ) {
    this.ensureDatabase();
    const actorId = this.actorId(request);

    const toStatus = (body?.toStatus ?? '').trim();
    const reason = (body?.reason ?? '').trim();

    // فحص مبكر لا يستحق استعلاماً: حالة غير معروفة تُرفض قبل لمس القاعدة.
    if (!(toStatus in STATUS_LABELS)) {
      throw DomainException.badRequest('الحالة المطلوبة غير معروفة');
    }

    const current = await sql<{ status_code: string }>`
      select status_code from registry.taxpayers
      where id = ${id}::uuid and archived_at is null
      limit 1
    `.execute(this.db.db);

    const fromStatus = current.rows[0]?.status_code;
    if (!fromStatus) throw DomainException.notFound('ملف المكلف غير موجود');

    assertTransitionAllowed(fromStatus, toStatus, reason);

    await this.db.db.transaction().execute(async (trx) => {
      await sql`
        update registry.taxpayers
        set status_code = ${toStatus},
            updated_at = now(),
            updated_by_profile_id = ${actorId}::uuid
        where id = ${id}::uuid
      `.execute(trx);

      await sql`
        insert into registry.taxpayer_status_histories
          (id, taxpayer_id, from_status_code, to_status_code, reason,
           changed_at, changed_by_profile_id, created_at)
        values (${randomUUID()}::uuid, ${id}::uuid, ${fromStatus},
                ${toStatus}, ${reason.length > 0 ? reason : null},
                now(), ${actorId}::uuid, now())
      `.execute(trx);
    });

    return {
      id,
      fromStatus,
      toStatus,
      statusLabel: STATUS_LABELS[toStatus],
    };
  }
}
