import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { sql } from 'kysely';
import { AuthenticatedEndpoint } from '../authz/authorization.decorators.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from './bearer-actor-context.resolver.js';
import { AuthnService } from './authn.service.js';
import { UsersService } from '../users/users.service.js';
import { DatabaseService } from '../database/database.service.js';
import { DomainException } from '../http/domain-exception.js';

interface ChangePasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

interface AddEmailBody {
  email?: string;
  currentPassword?: string;
}

interface PhoneChangeBody {
  newPhoneNumber?: string;
  currentPassword?: string;
  code?: string;
}

/**
 * شاشة «حسابي» في التطبيق.
 *
 * منفصل عن `AuthnController` لأن ذاك مُعلَّم `@PublicEndpoint()` على مستوى
 * الصنف، والحارس يقرأ العلامة من المعالج ثم الصنف — فوضع نقطة تتطلب جلسة
 * داخله كان يجعلها عامة بلا قصد.
 */
@Controller('api/v1/account')
@AuthenticatedEndpoint()
export class AccountController {
  constructor(
    private readonly authn: AuthnService,
    private readonly users: UsersService,
    private readonly db: DatabaseService,
  ) {}

  private actorId(request: AuthenticatedRequest): string {
    const actorId = request[VERIFIED_ACTOR]?.actorId;
    if (!actorId) throw DomainException.forbidden('تعذّر التحقق من هويتك');
    return actorId;
  }

  /** بيانات صاحب الحساب: هاتفه واسمه ونشاطه التجاري. */
  @Get('me')
  async me(@Req() request: AuthenticatedRequest) {
    const userProfileId = this.actorId(request);
    const profile = await this.users.findUserById(userProfileId);
    const contact = await this.authn.accountContact(profile.authUserId);

    if (!this.db.isInitialized) {
      return {
        displayName: profile.displayName,
        phone: contact.phone,
        email: contact.email,
        taxpayer: null,
        activities: [],
      };
    }

    const taxpayer = await sql<{
      taxpayer_id: string;
      public_ref: string | null;
      display_name: string | null;
      status_code: string | null;
      legal_entity_name: string | null;
    }>`
      select tp.id as taxpayer_id,
             tp.public_ref,
             tp.display_name,
             tp.status_code,
             le.legal_name as legal_entity_name
      from registry.taxpayer_account_links tal
      join registry.taxpayers tp on tp.id = tal.taxpayer_id
      left join registry.taxpayer_legal_entity_associations tlea
        on tlea.taxpayer_id = tp.id
      left join legal.legal_entities le on le.id = tlea.legal_entity_id
      where tal.user_profile_id = ${userProfileId}::uuid
        and tal.active_state_code = 'active'
      order by tp.created_at desc
      limit 1
    `.execute(this.db.db);

    const row = taxpayer.rows[0];
    if (!row) {
      return {
        displayName: profile.displayName,
        phone: contact.phone,
        email: contact.email,
        taxpayer: null,
        activities: [],
      };
    }

    // كل الأنشطة لا الأول فحسب: من له فرعان يرى الاثنين.
    const activities = await sql<{
      id: string;
      name: string | null;
      activity_type: string | null;
      status_code: string | null;
      address_line: string | null;
    }>`
      select ca.id,
             ca.name,
             ca.activity_type,
             ca.status_code,
             aa.address_line
      from masterdata.commercial_activities ca
      left join masterdata.activity_addresses aa
        on aa.commercial_activity_id = ca.id and aa.effective_to is null
      where ca.taxpayer_id = ${row.taxpayer_id}::uuid
        and ca.archived_at is null
      order by ca.created_at
    `.execute(this.db.db);

    return {
      displayName: profile.displayName,
      phone: contact.phone,
      email: contact.email,
      taxpayer: {
        taxpayerId: row.taxpayer_id,
        taxNumber: row.public_ref,
        displayName: row.display_name,
        statusCode: row.status_code,
        legalEntityName: row.legal_entity_name,
      },
      activities: activities.rows.map((activity) => ({
        id: activity.id,
        name: activity.name,
        activityType: activity.activity_type,
        statusCode: activity.status_code,
        address: activity.address_line,
      })),
    };
  }

  @Post('password')
  @HttpCode(200)
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: ChangePasswordBody,
  ) {
    const current = (body?.currentPassword ?? '').trim();
    const next = (body?.newPassword ?? '').trim();
    if (current.length === 0 || next.length === 0) {
      throw DomainException.badRequest('كلمتا المرور الحالية والجديدة مطلوبتان');
    }
    return this.authn.changePassword(this.actorId(request), current, next);
  }

  /**
   * إضافة بريد إلى حساب مسجَّل بالهاتف — القناتان معاً لا إحداهما.
   *
   * البريد لا يحلّ محل الرقم: بعد التأكيد يستطيع المكلف الدخول برقمه
   * وكلمة مروره كما كان، أو برمز يصل بريده.
   */
  @Post('email')
  @HttpCode(200)
  async addEmail(
    @Req() request: AuthenticatedRequest,
    @Body() body: AddEmailBody,
  ) {
    const email = (body?.email ?? '').trim();
    const password = (body?.currentPassword ?? '').trim();
    if (email.length === 0 || password.length === 0) {
      throw DomainException.badRequest('البريد وكلمة المرور مطلوبان');
    }
    return this.authn.addAccountEmail(this.actorId(request), email, password);
  }

  /** الخطوة الأولى لتغيير الرقم: كلمة المرور ثم رمز يصل الرقم الجديد. */
  @Post('phone/change/request')
  @HttpCode(200)
  async requestPhoneChange(
    @Req() request: AuthenticatedRequest,
    @Body() body: PhoneChangeBody,
  ) {
    const phone = (body?.newPhoneNumber ?? '').trim();
    const password = (body?.currentPassword ?? '').trim();
    if (phone.length === 0 || password.length === 0) {
      throw DomainException.badRequest('الرقم الجديد وكلمة المرور مطلوبان');
    }
    return this.authn.requestPhoneChange(
      this.actorId(request),
      phone,
      password,
    );
  }

  @Post('phone/change/confirm')
  @HttpCode(200)
  async confirmPhoneChange(
    @Req() request: AuthenticatedRequest,
    @Body() body: PhoneChangeBody,
  ) {
    const phone = (body?.newPhoneNumber ?? '').trim();
    const code = (body?.code ?? '').trim();
    if (phone.length === 0 || code.length === 0) {
      throw DomainException.badRequest('الرقم الجديد ورمز التحقق مطلوبان');
    }
    return this.authn.confirmPhoneChange(this.actorId(request), phone, code);
  }
}
