import { z } from 'zod';

/**
 * الخدمات الخمس في القسم 4.3 من مستند التحليل.
 *
 * جداول المستندات أدناه منقولة حرفياً عن المستند: عمود «الإلزام» فيه هو
 * ما يحدد قبول الطلب من رفضه، ولذلك يُمثَّل هنا كقاعدة قابلة للتنفيذ
 * لا كنص إرشادي.
 */

const optionalText = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const serviceCodeSchema = z.enum([
  'FR-101',
  'FR-102',
  'FR-103',
  'FR-104',
  'FR-105',
]);

export type ServiceCode = z.infer<typeof serviceCodeSchema>;

/** نوع وثيقة الهوية التي اختارها المكلف (FR-101 و FR-105). */
export const identityDocumentTypeSchema = z.enum(['national_id', 'passport']);
export type IdentityDocumentType = z.infer<typeof identityDocumentTypeSchema>;

/**
 * شرط إلزام المستند:
 * - `required`: إلزامي دائماً.
 * - `optional`: اختياري.
 * - `company_only`: إلزامي إن كان النشاط شركة فقط.
 * - `national_id_only` / `passport_only`: إلزامي بحسب وثيقة الهوية المختارة.
 */
export const documentRequirementSchema = z.enum([
  'required',
  'optional',
  'company_only',
  'national_id_only',
  'passport_only',
]);

export type DocumentRequirement = z.infer<typeof documentRequirementSchema>;

export interface ServiceDocument {
  /** رمز المستند كما يُرسل مع المرفق. */
  code: string;
  /** التسمية العربية كما وردت في المستند. */
  label: string;
  requirement: DocumentRequirement;
  /** ملاحظة من عمود «ملاحظات» في المستند. */
  note?: string;
}

export interface ServiceDefinition {
  code: ServiceCode;
  title: string;
  /** ملاحظة القبول من عمود «ملاحظات قبول». */
  acceptanceNote: string;
  /** بعض الخدمات لا تُعرض لكل المكلفين (FR-102 مثلاً). */
  availability: 'all' | 'without_tax_number_only';
  documents: readonly ServiceDocument[];
}

const IDENTITY_DOCUMENTS: readonly ServiceDocument[] = [
  {
    code: 'national_id_front',
    label: 'الهوية الشخصية — الوجه الأمامي',
    requirement: 'national_id_only',
    note: 'بديل عن جواز السفر',
  },
  {
    code: 'national_id_back',
    label: 'الهوية الشخصية — الوجه الخلفي',
    requirement: 'national_id_only',
    note: 'بديل عن جواز السفر',
  },
  {
    code: 'passport',
    label: 'جواز السفر',
    requirement: 'passport_only',
    note: 'بديل عن البطاقة الشخصية',
  },
];

const COMPANY_DOCUMENTS: readonly ServiceDocument[] = [
  {
    code: 'articles_of_association',
    label: 'النظام الأساسي',
    requirement: 'company_only',
    note: 'للشركات فقط',
  },
  {
    code: 'incorporation_contract',
    label: 'عقد التأسيس',
    requirement: 'company_only',
    note: 'للشركات فقط',
  },
  {
    code: 'partner_identities',
    label: 'هويات الشركاء',
    requirement: 'company_only',
    note: 'بحسب عدد الشركاء — بطاقة أو جواز سفر',
  },
];

