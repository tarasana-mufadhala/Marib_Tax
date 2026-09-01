import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { cancelDueSchema, recordPaymentSchema } from '@marib-tax/contracts';
import { DuesPaymentsService } from '../src/dues-payments/dues-payments.service.js';
import { DuesPaymentsMemoryRepository } from '../src/dues-payments/dues-payments.memory-repository.js';
import { DUE_STATUSES } from '../src/dues-payments/dues-payments.repository.js';

const TAXPAYER = randomUUID();
const ACTOR = randomUUID();

async function dueOf(amount: number): Promise<{
  service: DuesPaymentsService;
  dueId: string;
}> {
  const service = new DuesPaymentsService(new DuesPaymentsMemoryRepository());
  const due = await service.assessDue(
    {
      taxpayerId: TAXPAYER,
      serviceRequestId: null,
      balaghId: null,
      amount,
      currencyCode: 'YER',
      basisTypeCode: 'annual_assessment',
      documentReference: null,
      attachmentId: null,
    },
    ACTOR,
  );
  return { service, dueId: due.id };
}

describe('مخطط تسجيل السداد', () => {
  it('يوجب مبلغاً أكبر من صفر', () => {
    expect(recordPaymentSchema.safeParse({ amount: 0 }).success).toBe(false);
    expect(recordPaymentSchema.safeParse({ amount: -5 }).success).toBe(false);
    expect(recordPaymentSchema.safeParse({ amount: 1500 }).success).toBe(true);
  });

  it('لا يقبل حقلاً للحالة — الحالة تُشتق من المبلغ لا تُكتب باليد', () => {
    expect(
      recordPaymentSchema.safeParse({ amount: 100, statusCode: 'paid' }).success,
    ).toBe(false);
  });

  it('يوجب سبباً للإلغاء', () => {
    expect(cancelDueSchema.safeParse({ reason: '  ' }).success).toBe(false);
    expect(cancelDueSchema.safeParse({ reason: 'قُيِّد خطأً' }).success).toBe(
      true,
    );
  });
});

describe('اشتقاق حالة المستحق من المدفوعات', () => {
  it('السداد الجزئي ينقل الحالة إلى «مسدَّد جزئياً»', async () => {
    const { service, dueId } = await dueOf(300000);

    const after = await service.recordPayment(
      dueId,
      { amount: 100000, notes: 'سند 1' },
      ACTOR,
    );

    expect(after.statusCode).toBe(DUE_STATUSES.partiallyPaid);
    expect(after.amount).toBe(300000);
  });

  it('اكتمال المبلغ ينقل الحالة إلى «مسدَّد»', async () => {
    const { service, dueId } = await dueOf(300000);

    await service.recordPayment(dueId, { amount: 100000, notes: null }, ACTOR);
    const after = await service.recordPayment(
      dueId,
      { amount: 200000, notes: null },
      ACTOR,
    );

    expect(after.statusCode).toBe(DUE_STATUSES.paid);
  });

  it('يرفض سداداً على مستحق مسدَّد بالكامل', async () => {
    const { service, dueId } = await dueOf(1000);
    await service.recordPayment(dueId, { amount: 1000, notes: null }, ACTOR);

    await expect(
      service.recordPayment(dueId, { amount: 1, notes: null }, ACTOR),
    ).rejects.toThrow();
  });

  it('يرفض مبلغاً غير موجب', async () => {
    const { service, dueId } = await dueOf(1000);

    await expect(
      service.recordPayment(dueId, { amount: 0, notes: null }, ACTOR),
    ).rejects.toThrow();
  });

  it('يقبل الزيادة عن المتبقي ويعتبر المستحق مسدَّداً', async () => {
    // الفائض قرار محاسبي يُعالَج رصيداً؛ المهم ألا يبقى المستحق «غير مسدَّد».
    const { service, dueId } = await dueOf(1000);

    const after = await service.recordPayment(
      dueId,
      { amount: 1500, notes: null },
      ACTOR,
    );

    expect(after.statusCode).toBe(DUE_STATUSES.paid);
  });
});

describe('إلغاء المستحق', () => {
  it('يلغي مستحقاً لم يُقبض منه شيء', async () => {
    const { service, dueId } = await dueOf(5000);

    const after = await service.cancelDue(dueId, 'قُيِّد خطأً', ACTOR);

    expect(after.statusCode).toBe(DUE_STATUSES.cancelled);
  });

  it('يرفض إلغاء مستحق قُبض منه مبلغ — ما دخل الصندوق لا يُمحى', async () => {
    const { service, dueId } = await dueOf(5000);
    await service.recordPayment(dueId, { amount: 1000, notes: null }, ACTOR);

    await expect(service.cancelDue(dueId, 'سبب', ACTOR)).rejects.toThrow();
  });

  it('يرفض الإلغاء بلا سبب', async () => {
    const { service, dueId } = await dueOf(5000);

    await expect(service.cancelDue(dueId, '   ', ACTOR)).rejects.toThrow();
  });

  it('يرفض إلغاء ملغى', async () => {
    const { service, dueId } = await dueOf(5000);
    await service.cancelDue(dueId, 'قُيِّد خطأً', ACTOR);

    await expect(service.cancelDue(dueId, 'مرة أخرى', ACTOR)).rejects.toThrow();
  });

  it('يرفض تسجيل سداد على مستحق ملغى', async () => {
    const { service, dueId } = await dueOf(5000);
    await service.cancelDue(dueId, 'قُيِّد خطأً', ACTOR);

    await expect(
      service.recordPayment(dueId, { amount: 100, notes: null }, ACTOR),
    ).rejects.toThrow();
  });
});
