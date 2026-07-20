export type AttachmentClassification =
  'internal' | 'confidential' | 'highly_sensitive';
export type AttachmentDocumentCategory =
  | 'identity_document'
  | 'tax_document'
  | 'financial_evidence'
  | 'correspondence'
  | 'license'
  | 'supporting_document';

export const attachmentClassificationLabels: Record<
  AttachmentClassification,
  string
> = {
  internal: 'داخلي',
  confidential: 'سري',
  highly_sensitive: 'شديد الحساسية',
};

export const attachmentDocumentCategoryLabels: Record<
  AttachmentDocumentCategory,
  string
> = {
  identity_document: 'وثيقة هوية',
  tax_document: 'وثيقة ضريبية',
  financial_evidence: 'إثبات مالي',
  correspondence: 'مراسلات',
  license: 'ترخيص',
  supporting_document: 'وثيقة مؤيدة',
};
export type AttachmentArchiveState =
  'active' | 'archived' | 'legal_hold' | 'permanent_operational_archive';
export type AttachmentAvailability = 'متاح' | 'غير مصرح' | 'ملف مفقود';

export const attachmentArchiveStateLabels: Record<
  AttachmentArchiveState,
  string
> = {
  active: 'نشط',
  archived: 'مؤرشف',
  legal_hold: 'قيد الحفظ القانوني',
  permanent_operational_archive: 'أرشيف تشغيلي دائم',
};

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
  documentCategoryCode: AttachmentDocumentCategory;
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
    documentCategoryCode: 'license',
    classification: 'internal',
    archiveState: 'active',
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
    documentCategoryCode: 'financial_evidence',
    classification: 'highly_sensitive',
    archiveState: 'legal_hold',
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
    documentCategoryCode: 'correspondence',
    classification: 'confidential',
    archiveState: 'archived',
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
  documentCategories: [
    'all',
    'identity_document',
    'tax_document',
    'financial_evidence',
    'correspondence',
    'license',
    'supporting_document',
  ],
  classifications: ['all', 'internal', 'confidential', 'highly_sensitive'],
} as const;

export function filterMockAttachments(filters: {
  ownerType?: string;
  documentCategoryCode?: string;
  classification?: string;
  from?: string;
  to?: string;
}) {
  return mockAttachments.filter(
    (item) =>
      (!filters.ownerType ||
        filters.ownerType === 'الكل' ||
        item.ownerType === filters.ownerType) &&
      (!filters.documentCategoryCode ||
        filters.documentCategoryCode === 'all' ||
        item.documentCategoryCode === filters.documentCategoryCode) &&
      (!filters.classification ||
        filters.classification === 'all' ||
        item.classification === filters.classification) &&
      (!filters.from || item.updatedAt >= filters.from) &&
      (!filters.to || item.updatedAt <= filters.to),
  );
}
