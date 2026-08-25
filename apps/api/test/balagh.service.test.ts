import { describe, expect, it } from 'vitest';
import type { BalaghType, CreateBalaghDraft } from '@marib-tax/contracts';
import { BalaghService, requiresFieldVisit } from '../src/balaghs/balagh.service.js';
import type {
  BalaghListItem,
  BalaghRepository,
  StoredBalagh,
} from '../src/balaghs/balagh.repository.js';

/** مستودع في الذاكرة يحاكي عقد المستودع القاعدي. */
class MemoryBalaghRepository implements BalaghRepository {
  readonly rows = new Map<string, StoredBalagh>();

  async create(balagh: StoredBalagh): Promise<void> {
    this.rows.set(balagh.id, structuredClone(balagh));
  }

  async findById(id: string): Promise<StoredBalagh | null> {
    const found = this.rows.get(id);
    return found ? structuredClone(found) : null;
  }

  async save(balagh: StoredBalagh): Promise<void> {
    this.rows.set(balagh.id, structuredClone(balagh));
  }

  async list(ownerActorId: string | undefined, limit: number): Promise<BalaghListItem[]> {
    return [...this.rows.values()]
      .filter((b) => ownerActorId === undefined || b.ownerActorId === ownerActorId)
      .slice(0, limit)
      .map((b) => ({
        id: b.id,
        publicRef: b.publicRef,
        balaghType: b.balaghType,
        status: b.status,
        createdAt: b.createdAt,
        submittedAt: b.submittedAt ?? null,
      }));
  }
}

const OWNER = 'owner-profile-1';
const OTHER = 'other-profile-2';

const ACTIVITY_ID = '11111111-1111-4111-8111-111111111111';

/** حمولة صحيحة لكل نوع — لكل نوع مخططه، ولا تُقبل حمولة نوع مكان آخر. */
const FORM_DATA_BY_TYPE: Record<BalaghType, Record<string, unknown>> = {
  'FR-201': {
    activityIds: [ACTIVITY_ID],
    stopType: 'temporary',
    stoppedAt: '2026-01-01T00:00:00.000Z',
    reason: 'إيقاف مؤقت للصيانة',
    declarationConfirmed: true,
  },
  'FR-202': {
    propertyType: 'محل تجاري',
    district: 'مأرب',
    street: 'شارع السلام',
    tenantCount: 1,
    ownershipDeclarationConfirmed: true,
  },
  'FR-203': { activityId: ACTIVITY_ID, workerCount: 1 },
  'FR-204': {
    activityId: ACTIVITY_ID,
    newAddress: { district: 'مأرب', street: 'شارع الوحدة' },
    occupancyType: 'rented',
    startedAt: '2026-01-01T00:00:00.000Z',
  },
  'FR-205': {
    propertyType: 'شقة',
    district: 'مأرب',
    rentalStatus: 'شاغر',
    priorOwnerName: 'المالك السابق',
    newOwnerName: 'المالك الجديد',
    newOwnerPhone: '+967770000000',
    newOwnerAddress: 'مأرب',
    transferType: 'بيع',
    transferDate: '2026-01-01T00:00:00.000Z',
    relationshipCode: 'seller',
  },
  'FR-206': {
    activityIds: [ACTIVITY_ID],
    startedAt: '2026-01-01T00:00:00.000Z',
    infoConfirmed: true,
  },
};

function draftOf(balaghType: BalaghType): CreateBalaghDraft {
  return {
    balaghType,
    schemaVersion: '1.0.0',
    formData: FORM_DATA_BY_TYPE[balaghType],
  } as CreateBalaghDraft;
}

function build() {
  const repository = new MemoryBalaghRepository();
  return { repository, service: new BalaghService(repository) };
}

