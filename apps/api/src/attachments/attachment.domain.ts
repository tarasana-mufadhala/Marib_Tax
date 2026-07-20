import type {
  AttachmentClassification,
  AttachmentFileDescriptor,
  AttachmentOwnerReference,
} from '@marib-tax/contracts';
import { attachmentFileDescriptorSchema } from '@marib-tax/contracts';

export type AttachmentRetentionState = 'active' | 'archived' | 'legal_hold';

export interface AttachmentVersion {
  readonly id: string;
  readonly versionNumber: number;
  readonly previousVersionId: string | null;
  readonly file: Readonly<AttachmentFileDescriptor>;
  readonly objectReference: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly correctionReason: string | null;
}

export interface AttachmentMetadata {
  readonly id: string;
  readonly owner: Readonly<AttachmentOwnerReference>;
  readonly classification: AttachmentClassification;
  readonly category: string;
  readonly retentionState: AttachmentRetentionState;
  readonly versions: readonly AttachmentVersion[];
}

export function validateAttachmentFile(
  input: unknown,
): AttachmentFileDescriptor {
  return attachmentFileDescriptorSchema.parse(input);
}

export function appendAttachmentVersion(
  attachment: AttachmentMetadata,
  input: Omit<AttachmentVersion, 'versionNumber' | 'previousVersionId'> & {
    replacesVersionId: string;
  },
): AttachmentMetadata {
  const latest = attachment.versions.at(-1);
  if (latest === undefined || latest.id !== input.replacesVersionId) {
    throw new Error('ATTACHMENT_VERSION_CONFLICT');
  }
  if (attachment.versions.some((version) => version.id === input.id)) {
    throw new Error('ATTACHMENT_VERSION_ID_CONFLICT');
  }
  const next: AttachmentVersion = Object.freeze({
    id: input.id,
    versionNumber: latest.versionNumber + 1,
    previousVersionId: latest.id,
    file: Object.freeze(validateAttachmentFile(input.file)),
    objectReference: input.objectReference,
    createdAt: input.createdAt,
    createdBy: input.createdBy,
    correctionReason: input.correctionReason,
  });
  return Object.freeze({
    ...attachment,
    versions: Object.freeze([...attachment.versions, next]),
  });
}
