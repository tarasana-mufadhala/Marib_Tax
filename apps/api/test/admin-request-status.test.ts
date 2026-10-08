/* eslint-disable @typescript-eslint/explicit-function-return-type -- مجموعة بناء Kysely مصغّرة للاختبار */
import { describe, expect, it } from 'vitest';
import { AdminController } from '../src/admin/admin.controller.js';
import { VERIFIED_ACTOR } from '../src/authn/bearer-actor-context.resolver.js';
import type { AuthenticatedRequest } from '../src/authn/bearer-actor-context.resolver.js';

const ID = '44444444-4444-4444-4444-444444444444';
const STAFF = '55555555-5555-5555-5555-555555555555';

interface Calls {
  updates: unknown[];
  histories: unknown[];
}

/** مجموعة بناء Kysely مصغّرة: تعيد صفاً واحداً بالحالة المعطاة وتسجّل الكتابات. */
function fakeDb(currentStatus: string | null, calls: Calls): unknown {
  const trx = {
    selectFrom: () => ({
      select: () => ({
        where: () => ({
          forUpdate: () => ({
            executeTakeFirst: (): Promise<unknown> =>
              Promise.resolve(
                currentStatus ? { status_code: currentStatus } : undefined,
              ),
          }),
        }),
      }),
    }),
    updateTable: () => ({
      set: (v: unknown) => {
        calls.updates.push(v);
        return {
          where: () => ({
            returningAll: () => ({
              executeTakeFirstOrThrow: (): Promise<unknown> =>
                Promise.resolve(v),
            }),
          }),
        };
      },
    }),
    insertInto: () => ({
      values: (v: unknown) => {
        calls.histories.push(v);
        return { execute: (): Promise<void> => Promise.resolve() };
      },
    }),
  };
  return {
    isInitialized: true,
    db: {
      transaction: () => ({
        execute: (cb: (t: unknown) => Promise<unknown>): Promise<unknown> =>
          cb(trx),
      }),
    },
  };
}

function build(currentStatus: string | null): {
  controller: AdminController;
  calls: Calls;
} {
  const calls: Calls = { updates: [], histories: [] };
  const controller = new AdminController(
    fakeDb(currentStatus, calls) as never,
    {} as never,
  );
  return { controller, calls };
}

const request = {
  [VERIFIED_ACTOR]: { actorId: STAFF, permissions: [] },
} as unknown as AuthenticatedRequest;

describe('PATCH /admin/requests/:id/status', () => {
  it('يقبل انتقالاً مسموحاً ويكتب سطر السجل', async () => {
    const { controller, calls } = build('submitted');
    await controller.updateRequestStatus(
      ID,
      { status: 'under_review', notes: 'TEST' },
      request,
    );
    expect(calls.updates).toHaveLength(1);
    expect(calls.histories[0]).toMatchObject({
      from_status_code: 'submitted',
      to_status_code: 'under_review',
      changed_by_profile_id: STAFF,
      reason: 'TEST',
    });
  });

  it('يرفض قفزة غير مسموحة بـ409 بلا كتابة', async () => {
    const { controller, calls } = build('submitted');
    await expect(
      controller.updateRequestStatus(ID, { status: 'completed' }, request),
    ).rejects.toMatchObject({ status: 409 });
    expect(calls.updates).toHaveLength(0);
    expect(calls.histories).toHaveLength(0);
  });

  it('يرفض حالة غير معروفة أو تسمية عربية بـ400', async () => {
    const { controller, calls } = build('submitted');
    for (const status of ['bogus_status', 'تحت_المعالجة', '']) {
      await expect(
        controller.updateRequestStatus(ID, { status }, request),
      ).rejects.toMatchObject({ status: 400 });
    }
    expect(calls.updates).toHaveLength(0);
  });

  it('يرد 404 لطلب غير موجود', async () => {
    const { controller } = build(null);
    await expect(
      controller.updateRequestStatus(ID, { status: 'under_review' }, request),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('PATCH /admin/dues/:id/status', () => {
  function dueController(exists: boolean): AdminController {
    const db = {
      isInitialized: true,
      db: {
        selectFrom: () => ({
          select: () => ({
            where: () => ({
              executeTakeFirst: (): Promise<unknown> =>
                Promise.resolve(exists ? { status_code: 'unpaid' } : undefined),
            }),
          }),
        }),
      },
    };
    return new AdminController(db as never, {} as never);
  }

  it('يرفض حالة غير معروفة بـ400', async () => {
    await expect(
      dueController(true).updateDueStatus(ID, { status: 'bogus' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('يرد 404 لمستحق غير موجود', async () => {
    await expect(
      dueController(false).updateDueStatus(ID, { status: 'paid' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it.each(['paid', 'partially_paid', 'unpaid', 'cancelled'])(
    'يرفض تعيين %s يدوياً بـ409 بلا كتابة',
    async (status) => {
      await expect(
        dueController(true).updateDueStatus(ID, { status }),
      ).rejects.toMatchObject({ status: 409 });
    },
  );
});
