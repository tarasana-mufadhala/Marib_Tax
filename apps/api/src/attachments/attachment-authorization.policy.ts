import type {
  AttachmentClassification,
  AttachmentOwnerReference,
} from '@marib-tax/contracts';

export const attachmentAccessPermissions = [
  'attachment.metadata.read',
  'attachment.binary.download',
  'attachment.highly_sensitive.read',
  'attachment.legal_hold.download',
] as const;
export type AttachmentAccessPermission =
  (typeof attachmentAccessPermissions)[number];

export interface AttachmentAuthorizationActor {
  readonly actorId: string;
  readonly permissions: readonly AttachmentAccessPermission[];
  readonly roleActive: boolean;
  readonly assignmentActive: boolean;
  readonly authorizedOwners: readonly AttachmentOwnerReference[];
}

export interface AttachmentAuthorizationResource {
  readonly owner: AttachmentOwnerReference;
  readonly classification: AttachmentClassification;
  readonly retentionState:
    'active' | 'archived' | 'legal_hold' | 'permanent_operational_archive';
}

export type AttachmentAccessKind = 'metadata' | 'binary_download';

export interface AttachmentAuthorizationRequest {
  readonly actor: AttachmentAuthorizationActor;
  readonly resource: AttachmentAuthorizationResource;
  readonly accessKind: AttachmentAccessKind;
}

/**
 * Below-UI, deny-by-default attachment authorization boundary.
 * It deliberately has no role-name or general-admin bypass.
 */
export class AttachmentAuthorizationPolicy {
  canAccess(request: AttachmentAuthorizationRequest): boolean {
    const { actor, resource, accessKind } = request;
    if (!actor.roleActive || !actor.assignmentActive) return false;
    if (!this.hasOwnerScope(actor, resource.owner)) return false;

    const requiredPermission =
      accessKind === 'metadata'
        ? 'attachment.metadata.read'
        : 'attachment.binary.download';
    if (!actor.permissions.includes(requiredPermission)) return false;

    if (
      resource.classification === 'highly_sensitive' &&
      !actor.permissions.includes('attachment.highly_sensitive.read')
    ) {
      return false;
    }
    if (
      accessKind === 'binary_download' &&
      resource.retentionState === 'legal_hold' &&
      !actor.permissions.includes('attachment.legal_hold.download')
    ) {
      return false;
    }
    return true;
  }

  private hasOwnerScope(
    actor: AttachmentAuthorizationActor,
    owner: AttachmentOwnerReference,
  ): boolean {
    return actor.authorizedOwners.some(
      (candidate) =>
        candidate.ownerType === owner.ownerType &&
        candidate.ownerId === owner.ownerId,
    );
  }
}
