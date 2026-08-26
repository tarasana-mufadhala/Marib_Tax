import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { assessDueSchema, correctDueSchema } from '@marib-tax/contracts';
import { DuesPaymentsService } from '../src/dues-payments/dues-payments.service.js';
import { DuesPaymentsMemoryRepository } from '../src/dues-payments/dues-payments.memory-repository.js';
import {
  CORRECTABLE_DUE_STATUSES,
  DUE_STATUSES,
} from '../src/dues-payments/dues-payments.repository.js';

const TAXPAYER = randomUUID();
const ACTOR = randomUUID();

function serviceWithMemory(): DuesPaymentsService {
  return new DuesPaymentsService(new DuesPaymentsMemoryRepository());
}

describe('مخطط تسجيل المستحق', () => {
  const valid = {
    taxpayerId: TAXPAYER,
    amount: 250000,
    currencyCode: 'YER' as const,
    basisTypeCode: 'annual_assessment',
  };

  it('يقبل مستحقاً على مكلف بلا طلب ولا بلاغ — الربط السنوي والمتأخرات', () => {
    expect(assessDueSchema.safeParse(valid).success).toBe(true);
  });

  it('يرفض مستحقاً بلا مكلف — دَينٌ على لا أحد', () => {
    const { taxpayerId: _omitted, ...withoutTaxpayer } = valid;
    expect(assessDueSchema.safeParse(withoutTaxpayer).success).toBe(false);
  });

  it('يقبل مستحقاً ناشئاً عن طلب', () => {
    expect(
      assessDueSchema.safeParse({ ...valid, serviceRequestId: randomUUID() })
        .success,
    ).toBe(true);
  });

  it('يرفض اجتماع الطلب والبلاغ — المستحق ينشأ عن معاملة واحدة', () => {
    expect(
      assessDueSchema.safeParse({
        ...valid,
        serviceRequestId: randomUUID(),
        balaghId: randomUUID(),
      }).success,
    ).toBe(false);
  });

  it('يرفض مبلغاً سالباً', () => {
    expect(assessDueSchema.safeParse({ ...valid, amount: -1 }).success).toBe(
      false,
    );
  });

  it('يرفض عملة غير الريال', () => {
    expect(
      assessDueSchema.safeParse({ ...valid, currencyCode: 'USD' }).success,
    ).toBe(false);
  });
});

describe('مخطط تعديل المبلغ', () => {
  it('يوجب سبباً للتعديل', () => {
    expect(correctDueSchema.safeParse({ newAmount: 100 }).success).toBe(false);
    expect(
      correctDueSchema.safeParse({ newAmount: 100, reason: '   ' }).success,
    ).toBe(false);
    expect(
      correctDueSchema.safeParse({ newAmount: 100, reason: 'تصحيح' }).success,
    ).toBe(true);
  });

  it('يرفض مبلغاً سالباً وسبباً أطول من المسموح', () => {
    expect(
      correctDueSchema.safeParse({ newAmount: -1, reason: 'س' }).success,
    ).toBe(false);
    expect(
      correctDueSchema.safeParse({ newAmount: 1, reason: 'س'.repeat(1001) })
        .success,
    ).toBe(false);
  });
});

describe('تسجيل المستحق وتعديله', () => {
  it('يُنشئ المستحق بحالة «غير مسدَّد» بالمفردة نفسها التي في القاعدة', async () => {
    const service = serviceWithMemory();
    const due = await service.assessDue(
      {
        taxpayerId: TAXPAYER,
        serviceRequestId: null,
        balaghId: null,
        amount: 250000,
        currencyCode: 'YER',
        basisTypeCode: 'annual_assessment',
        documentReference: 'ربط 2026',
        attachmentId: null,
      },
      ACTOR,
    );

    expect(due.taxpayerId).toBe(TAXPAYER);
    // كانت تُكتب 'PENDING' بينما القاعدة تحمل 'unpaid'، فيفشل كل تعديل لاحق.
    expect(due.statusCode).toBe(DUE_STATUSES.unpaid);
    expect(CORRECTABLE_DUE_STATUSES).toContain(due.statusCode);
  });

  it('يرفض اجتماع الطلب والبلاغ على مستوى الخدمة أيضاً', async () => {
    const service = serviceWithMemory();
    await expect(
      service.assessDue(
        {
          taxpayerId: TAXPAYER,
          serviceRequestId: randomUUID(),
          balaghId: randomUUID(),
          amount: 100,
          currencyCode: 'YER',
          basisTypeCode: 'arrears',
          documentReference: null,
          attachmentId: null,
        },
        ACTOR,
      ),
    ).rejects.toThrow();
  });

  it('يعدّل مبلغ مستحق قائم ويحفظ المبلغ السابق في السجل', async () => {
    const service = serviceWithMemory();
    const due = await service.assessDue(
      {
        taxpayerId: TAXPAYER,
        serviceRequestId: null,
        balaghId: null,
        amount: 250000,
        currencyCode: 'YER',
        basisTypeCode: 'annual_assessment',
        documentReference: null,
        attachmentId: null,
      },
      ACTOR,
    );

    const corrected = await service.correctDue(
      due.id,
      { newAmount: 300000, reason: 'تصحيح بعد مراجعة الدفاتر' },
      ACTOR,
    );

    expect(corrected.amount).toBe(300000);
    // تعديل المبلغ لا يمحو سداداً جزئياً وقع فعلاً.
    expect(corrected.statusCode).toBe(DUE_STATUSES.unpaid);
  });

  it('يرفض تعديل مستحق مسدَّد', async () => {
    const repository = new DuesPaymentsMemoryRepository();
    const service = new DuesPaymentsService(repository);
    const due = await service.assessDue(
      {
        taxpayerId: TAXPAYER,
        serviceRequestId: null,
        balaghId: null,
        amount: 1000,
        currencyCode: 'YER',
        basisTypeCode: 'arrears',
        documentReference: null,
        attachmentId: null,
      },
      ACTOR,
    );
    await repository.updateDue(due.id, { statusCode: DUE_STATUSES.paid });

    await expect(
      service.correctDue(due.id, { newAmount: 500, reason: 'س' }, ACTOR),
    ).rejects.toThrow();
  });

  it('يقرّب المبالغ إلى فلسين فلا تتسرب كسور من الحساب العائم', async () => {
    const service = serviceWithMemory();
    const due = await service.assessDue(
      {
        taxpayerId: TAXPAYER,
        serviceRequestId: null,
        balaghId: null,
        amount: 100.005,
        currencyCode: 'YER',
        basisTypeCode: 'arrears',
        documentReference: null,
        attachmentId: null,
      },
      ACTOR,
    );
    expect(due.amount).toBe(100.01);
  });
});
