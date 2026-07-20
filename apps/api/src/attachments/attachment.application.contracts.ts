import type {
  ArchiveAttachmentDto,
  AttachmentAccessQueryDto,
  AttachmentListResponse,
  AttachmentMetadataResponse,
  AttachmentOwnerReference,
  AttachmentVersionResponse,
  AuthorizedDownloadIntentResponse,
  CreateNewAttachmentVersionDto,
  CreateUploadIntentDto,
  RegisterUploadedObjectDto,
} from '@marib-tax/contracts';

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
export interface AttachmentApplicationPort {
  createUploadIntent(
    command: CreateUploadIntentCommand,
  ): Promise<UploadIntentResult>;
  registerUploadedObject(
    command: RegisterUploadedObjectCommand,
  ): Promise<AttachmentMetadataResponse>;
  createNewVersion(
    command: CreateNewVersionCommand,
  ): Promise<AttachmentMetadataResponse>;
  listVersions(
    query: ListAttachmentVersionsQuery,
  ): Promise<readonly AttachmentVersionResponse[]>;
  listAttachments(
    query: Omit<ListAttachmentVersionsQuery, 'attachmentId'>,
  ): Promise<AttachmentListResponse>;
  createAuthorizedDownloadIntent(
    query: AuthorizedDownloadIntentQuery,
  ): Promise<AuthorizedDownloadIntentResponse>;
  setRetentionState(command: ArchiveAttachmentCommand): Promise<void>;
}

export const ATTACHMENT_APPLICATION_PORT = Symbol(
  'ATTACHMENT_APPLICATION_PORT',
);