/** كتالوج الخدمات كما في القسم 4.3. */
export const serviceCatalog: Readonly<Record<ServiceCode, ServiceDefinition>> =
  Object.freeze({
    'FR-101': {
      code: 'FR-101',
      title: 'فتح ملف ضريبي',
      acceptanceNote:
        'لا يُقبل الطلب دون هوية أو جواز، وسجل تجاري، وبيانات النشاط.',
      availability: 'all',
      documents: [
        ...IDENTITY_DOCUMENTS,
        {
          code: 'lease_contract',
          label: 'عقد الإيجار',
          requirement: 'optional',
          note: 'إن كان المحل ملكاً يُرفق ما يثبت ذلك بدلاً منه',
        },
        {
          code: 'commercial_register',
          label: 'صورة السجل التجاري',
          requirement: 'required',
        },
      ],
    },

    'FR-102': {
      code: 'FR-102',
      title: 'استخراج أو طلب رقم ضريبي',
      acceptanceNote: 'تظهر فقط لمن لا يملك رقماً ضريبياً مسبقاً.',
      availability: 'without_tax_number_only',
      documents: [
        {
          code: 'trade_name_registration',
          label: 'شهادة قيد الاسم التجاري',
          requirement: 'required',
        },
        {
          code: 'practice_license',
          label: 'رخصة مزاولة مهنة',
          requirement: 'required',
        },
        {
          code: 'insurance_card',
          label: 'البطاقة التأمينية سارية المفعول',
          requirement: 'required',
        },
        ...COMPANY_DOCUMENTS,
      ],
    },

    'FR-103': {
      code: 'FR-103',
      title: 'إعادة إصدار الرقم أو البطاقة (بدل فاقد)',
      acceptanceNote:
        'قد ينتقل الطلب إلى حالة «مطلوب حضور» لتحديد الموقف الضريبي.',
      availability: 'all',
      documents: [
        {
          code: 'trade_name_registration',
          label: 'شهادة قيد الاسم التجاري',
          requirement: 'required',
        },
        {
          code: 'practice_license',
          label: 'رخصة مزاولة مهنة',
          requirement: 'required',
        },
        {
          code: 'insurance_card',
          label: 'البطاقة التأمينية سارية المفعول',
          requirement: 'required',
        },
        ...COMPANY_DOCUMENTS,
        {
          code: 'tax_card_copy',
          label: 'صورة البطاقة الضريبية',
          requirement: 'optional',
          note: 'إن وُجدت',
        },
        {
          code: 'last_tax_position',
          label: 'آخر موقف ضريبي',
          requirement: 'optional',
        },
      ],
    },

    'FR-104': {
      code: 'FR-104',
      title: 'تحديث بيانات الرقم الضريبي أو الأسماء التجارية',
      acceptanceNote: 'يجب حفظ السجل السابق والجديد معاً للمراجعة.',
      availability: 'all',
      documents: [
        {
          code: 'previous_commercial_register',
          label: 'السجل التجاري السابق',
          requirement: 'required',
        },
        {
          code: 'new_commercial_register',
          label: 'السجل التجاري الجديد',
          requirement: 'required',
        },
        {
          code: 'new_register_certificate',
          label: 'شهادة قيد السجل التجاري الجديد',
          requirement: 'required',
        },
        {
          code: 'valid_tax_card',
          label: 'صورة البطاقة الضريبية سارية المفعول',
          requirement: 'required',
        },
        {
          code: 'practice_license',
          label: 'رخصة مزاولة المهنة',
          requirement: 'required',
        },
        {
          code: 'insurance_card',
          label: 'البطاقة التأمينية سارية المفعول',
          requirement: 'required',
        },
        {
          code: 'last_tax_position',
          label: 'آخر موقف ضريبي',
          requirement: 'optional',
          note: 'إن وُجد',
        },
      ],
    },

    'FR-105': {
      code: 'FR-105',
      title: 'شهادة الضريبة العامة على المبيعات',
      acceptanceNote:
        'يُرسل للمكلف إشعار الجاهزية مع نسخة إلكترونية من الشهادة إن وُجدت.',
      availability: 'all',
      documents: [
        {
          code: 'valid_tax_card',
          label: 'بطاقة ضريبية سارية المفعول',
          requirement: 'required',
        },
        ...IDENTITY_DOCUMENTS,
        {
          code: 'trade_name_registration',
          label: 'شهادة قيد السجل التجاري',
          requirement: 'required',
        },
        {
          code: 'insurance_card',
          label: 'البطاقة التأمينية سارية المفعول',
          requirement: 'required',
        },
        {
          code: 'practice_license',
          label: 'ترخيص مزاولة المهنة',
          requirement: 'required',
        },
        ...COMPANY_DOCUMENTS,
      ],
    },
  });

/** سياق المكلف الذي تُقاس عليه الشروط المشروطة. */
export interface ServiceRequestContext {
  /** الكيان القانوني شركة (يفعّل مستندات الشركات). */
  isCompany: boolean;
  /** وثيقة الهوية المختارة، إن كانت الخدمة تطلب هوية. */
  identityDocumentType?: IdentityDocumentType | null;
}

/** هل هذا المستند إلزامي في هذا السياق؟ */
export function isDocumentMandatory(
  document: ServiceDocument,
  context: ServiceRequestContext,
): boolean {
  switch (document.requirement) {
    case 'required':
      return true;
    case 'optional':
      return false;
    case 'company_only':
      return context.isCompany;
    case 'national_id_only':
      return context.identityDocumentType === 'national_id';
    case 'passport_only':
      return context.identityDocumentType === 'passport';
  }
}

/**
 * المستندات الإلزامية الناقصة. مصفوفة فارغة تعني أن الطلب مستوفٍ.
 *
 * هذه هي قاعدة القبول في عمود «ملاحظات قبول»؛ تُطبَّق على الخادم عند
 * التقديم، ويستعملها التطبيق أيضاً ليُظهر للمكلف ما ينقصه قبل الإرسال.
 */
export function missingRequiredDocuments(
  serviceCode: ServiceCode,
  context: ServiceRequestContext,
  providedDocumentCodes: readonly string[],
): ServiceDocument[] {
  const provided = new Set(providedDocumentCodes);
  return serviceCatalog[serviceCode].documents.filter(
    (document) =>
      isDocumentMandatory(document, context) && !provided.has(document.code),
  );
}

/** الخدمات المتاحة لمكلف بحسب امتلاكه رقماً ضريبياً (ملاحظة القسم 4.2). */
export function availableServices(hasTaxNumber: boolean): ServiceDefinition[] {
  return Object.values(serviceCatalog).filter(
    (service) =>
      service.availability === 'all' ||
      (service.availability === 'without_tax_number_only' && !hasTaxNumber),
  );
}

