import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  DuesPaymentsRepository,
  StoredPaymentDue,
  StoredDueBasisDocumentReference,
  StoredDueCorrection,
  StoredPaymentReceipt,
  StoredPaymentConfirmation,
  StoredFinancialCorrection,
} from './dues-payments.repository.js';

@Injectable()
export class DuesPaymentsKyselyRepository implements DuesPaymentsRepository {
  // In-memory fallback
  private readonly dues = new Map<string, StoredPaymentDue>();
  private readonly basisReferences: StoredDueBasisDocumentReference[] = [];
  private readonly corrections: StoredDueCorrection[] = [];
  private readonly receipts = new Map<string, StoredPaymentReceipt>();
  private readonly confirmations: StoredPaymentConfirmation[] = [];
  private readonly financialCorrections: StoredFinancialCorrection[] = [];

  constructor(private readonly dbService: DatabaseService) {}

  async findDueById(id: string): Promise<StoredPaymentDue | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('dues.payment_dues')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        publicRef: row.public_ref,
        serviceRequestId: row.service_request_id,
        balaghId: row.balagh_id,
        amount: Number(row.amount),
        currencyCode: row.currency_code,
        taxpayerId: row.taxpayer_id,
        statusCode: row.status_code,
        assessedAt: row.assessed_at,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
        updatedAt: row.updated_at,
        updatedByProfileId: row.updated_by_profile_id,
        correlationId: row.correlation_id,
        archivedAt: row.archived_at,
      };
    }
    return this.dues.get(id) ?? null;
  }

  async findDuesByRequestId(serviceRequestId: string): Promise<StoredPaymentDue[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('dues.payment_dues')
        .selectAll()
        .where('service_request_id', '=', serviceRequestId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        publicRef: row.public_ref,
        serviceRequestId: row.service_request_id,
        balaghId: row.balagh_id,
        amount: Number(row.amount),
        currencyCode: row.currency_code,
        taxpayerId: row.taxpayer_id,
        statusCode: row.status_code,
        assessedAt: row.assessed_at,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
        updatedAt: row.updated_at,
        updatedByProfileId: row.updated_by_profile_id,
        correlationId: row.correlation_id,
        archivedAt: row.archived_at,
      }));
    }
    return [...this.dues.values()].filter((d) => d.serviceRequestId === serviceRequestId);
  }

  async createDue(due: StoredPaymentDue): Promise<StoredPaymentDue> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('dues.payment_dues')
        .values({
          id: due.id,
          public_ref: due.publicRef,
          taxpayer_id: due.taxpayerId,
          service_request_id: due.serviceRequestId,
          balagh_id: due.balaghId,
          amount: due.amount,
          currency_code: due.currencyCode,
          status_code: due.statusCode,
          assessed_at: due.assessedAt,
          created_at: due.createdAt,
          created_by_profile_id: due.createdByProfileId,
          updated_at: due.updatedAt,
          updated_by_profile_id: due.updatedByProfileId,
          correlation_id: due.correlationId,
          archived_at: due.archivedAt,
        })
        .execute();
      return due;
    }
    this.dues.set(due.id, due);
    return due;
  }

  async updateDue(id: string, updates: Partial<StoredPaymentDue>): Promise<StoredPaymentDue> {
    if (this.dbService.isInitialized) {
      const dbUpdates: {
        amount?: number;
        status_code?: string;
        updated_at?: Date | null;
        updated_by_profile_id?: string | null;
      } = {};
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.statusCode !== undefined) dbUpdates.status_code = updates.statusCode;
      if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;
      if (updates.updatedByProfileId !== undefined)
        dbUpdates.updated_by_profile_id = updates.updatedByProfileId;

      await this.dbService.db
        .updateTable('dues.payment_dues')
        .set(dbUpdates)
        .where('id', '=', id)
        .execute();

      const updated = await this.findDueById(id);
      if (!updated) throw new Error('Payment due not found after update.');
      return updated;
    }

    const existing = this.dues.get(id);
    if (!existing) throw new Error('Payment due not found.');
    const updated = { ...existing, ...updates };
    this.dues.set(id, updated);
    return updated;
  }

  async createBasisReference(
    ref: StoredDueBasisDocumentReference,
  ): Promise<StoredDueBasisDocumentReference> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('dues.due_basis_document_references')
        .values({
          id: ref.id,
          payment_due_id: ref.paymentDueId,
          document_reference: ref.documentReference,
          attachment_id: ref.attachmentId,
          basis_type_code: ref.basisTypeCode,
          created_at: ref.createdAt,
          created_by_profile_id: ref.createdByProfileId,
          correlation_id: null,
        })
        .execute();
      return ref;
    }
    this.basisReferences.push(ref);
    return ref;
  }

  async listBasisReferencesForDue(
    paymentDueId: string,
  ): Promise<StoredDueBasisDocumentReference[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('dues.due_basis_document_references')
        .selectAll()
        .where('payment_due_id', '=', paymentDueId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        paymentDueId: row.payment_due_id,
        documentReference: row.document_reference,
        attachmentId: row.attachment_id,
        basisTypeCode: row.basis_type_code,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
      }));
    }
    return this.basisReferences.filter((r) => r.paymentDueId === paymentDueId);
  }

  async createCorrection(correction: StoredDueCorrection): Promise<StoredDueCorrection> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('dues.due_corrections')
        .values({
          id: correction.id,
          payment_due_id: correction.paymentDueId,
          prior_amount: correction.priorAmount,
          new_amount: correction.newAmount,
          currency_code: correction.currencyCode,
          reason: correction.reason,
          corrected_at: correction.correctedAt,
          corrected_by_staff_profile_id: correction.correctedByStaffProfileId,
          correlation_id: null,
          created_at: new Date(),
        })
        .execute();
      return correction;
    }
    this.corrections.push(correction);
    return correction;
  }

  async listCorrectionsForDue(paymentDueId: string): Promise<StoredDueCorrection[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('dues.due_corrections')
        .selectAll()
        .where('payment_due_id', '=', paymentDueId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        paymentDueId: row.payment_due_id,
        priorAmount: Number(row.prior_amount),
        newAmount: Number(row.new_amount),
        currencyCode: row.currency_code,
        reason: row.reason,
        correctedAt: row.corrected_at,
        correctedByStaffProfileId: row.corrected_by_staff_profile_id,
      }));
    }
    return this.corrections.filter((c) => c.paymentDueId === paymentDueId);
  }

  async findReceiptById(id: string): Promise<StoredPaymentReceipt | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('dues.payment_receipts')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        publicRef: row.public_ref,
        paymentDueId: row.payment_due_id,
        amount: Number(row.amount),
        currencyCode: row.currency_code,
        acceptanceStatusCode: row.acceptance_status_code,
        receivedAt: row.received_at,
        replacesReceiptId: row.replaces_receipt_id,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
        updatedAt: row.updated_at,
        updatedByProfileId: row.updated_by_profile_id,
      };
    }
    return this.receipts.get(id) ?? null;
  }

  async listReceiptsForDue(paymentDueId: string): Promise<StoredPaymentReceipt[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('dues.payment_receipts')
        .selectAll()
        .where('payment_due_id', '=', paymentDueId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        publicRef: row.public_ref,
        paymentDueId: row.payment_due_id,
        amount: Number(row.amount),
        currencyCode: row.currency_code,
        acceptanceStatusCode: row.acceptance_status_code,
        receivedAt: row.received_at,
        replacesReceiptId: row.replaces_receipt_id,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
        updatedAt: row.updated_at,
        updatedByProfileId: row.updated_by_profile_id,
      }));
    }
    return [...this.receipts.values()].filter((r) => r.paymentDueId === paymentDueId);
  }

  async createReceipt(receipt: StoredPaymentReceipt): Promise<StoredPaymentReceipt> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('dues.payment_receipts')
        .values({
          id: receipt.id,
          public_ref: receipt.publicRef,
          payment_due_id: receipt.paymentDueId,
          amount: receipt.amount,
          currency_code: receipt.currencyCode,
          acceptance_status_code: receipt.acceptanceStatusCode,
          received_at: receipt.receivedAt,
          replaces_receipt_id: receipt.replacesReceiptId,
          created_at: receipt.createdAt,
          created_by_profile_id: receipt.createdByProfileId,
          updated_at: receipt.updatedAt,
          updated_by_profile_id: receipt.updatedByProfileId,
          correlation_id: null,
        })
        .execute();
      return receipt;
    }
    this.receipts.set(receipt.id, receipt);
    return receipt;
  }

  async updateReceipt(id: string, updates: Partial<StoredPaymentReceipt>): Promise<StoredPaymentReceipt> {
    if (this.dbService.isInitialized) {
      const dbUpdates: {
        acceptance_status_code?: string;
        updated_at?: Date | null;
      } = {};
      if (updates.acceptanceStatusCode !== undefined)
        dbUpdates.acceptance_status_code = updates.acceptanceStatusCode;
      if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

      await this.dbService.db
        .updateTable('dues.payment_receipts')
        .set(dbUpdates)
        .where('id', '=', id)
        .execute();

      const updated = await this.findReceiptById(id);
      if (!updated) throw new Error('Payment receipt not found after update.');
      return updated;
    }

    const existing = this.receipts.get(id);
    if (!existing) throw new Error('Payment receipt not found.');
    const updated = { ...existing, ...updates };
    this.receipts.set(id, updated);
    return updated;
  }

  async createConfirmation(conf: StoredPaymentConfirmation): Promise<StoredPaymentConfirmation> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('dues.payment_confirmations')
        .values({
          id: conf.id,
          payment_receipt_id: conf.paymentReceiptId,
          outcome_code: 'approved',
          confirmed_at: conf.confirmedAt,
          confirmed_by_profile_id: conf.confirmedByStaffProfileId,
          amount_confirmed: null,
          currency_code: null,
          created_at: new Date(),
          created_by_profile_id: conf.confirmedByStaffProfileId,
          correlation_id: null,
        })
        .execute();
      return conf;
    }
    this.confirmations.push(conf);
    return conf;
  }

  async createFinancialCorrection(
    correction: StoredFinancialCorrection,
  ): Promise<StoredFinancialCorrection> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('dues.financial_corrections')
        .values({
          id: correction.id,
          payment_due_id: correction.paymentDueId,
          correction_type: correction.correctionType,
          amount: correction.amount,
          currency_code: correction.currencyCode,
          notes: correction.notes,
          created_at: correction.createdAt,
        })
        .execute();
      return correction;
    }
    this.financialCorrections.push(correction);
    return correction;
  }
}
