import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { UsersService } from '../users/users.service.js';
import { DuesPaymentsService } from './dues-payments.service.js';
import {
  DUES_PAYMENTS_REPOSITORY,
  DUE_STATUSES,
  RECEIPT_STATUSES,
  type DuesPaymentsRepository,
  type StoredPaymentConfirmation,
  type StoredPaymentDue,
} from './dues-payments.repository.js';

@Injectable()
export class AtomicDuesPaymentsService extends DuesPaymentsService {
  constructor(
    @Inject(DUES_PAYMENTS_REPOSITORY)
    repository: DuesPaymentsRepository,
    @Optional() private readonly atomicUsers: UsersService | undefined,
    private readonly database: DatabaseService,
  ) {
    super(repository, atomicUsers);
  }

  override async recordPayment(
    dueId: string,
    input: { amount: number; notes: string | null },
    actorProfileId: string,
  ): Promise<StoredPaymentDue> {
    if (!this.database.isInitialized) {
      return super.recordPayment(dueId, input, actorProfileId);
    }

    await this.requireActiveStaff(actorProfileId);
    if (input.amount <= 0) {
      throw new ConflictException('مبلغ السداد يجب أن يكون أكبر من صفر');
    }
    const amount = Math.round(input.amount * 100) / 100;

    return this.database.db.transaction().execute(async (trx) => {
      const due = await trx
        .selectFrom('dues.payment_dues')
        .selectAll()
        .where('id', '=', dueId)
        .forUpdate()
        .executeTakeFirst();
      if (!due) throw new NotFoundException('Payment due record not found.');

      const status = due.status_code.trim().toLowerCase();
      if (status === DUE_STATUSES.cancelled) {
        throw new ConflictException('لا يُسجَّل سداد على مستحق ملغى');
      }
      if (status === DUE_STATUSES.paid) {
        throw new ConflictException('هذا المستحق مسدَّد بالكامل');
      }

      const receipts = await trx
        .selectFrom('dues.payment_receipts')
        .select(['amount', 'acceptance_status_code'])
        .where('payment_due_id', '=', dueId)
        .execute();
      const paid = receipts
        .filter(
          (receipt) =>
            receipt.acceptance_status_code.trim().toLowerCase() ===
            RECEIPT_STATUSES.verified,
        )
        .reduce((sum, receipt) => sum + Number(receipt.amount), 0);
      const remaining = Math.round((Number(due.amount) - paid) * 100) / 100;
      if (amount > remaining) {
        throw new ConflictException(
          `المبلغ أكبر من المتبقي على المستحق (${remaining})`,
        );
      }

      const now = new Date();
      const receiptId = randomUUID();
      await trx
        .insertInto('dues.payment_receipts')
        .values({
          id: receiptId,
          public_ref: `RCP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          payment_due_id: dueId,
          amount,
          currency_code: 'YER',
          acceptance_status_code: RECEIPT_STATUSES.verified,
          received_at: now,
          replaces_receipt_id: null,
          created_at: now,
          created_by_profile_id: actorProfileId,
          updated_at: now,
          updated_by_profile_id: actorProfileId,
          correlation_id: null,
        })
        .execute();

      const totalPaid = Math.round((paid + amount) * 100) / 100;
      const nextStatus =
        totalPaid >= Number(due.amount)
          ? DUE_STATUSES.paid
          : DUE_STATUSES.partiallyPaid;

      await trx
        .updateTable('dues.payment_dues')
        .set({
          status_code: nextStatus,
          updated_at: now,
          updated_by_profile_id: actorProfileId,
        })
        .where('id', '=', dueId)
        .execute();

      await trx
        .insertInto('dues.payment_confirmations')
        .values({
          id: randomUUID(),
          payment_receipt_id: receiptId,
          outcome_code: 'approved',
          confirmed_at: now,
          confirmed_by_profile_id: actorProfileId,
          amount_confirmed: amount,
          currency_code: 'YER',
          created_at: now,
          created_by_profile_id: actorProfileId,
          correlation_id: null,
        })
        .execute();

      return {
        id: due.id,
        publicRef: due.public_ref,
        taxpayerId: due.taxpayer_id,
        serviceRequestId: due.service_request_id,
        balaghId: due.balagh_id,
        amount: Number(due.amount),
        currencyCode: due.currency_code,
        statusCode: nextStatus,
        assessedAt: due.assessed_at,
        createdAt: due.created_at,
        createdByProfileId: due.created_by_profile_id,
        updatedAt: now,
        updatedByProfileId: actorProfileId,
        correlationId: due.correlation_id,
        archivedAt: due.archived_at,
      };
    });
  }

  override async confirmPayment(
    receiptId: string,
    input: { notes: string | null },
    actorProfileId: string,
  ): Promise<StoredPaymentConfirmation> {
    if (!this.database.isInitialized) {
      return super.confirmPayment(receiptId, input, actorProfileId);
    }

    await this.requireActiveStaff(actorProfileId);

    return this.database.db.transaction().execute(async (trx) => {
      const receipt = await trx
        .selectFrom('dues.payment_receipts')
        .selectAll()
        .where('id', '=', receiptId)
        .forUpdate()
        .executeTakeFirst();
      if (!receipt) throw new NotFoundException('Payment receipt not found.');
      if (
        receipt.acceptance_status_code.trim().toLowerCase() !==
        RECEIPT_STATUSES.uploaded
      ) {
        throw new ConflictException(
          `Receipt has already been "${receipt.acceptance_status_code}".`,
        );
      }

      const due = await trx
        .selectFrom('dues.payment_dues')
        .selectAll()
        .where('id', '=', receipt.payment_due_id)
        .forUpdate()
        .executeTakeFirst();
      if (!due) {
        throw new NotFoundException('Associated payment due not found.');
      }

      const receipts = await trx
        .selectFrom('dues.payment_receipts')
        .select(['amount', 'acceptance_status_code'])
        .where('payment_due_id', '=', due.id)
        .execute();
      const paid = receipts
        .filter(
          (row) =>
            row.acceptance_status_code.trim().toLowerCase() ===
            RECEIPT_STATUSES.verified,
        )
        .reduce((sum, row) => sum + Number(row.amount), 0);
      const amount = Number(receipt.amount);
      const remaining = Math.round((Number(due.amount) - paid) * 100) / 100;
      if (amount > remaining) {
        throw new ConflictException(
          `المبلغ أكبر من المتبقي على المستحق (${remaining})`,
        );
      }

      const now = new Date();
      await trx
        .updateTable('dues.payment_receipts')
        .set({
          acceptance_status_code: RECEIPT_STATUSES.verified,
          updated_at: now,
          updated_by_profile_id: actorProfileId,
        })
        .where('id', '=', receiptId)
        .execute();

      const totalPaid = Math.round((paid + amount) * 100) / 100;
      const nextStatus =
        totalPaid >= Number(due.amount)
          ? DUE_STATUSES.paid
          : totalPaid > 0
            ? DUE_STATUSES.partiallyPaid
            : DUE_STATUSES.unpaid;

      await trx
        .updateTable('dues.payment_dues')
        .set({
          status_code: nextStatus,
          updated_at: now,
          updated_by_profile_id: actorProfileId,
        })
        .where('id', '=', due.id)
        .execute();

      const confirmation: StoredPaymentConfirmation = {
        id: randomUUID(),
        paymentReceiptId: receiptId,
        confirmedAt: now,
        confirmedByStaffProfileId: actorProfileId,
        notes: input.notes,
      };

      await trx
        .insertInto('dues.payment_confirmations')
        .values({
          id: confirmation.id,
          payment_receipt_id: receiptId,
          outcome_code: 'approved',
          confirmed_at: now,
          confirmed_by_profile_id: actorProfileId,
          amount_confirmed: amount,
          currency_code: receipt.currency_code,
          created_at: now,
          created_by_profile_id: actorProfileId,
          correlation_id: null,
        })
        .execute();

      return confirmation;
    });
  }

  private async requireActiveStaff(actorProfileId: string): Promise<void> {
    if (!this.atomicUsers) return;
    try {
      const staff = await this.atomicUsers.findStaffByUserProfileId(actorProfileId);
      if (staff?.isActive) return;
    } catch {
      // handled below
    }
    throw new ForbiddenException(
      'هذه العملية مقصورة على موظفي المكتب الفعّالين',
    );
  }
}
