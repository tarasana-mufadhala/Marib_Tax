import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const requestTargetSchema = z
  .object({
    activityId: z.uuid(),
    branchId: z
      .uuid()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    newAddress: z
      .object({
        district: z.string().trim().min(1),
        street: z.string().trim().min(1),
        neighborhood: optionalText,
        buildingNumber: optionalText,
        nearbyLandmark: optionalText,
      })
      .strict(),
  })
  .strict();

const targetsSchema = z
  .array(requestTargetSchema)
  .min(1)
  .superRefine((targets, context) => {
    const seen = new Set<string>();
    targets.forEach((target, index) => {
      const key = `${target.activityId}:${target.branchId ?? ''}`;
      if (seen.has(key))
        context.addIssue({
          code: 'custom',
          message: 'Duplicate activity and branch target.',
          path: [index],
        });
      seen.add(key);
    });
  });

export const createActivityAddressChangeDraftSchema = z
  .object({
    serviceType: z.literal('activity_address_change'),
    schemaVersion: z.literal('1.0.0'),
    targets: targetsSchema,
  })
  .strict();

export const editActivityAddressChangeDraftSchema = z
  .object({ targets: targetsSchema })
  .strict();

export type CreateActivityAddressChangeDraft = z.infer<
  typeof createActivityAddressChangeDraftSchema
>;
export type EditActivityAddressChangeDraft = z.infer<
  typeof editActivityAddressChangeDraftSchema
>;
export type ActivityAddressChangeTarget = z.infer<typeof requestTargetSchema>;

export interface ActivityAddressChangeRequestResponse {
  id: string;
  status: 'draft' | 'submitted';
  form: {
    serviceType: 'activity_address_change';
    schemaVersion: '1.0.0';
    data: { targets: ActivityAddressChangeTarget[] };
  };
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}
