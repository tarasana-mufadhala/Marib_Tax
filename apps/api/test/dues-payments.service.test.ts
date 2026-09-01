import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { DuesPaymentsMemoryRepository } from '../src/dues-payments/dues-payments.memory-repository.js';
import {
  DUE_STATUSES,
  RECEIPT_STATUSES,
} from '../src/dues-payments/dues-payments.repository.js';
import { DuesPaymentsService } from '../src/dues-payments/dues-payments.service.js';
import type { StoredFinancialCorrection } from '../src/dues-payments/dues-payments.repository.js';

const TAXPAYER_ID = '33333333-3333-3333-3333-333333333333';

describe('DuesPaymentsService', () => {
  it('manages dues assessment, corrections, receipt uploading, and approvals leading to due payment status updates', async () => {
    const repository = new DuesPaymentsMemoryRepository();
    const service = new DuesPaymentsService(repository);

    const serviceRequestId = randomUUID();
    const actorId = randomUUID();

    // 1. Assess due
    const due = await service.assessDue(
      {
        taxpayerId: TAXPAYER_ID,
        serviceRequestId,
        balaghId: null,
        amount: 150000.0,
        currencyCode: 'YER',
        basisTypeCode: 'tax_assessment',
        documentReference: 'DOC-ASSESS-2026-99',
        attachmentId: null,
      },
      actorId,
    );

    expect(due.statusCode).toBe(DUE_STATUSES.unpaid);
    expect(due.amount).toBe(150000.0);
    expect(due.currencyCode).toBe('YER');

    // Verify basis ref
    const refs = await repository.listBasisReferencesForDue(due.id);
    expect(refs).toHaveLength(1);
    expect(refs[0]?.documentReference).toBe('DOC-ASSESS-2026-99');

    // 2. Correct due
    const correctedDue = await service.correctDue(
      due.id,
      {
        newAmount: 140000.0,
        reason: 'خصم تشجيع السداد المبكر بموافقة المدير',
      },
      actorId,
    );

    expect(correctedDue.amount).toBe(140000.0);

    const corrections = await repository.listCorrectionsForDue(due.id);
    expect(corrections).toHaveLength(1);
    expect(corrections[0]?.priorAmount).toBe(150000.0);
    expect(corrections[0]?.newAmount).toBe(140000.0);

    // 3. Upload receipts (partial receipt 1)
    const receipt1 = await service.uploadReceipt(
      due.id,
      {
        amount: 80000.0,
        currencyCode: 'YER',
        replacesReceiptId: null,
      },
      actorId,
    );

    expect(receipt1.amount).toBe(80000.0);
    expect(receipt1.acceptanceStatusCode).toBe(RECEIPT_STATUSES.uploaded);

    // Confirm receipt 1
    const conf1 = await service.confirmPayment(
      receipt1.id,
      { notes: 'السداد الجزئي الأول مقبول' },
      actorId,
    );
    expect(conf1.paymentReceiptId).toBe(receipt1.id);

    // سُدِّد 80 من 140، فالحالة «مسدَّد جزئياً» لا «غير مسدَّد»: الحالة تتبع
    // ما أُكِّد قبضه.
    expect((await service.getDue(due.id)).statusCode).toBe(
      DUE_STATUSES.partiallyPaid,
    );

    // Upload receipt 2 (covers the remainder)
    const receipt2 = await service.uploadReceipt(
      due.id,
      {
        amount: 60000.0,
        currencyCode: 'YER',
        replacesReceiptId: null,
      },
      actorId,
    );

    // Confirm receipt 2
    await service.confirmPayment(
      receipt2.id,
      { notes: 'المتبقي مقبول؛ الرسوم مسددة بالكامل' },
      actorId,
    );

    // Due should now be fully paid!
    expect((await service.getDue(due.id)).statusCode).toBe(DUE_STATUSES.paid);
  });

  it('allows overpayment and records credit balance surplus as financial corrections', async () => {
    const repository = new DuesPaymentsMemoryRepository();
    const service = new DuesPaymentsService(repository);

    const serviceRequestId = randomUUID();
    const actorId = randomUUID();

    const due = await service.assessDue(
      {
        taxpayerId: TAXPAYER_ID,
        serviceRequestId,
        balaghId: null,
        amount: 10000.0,
        currencyCode: 'YER',
        basisTypeCode: 'tax_assessment',
        documentReference: 'DOC-OVERPAY-1',
        attachmentId: null,
      },
      actorId,
    );

    // Upload receipt with overpaid amount: 12,000 YER (for a 10,000 YER due)
    const receipt = await service.uploadReceipt(
      due.id,
      {
        amount: 12000.0,
        currencyCode: 'YER',
        replacesReceiptId: null,
      },
      actorId,
    );

    expect(receipt.amount).toBe(12000.0);

    // Confirm receipt (which triggers PAID state and a financial correction for the 2,000 YER surplus)
    await service.confirmPayment(
      receipt.id,
      { notes: 'دفع زائد مقبول' },
      actorId,
    );

    expect((await service.getDue(due.id)).statusCode).toBe(DUE_STATUSES.paid);

    // Verify financial correction is created in repository
    const allCorrections = (repository as unknown as { financialCorrections: StoredFinancialCorrection[] }).financialCorrections;
    expect(allCorrections).toHaveLength(1);
    const corr = allCorrections[0];
    expect(corr).toBeDefined();
    expect(corr?.paymentDueId).toBe(due.id);
    expect(corr?.amount).toBe(2000.0);
    expect(corr?.correctionType).toBe('overpayment_credit');
  });
});
