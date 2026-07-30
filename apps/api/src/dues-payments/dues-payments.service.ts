import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DUES_PAYMENTS_REPOSITORY,
  type DuesPaymentsRepository,
  type StoredPaymentDue,
  type StoredDueBasisDocumentReference,
  type StoredDueCorrection,
  type StoredPaymentReceipt,
  type StoredPaymentConfirmation,
} from './dues-payments.repository.js';

@Injectable()
export class DuesPaymentsService {
  constructor(
    @Inject(DUES_PAYMENTS_REPOSITORY)
    private readonly repository: DuesPaymentsRepository,
  ) {}

  async assessDue(
    input: {
      serviceRequestId: string | null;
      balaghId: string | null;
      amount: number;
      currencyCode: string;
      basisTypeCode: string;
      documentReference: string | null;
      attachmentId: string | null;
    },
    actorProfileId: string,
  ): Promise<StoredPaymentDue> {
    const hasRequest = !!input.serviceRequestId;
    const hasBalagh = !!input.balaghId;

    if ((hasRequest && hasBalagh) || (!hasRequest && !hasBalagh)) {
      throw new BadRequestException(
        'Exact-one parent context (serviceRequestId XOR balaghId) is required.',
      );
    }

    if (input.amount < 0) {
      throw new BadRequestException('Assessed amount must be non-negative.');
    }

    const dueId = randomUUID();
    const due: StoredPaymentDue = {
      id: dueId,
      publicRef: `DUE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      serviceRequestId: input.serviceRequestId,
      balaghId: input.balaghId,
      amount: input.amount,
      currencyCode: input.currencyCode,
      statusCode: 'pending',
      assessedAt: new Date(),
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
      updatedAt: null,
      updatedByProfileId: null,
      correlationId: null,
      archivedAt: null,
    };

    const createdDue = await this.repository.createDue(due);

    // Create basis reference
    const ref: StoredDueBasisDocumentReference = {
      id: randomUUID(),
      paymentDueId: dueId,
      documentReference: input.documentReference,
      attachmentId: input.attachmentId,
      basisTypeCode: input.basisTypeCode,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
    };
    await this.repository.createBasisReference(ref);

    return createdDue;
  }

  async correctDue(
    dueId: string,
    input: {
      newAmount: number;
      reason: string;
    },
    actorStaffProfileId: string,
  ): Promise<StoredPaymentDue> {
    const due = await this.repository.findDueById(dueId);
    if (!due) {
      throw new NotFoundException('Payment due record not found.');
    }

    if (due.statusCode !== 'pending') {
      throw new ConflictException(
        `Cannot correct a due that is already "${due.statusCode}".`,
      );
    }

    if (input.newAmount < 0) {
      throw new BadRequestException('Corrected amount must be non-negative.');
    }

    if (!input.reason || input.reason.trim() === '') {
      throw new BadRequestException('Correction reason is mandatory.');
    }

    const correction: StoredDueCorrection = {
      id: randomUUID(),
      paymentDueId: dueId,
      priorAmount: due.amount,
      newAmount: input.newAmount,
      currencyCode: due.currencyCode,
      reason: input.reason,
      correctedAt: new Date(),
      correctedByStaffProfileId: actorStaffProfileId,
    };

    await this.repository.createCorrection(correction);

    return this.repository.updateDue(dueId, {
      amount: input.newAmount,
      updatedAt: new Date(),
    });
  }

  async uploadReceipt(
    dueId: string,
    input: {
      amount: number;
      currencyCode: string;
      replacesReceiptId: string | null;
    },
    actorProfileId: string,
  ): Promise<StoredPaymentReceipt> {
    const due = await this.repository.findDueById(dueId);
    if (!due) {
      throw new NotFoundException('Payment due record not found.');
    }

    if (input.amount <= 0) {
      throw new BadRequestException(
        'Receipt payment amount must be greater than zero.',
      );
    }

    const receipt: StoredPaymentReceipt = {
      id: randomUUID(),
      publicRef: `RCP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      paymentDueId: dueId,
      amount: input.amount,
      currencyCode: input.currencyCode,
      acceptanceStatusCode: 'pending',
      receivedAt: new Date(),
      replacesReceiptId: input.replacesReceiptId,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
      updatedAt: null,
      updatedByProfileId: null,
    };

    return this.repository.createReceipt(receipt);
  }

  async confirmPayment(
    receiptId: string,
    input: {
      notes: string | null;
    },
    actorStaffProfileId: string,
  ): Promise<StoredPaymentConfirmation> {
    const receipt = await this.repository.findReceiptById(receiptId);
    if (!receipt) {
      throw new NotFoundException('Payment receipt not found.');
    }

    if (receipt.acceptanceStatusCode !== 'pending') {
      throw new ConflictException(
        `Receipt has already been "${receipt.acceptanceStatusCode}".`,
      );
    }

    // Update receipt status
    await this.repository.updateReceipt(receiptId, {
      acceptanceStatusCode: 'approved',
      updatedAt: new Date(),
    });

    const due = await this.repository.findDueById(receipt.paymentDueId);
    if (!due) {
      throw new NotFoundException('Associated payment due not found.');
    }

    // Calculate total approved payments for this due
    const receipts = await this.repository.listReceiptsForDue(
      receipt.paymentDueId,
    );
    const totalPaid = receipts
      .filter((r) => r.acceptanceStatusCode === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);

    // If fully paid, transition due state
    if (totalPaid >= due.amount) {
      await this.repository.updateDue(due.id, {
        statusCode: 'paid',
        updatedAt: new Date(),
      });
    }

    // Create confirmation record
    const confirmation: StoredPaymentConfirmation = {
      id: randomUUID(),
      paymentReceiptId: receiptId,
      confirmedAt: new Date(),
      confirmedByStaffProfileId: actorStaffProfileId,
      notes: input.notes,
    };

    return this.repository.createConfirmation(confirmation);
  }

  async getDue(id: string): Promise<StoredPaymentDue> {
    const due = await this.repository.findDueById(id);
    if (!due) {
      throw new NotFoundException('Payment due record not found.');
    }
    return due;
  }
}
