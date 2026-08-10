import { describe, expect, it } from 'vitest';
import type {
  CreateServiceRequest,
  ServiceRequestListItem,
} from '@marib-tax/contracts';
import { ServiceRequestService } from '../src/service-requests/service-request.service.js';
import type {
  ServiceRequestRepository,
  StoredServiceRequest,
} from '../src/service-requests/service-request.repository.js';

const OWNER = 'owner-1';
const OTHER = 'other-2';

/** مستودع في الذاكرة يحاكي عقد المستودع القاعدي. */
class MemoryRepository implements ServiceRequestRepository {
  readonly rows = new Map<string, StoredServiceRequest>();
  documents: string[] = [];
  company = false;
  taxNumber = false;

  async create(request: StoredServiceRequest): Promise<void> {
    this.rows.set(request.id, structuredClone(request));
  }

  async findById(id: string): Promise<StoredServiceRequest | null> {
    const found = this.rows.get(id);
    return found ? structuredClone(found) : null;
  }

  async save(request: StoredServiceRequest): Promise<void> {
    this.rows.set(request.id, structuredClone(request));
  }

  async list(ownerActorId: string | undefined, limit: number): Promise<ServiceRequestListItem[]> {
    return [...this.rows.values()]
      .filter((r) => ownerActorId === undefined || r.ownerActorId === ownerActorId)
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        publicRef: r.publicRef,
        serviceCode: r.serviceCode,
        serviceTitle: r.serviceCode,
        status: r.status,
        createdAt: r.createdAt,
        submittedAt: r.submittedAt,
      }));
  }

  async attachedDocumentCodes(): Promise<string[]> {
    return this.documents;
  }

  async isCompanyTaxpayer(): Promise<boolean> {
    return this.company;
  }

  async hasTaxNumber(): Promise<boolean> {
    return this.taxNumber;
  }

  async serviceCodeOf(id: string) {
    return this.rows.get(id)?.serviceCode ?? null;
  }
}

const FR101: CreateServiceRequest = {
  serviceCode: 'FR-101',
  schemaVersion: '1.0.0',
  form: {
    identityDocumentType: 'national_id',
    activityName: 'بقالة النور',
    activityDescription: null,
    commercialRegisterNumber: 'CR-1',
    district: 'الوادي',
    street: 'الشارع العام',
    nearbyLandmark: null,
    premisesOwnership: 'rented',
    startedAt: '2026-01-01T00:00:00.000Z',
    employeeCount: null,
    notes: null,
  },
};

const FR102: CreateServiceRequest = {
  serviceCode: 'FR-102',
  schemaVersion: '1.0.0',
  form: {
    tradeNameRegistrationNumber: 'TN-1',
    practiceLicenseNumber: 'PL-1',
    insuranceCardNumber: null,
    isCompany: false,
    partnerCount: null,
    notes: null,
  },
};

function build() {
  const repository = new MemoryRepository();
  return { repository, service: new ServiceRequestService(repository) };
}

