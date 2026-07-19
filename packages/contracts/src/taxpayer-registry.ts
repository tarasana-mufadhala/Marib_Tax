import { z } from 'zod';

/** Digits-only numeric text; leading zeros preserved (ADR-015). */
export const taxNumberValueSchema = z
  .string()
  .regex(/^[0-9]+$/, 'Tax number must contain digits only.');

export type TaxNumberValue = z.infer<typeof taxNumberValueSchema>;

export const taxNumberStatusSchema = z.enum(['issued', 'invalid', 'replaced']);
export type TaxNumberStatus = z.infer<typeof taxNumberStatusSchema>;

export const taxpayerStatusSchema = z.string().trim().min(1);

export const taxpayerProfileResponseSchema = z
  .object({
    id: z.uuid(),
    publicRef: z.string().trim().min(1).nullable(),
    displayName: z.string().trim().min(1),
    statusCode: taxpayerStatusSchema,
    hasTaxNumber: z.boolean(),
    activeLegalEntityCount: z.number().int().nonnegative(),
    openDuesFlag: z.boolean(),
  })
  .strict();

export type TaxpayerProfileResponse = z.infer<
  typeof taxpayerProfileResponseSchema
>;

export const legalEntitySummarySchema = z
  .object({
    id: z.uuid(),
    publicRef: z.string().trim().min(1).nullable(),
    legalName: z.string().trim().min(1),
    classificationCode: z.string().trim().min(1).nullable(),
    isActive: z.boolean(),
    associationTypeCode: z.string().trim().min(1),
  })
  .strict();

export type LegalEntitySummary = z.infer<typeof legalEntitySummarySchema>;

export const taxNumberSummarySchema = z
  .object({
    id: z.uuid(),
    taxNumberValueMasked: z.string().trim().min(1),
    statusCode: taxNumberStatusSchema,
    legalEntityId: z.uuid(),
    issuedAt: z.string().datetime().nullable(),
  })
  .strict();

export type TaxNumberSummary = z.infer<typeof taxNumberSummarySchema>;

export const ownedTaxpayerBundleSchema = z
  .object({
    taxpayer: taxpayerProfileResponseSchema,
    legalEntities: z.array(legalEntitySummarySchema),
    taxNumbers: z.array(taxNumberSummarySchema),
  })
  .strict();

export type OwnedTaxpayerBundle = z.infer<typeof ownedTaxpayerBundleSchema>;

/**
 * Report-to-field keys required by DM-16 matrix for taxpayer/legal reports 12–15.
 * Persistence and read models must be able to supply these fields.
 */
export const registryReportFieldKeys = [
  'taxpayer_id',
  'registered_at',
  'registration_channel_code',
  'has_tax_number',
  'legal_entity_type_code',
  'activity_type_code',
  'area_code',
  'active_state_code',
  'activity_count',
  'open_case_count',
  'open_dues_flag',
  'tax_number_value',
  'legal_entity_id',
  'entity_type_code',
  'status_code',
] as const;

export type RegistryReportFieldKey = (typeof registryReportFieldKeys)[number];

export function maskTaxNumberValue(value: string): string {
  const parsed = taxNumberValueSchema.parse(value);
  if (parsed.length <= 4) return '*'.repeat(parsed.length);
  return `${'*'.repeat(parsed.length - 4)}${parsed.slice(-4)}`;
}
