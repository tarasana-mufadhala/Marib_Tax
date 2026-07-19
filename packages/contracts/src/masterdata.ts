import { z } from 'zod';

export const commercialActivitySummarySchema = z
  .object({
    id: z.uuid(),
    publicRef: z.string().trim().min(1).nullable(),
    taxpayerId: z.uuid(),
    name: z.string().trim().min(1),
    statusCode: z.string().trim().min(1),
  })
  .strict();

export type CommercialActivitySummary = z.infer<
  typeof commercialActivitySummarySchema
>;

export const branchSummarySchema = z
  .object({
    id: z.uuid(),
    publicRef: z.string().trim().min(1).nullable(),
    commercialActivityId: z.uuid(),
    name: z.string().trim().min(1),
    statusCode: z.string().trim().min(1),
  })
  .strict();

export type BranchSummary = z.infer<typeof branchSummarySchema>;

export const activityAddressSummarySchema = z
  .object({
    id: z.uuid(),
    commercialActivityId: z.uuid().nullable(),
    branchId: z.uuid().nullable(),
    addressLine: z.string().trim().min(1).nullable(),
    districtCode: z.string().trim().min(1).nullable(),
    effectiveFrom: z.string().datetime(),
    effectiveTo: z.string().datetime().nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.commercialActivityId === null && value.branchId === null) {
      context.addIssue({
        code: 'custom',
        message: 'Address must reference an activity or a branch.',
        path: ['commercialActivityId'],
      });
    }
  });

export type ActivityAddressSummary = z.infer<
  typeof activityAddressSummarySchema
>;

export const propertySummarySchema = z
  .object({
    id: z.uuid(),
    publicRef: z.string().trim().min(1).nullable(),
    statusCode: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable(),
  })
  .strict();

export type PropertySummary = z.infer<typeof propertySummarySchema>;

export const propertyOwnershipSummarySchema = z
  .object({
    id: z.uuid(),
    propertyId: z.uuid(),
    taxpayerId: z.uuid(),
    partyRoleCode: z.string().trim().min(1),
    isCurrent: z.boolean(),
    effectiveFrom: z.string().datetime(),
    effectiveTo: z.string().datetime().nullable(),
  })
  .strict();

export type PropertyOwnershipSummary = z.infer<
  typeof propertyOwnershipSummarySchema
>;

export const ownedMasterdataBundleSchema = z
  .object({
    activities: z.array(commercialActivitySummarySchema),
    branches: z.array(branchSummarySchema),
    addresses: z.array(activityAddressSummarySchema),
    properties: z.array(propertySummarySchema),
    ownershipRecords: z.array(propertyOwnershipSummarySchema),
  })
  .strict();

export type OwnedMasterdataBundle = z.infer<typeof ownedMasterdataBundleSchema>;

/** DM-16 field keys for activity/property reports 8, 13–14. */
export const masterdataReportFieldKeys = [
  'activity_id',
  'activity_type_code',
  'status_code',
  'area_code',
  'address_changed_flag',
  'taxpayer_id',
  'stoppage_at',
  'reactivated_at',
  'tax_number_value',
] as const;

export type MasterdataReportFieldKey =
  (typeof masterdataReportFieldKeys)[number];