// ---------------------------------------------------------------------------
// نماذج الخدمات
// ---------------------------------------------------------------------------

/** FR-101: «بيانات النشاط التجاري» تُعبَّأ داخل التطبيق. */
export const fr101FormSchema = z
  .object({
    identityDocumentType: identityDocumentTypeSchema,
    activityName: z.string().trim().min(1),
    activityDescription: optionalText,
    commercialRegisterNumber: z.string().trim().min(1),
    district: z.string().trim().min(1),
    street: z.string().trim().min(1),
    nearbyLandmark: optionalText,
    premisesOwnership: z.enum(['owned', 'rented']),
    startedAt: z.string().datetime(),
    employeeCount: z.number().int().nonnegative().nullable().optional()
      .transform((value) => value ?? null),
    notes: optionalText,
  })
  .strict();

export const fr102FormSchema = z
  .object({
    tradeNameRegistrationNumber: z.string().trim().min(1),
    practiceLicenseNumber: z.string().trim().min(1),
    insuranceCardNumber: optionalText,
    isCompany: z.boolean(),
    partnerCount: z.number().int().nonnegative().nullable().optional()
      .transform((value) => value ?? null),
    notes: optionalText,
  })
  .strict();

export const fr103FormSchema = z
  .object({
    lossReason: z.string().trim().min(1),
    previousTaxNumber: optionalText,
    isCompany: z.boolean(),
    notes: optionalText,
  })
  .strict();

export const fr104FormSchema = z
  .object({
    previousRegisterNumber: z.string().trim().min(1),
    newRegisterNumber: z.string().trim().min(1),
    previousTradeName: z.string().trim().min(1),
    newTradeName: z.string().trim().min(1),
    changeReason: z.string().trim().min(1),
    isCompany: z.boolean(),
    notes: optionalText,
  })
  .strict();

export const fr105FormSchema = z
  .object({
    identityDocumentType: identityDocumentTypeSchema,
    taxCardNumber: z.string().trim().min(1),
    purpose: z.string().trim().min(1),
    isCompany: z.boolean(),
    notes: optionalText,
  })
  .strict();

export type Fr101Form = z.infer<typeof fr101FormSchema>;
export type Fr102Form = z.infer<typeof fr102FormSchema>;
export type Fr103Form = z.infer<typeof fr103FormSchema>;
export type Fr104Form = z.infer<typeof fr104FormSchema>;
export type Fr105Form = z.infer<typeof fr105FormSchema>;

/**
 * اتحاد مميَّز بـ `serviceCode`: كل خدمة تُطابَق بنموذجها هي فقط، فلا يمكن
 * إرسال نموذج FR-104 تحت رمز FR-101.
 */
export const createServiceRequestSchema = z.discriminatedUnion('serviceCode', [
  z.object({
    serviceCode: z.literal('FR-101'),
    schemaVersion: z.literal('1.0.0'),
    form: fr101FormSchema,
  }).strict(),
  z.object({
    serviceCode: z.literal('FR-102'),
    schemaVersion: z.literal('1.0.0'),
    form: fr102FormSchema,
  }).strict(),
  z.object({
    serviceCode: z.literal('FR-103'),
    schemaVersion: z.literal('1.0.0'),
    form: fr103FormSchema,
  }).strict(),
  z.object({
    serviceCode: z.literal('FR-104'),
    schemaVersion: z.literal('1.0.0'),
    form: fr104FormSchema,
  }).strict(),
  z.object({
    serviceCode: z.literal('FR-105'),
    schemaVersion: z.literal('1.0.0'),
    form: fr105FormSchema,
  }).strict(),
]);

export type CreateServiceRequest = z.infer<typeof createServiceRequestSchema>;

export const editServiceRequestSchema = z
  .object({
    form: z.union([
      fr101FormSchema,
      fr102FormSchema,
      fr103FormSchema,
      fr104FormSchema,
      fr105FormSchema,
    ]),
  })
  .strict();

export type EditServiceRequest = z.infer<typeof editServiceRequestSchema>;

/** حالات الطلب كما في القسم 4.6. */
export const serviceRequestStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'need_more_info',
  'field_visit_scheduled',
  'field_visit_done',
  'payment_required',
  'ready_for_pickup',
  'approved',
  'completed',
  'rejected',
  'archived',
  'cancelled',
]);

export type ServiceRequestStatus = z.infer<typeof serviceRequestStatusSchema>;

export interface ServiceRequestResponse {
  id: string;
  publicRef: string | null;
  serviceCode: ServiceCode;
  schemaVersion: '1.0.0';
  status: ServiceRequestStatus;
  form: unknown;
  ownerActorId: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export interface ServiceRequestListItem {
  id: string;
  publicRef: string | null;
  serviceCode: ServiceCode;
  serviceTitle: string;
  status: ServiceRequestStatus;
  createdAt: string;
  submittedAt: string | null;
}
