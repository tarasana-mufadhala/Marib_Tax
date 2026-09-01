import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const dueStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'CANCELLED',
  'CORRECTED',
]);
export type DueStatus = z.infer<typeof dueStatusSchema>;

export const receiptStatusSchema = z.enum([
  'UPLOADED',
  'VERIFIED',
  'REJECTED',
  'REPLACED',
]);
export type ReceiptStatus = z.infer<typeof receiptStatusSchema>;

export const confirmationStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'REJECTED',
]);
export type ConfirmationStatus = z.infer<typeof confirmationStatusSchema>;

export const assessDueSchema = z
  .object({
    serviceRequestId: z
      .uuid()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    balaghId: z
      .uuid()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    amount: z.number().multipleOf(0.01),
    currencyCode: z.literal('YER'),
    basisTypeCode: z.string().trim().min(1),
    documentReference: optionalText,
    attachmentId: z
      .uuid()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasRequest = !!data.serviceRequestId;
    const hasBalagh = !!data.balaghId;
    if ((hasRequest && hasBalagh) || (!hasRequest && !hasBalagh)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Exact-one parent context (serviceRequestId XOR balaghId) is required.',
      });
    }
  });

export type AssessDueInput = z.infer<typeof assessDueSchema>;

export const correctDueSchema = z
  .object({
    newAmount: z.number().multipleOf(0.01),
    reason: z.string().trim().min(1),
  })
  .strict();

export type CorrectDueInput = z.infer<typeof correctDueSchema>;

export const uploadReceiptSchema = z
  .object({
    amount: z.number().multipleOf(0.01),
    currencyCode: z.literal('YER'),
    replacesReceiptId: z
      .uuid()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
  })
  .strict();

export type UploadReceiptInput = z.infer<typeof uploadReceiptSchema>;

export const confirmPaymentSchema = z
  .object({
    notes: optionalText,
  })
  .strict();

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

export const paymentDueResponseSchema = z
  .object({
    id: z.uuid(),
    publicRef: z.string().trim().min(1).nullable(),
    serviceRequestId: z.uuid().nullable(),
    balaghId: z.uuid().nullable(),
    amount: z.number(),
    currencyCode: z.literal('YER'),
    statusCode: dueStatusSchema,
    assessedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    createdByProfileId: z.uuid().nullable(),
    updatedAt: z.string().datetime().nullable(),
    updatedByProfileId: z.uuid().nullable(),
    correlationId: z.string().trim().min(1).nullable(),
    archivedAt: z.string().datetime().nullable(),
  })
  .strict();

export type PaymentDueResponse = z.infer<typeof paymentDueResponseSchema>;

export const paymentReceiptResponseSchema = z
  .object({
    id: z.uuid(),
    publicRef: z.string().trim().min(1).nullable(),
    paymentDueId: z.uuid(),
    amount: z.number(),
    currencyCode: z.literal('YER'),
    acceptanceStatusCode: receiptStatusSchema,
    receivedAt: z.string().datetime().nullable(),
    replacesReceiptId: z.uuid().nullable(),
    createdAt: z.string().datetime(),
    createdByProfileId: z.uuid().nullable(),
    updatedAt: z.string().datetime().nullable(),
    updatedByProfileId: z.uuid().nullable(),
  })
  .strict();

export type PaymentReceiptResponse = z.infer<
  typeof paymentReceiptResponseSchema
>;

export const paymentConfirmationResponseSchema = z
  .object({
    id: z.uuid(),
    paymentReceiptId: z.uuid(),
    confirmedAt: z.string().datetime(),
    confirmedByStaffProfileId: z.uuid(),
    notes: z.string().trim().min(1).nullable(),
  })
  .strict();

export type PaymentConfirmationResponse = z.infer<
  typeof paymentConfirmationResponseSchema
>;
