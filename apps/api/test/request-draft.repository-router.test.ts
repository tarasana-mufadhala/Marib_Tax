import { describe, expect, it } from 'vitest';
import { RequestDraftRepositoryRouter } from '../src/requests/request-draft.repository-router.js';
import { RequestDraftMemoryRepository } from '../src/requests/request-draft.memory-repository.js';
import type { StoredRequestDraft } from '../src/requests/request-draft.repository.js';
import type { RequestDraftKyselyRepository } from '../src/requests/request-draft.kysely-repository.js';
import type { DatabaseService } from '../src/database/database.service.js';

/**
 * الموجّه يجب أن يختار المخزن **عند كل نداء**.
 *
 * `DatabaseService` يتصل في `onModuleInit`، أي بعد بناء مزوّدات الوحدة.
 * أي قرار يُتخذ وقت الإقلاع يثبّت مخزن الذاكرة إلى الأبد، فتُنشأ الطلبات
 * في RAM: تضيع بإعادة التشغيل، ولا تظهر لموظفي المكتب (يقرأون من القاعدة)،
 * ولا يمكن ربط مرفق بها. هذا ما وقع فعلاً وتكشفه هذه الاختبارات.
 */

const draft: StoredRequestDraft = {
  id: '3f1c1d3e-6a4b-4c2e-9d5f-1a2b3c4d5e6f',
  ownerActorId: 'owner-1',
  status: 'draft',
  form: {
    serviceType: 'activity_address_change',
    schemaVersion: '1.0.0',
    data: { targets: [] },
  },
  createdAt: '2026-08-09T10:00:00.000Z',
  updatedAt: '2026-08-09T10:00:00.000Z',
};

/** قاعدة يمكن تبديل حالتها بعد الإنشاء، كما يحدث فعلياً عند الإقلاع. */
function mutableDatabase(initial: boolean) {
  const state = { isInitialized: initial };
  return state as unknown as DatabaseService & { isInitialized: boolean };
}

function spyRepository() {
  const calls: string[] = [];
  const repository = {
    create: async () => { calls.push('create'); },
    findById: async () => { calls.push('findById'); return null; },
    save: async () => { calls.push('save'); },
  } as unknown as RequestDraftKyselyRepository;
  return { repository, calls };
}

describe('RequestDraftRepositoryRouter', () => {
  it('يستعمل القاعدة حين تكون مهيأة', async () => {
    const db = mutableDatabase(true);
    const persistent = spyRepository();
    const memory = new RequestDraftMemoryRepository();
    const router = new RequestDraftRepositoryRouter(db, persistent.repository, memory);

    await router.create(draft);
    await router.findById(draft.id);
    await router.save(draft);

    expect(persistent.calls).toEqual(['create', 'findById', 'save']);
    // لم يمس الذاكرة إطلاقاً
    expect(await memory.findById(draft.id)).toBeNull();
  });

  it('يستعمل الذاكرة حين تكون القاعدة غير مهيأة', async () => {
    const db = mutableDatabase(false);
    const persistent = spyRepository();
    const memory = new RequestDraftMemoryRepository();
    const router = new RequestDraftRepositoryRouter(db, persistent.repository, memory);

    await router.create(draft);

    expect(persistent.calls).toEqual([]);
    expect(await memory.findById(draft.id)).not.toBeNull();
  });

  it('ينتقل إلى القاعدة فور تهيئتها بعد الإقلاع — لا يثبّت الاختيار', async () => {
    const db = mutableDatabase(false);
    const persistent = spyRepository();
    const memory = new RequestDraftMemoryRepository();
    const router = new RequestDraftRepositoryRouter(db, persistent.repository, memory);

    // نداء قبل اتصال القاعدة
    await router.findById(draft.id);
    expect(persistent.calls).toEqual([]);

    // القاعدة اتصلت (onModuleInit)
    db.isInitialized = true;

    await router.create(draft);
    expect(persistent.calls).toEqual(['create']);
  });

  it('يرجع إلى الذاكرة إن سقطت القاعدة أثناء التشغيل', async () => {
    const db = mutableDatabase(true);
    const persistent = spyRepository();
    const memory = new RequestDraftMemoryRepository();
    const router = new RequestDraftRepositoryRouter(db, persistent.repository, memory);

    await router.create(draft);
    expect(persistent.calls).toEqual(['create']);

    db.isInitialized = false;
    await router.save(draft);

    expect(persistent.calls).toEqual(['create']);
    expect(await memory.findById(draft.id)).not.toBeNull();
  });
});
