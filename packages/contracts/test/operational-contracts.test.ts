import { describe, expect, it } from 'vitest';
import {
  balagh201Schema,
  balagh202Schema,
  balagh203Schema,
  balagh204Schema,
  balagh205Schema,
  balagh206Schema,
} from '../src/balaghs.js';
import {
  scheduleFieldVisitSchema,
  recordFieldVisitResultSchema,
  cancelFieldVisitSchema,
} from '../src/field-visits.js';
import {
  recordDecisionSchema,
  reviseDecisionSchema,
} from '../src/decisions.js';
import {
  assessDueSchema,
  correctDueSchema,
  uploadReceiptSchema,
  confirmPaymentSchema,
} from '../src/dues.js';

describe('Operational Contracts - Balaghs (FR-201 to FR-206)', () => {
  it('validates FR-201 Stoppage activity', () => {
    const valid = {
      activityIds: ['00000000-0000-4000-8000-000000000001'],
      branchIds: [],
      stopType: 'temporary',
      stoppedAt: '2026-07-31T12:00:00Z',
      reason: 'Work suspended',
      declarationConfirmed: true,
    };
    expect(balagh201Schema.parse(valid)).toMatchObject(valid);
  });

  it('validates FR-202 Eviction', () => {
    const valid = {
      propertyType: 'commercial',
      district: 'Marib',
      street: 'Sana Street',
      ownershipDeclarationConfirmed: true,
      tenantCount: 5,
    };
    expect(balagh202Schema.parse(valid)).toMatchObject(valid);
  });

  it('validates FR-203 worker exit', () => {
    const valid = {
      activityId: '00000000-0000-4000-8000-000000000001',
      workerCount: 3,
    };
    expect(balagh203Schema.parse(valid)).toMatchObject(valid);
  });

  it('validates FR-204 address change', () => {
    const valid = {
      activityId: '00000000-0000-4000-8000-000000000001',
      newAddress: {
        district: 'Marib',
        street: 'Ali Road',
      },
      occupancyType: 'rented',
      startedAt: '2026-07-31T12:00:00Z',
    };
    expect(balagh204Schema.parse(valid)).toMatchObject(valid);
  });

  it('validates FR-205 property transfer', () => {
    const valid = {
      propertyType: 'apartment',
      district: 'Marib',
      rentalStatus: 'rented',
      priorOwnerName: 'Ali Salem',
      newOwnerName: 'Mohammed Ahmed',
      newOwnerPhone: '777123456',
      newOwnerAddress: 'Marib city',
      transferType: 'sale',
      transferDate: '2026-07-31T12:00:00Z',
      relationshipCode: 'agent',
    };
    expect(balagh205Schema.parse(valid)).toMatchObject(valid);
  });

  it('validates FR-206 activation', () => {
    const valid = {
      activityIds: ['00000000-0000-4000-8000-000000000001'],
      startedAt: '2026-07-31T12:00:00Z',
      infoConfirmed: true,
    };
    expect(balagh206Schema.parse(valid)).toMatchObject(valid);
  });
});

describe('Operational Contracts - Field Visits', () => {
  it('validates schedule input with XOR parent', () => {
    const valid = {
      serviceRequestId: '00000000-0000-4000-8000-000000000001',
      scheduledStartAt: '2026-07-31T10:00:00Z',
      scheduledEndAt: '2026-07-31T12:00:00Z',
      teamMemberStaffIds: ['00000000-0000-4000-8000-000000000002'],
    };
    expect(scheduleFieldVisitSchema.parse(valid)).toMatchObject(valid);

    const invalidBoth = {
      serviceRequestId: '00000000-0000-4000-8000-000000000001',
      balaghId: '00000000-0000-4000-8000-000000000003',
      scheduledStartAt: '2026-07-31T10:00:00Z',
      scheduledEndAt: '2026-07-31T12:00:00Z',
      teamMemberStaffIds: ['00000000-0000-4000-8000-000000000002'],
    };
    expect(() => scheduleFieldVisitSchema.parse(invalidBoth)).toThrow();
  });

  it('validates result recording and cancellation inputs', () => {
    const result = {
      resultSummary: 'تمت المعاينة والتحقق من بيانات النشاط.',
      resultCode: 'VERIFIED',
      actualStartedAt: '2026-07-31T10:00:00Z',
      actualEndedAt: '2026-07-31T11:00:00Z',
    };
    expect(recordFieldVisitResultSchema.parse(result)).toMatchObject(result);

    const cancellation = { reason: 'تعذر الوصول إلى موقع النشاط.' };
    expect(cancelFieldVisitSchema.parse(cancellation)).toMatchObject(
      cancellation,
    );
  });
});

describe('Operational Contracts - Decisions', () => {
  it('validates decision outcome and revision reason', () => {
    const validDecision = {
      serviceRequestId: '00000000-0000-4000-8000-000000000001',
      outcomeCode: 'approved',
    };
    expect(recordDecisionSchema.parse(validDecision)).toMatchObject(
      validDecision,
    );

    const validRevision = {
      reason: 'Updated proof provided',
    };
    expect(reviseDecisionSchema.parse(validRevision)).toMatchObject(
      validRevision,
    );
  });
});

describe('Operational Contracts - Dues & Payments', () => {
  it('validates due assessment and currency constraints', () => {
    const valid = {
      serviceRequestId: '00000000-0000-4000-8000-000000000001',
      amount: 150000.5,
      currencyCode: 'YER',
      basisTypeCode: 'tax_audit',
    };
    expect(assessDueSchema.parse(valid)).toMatchObject(valid);
  });

  it('rejects dues with non-YER currency', () => {
    const invalid = {
      serviceRequestId: '00000000-0000-4000-8000-000000000001',
      amount: 150.0,
      currencyCode: 'USD',
      basisTypeCode: 'tax_audit',
    };
    expect(() => assessDueSchema.parse(invalid)).toThrow();
  });

  it('validates correction, receipt upload, and payment confirmation inputs', () => {
    const correction = {
      newAmount: 125000,
      reason: 'تصحيح مبلغ الاستحقاق قبل السداد.',
    };
    expect(correctDueSchema.parse(correction)).toMatchObject(correction);

    const receipt = {
      amount: 125000,
      currencyCode: 'YER' as const,
    };
    expect(uploadReceiptSchema.parse(receipt)).toMatchObject(receipt);

    const confirmation = {
      notes: 'تمت مطابقة إثبات السداد التجريبي.',
    };
    expect(confirmPaymentSchema.parse(confirmation)).toMatchObject(
      confirmation,
    );
  });
});
