import { z } from 'zod';

export const attachmentClassifications = [
  'internal',
  'confidential',
  'highly_sensitive',
] as const;
export const attachmentClassificationSchema = z.enum(attachmentClassifications);
export type AttachmentClassification = z.infer<
  typeof attachmentClassificationSchema
>;

export const attachmentOwnerTypes = [
  'service_request',
  'balagh',
  'taxpayer',
  'commercial_activity',
  'branch',
  'property',
  'property_unit',
] as const;
export const attachmentOwnerReferenceSchema = z
  .object({
    ownerType: z.enum(attachmentOwnerTypes),
    ownerId: z.uuid(),
  })
  .strict();
export type AttachmentOwnerReference = z.infer<
  typeof attachmentOwnerReferenceSchema
>;

const sha256Schema = z
  .string()
  .regex(/^[a-f0-9]{64}$/i, 'Checksum must be a SHA-256 hex digest.');
const filenameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine(
    (name) => !name.includes('/') && !name.includes('\\') && name !== '.',
    'Filename must not contain a path.',
  );
const mimeTypeSchema = z
  .string()
  .trim()
  .max(127)
  .regex(/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i);
const sizeBytesSchema = z
  .number()
  .int()
  .positive()
  .max(25 * 1024 * 1024);

export const attachmentFileDescriptorSchema = z
  .object({
    originalFilename: filenameSchema,
    mimeType: mimeTypeSchema,
    sizeBytes: sizeBytesSchema,
    checksumSha256: sha256Schema,
  })
  .strict();
export type AttachmentFileDescriptor = z.infer<
  typeof attachmentFileDescriptorSchema
>;

const actorContextSchema = z
  .object({
    actorId: z.uuid(),
    permissions: z.array(z.string().trim().min(1)).max(100),
  })
  .strict();

export const createUploadIntentSchema = z
  .object({
    owner: attachmentOwnerReferenceSchema,
    classification: attachmentClassificationSchema,
    category: z.string().trim().min(1).max(80),
    file: attachmentFileDescriptorSchema,
  })
  .strict();
export type CreateUploadIntentDto = z.infer<typeof createUploadIntentSchema>;

export const registerUploadedObjectSchema = z
  .object({
    uploadIntentId: z.uuid(),
    objectReference: z.string().trim().min(1).max(1024),
    observed: attachmentFileDescriptorSchema,
  })
  .strict();
export type RegisterUploadedObjectDto = z.infer<
  typeof registerUploadedObjectSchema
>;

export const createNewAttachmentVersionSchema = z
  .object({
    attachmentId: z.uuid(),
    replacesVersionId: z.uuid(),
    file: attachmentFileDescriptorSchema,
    correctionReason: z.string().trim().min(1).max(500),
  })
  .strict();
export type CreateNewAttachmentVersionDto = z.infer<
  typeof createNewAttachmentVersionSchema
>;

export const attachmentAccessQuerySchema = z
  .object({
    attachmentId: z.uuid(),
    actor: actorContextSchema,
    owner: attachmentOwnerReferenceSchema,
    classification: attachmentClassificationSchema,
  })
  .strict();
export type AttachmentAccessQueryDto = z.infer<
  typeof attachmentAccessQuerySchema
>;

export const archiveAttachmentSchema = z
  .object({
    attachmentId: z.uuid(),
    actor: actorContextSchema,
    retentionState: z.enum(['active', 'archived', 'legal_hold']),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();
export type ArchiveAttachmentDto = z.infer<typeof archiveAttachmentSchema>;
