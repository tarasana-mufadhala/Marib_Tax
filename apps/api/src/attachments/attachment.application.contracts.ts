import type {
  ArchiveAttachmentDto,
  AttachmentAccessQueryDto,
  AttachmentFileDescriptor,
  AttachmentOwnerReference,
  CreateNewAttachmentVersionDto,
  CreateUploadIntentDto,
  RegisterUploadedObjectDto,
} from '@marib-tax/contracts';
import type { AttachmentMetadata } from './attachment.domain.js';

export interface CreateUploadIntentCommand extends CreateUploadIntentDto {
  actorId: string;
}
export interface RegisterUploadedObjectCommand extends RegisterUploadedObjectDto {
  actorId: string;
}
export interface CreateNewVersionCommand extends CreateNewAttachmentVersionDto {
  actorId: string;
}
export type ArchiveAttachmentCommand = ArchiveAttachmentDto;

export interface ListAttachmentVersionsQuery {
  attachmentId: string;
  actorId: string;
  owner: AttachmentOwnerReference;
}
export type AuthorizedDownloadIntentQuery = AttachmentAccessQueryDto;

export interface UploadIntentResult {
  uploadIntentId: string;
  expiresAt: string;
  uploadToken: string;
}
export interface DownloadIntentResult {
  expiresAt: string;
  downloadToken: string;
}

export interface AttachmentApplicationPort {
  createUploadIntent(
    command: CreateUploadIntentCommand,
  ): Promise<UploadIntentResult>;
  registerUploadedObject(
    command: RegisterUploadedObjectCommand,
  ): Promise<AttachmentMetadata>;
  createNewVersion(
    command: CreateNewVersionCommand,
  ): Promise<AttachmentMetadata>;
  listVersions(
    query: ListAttachmentVersionsQuery,
  ): Promise<readonly AttachmentFileDescriptor[]>;
  createAuthorizedDownloadIntent(
    query: AuthorizedDownloadIntentQuery,
  ): Promise<DownloadIntentResult>;
  setRetentionState(command: ArchiveAttachmentCommand): Promise<void>;
}

export const ATTACHMENT_APPLICATION_PORT = Symbol(
  'ATTACHMENT_APPLICATION_PORT',
);