describe('ServiceRequestService — قاعدة قبول المستندات', () => {
  it('لا يُقدَّم FR-101 قبل إرفاق الهوية والسجل التجاري', async () => {
    const { service } = build();
    const created = await service.create(OWNER, FR101);

    await expect(service.submit(OWNER, created.id)).rejects.toThrow();
  });

  it('يُذكر للمكلف ما ينقصه بالتحديد', async () => {
    const { service } = build();
    const created = await service.create(OWNER, FR101);

    const missing = await service.missingDocuments(OWNER, created.id);
    const codes = missing.map((d) => d.code);

    expect(codes).toContain('national_id_front');
    expect(codes).toContain('commercial_register');
    // عقد الإيجار اختياري
    expect(codes).not.toContain('lease_contract');
    // الجواز بديل لم يُختَر
    expect(codes).not.toContain('passport');
    expect(missing[0]?.label).not.toBe('');
  });

  it('يُقدَّم بعد استيفاء المستندات الإلزامية', async () => {
    const { repository, service } = build();
    const created = await service.create(OWNER, FR101);
    repository.documents = ['national_id_front', 'national_id_back', 'commercial_register'];

    const submitted = await service.submit(OWNER, created.id);

    expect(submitted.status).toBe('submitted');
    expect(submitted.submittedAt).not.toBeNull();
  });

  it('الشركة تحتاج مستندات إضافية لا يحتاجها الفرد', async () => {
    const { repository, service } = build();
    const created = await service.create(OWNER, FR102);
    repository.documents = ['trade_name_registration', 'practice_license', 'insurance_card'];

    // فرد: مستوفٍ
    expect(await service.missingDocuments(OWNER, created.id)).toEqual([]);

    // شركة: تنقصه مستندات الشركات
    repository.company = true;
    const missing = await service.missingDocuments(OWNER, created.id);
    expect(missing.map((d) => d.code)).toEqual([
      'articles_of_association',
      'incorporation_contract',
      'partner_identities',
    ]);
    await expect(service.submit(OWNER, created.id)).rejects.toThrow();
  });
});

describe('ServiceRequestService — إتاحة الخدمات', () => {
  it('FR-102 تظهر لمن لا يملك رقماً ضريبياً وتُخفى عمّن يملكه', async () => {
    const { repository, service } = build();

    repository.taxNumber = false;
    expect((await service.catalogFor(OWNER)).map((s) => s.code)).toContain('FR-102');

    repository.taxNumber = true;
    expect((await service.catalogFor(OWNER)).map((s) => s.code)).not.toContain('FR-102');
  });

  it('إنشاء FR-102 يُرفض على الخادم لمن يملك رقماً ضريبياً', async () => {
    const { repository, service } = build();
    repository.taxNumber = true;

    await expect(service.create(OWNER, FR102)).rejects.toThrow();
  });
});

describe('ServiceRequestService — الملكية وحالات الرفض', () => {
  it('لا يقرأ مكلف طلب غيره', async () => {
    const { service } = build();
    const created = await service.create(OWNER, FR101);

    await expect(service.read(OTHER, created.id)).rejects.toThrow();
  });

  it('لا يعدّل مكلف طلب غيره', async () => {
    const { service } = build();
    const created = await service.create(OWNER, FR101);

    await expect(
      service.edit(OTHER, created.id, { form: FR101.form } as never),
    ).rejects.toThrow();
  });

  it('لا يقدّم مكلف طلب غيره', async () => {
    const { repository, service } = build();
    const created = await service.create(OWNER, FR101);
    repository.documents = ['national_id_front', 'national_id_back', 'commercial_register'];

    await expect(service.submit(OTHER, created.id)).rejects.toThrow();
  });

  it('لا يُعدَّل الطلب بعد تقديمه', async () => {
    const { repository, service } = build();
    const created = await service.create(OWNER, FR101);
    repository.documents = ['national_id_front', 'national_id_back', 'commercial_register'];
    await service.submit(OWNER, created.id);

    await expect(
      service.edit(OWNER, created.id, { form: FR101.form } as never),
    ).rejects.toThrow();
  });

  it('لا يُقدَّم الطلب مرتين', async () => {
    const { repository, service } = build();
    const created = await service.create(OWNER, FR101);
    repository.documents = ['national_id_front', 'national_id_back', 'commercial_register'];
    await service.submit(OWNER, created.id);

    await expect(service.submit(OWNER, created.id)).rejects.toThrow();
  });

  it('طلب غير موجود يعطي «غير موجود»', async () => {
    const { service } = build();
    await expect(
      service.read(OWNER, '33333333-3333-4333-8333-333333333333'),
    ).rejects.toThrow(/غير موجود/);
  });

  it('السرد المقيَّد لا يُظهر طلبات الآخرين', async () => {
    const { service } = build();
    await service.create(OWNER, FR101);
    await service.create(OTHER, FR102);

    expect(await service.list(OWNER)).toHaveLength(1);
    expect(await service.list(undefined)).toHaveLength(2);
  });
});
