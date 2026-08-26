import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  Inject,
  Req,
  UnprocessableEntityException,
} from '@nestjs/common';
import { sql } from 'kysely';
import {
  assessDueSchema,
  correctDueSchema,
  uploadReceiptSchema,
  confirmPaymentSchema,
} from '@marib-tax/contracts';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { DuesPaymentsService } from './dues-payments.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import { DatabaseService } from '../database/database.service.js';
import { DomainException } from '../http/domain-exception.js';
import {
  type StoredPaymentDue,
  type StoredPaymentReceipt,
  type StoredPaymentConfirmation,
} from './dues-payments.repository.js';

@Controller('api/v1/dues')
export class DuesPaymentsController {
  constructor(
    private readonly service: DuesPaymentsService,
    private readonly db: DatabaseService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  /** موظف المكتب يرى مستحقات الجميع؛ المكلف لا يرى إلا مستحقاته. */
  private isStaff(request: AuthenticatedRequest): boolean {
    const permissions = (request[VERIFIED_ACTOR]?.permissions ??
      []) as readonly string[];
    return (
      permissions.includes('due.register') ||
      permissions.includes('payment.confirm') ||
      permissions.includes('request.review')
    );
  }

  private actorId(request: AuthenticatedRequest): string {
    const actorId = request[VERIFIED_ACTOR]?.actorId;
    if (!actorId) throw DomainException.forbidden('تعذّر التحقق من هويتك');
    return actorId;
  }

  /**
   * مستحقات المكلف الحالي ومدفوعاته.
   *
   * الربط بالمكلف مباشر عبر `taxpayer_id`، فيظهر للمكلف ما قيّده المكتب
   * عليه ابتداءً كما يظهر ما نشأ عن طلباته.
   * لا بد أن تسبق هذه النقطة `@Get(':id')` وإلا التقط المسارُ المُعامَل
   * كلمة `me` وعاملها معرّفاً.
   */
  @Get('me')
  @HttpCode(200)
  @RequirePermission('request.read')
  async myDues(@Req() request: AuthenticatedRequest) {
    if (!this.db.isInitialized) return [];
    const userProfileId = this.actorId(request);

    const result = await sql<{
      id: string;
      public_ref: string | null;
      amount: string;
      currency_code: string;
      status_code: string;
      assessed_at: Date | null;
      created_at: Date;
      request_ref: string | null;
      service_name: string | null;
    }>`
      select d.id,
             d.public_ref,
             d.amount,
             d.currency_code,
             d.status_code,
             d.assessed_at,
             d.created_at,
             sr.public_ref as request_ref,
             st.name as service_name
      from dues.payment_dues d
      left join requests.service_requests sr on sr.id = d.service_request_id
      left join requests.service_types st on st.id = sr.service_type_id
      join registry.taxpayer_account_links tal on tal.taxpayer_id = d.taxpayer_id
      where tal.user_profile_id = ${userProfileId}::uuid
        and tal.active_state_code = 'active'
        and d.archived_at is null
      order by d.created_at desc
      limit 100
    `.execute(this.db.db);

    return result.rows.map((row) => ({
      id: row.id,
      publicRef: row.public_ref,
      amount: Number(row.amount),
      currencyCode: row.currency_code,
      statusCode: row.status_code,
      assessedAt: row.assessed_at,
      createdAt: row.created_at,
      requestRef: row.request_ref,
      serviceName: row.service_name,
    }));
  }

  @Post()
  @HttpCode(201)
  @RequirePermission('due.register')
  assess(
    @Body()
    body: unknown,
  ): Promise<StoredPaymentDue> {
    const parsed = assessDueSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException();
    }
    const actorId = this.actors.requireActorId();
    return this.service.assessDue(
      {
        taxpayerId: parsed.data.taxpayerId,
        serviceRequestId: parsed.data.serviceRequestId,
        balaghId: parsed.data.balaghId,
        amount: parsed.data.amount,
        currencyCode: parsed.data.currencyCode,
        basisTypeCode: parsed.data.basisTypeCode,
        documentReference: parsed.data.documentReference ?? null,
        attachmentId: parsed.data.attachmentId,
      },
      actorId,
    );
  }

  @Post(':id/corrections')
  @HttpCode(201)
  @RequirePermission('due.correct')
  correct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    body: unknown,
  ): Promise<StoredPaymentDue> {
    const parsed = correctDueSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException();
    }
    const actorId = this.actors.requireActorId();
    return this.service.correctDue(
      id,
      {
        newAmount: parsed.data.newAmount,
        reason: parsed.data.reason,
      },
      actorId,
    );
  }

  @Post(':id/receipts')
  @HttpCode(201)
  @RequirePermission('payment.receipt.upload')
  uploadReceipt(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    body: unknown,
  ): Promise<StoredPaymentReceipt> {
    const parsed = uploadReceiptSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException();
    }
    const actorId = this.actors.requireActorId();
    return this.service.uploadReceipt(
      id,
      {
        amount: parsed.data.amount,
        currencyCode: parsed.data.currencyCode,
        replacesReceiptId: parsed.data.replacesReceiptId,
      },
      actorId,
    );
  }

  @Post('receipts/:receiptId/confirm')
  @HttpCode(201)
  @RequirePermission('payment.confirm')
  confirm(
    @Param('receiptId', new ParseUUIDPipe()) receiptId: string,
    @Body()
    body: unknown,
  ): Promise<StoredPaymentConfirmation> {
    const parsed = confirmPaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException();
    }
    const actorId = this.actors.requireActorId();
    return this.service.confirmPayment(
      receiptId,
      {
        notes: parsed.data.notes ?? null,
      },
      actorId,
    );
  }

  /**
   * `request.read` ممنوحة لكل مكلف، فلا تكفي وحدها هنا: بدون تقييد الملكية
   * يقرأ أي مكلف مبالغ مستحقات غيره بمعرفة معرّفها.
   */
  @Get(':id')
  @HttpCode(200)
  @RequirePermission('request.read')
  async getDue(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredPaymentDue> {
    if (!this.isStaff(request)) {
      const owned = await this.ownsDue(this.actorId(request), id);
      // «غير موجود» لا «ممنوع»: الفرق بينهما يكشف أي المعرّفات حقيقية.
      if (!owned) throw DomainException.notFound('السجل المطلوب غير موجود');
    }
    return this.service.getDue(id);
  }

  private async ownsDue(userProfileId: string, dueId: string): Promise<boolean> {
    if (!this.db.isInitialized) return false;
    const result = await sql<{ count: number }>`
      select count(*)::int as count
      from dues.payment_dues d
      join registry.taxpayer_account_links tal on tal.taxpayer_id = d.taxpayer_id
      where d.id = ${dueId}::uuid
        and tal.user_profile_id = ${userProfileId}::uuid
        and tal.active_state_code = 'active'
    `.execute(this.db.db);
    return (result.rows[0]?.count ?? 0) > 0;
  }
}