describe('BalaghService', () => {
  it('ينشئ البلاغ بحالة مسودة ويحفظ نوعه وبياناته', async () => {
    const { service } = build();
    const created = await service.create(OWNER, draftOf('FR-203'));

    expect(created.status).toBe('draft');
    expect(created.balaghType).toBe('FR-203');
    expect(created.submittedAt).toBeNull();
    expect(created.ownerActorId).toBe(OWNER);
  });

  it('التقديم يغيّر الحالة ويثبّت وقت التقديم', async () => {
    const { service } = build();
    const created = await service.create(OWNER, draftOf('FR-201'));

    const submitted = await service.submit(OWNER, created.id);

    expect(submitted.status).toBe('submitted');
    expect(submitted.submittedAt).not.toBeNull();
  });

  it('لا يُقدَّم البلاغ مرتين', async () => {
    const { service } = build();
    const created = await service.create(OWNER, draftOf('FR-201'));
    await service.submit(OWNER, created.id);

    await expect(service.submit(OWNER, created.id)).rejects.toThrow();
  });

  it('لا يُعدَّل البلاغ بعد التقديم', async () => {
    const { service } = build();
    const created = await service.create(OWNER, draftOf('FR-203'));
    await service.submit(OWNER, created.id);

    await expect(
      service.edit(OWNER, created.id, {
        formData: { activityId: '11111111-1111-4111-8111-111111111111', workerCount: 5 },
      } as never),
    ).rejects.toThrow();
  });

  // ---- حالات الرفض: الملكية ----

  it('لا يقرأ مكلف بلاغ غيره', async () => {
    const { service } = build();
    const created = await service.create(OWNER, draftOf('FR-203'));

    await expect(service.read(OTHER, created.id)).rejects.toThrow();
  });

  it('لا يعدّل مكلف بلاغ غيره', async () => {
    const { service } = build();
    const created = await service.create(OWNER, draftOf('FR-203'));

    await expect(
      service.edit(OTHER, created.id, {
        formData: { activityId: '11111111-1111-4111-8111-111111111111', workerCount: 9 },
      } as never),
    ).rejects.toThrow();
  });

  it('لا يقدّم مكلف بلاغ غيره', async () => {
    const { service } = build();
    const created = await service.create(OWNER, draftOf('FR-203'));

    await expect(service.submit(OTHER, created.id)).rejects.toThrow();
  });

  it('بلاغ غير موجود يعطي «غير موجود» لا خطأ خادم', async () => {
    const { service } = build();
    await expect(
      service.read(OWNER, '22222222-2222-4222-8222-222222222222'),
    ).rejects.toThrow(/غير موجود/);
  });

  it('السرد المقيَّد لا يُظهر بلاغات الآخرين', async () => {
    const { service } = build();
    await service.create(OWNER, draftOf('FR-201'));
    await service.create(OWNER, draftOf('FR-203'));
    await service.create(OTHER, draftOf('FR-206'));

    const mine = await service.list(OWNER);
    const all = await service.list(undefined);

    expect(mine).toHaveLength(2);
    expect(mine.every((b) => b.balaghType !== 'FR-206')).toBe(true);
    expect(all).toHaveLength(3);
  });

  // ---- حالات الرفض: مطابقة الحمولة لنوع البلاغ ----

  it('يرفض حمولة نوع آخر تحت نوع مُعلن', async () => {
    const { service } = build();

    // FR-206 يُعالَج داخل المكتب، وFR-201 يستوجب نزولاً ميدانياً: قبول حمولة
    // أحدهما تحت اسم الآخر يوجّه البلاغ إلى مسار لا يخصّه.
    await expect(
      service.create(OWNER, {
        balaghType: 'FR-206',
        schemaVersion: '1.0.0',
        formData: FORM_DATA_BY_TYPE['FR-201'],
      } as CreateBalaghDraft),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('يرفض حمولة ناقصة الحقول الإلزامية', async () => {
    const { service } = build();

    await expect(
      service.create(OWNER, {
        balaghType: 'FR-203',
        schemaVersion: '1.0.0',
        formData: { activityId: ACTIVITY_ID },
      } as CreateBalaghDraft),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('يرفض تعديل مسودة بحمولة نوع آخر', async () => {
    const { service } = build();
    const created = await service.create(OWNER, draftOf('FR-203'));

    await expect(
      service.edit(OWNER, created.id, {
        formData: FORM_DATA_BY_TYPE['FR-202'],
      } as never),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('يقبل تعديل المسودة بحمولة نوعها نفسه', async () => {
    const { service } = build();
    const created = await service.create(OWNER, draftOf('FR-203'));

    const edited = await service.edit(OWNER, created.id, {
      formData: { activityId: ACTIVITY_ID, workerCount: 7 },
    } as never);

    expect(edited.formData).toMatchObject({ workerCount: 7 });
  });

  it('ينشئ كل نوع من الأنواع الستة بحمولته الصحيحة', async () => {
    const { service } = build();
    for (const type of Object.keys(FORM_DATA_BY_TYPE) as BalaghType[]) {
      const created = await service.create(OWNER, draftOf(type));
      expect(created.balaghType).toBe(type);
    }
  });
});

describe('requiresFieldVisit — القسم 4.4', () => {
  it('البلاغات الخمسة الأولى يتبعها نزول ميداني', () => {
    for (const type of ['FR-201', 'FR-202', 'FR-203', 'FR-204', 'FR-205'] as BalaghType[]) {
      expect(requiresFieldVisit(type)).toBe(true);
    }
  });

  it('FR-206 «تفعيل نشاط موقوف» يُعالَج داخلياً بلا نزول', () => {
    expect(requiresFieldVisit('FR-206')).toBe(false);
  });
});
