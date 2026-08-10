import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { RequirePermission } from '../authz/authorization.decorators.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import { DatabaseService } from '../database/database.service.js';

interface CompleteProfileBody {
  firstName?: string;
  secondName?: string;
  thirdName?: string;
  lastName?: string;
  displayName?: string;
  tradeName?: string;
  legalEntityId?: string;
  activityType?: string;
  address?: string;
  taxNumber?: string;
}

/**
 * ملف المكلف الخاص بالمستخدم الحالي — يغطي FR-001 خطوتَي 6 و7:
 * حفظ بيانات التسجيل الكاملة وربطها بحساب المستخدم.
 *
 * كل النقاط هنا تعمل على «أنا» فقط: لا تقبل معرّف مكلف من العميل إطلاقاً،
 * فلا يمكن لمكلف قراءة أو تعديل ملف غيره من هذا المسار.
 */
@Controller('api/v1/taxpayers/me')
export class TaxpayerProfileController {
  constructor(private readonly db: DatabaseService) {}

  private actorId(request: AuthenticatedRequest): string {
    const actor = request[VERIFIED_ACTOR];
    if (!actor) throw new BadRequestException('Missing actor context.');
    return actor.actorId;
  }

  private required(value: string | undefined, field: string): string {
    const trimmed = (value ?? '').trim();
    if (trimmed.length === 0) {
      throw new BadRequestException(`الحقل «${field}» مطلوب`);
    }
    if (trimmed.length > 200) {
      throw new BadRequestException(`الحقل «${field}» أطول من المسموح`);
    }
    return trimmed;
  }

  /** ملف المكلف المرتبط بالمستخدم الحالي، أو null إن لم يُكمل بياناته بعد. */
  @RequirePermission('taxpayer.profile.read')
  @Get()
  async myProfile(@Req() request: AuthenticatedRequest) {
    if (!this.db.isInitialized) {
      throw new ServiceUnavailableException('قاعدة البيانات غير متاحة');
    }
    const userProfileId = this.actorId(request);

    const rows = await sql<{
      taxpayer_id: string;
      public_ref: string | null;
      display_name: string | null;
      status_code: string | null;
      trade_name: string | null;
      legal_entity_name: string | null;
      activity_type: string | null;
      address_line: string | null;
    }>`
      select tp.id as taxpayer_id,
             tp.public_ref,
             tp.display_name,
             tp.status_code,
             ca.name as trade_name,
             le.legal_name as legal_entity_name,
             ca.activity_type,
             aa.address_line
      from registry.taxpayer_account_links tal
      join registry.taxpayers tp on tp.id = tal.taxpayer_id
      left join masterdata.commercial_activities ca
        on ca.taxpayer_id = tp.id and ca.archived_at is null
      left join registry.taxpayer_legal_entity_associations tlea
        on tlea.taxpayer_id = tp.id
      left join legal.legal_entities le on le.id = tlea.legal_entity_id
      left join masterdata.activity_addresses aa on aa.commercial_activity_id = ca.id
      where tal.user_profile_id = ${userProfileId}
        and tal.active_state_code = 'active'
      order by tp.created_at desc
      limit 1
    `.execute(this.db.db);

    const row = rows.rows[0];
    if (!row) return null;

    return {
      taxpayerId: row.taxpayer_id,
      taxNumber: row.public_ref,
      displayName: row.display_name,
      statusCode: row.status_code,
      tradeName: row.trade_name,
      legalEntityName: row.legal_entity_name,
      activityType: row.activity_type,
      address: row.address_line,
    };
  }

