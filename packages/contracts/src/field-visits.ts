import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const scheduleFieldVisitSchema = z
  .object({
    serviceRequestId: z.uuid().nullable().optional().transform((value) => value ?? null),
    balaghId: z.uuid().nullable().optional().transform((value) => value ?? null),
    scheduledStartAt: z.string().datetime(),
    scheduledEndAt: z.string().datetime(),
    teamMemberStaffIds: z.array(z.uuid()).min(1),
    locationSnapshot: optionalText,
    notes: optionalText,
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasRequest = !!data.serviceRequestId;
    const hasBalagh = !!data.balaghId;
    if ((hasRequest && hasBalagh) || (!hasRequest && !hasBalagh)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Exact-one parent context (serviceRequestId XOR balaghId) is required.',
      });
    }
  });

export type ScheduleFieldVisitInput = z.infer<typeof scheduleFieldVisitSchema>;

export const recordFieldVisitResultSchema = z
  .object({
    resultSummary: z.string().trim().min(1),
    resultCode: optionalText,
    actualStartedAt: z.string().datetime(),
    actualEndedAt: z.string().datetime(),
  })
  .strict();

export type RecordFieldVisitResultInput = z.infer<typeof recordFieldVisitResultSchema>;

export const cancelFieldVisitSchema = z
  .object({
    reason: z.string().trim().min(1),
  })
  .strict();

export type CancelFieldVisitInput = z.infer<typeof cancelFieldVisitSchema>;

export const fieldVisitResponseSchema = z
  .object({
    id: z.uuid(),
    publicRef: z.string().trim().min(1).nullable(),
    serviceRequestId: z.uuid().nullable(),
    balaghId: z.uuid().nullable(),
    statusCode: z.enum(['scheduled', 'completed', 'cancelled']),
    actualStartedAt: z.string().datetime().nullable(),
    actualEndedAt: z.string().datetime().nullable(),
    locationSnapshot: z.string().trim().min(1).nullable(),
    notes: z.string().trim().min(1).nullable(),
    cancellationReason: z.string().trim().min(1).nullable(),
    createdByStaffProfileId: z.uuid(),
    createdByProfileId: z.uuid().nullable(),
    updatedAt: z.string().datetime().nullable(),
    updatedByProfileId: z.uuid().nullable(),
    archivedAt: z.string().datetime().nullable(),
  })
  .strict();

export type FieldVisitResponse = z.infer<typeof fieldVisitResponseSchema>;

export const fieldVisitResultResponseSchema = z
  .object({
    id: z.uuid(),
    fieldVisitId: z.uuid(),
    resultSummary: z.string().trim().min(1).nullable(),
    resultCode: z.string().trim().min(1).nullable(),
    recordedAt: z.string().datetime(),
    recordedByStaffProfileId: z.uuid(),
  })
  .strict();

export type FieldVisitResultResponse = z.infer<typeof fieldVisitResultResponseSchema>;
