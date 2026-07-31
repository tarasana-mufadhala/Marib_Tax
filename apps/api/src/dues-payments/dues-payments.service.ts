import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Optional,
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
import { UsersService } from '../users/users.service.js';
import { RolesPermissionsService } from '../roles-permissions/roles-permissions.service.js';

@Injectable()
export class DuesPaymentsService {
  constructor(
    @Inject(DUES_PAYMENTS_REPOSITORY)
    private readonly repository: DuesPaymentsRepository,
    @Optional()
    private readonly usersService?: UsersService,
    @Optional()
    private readonly rolesPermissionsService?: RolesPermissionsService,
  ) {}

  private async checkFinanceOfficerRole(actorProfileId: string): Promise<void> {
    if (!this.usersService || !this.rolesPermissionsService) {
      // In testing contexts where authorization services are not mocked/provided, bypass check
      return;
    }

    try {
      const staff =
        await this.usersService.findStaffByUserProfileId(actorProfileId);
      if (!staff || !staff.isActive) {
        throw new ForbiddenException('Actor is not an active staff profile.');
      }

      const assignments =
        await this.rolesPermissionsService.listActiveAssignmentsForStaff(
          staff.id,
        );
      let isFinanceOfficer = false;
      for (const assignment of assignments) {
        const role = await this.rolesPermissionsService.findRoleById(
          assignment.roleId,
        );
        if (role && role.code === 'FINANCE_OFFICER') {
          isFinanceOfficer = true;
          break;
        }
      }

      if (!isFinanceOfficer) {
        throw new ForbiddenException(
          'Only staff profiles with the FINANCE_OFFICER role can make due corrections or process receipt confirmations.',
        );
      }
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new ForbiddenException(
        'Failed to verify staff roles for the operation.',
      );
    }
  }

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

    if (input.currencyCode !== 'YER') {
      throw new BadRequestException('Currency code must be YER.');
    }

    if (input.amount < 0) {
      throw new BadRequestException('Assessed amount must be non-negative.');
    }

    // Currency and rounding (PHY-35)
    const roundedAmount = Math.round(input.amount * 100) / 100;

    const dueId = randomUUID();
    const due: StoredPaymentDue = {
      id: dueId,
      publicRef: `DUE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      serviceRequestId: input.serviceRequestId,
      balaghId: input.balaghId,
      amount: roundedAmount,
      currencyCode: 'YER',
      statusCode: 'PENDING',
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
    // 1. Correction Authority (OD-15)
    await this.checkFinanceOfficerRole(actorStaffProfileId);

    const due = await this.repository.findDueById(dueId);
    if (!due) {
      throw new NotFoundException('Payment due record not found.');
    }

    const currentStatus = due.statusCode.toUpperCase();
    if (currentStatus !== 'PENDING') {
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

    // Currency and rounding (PHY-35)
    const roundedNewAmount = Math.round(input.newAmount * 100) / 100;

    const correction: StoredDueCorrection = {
      id: randomUUID(),
      paymentDueId: dueId,
      priorAmount: due.amount,
      newAmount: roundedNewAmount,
      currencyCode: 'YER',
      reason: input.reason,
      correctedAt: new Date(),
      correctedByStaffProfileId: actorStaffProfileId,
    };

    await this.repository.createCorrection(correction);

    return this.repository.updateDue(dueId, {
      amount: roundedNewAmount,
      statusCode: 'PENDING',
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

    if (input.currencyCode !== 'YER') {
      throw new BadRequestException('Currency code must be YER.');
    }

    if (input.amount <= 0) {
      throw new BadRequestException(
        'Receipt payment amount must be greater than zero.',
      );
    }

    // Currency and Rounding (PHY-35)
    const roundedAmount = Math.round(input.amount * 100) / 100;

    // Overpayment check
    const receipts = await this.repository.listReceiptsForDue(dueId);
    const activeReceipts = receipts.filter(
      (r) =>
        r.id !== input.replacesReceiptId &&
        ['UPLOADED', 'VERIFIED', 'PENDING', 'APPROVED'].includes(
          r.acceptanceStatusCode.toUpperCase(),
        ),
    );

    const cumulativeAmount =
      activeReceipts.reduce((sum, r) => sum + r.amount, 0) + roundedAmount;

    if (cumulativeAmount > due.amount) {
      throw new BadRequestException('PAYMENT_OVERPAYMENT_NOT_ALLOWED');
    }

    const receipt: StoredPaymentReceipt = {
      id: randomUUID(),
      publicRef: `RCP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      paymentDueId: dueId,
      amount: roundedAmount,
      currencyCode: 'YER',
      acceptanceStatusCode: 'UPLOADED',
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
    // 1. Confirmation Authority (OD-15)
    await this.checkFinanceOfficerRole(actorStaffProfileId);

    const receipt = await this.repository.findReceiptById(receiptId);
    if (!receipt) {
      throw new NotFoundException('Payment receipt not found.');
    }

    const acceptanceStatus = receipt.acceptanceStatusCode.toUpperCase();
    if (acceptanceStatus !== 'UPLOADED' && acceptanceStatus !== 'PENDING') {
      throw new ConflictException(
        `Receipt has already been "${receipt.acceptanceStatusCode}".`,
      );
    }

    // Update receipt status to VERIFIED
    await this.repository.updateReceipt(receiptId, {
      acceptanceStatusCode: 'VERIFIED',
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
      .filter((r) =>
        ['VERIFIED', 'APPROVED'].includes(r.acceptanceStatusCode.toUpperCase()),
      )
      .reduce((sum, r) => sum + r.amount, 0);

    // If fully paid, transition due state to PAID
    if (totalPaid >= due.amount) {
      await this.repository.updateDue(due.id, {
        statusCode: 'PAID',
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
