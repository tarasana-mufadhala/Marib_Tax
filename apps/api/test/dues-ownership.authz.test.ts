import { describe, expect, it } from 'vitest';
import { DuesPaymentsController } from '../src/dues-payments/dues-payments.controller.js';
import { VERIFIED_ACTOR } from '../src/authn/bearer-actor-context.resolver.js';
import type { AuthenticatedRequest } from '../src/authn/bearer-actor-context.resolver.js';

/**
 * `request.read` ممنوحة لكل مكلف، فلا تكفي وحدها لحماية `GET /dues/:id`.
 * بدون تقييد الملكية يقرأ أي مكلف مبالغ مستحقات غيره بمعرفة معرّفها.
 */
function requestFor(permissions: string[]): AuthenticatedRequest {
  return {
    [VERIFIED_ACTOR]: {
      actorId: '11111111-1111-1111-1111-111111111111',
      permissions,
      roleActive: true,
      assignmentActive: true,
    },
  } as unknown as AuthenticatedRequest;
}

/** يبني المتحكّم بقاعدة وهمية تُرجع ما تقرره `ownedCount`. */
function controllerWith(options: {
  ownedCount: number;
  onGetDue?: (id: string) => unknown;
}): DuesPaymentsController {
  const service = {
    getDue: (id: string) =>
      Promise.resolve(options.onGetDue?.(id) ?? { id, amount: 5000 }),
  };
  const db = {
    isInitialized: true,
    db: {},
  };

  const controller = new DuesPaymentsController(
    service as never,
    db as never,
    { requireActorId: () => '11111111-1111-1111-1111-111111111111' } as never,
  );

  // `ownsDue` يستعلم القاعدة؛ نستبدله بنتيجة معروفة لعزل قرار التصريح
  // عن SQL.
  Reflect.set(
    controller,
    'ownsDue',
    () => Promise.resolve(options.ownedCount > 0),
  );

  return controller;
}

describe('تقييد المستحقات بملكيتها', () => {
  const dueId = '22222222-2222-2222-2222-222222222222';

  it('يمنع المكلف من قراءة مستحق ليس له', async () => {
    const controller = controllerWith({ ownedCount: 0 });

    await expect(
      controller.getDue(requestFor(['request.read']), dueId),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('يسمح للمكلف بقراءة مستحقه هو', async () => {
    const controller = controllerWith({ ownedCount: 1 });

    await expect(
      controller.getDue(requestFor(['request.read']), dueId),
    ).resolves.toMatchObject({ id: dueId });
  });

  it('موظف المكتب يقرأ مستحقات الجميع بلا فحص ملكية', async () => {
    // `ownedCount: 0` يثبت أن المرور جاء من صلاحية الموظف لا من الملكية.
    const controller = controllerWith({ ownedCount: 0 });

    await expect(
      controller.getDue(requestFor(['request.read', 'due.register']), dueId),
    ).resolves.toMatchObject({ id: dueId });
  });

  it('يرد «غير موجود» لا «ممنوع» فلا يكشف أي المعرّفات حقيقية', async () => {
    const controller = controllerWith({ ownedCount: 0 });

    await expect(
      controller.getDue(requestFor(['request.read']), dueId),
    ).rejects.toMatchObject({ status: 404 });
  });
});
