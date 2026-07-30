import { Injectable } from '@nestjs/common';
import {
  type DuesPaymentsRepository,
  type StoredPaymentDue,
  type StoredDueBasisDocumentReference,
  type StoredDueCorrection,
  type StoredPaymentReceipt,
  type StoredPaymentConfirmation,
} from './dues-payments.repository.js';

@Injectable()
export class DuesPaymentsMemoryRepository implements DuesPaymentsRepository {
  private readonly dues = new Map<string, StoredPaymentDue>();
  private readonly basisReferences: StoredDueBasisDocumentReference[] = [];
  private readonly corrections: StoredDueCorrection[] = [];
  private readonly receipts = new Map<string, StoredPaymentReceipt>();
  private readonly confirmations: StoredPaymentConfirmation[] = [];

  async findDueById(id: string): Promise<StoredPaymentDue | null> {
    await Promise.resolve();
    return this.dues.get(id) ?? null;
  }

  async findDuesByRequestId(
    serviceRequestId: string,
  ): Promise<StoredPaymentDue[]> {
    await Promise.resolve();
    return [...this.dues.values()].filter(
      (d) => d.serviceRequestId === serviceRequestId,
    );
  }

  async createDue(due: StoredPaymentDue): Promise<StoredPaymentDue> {
    await Promise.resolve();
    this.dues.set(due.id, due);
    return due;
  }

  async updateDue(
    id: string,
    updates: Partial<StoredPaymentDue>,
  ): Promise<StoredPaymentDue> {
    await Promise.resolve();
    const existing = this.dues.get(id);
    if (!existing) throw new Error('Payment due not found.');
    const updated = { ...existing, ...updates };
    this.dues.set(id, updated);
    return updated;
  }

  async createBasisReference(
    ref: StoredDueBasisDocumentReference,
  ): Promise<StoredDueBasisDocumentReference> {
    await Promise.resolve();
    this.basisReferences.push(ref);
    return ref;
  }

  async listBasisReferencesForDue(
    paymentDueId: string,
  ): Promise<StoredDueBasisDocumentReference[]> {
    await Promise.resolve();
    return this.basisReferences.filter((r) => r.paymentDueId === paymentDueId);
  }

  async createCorrection(
    correction: StoredDueCorrection,
  ): Promise<StoredDueCorrection> {
    await Promise.resolve();
    this.corrections.push(correction);
    return correction;
  }

  async listCorrectionsForDue(
    paymentDueId: string,
  ): Promise<StoredDueCorrection[]> {
    await Promise.resolve();
    return this.corrections.filter((c) => c.paymentDueId === paymentDueId);
  }

  async findReceiptById(id: string): Promise<StoredPaymentReceipt | null> {
    await Promise.resolve();
    return this.receipts.get(id) ?? null;
  }

  async listReceiptsForDue(
    paymentDueId: string,
  ): Promise<StoredPaymentReceipt[]> {
    await Promise.resolve();
    return [...this.receipts.values()].filter(
      (r) => r.paymentDueId === paymentDueId,
    );
  }

  async createReceipt(
    receipt: StoredPaymentReceipt,
  ): Promise<StoredPaymentReceipt> {
    await Promise.resolve();
    this.receipts.set(receipt.id, receipt);
    return receipt;
  }

  async updateReceipt(
    id: string,
    updates: Partial<StoredPaymentReceipt>,
  ): Promise<StoredPaymentReceipt> {
    await Promise.resolve();
    const existing = this.receipts.get(id);
    if (!existing) throw new Error('Payment receipt not found.');
    const updated = { ...existing, ...updates };
    this.receipts.set(id, updated);
    return updated;
  }

  async createConfirmation(
    conf: StoredPaymentConfirmation,
  ): Promise<StoredPaymentConfirmation> {
    await Promise.resolve();
    this.confirmations.push(conf);
    return conf;
  }
}
