import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

// FR-201: إيقاف نشاط
export const balagh201Schema = z
  .object({
    activityIds: z.array(z.uuid()).min(1),
    branchIds: z
      .array(z.uuid())
      .optional()
      .transform((value) => value ?? []),
    stopType: z.enum(['temporary', 'permanent']),
    stoppedAt: z.string().datetime(),
    reason: z.string().trim().min(1),
    lastWorkingDay: optionalText,
    siteStatus: optionalText,
    hasGoodsOrEquipment: z
      .boolean()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    siteOccupancyType: optionalText,
    rentalStatus: optionalText,
    hasEmployees: z
      .boolean()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    notes: optionalText,
    declarationConfirmed: z.literal(true),
  })
  .strict();

export type Balagh201Data = z.infer<typeof balagh201Schema>;

// FR-202: خروج مستأجر/إخلاء عقار
export const balagh202Schema = z
  .object({
    propertyType: z.string().trim().min(1),
    district: z.string().trim().min(1),
    street: z.string().trim().min(1),
    locationSnapshot: optionalText,
    notes: optionalText,
    ownershipDeclarationConfirmed: z.literal(true),
    tenantCount: z.number().int().nonnegative(),
  })
  .strict();

export type Balagh202Data = z.infer<typeof balagh202Schema>;

// FR-203: خروج عامل
export const balagh203Schema = z
  .object({
    activityId: z.uuid(),
    branchId: optionalText,
    workerCount: z.number().int().nonnegative(),
  })
  .strict();

export type Balagh203Data = z.infer<typeof balagh203Schema>;

// FR-204: تغيير عنوان النشاط
export const balagh204Schema = z
  .object({
    activityId: z.uuid(),
    branchId: optionalText,
    newAddress: z
      .object({
        district: z.string().trim().min(1),
        street: z.string().trim().min(1),
        neighborhood: optionalText,
        buildingNumber: optionalText,
        nearbyLandmark: optionalText,
        gpsLocation: optionalText,
      })
      .strict(),
    occupancyType: z.string().trim().min(1), // e.g. rented, owned
    landlordName: optionalText,
    startedAt: z.string().datetime(),
  })
  .strict();

export type Balagh204Data = z.infer<typeof balagh204Schema>;

// FR-205: نقل ملكية عقار
export const balagh205Schema = z
  .object({
    propertyType: z.string().trim().min(1),
    district: z.string().trim().min(1),
    neighborhood: optionalText,
    rentalStatus: z.string().trim().min(1),
    description: optionalText,
    gpsLocation: optionalText,
    unitCount: z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    priorOwnerName: z.string().trim().min(1),
    newOwnerName: z.string().trim().min(1),
    newOwnerPhone: z.string().trim().min(1),
    newOwnerAddress: z.string().trim().min(1),
    newOwnerNationalId: optionalText,
    newOwnerTaxNumber: optionalText,
    transferType: z.string().trim().min(1),
    transferDate: z.string().datetime(),
    documentNumber: optionalText,
    issuingAuthority: optionalText,
    deliveryConfirmed: z
      .boolean()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    relationshipCode: z.string().trim().min(1),
  })
  .strict();

export type Balagh205Data = z.infer<typeof balagh205Schema>;

// FR-206: تفعيل نشاط موقوف
export const balagh206Schema = z
  .object({
    activityIds: z.array(z.uuid()).min(1),
    priorStopReferenceNumber: optionalText,
    priorStopDate: optionalText,
    startedAt: z.string().datetime(),
    reason: optionalText,
    infoConfirmed: z.literal(true),
  })
  .strict();

export type Balagh206Data = z.infer<typeof balagh206Schema>;

export const balaghTypeSchema = z.enum([
  'FR-201',
  'FR-202',
  'FR-203',
  'FR-204',
  'FR-205',
  'FR-206',
]);

export type BalaghType = z.infer<typeof balaghTypeSchema>;

export const createBalaghDraftSchema = z
  .object({
    balaghType: balaghTypeSchema,
    schemaVersion: z.literal('1.0.0'),
    formData: z.union([
      balagh201Schema,
      balagh202Schema,
      balagh203Schema,
      balagh204Schema,
      balagh205Schema,
      balagh206Schema,
    ]),
  })
  .strict();

export type CreateBalaghDraft = z.infer<typeof createBalaghDraftSchema>;

export const editBalaghDraftSchema = z
  .object({
    formData: z.union([
      balagh201Schema,
      balagh202Schema,
      balagh203Schema,
      balagh204Schema,
      balagh205Schema,
      balagh206Schema,
    ]),
  })
  .strict();

export type EditBalaghDraft = z.infer<typeof editBalaghDraftSchema>;

export interface BalaghResponse {
  id: string;
  publicRef: string | null;
  status:
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'field_visit_scheduled'
    | 'field_visit_completed'
    | 'approved'
    | 'rejected'
    | 'archived';
  balaghType: BalaghType;
  schemaVersion: '1.0.0';
  formData: CreateBalaghDraft['formData'];
  ownerActorId: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
}
