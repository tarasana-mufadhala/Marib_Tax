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
import type {
  AttachmentAuthorizationActor,
  AttachmentAuthorizationResource,
} from './attachment-authorization.policy.js';

/** Resolved by trusted server infrastructure and never constructed from DTO input. */
export type ServerResolvedAttachmentActorContext =
  Readonly<AttachmentAuthorizationActor>;

export interface CreateUploadIntentCommand extends CreateUploadIntentDto {
  readonly actorContext: ServerResolvedAttachmentActorContext;
}
export interface RegisterUploadedObjectCommand extends RegisterUploadedObjectDto {
  readonly actorContext: ServerResolvedAttachmentActorContext;
}
export interface CreateNewVersionCommand extends CreateNewAttachmentVersionDto {
  readonly actorContext: ServerResolvedAttachmentActorContext;
}
export interface ArchiveAttachmentCommand extends ArchiveAttachmentDto {
  readonly actorContext: ServerResolvedAttachmentActorContext;
  readonly resource: Readonly<AttachmentAuthorizationResource>;
}

export interface ListAttachmentVersionsQuery {
  attachmentId: string;
  readonly actorContext: ServerResolvedAttachmentActorContext;
  owner: AttachmentOwnerReference;
}
export interface AuthorizedDownloadIntentQuery extends AttachmentAccessQueryDto {
  readonly actorContext: ServerResolvedAttachmentActorContext;
  readonly resource: Readonly<AttachmentAuthorizationResource>;
}

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
