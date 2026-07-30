import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  Inject,
} from '@nestjs/common';
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
    body: {
      serviceRequestId?: string | null;
      balaghId?: string | null;
      amount: number;
      currencyCode: string;
      basisTypeCode: string;
      documentReference?: string | null;
      attachmentId?: string | null;
    },
  ): Promise<StoredPaymentDue> {
    const actorId = this.actors.requireActorId();
    return this.service.assessDue(
      {
        serviceRequestId: body.serviceRequestId ?? null,
        balaghId: body.balaghId ?? null,
        amount: body.amount,
        currencyCode: body.currencyCode,
        basisTypeCode: body.basisTypeCode,
        documentReference: body.documentReference ?? null,
        attachmentId: body.attachmentId ?? null,
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
    body: {
      newAmount: number;
      reason: string;
    },
  ): Promise<StoredPaymentDue> {
    const actorId = this.actors.requireActorId();
    return this.service.correctDue(
      id,
      {
        newAmount: body.newAmount,
        reason: body.reason,
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
    body: {
      amount: number;
      currencyCode: string;
      replacesReceiptId?: string | null;
    },
  ): Promise<StoredPaymentReceipt> {
    const actorId = this.actors.requireActorId();
    return this.service.uploadReceipt(
      id,
      {
        amount: body.amount,
        currencyCode: body.currencyCode,
        replacesReceiptId: body.replacesReceiptId ?? null,
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
    body: {
      notes?: string | null;
    },
  ): Promise<StoredPaymentConfirmation> {
    const actorId = this.actors.requireActorId();
    return this.service.confirmPayment(
      receiptId,
      {
        notes: body.notes ?? null,
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
