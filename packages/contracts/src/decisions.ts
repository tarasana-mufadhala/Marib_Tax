import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const recordDecisionSchema = z
  .object({
    serviceRequestId: z.uuid(),
    outcomeCode: z.enum(['approved', 'rejected']),
    decisionSummary: optionalText,
    basisText: optionalText,
  })
  .strict();

export type RecordDecisionInput = z.infer<typeof recordDecisionSchema>;

export const reviseDecisionSchema = z
  .object({
    revisedOutcomeCode: z
      .enum(['approved', 'rejected'])
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    revisionSummary: optionalText,
    reason: z.string().trim().min(1),
  })
  .strict();

export type ReviseDecisionInput = z.infer<typeof reviseDecisionSchema>;

export const decisionResponseSchema = z
  .object({
    id: z.uuid(),
    serviceRequestId: z.uuid(),
    outcomeCode: z.enum(['approved', 'rejected']),
    decisionSummary: z.string().trim().min(1).nullable(),
    basisText: z.string().trim().min(1).nullable(),
    decidedAt: z.string().datetime(),
    decidedByStaffProfileId: z.uuid(),
    createdAt: z.string().datetime(),
    createdByProfileId: z.uuid().nullable(),
    correlationId: z.string().trim().min(1).nullable(),
  })
  .strict();

export type DecisionResponse = z.infer<typeof decisionResponseSchema>;

export const decisionRevisionResponseSchema = z
  .object({
    id: z.uuid(),
    decisionRecordId: z.uuid(),
    revisionNumber: z.number().int().positive(),
    revisedOutcomeCode: z.enum(['approved', 'rejected']).nullable(),
    revisionSummary: z.string().trim().min(1).nullable(),
    revisedAt: z.string().datetime(),
    revisedByStaffProfileId: z.uuid(),
    reason: z.string().trim().min(1).nullable(),
    correlationId: z.string().trim().min(1).nullable(),
    createdAt: z.string().datetime(),
  })
  .strict();

export type DecisionRevisionResponse = z.infer<
  typeof decisionRevisionResponseSchema
>;
