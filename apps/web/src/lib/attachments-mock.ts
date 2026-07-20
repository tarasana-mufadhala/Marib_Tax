export type AttachmentClassification =
  'عام' | 'داخلي' | 'سري' | 'شديد الحساسية';
export type AttachmentArchiveState = 'نشط' | 'مؤرشف' | 'قيد الحفظ الدائم';
export type AttachmentAvailability = 'متاح' | 'غير مصرح' | 'ملف مفقود';

export interface MockAttachmentVersion {
  version: number;
  filename: string;
  createdAt: string;
  createdBy: string;
  note: string;
}

export interface MockAttachment {
  id: string;
  filename: string;
  ownerType: 'طلب' | 'بلاغ' | 'مكلف' | 'نشاط';
  ownerLabel: string;
  category: 'هوية' | 'إثبات مالي' | 'مراسلات' | 'ترخيص';
  classification: AttachmentClassification;
  archiveState: AttachmentArchiveState;
  availability: AttachmentAvailability;
  mimeType: string;
  sizeLabel: string;
  updatedAt: string;
  versions: MockAttachmentVersion[];
}

/** بيانات عرض محلية ثابتة؛ لا تحتوي مسارات تخزين أو روابط تنزيل. */
export const mockAttachments: readonly MockAttachment[] = [
  {
    id: 'ATT-MOCK-1042',
    filename: 'السجل-التجاري.pdf',
    ownerType: 'طلب',
    ownerLabel: 'طلب تعديل بيانات · REQ-MOCK-214',
    category: 'ترخيص',
    classification: 'داخلي',
    archiveState: 'نشط',
    availability: 'متاح',
    mimeType: 'application/pdf',
    sizeLabel: '1.8 م.ب',
    updatedAt: '2026-07-18',
    versions: [
      {
        version: 2,
        filename: 'السجل-التجاري-مصحح.pdf',
        createdAt: '2026-07-18',
        createdBy: 'موظف المراجعة',
        note: 'تصحيح وضوح الصفحة الثانية',
      },
      {
        version: 1,
        filename: 'السجل-التجاري.pdf',
        createdAt: '2026-07-16',
        createdBy: 'المكلف',
        note: 'النسخة الأصلية',
      },
    ],
  },
  {
    id: 'ATT-MOCK-1037',
    filename: 'كشف-الحساب.xlsx',
    ownerType: 'مكلف',
    ownerLabel: 'شركة مأرب التجريبية · TAX-MOCK-031',
    category: 'إثبات مالي',
    classification: 'شديد الحساسية',
    archiveState: 'قيد الحفظ الدائم',
    availability: 'غير مصرح',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeLabel: '640 ك.ب',
    updatedAt: '2026-07-15',
    versions: [
      {
        version: 1,
        filename: 'كشف-الحساب.xlsx',
        createdAt: '2026-07-15',
        createdBy: 'المكلف',
        note: 'مرفق للإثبات فقط',
      },
    ],
  },
  {
    id: 'ATT-MOCK-1029',
    filename: 'خطاب-متابعة.pdf',
    ownerType: 'بلاغ',
    ownerLabel: 'بلاغ ميداني · BAL-MOCK-088',
    category: 'مراسلات',
    classification: 'سري',
    archiveState: 'مؤرشف',
    availability: 'ملف مفقود',
    mimeType: 'application/pdf',
    sizeLabel: '—',
    updatedAt: '2026-07-08',
    versions: [
      {
        version: 1,
        filename: 'خطاب-متابعة.pdf',
        createdAt: '2026-07-08',
        createdBy: 'موظف البلاغات',
        note: 'مرجع العرض المحلي',
      },
    ],
  },
];

export const attachmentFilterOptions = {
  ownerTypes: ['الكل', 'طلب', 'بلاغ', 'مكلف', 'نشاط'],
  categories: ['الكل', 'هوية', 'إثبات مالي', 'مراسلات', 'ترخيص'],
  classifications: ['الكل', 'عام', 'داخلي', 'سري', 'شديد الحساسية'],
} as const;

export function filterMockAttachments(filters: {
  ownerType?: string;
  category?: string;
  classification?: string;
  from?: string;
  to?: string;
}) {
  return mockAttachments.filter(
    (item) =>
      (!filters.ownerType ||
        filters.ownerType === 'الكل' ||
        item.ownerType === filters.ownerType) &&
      (!filters.category ||
        filters.category === 'الكل' ||
        item.category === filters.category) &&
      (!filters.classification ||
        filters.classification === 'الكل' ||
        item.classification === filters.classification) &&
      (!filters.from || item.updatedAt >= filters.from) &&
      (!filters.to || item.updatedAt <= filters.to),
  );
}
