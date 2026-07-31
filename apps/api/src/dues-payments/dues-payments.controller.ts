import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  Inject,
  UnprocessableEntityException,
} from '@nestjs/common';
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
  type StoredPaymentDue,
  type StoredPaymentReceipt,
  type StoredPaymentConfirmation,
} from './dues-payments.repository.js';

@Controller('api/v1/dues')
export class DuesPaymentsController {
  constructor(
    private readonly service: DuesPaymentsService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

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

  @Get(':id')
  @HttpCode(200)
  @RequirePermission('request.read')
  getDue(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredPaymentDue> {
    return this.service.getDue(id);
  }
}