  /**
   * FR-001 خطوتا 6 و7: حفظ بيانات التسجيل الكاملة.
   *
   * إن أدخل المستخدم رقماً ضريبياً موجوداً في القاعدة، يُربط بذلك المكلف بدل
   * إنشاء سجل مكرر — وهو ما يقتضيه نصّ FR-001 من «التحقق من رقمه الضريبي
   * في قاعدة البيانات وتحميل بياناته». وإلا يُنشأ سجل جديد بحالة `under_review`
   * لأن المكتب هو من يعتمد المكلف، لا التطبيق.
   */
  @RequirePermission('taxpayer.profile.update')
  @Post()
  async completeProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: CompleteProfileBody,
  ) {
    if (!this.db.isInitialized) {
      throw new ServiceUnavailableException('قاعدة البيانات غير متاحة');
    }
    const userProfileId = this.actorId(request);

    const firstName = this.required(body?.firstName, 'الاسم الأول');
    const secondName = this.required(body?.secondName, 'الاسم الثاني');
    const thirdName = this.required(body?.thirdName, 'الاسم الثالث');
    const lastName = this.required(body?.lastName, 'الاسم الرابع');
    const tradeName = this.required(body?.tradeName, 'الاسم التجاري');
    const legalEntityId = this.required(body?.legalEntityId, 'الكيان القانوني');
    const activityType = this.required(body?.activityType, 'نوع النشاط');
    const address = this.required(body?.address, 'العنوان');
    const taxNumber = (body?.taxNumber ?? '').trim() || null;
    const displayName =
      (body?.displayName ?? '').trim() ||
      [firstName, secondName, thirdName, lastName].join(' ');

    const existingLink = await sql<{ id: string }>`
      select id from registry.taxpayer_account_links
      where user_profile_id = ${userProfileId} and active_state_code = 'active'
      limit 1
    `.execute(this.db.db);
    if (existingLink.rows.length > 0) {
      throw new ConflictException('تم إكمال بيانات هذا الحساب مسبقاً');
    }

    const legalEntity = await sql<{ id: string }>`
      select id from legal.legal_entities
      where id = ${legalEntityId}::uuid and is_active and archived_at is null
      limit 1
    `.execute(this.db.db);
    if (legalEntity.rows.length === 0) {
      throw new BadRequestException('الكيان القانوني غير معروف');
    }

    return this.db.db.transaction().execute(async (trx) => {
      // 1. مكلف قائم بنفس الرقم الضريبي ⇒ ربط لا إنشاء.
      let taxpayerId: string | null = null;
      let linkedToExisting = false;

      if (taxNumber !== null) {
        const found = await sql<{ id: string }>`
          select id from registry.taxpayers
          where public_ref = ${taxNumber} and archived_at is null
          limit 1
        `.execute(trx);
        if (found.rows[0]) {
          taxpayerId = found.rows[0].id;
          linkedToExisting = true;
        }
      }

      if (taxpayerId === null) {
        taxpayerId = randomUUID();
        await sql`
          insert into registry.taxpayers
            (id, public_ref, display_name, status_code, created_at, created_by_profile_id)
          values (${taxpayerId}::uuid, ${taxNumber}, ${displayName},
                  'under_review', now(), ${userProfileId}::uuid)
        `.execute(trx);
      }

      // 2. ربط الحساب بالمكلف.
      await sql`
        insert into registry.taxpayer_account_links
          (id, user_profile_id, taxpayer_id, relationship_type_code,
           active_state_code, verification_status_code, effective_from,
           created_at, created_by_profile_id)
        values (${randomUUID()}::uuid, ${userProfileId}::uuid, ${taxpayerId}::uuid,
                'owner', 'active', ${linkedToExisting ? 'pending' : 'pending'},
                now(), now(), ${userProfileId}::uuid)
      `.execute(trx);

      // 3. الكيان القانوني.
      await sql`
        insert into registry.taxpayer_legal_entity_associations
          (id, taxpayer_id, legal_entity_id, association_type_code,
           effective_from, created_at, created_by_profile_id)
        values (${randomUUID()}::uuid, ${taxpayerId}::uuid, ${legalEntityId}::uuid,
                'primary', now(), now(), ${userProfileId}::uuid)
      `.execute(trx);

      // 4. النشاط التجاري: الاسم التجاري هو اسم النشاط، ونوعه في عموده الخاص.
      //    `public_ref` مرجع **فريد** فلا يصلح لنوع النشاط: مكلفان بالنوع نفسه
      //    كانا يتصادمان على قيد التفرّد.
      const activityId = randomUUID();
      await sql`
        insert into masterdata.commercial_activities
          (id, public_ref, taxpayer_id, name, activity_type, status_code,
           created_at, created_by_profile_id)
        values (${activityId}::uuid, ${activityPublicRef(activityId)},
                ${taxpayerId}::uuid, ${tradeName}, ${activityType}, 'pending',
                now(), ${userProfileId}::uuid)
      `.execute(trx);

      // 5. العنوان.
      await sql`
        insert into masterdata.activity_addresses
          (id, commercial_activity_id, address_line, effective_from,
           created_at, created_by_profile_id)
        values (${randomUUID()}::uuid, ${activityId}::uuid, ${address},
                now(), now(), ${userProfileId}::uuid)
      `.execute(trx);

      // 6. جهات الاتصال: الرقم الضريبي إن وُجد.
      if (taxNumber !== null && !linkedToExisting) {
        await sql`
          insert into registry.taxpayer_contacts
            (id, taxpayer_id, contact_type_code, contact_value, is_primary,
             is_active, effective_from, created_at, created_by_profile_id)
          values (${randomUUID()}::uuid, ${taxpayerId}::uuid, 'tax_number',
                  ${taxNumber}, true, true, now(), now(), ${userProfileId}::uuid)
        `.execute(trx);
      }

      return {
        taxpayerId,
        linkedToExisting,
        statusCode: linkedToExisting ? 'linked' : 'under_review',
      };
    });
  }
}

/** مرجع علني فريد للنشاط التجاري. */
function activityPublicRef(activityId: string): string {
  return `ACT-${activityId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}
