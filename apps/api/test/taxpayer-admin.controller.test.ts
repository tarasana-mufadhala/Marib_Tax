import { describe, expect, it } from 'vitest';
import {
  TaxpayerAdminController,
  assertTransitionAllowed,
  transitionsFrom,
} from '../src/admin/taxpayer-admin.controller.js';
import { VERIFIED_ACTOR } from '../src/authn/bearer-actor-context.resolver.js';
import type { AuthenticatedRequest } from '../src/authn/bearer-actor-context.resolver.js';

const OFFICER = '11111111-1111-1111-1111-111111111111';
const TAXPAYER = '22222222-2222-2222-2222-222222222222';

function officerRequest(): AuthenticatedRequest {
  return {
    [VERIFIED_ACTOR]: {
      actorId: OFFICER,
      permissions: ['taxpayer.admin.read', 'taxpayer.admin.status'],
      roleActive: true,
      assignmentActive: true,
    },
  } as unknown as AuthenticatedRequest;
}

describe('قواعد انتقال حالة ملف المكلف', () => {
  it('تسمح باعتماد ملف قيد المراجعة', () => {
    expect(() =>
      assertTransitionAllowed('under_review', 'active', ''),
    ).not.toThrow();
  });

  it('تسمح برفض ملف قيد المراجعة مع سبب', () => {
    expect(() =>
      assertTransitionAllowed('under_review', 'rejected', 'مستندات ناقصة'),
    ).not.toThrow();
  });

  it('تمنع رفض ملف معتمد — الرفض قرار على ما لم يُعتمد بعد', () => {
    expect(() =>
      assertTransitionAllowed('active', 'rejected', 'سبب'),
    ).toThrowError(/لا يمكن الانتقال/);
  });

  it('تمنع إعادة الموقوف إلى قيد المراجعة', () => {
    expect(() =>
      assertTransitionAllowed('suspended', 'under_review', 'سبب'),
    ).toThrowError(/لا يمكن الانتقال/);
  });

  it('تمنع الانتقال إلى الحالة نفسها', () => {
    expect(() => assertTransitionAllowed('active', 'active', '')).toThrowError(
      /بالفعل في حالة/,
    );
  });

  it('تمنع حالة غير معروفة', () => {
    expect(() =>
      assertTransitionAllowed('active', 'deleted', ''),
    ).toThrowError(/غير معروفة/);
  });

  it('توجب السبب عند الإيقاف', () => {
    expect(() => assertTransitionAllowed('active', 'suspended', '')).toThrowError(
      /يجب كتابة سبب/,
    );
    expect(() =>
      assertTransitionAllowed('active', 'suspended', 'توقف النشاط'),
    ).not.toThrow();
  });

  it('توجب السبب عند الرفض', () => {
    expect(() =>
      assertTransitionAllowed('under_review', 'rejected', ''),
    ).toThrowError(/يجب كتابة سبب/);
  });

  it('لا توجب السبب عند الاعتماد أو إعادة التفعيل', () => {
    expect(() =>
      assertTransitionAllowed('under_review', 'active', ''),
    ).not.toThrow();
    expect(() =>
      assertTransitionAllowed('suspended', 'active', ''),
    ).not.toThrow();
  });

  it('ترفض سبباً أطول من المسموح', () => {
    expect(() =>
      assertTransitionAllowed('active', 'suspended', 'x'.repeat(1001)),
    ).toThrowError(/أطول من المسموح/);
  });

  it('تعرض على كل حالة انتقالاتها المسموحة فقط', () => {
    expect(transitionsFrom('under_review').map((t) => t.code)).toEqual([
      'active',
      'rejected',
    ]);
    expect(transitionsFrom('active').map((t) => t.code)).toEqual(['suspended']);
    expect(transitionsFrom('suspended').map((t) => t.code)).toEqual(['active']);
    // حالة مجهولة لا تفتح أي إجراء بدل أن تفتحها جميعاً.
    expect(transitionsFrom('unknown_state')).toEqual([]);
  });

  it('تُعلم اللوحة أي الإجراءات يلزمها سبب', () => {
    const options = transitionsFrom('under_review');
    expect(options.find((t) => t.code === 'active')?.reasonRequired).toBe(false);
    expect(options.find((t) => t.code === 'rejected')?.reasonRequired).toBe(
      true,
    );
  });
});

describe('حراسة متحكّم إدارة المكلفين', () => {
  it('يرفض العمل حين تكون القاعدة غير متاحة بدل ابتلاع الفشل', async () => {
    const controller = new TaxpayerAdminController({
      isInitialized: false,
    } as never);

    await expect(
      controller.changeStatus(officerRequest(), TAXPAYER, {
        toStatus: 'active',
      }),
    ).rejects.toMatchObject({ status: 503 });
    await expect(controller.list()).rejects.toMatchObject({ status: 503 });
  });

  it('يرفض طلباً بلا سياق ممثّل', async () => {
    const controller = new TaxpayerAdminController({
      isInitialized: true,
    } as never);
    const anonymous = {} as unknown as AuthenticatedRequest;

    await expect(
      controller.changeStatus(anonymous, TAXPAYER, { toStatus: 'active' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('يرفض حالة غير معروفة قبل لمس القاعدة', async () => {
    const controller = new TaxpayerAdminController({
      isInitialized: true,
    } as never);

    await expect(
      controller.changeStatus(officerRequest(), TAXPAYER, {
        toStatus: 'deleted',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
