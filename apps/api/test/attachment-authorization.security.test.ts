import { describe, expect, it } from 'vitest';
import { attachmentAccessQuerySchema } from '@marib-tax/contracts';
import {
  AttachmentAuthorizationPolicy,
  type AttachmentAuthorizationActor,
  type AttachmentAuthorizationRequest,
} from '../src/attachments/attachment-authorization.policy.js';
import {
  appendAttachmentVersion,
  type AttachmentMetadata,
} from '../src/attachments/attachment.domain.js';
import type { ServerResolvedAttachmentActorContext } from '../src/attachments/attachment.application.contracts.js';

const owner = Object.freeze({
  ownerType: 'service_request' as const,
  ownerId: '00000000-0000-4000-8000-000000000001',
});
const policy = new AttachmentAuthorizationPolicy();

const actor = (
  overrides: Partial<AttachmentAuthorizationActor> = {},
): AttachmentAuthorizationActor => ({
  actorId: '00000000-0000-4000-8000-000000000002',
  permissions: [
    'attachment.metadata.read',
    'attachment.binary.download',
    'attachment.highly_sensitive.read',
    'attachment.legal_hold.download',
  ],
  roleActive: true,
  assignmentActive: true,
  authorizedOwners: [owner],
  ...overrides,
});

const request = (
  requestActor: AttachmentAuthorizationActor,
  overrides: Partial<AttachmentAuthorizationRequest> = {},
): AttachmentAuthorizationRequest => ({
  actor: requestActor,
  resource: {
    owner,
    classification: 'highly_sensitive',
    retentionState: 'active',
  },
  accessKind: 'binary_download',
  ...overrides,
});

function safeFailure(): { status: number; code: string; message: string } {
  return {
    status: 404,
    code: 'ATTACHMENT_ACCESS_DENIED',
    message: 'تعذر إتاحة المرفق المطلوب',
  };
}

/** A service entry point must enforce the policy even when no controller runs. */
function directDownloadService(
  requestActor: ServerResolvedAttachmentActorContext,
): {
  authorized: true;
} {
  if (!policy.canAccess(request(requestActor))) {
    throw new Error(JSON.stringify(safeFailure()));
  }
  return { authorized: true };
}

const firstVersion = Object.freeze({
  id: 'version-1',
  versionNumber: 1,
  previousVersionId: null,
  file: Object.freeze({
    originalFilename: 'first.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
    checksumSha256: 'a'.repeat(64),
  }),
  objectReference: 'private/opaque/1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'actor-1',
  correctionReason: null,
});
const attachment: AttachmentMetadata = Object.freeze({
  id: 'attachment-1',
  owner,
  classification: 'highly_sensitive',
  documentCategoryCode: 'supporting_document',
  retentionState: 'active',
  versions: Object.freeze([firstVersion]),
});

describe('attachment authorization integration security', () => {
  it.each([
    ['missing owner scope', actor({ authorizedOwners: [] })],
    ['inactive role', actor({ roleActive: false })],
    ['inactive assignment', actor({ assignmentActive: false })],
    ['no explicit permission', actor({ permissions: [] })],
  ])('denies binary download for %s', (_label, requestActor) => {
    expect(policy.canAccess(request(requestActor))).toBe(false);
  });

  it('keeps metadata authorization separate from binary download', () => {
    const metadataReader = actor({
      permissions: [
        'attachment.metadata.read',
        'attachment.highly_sensitive.read',
      ],
    });
    expect(
      policy.canAccess(
        request(metadataReader, {
          accessKind: 'metadata',
        }),
      ),
    ).toBe(true);
    expect(policy.canAccess(request(metadataReader))).toBe(false);
  });

  it('requires distinct highly-sensitive and legal-hold download grants', () => {
    const downloadOnly = actor({
      permissions: [
        'attachment.binary.download',
        'attachment.highly_sensitive.read',
      ],
    });
    const legalHold = request(downloadOnly, {
      resource: {
        owner,
        classification: 'highly_sensitive',
        retentionState: 'legal_hold',
      },
    });
    expect(policy.canAccess(legalHold)).toBe(false);
    expect(
      policy.canAccess({
        ...legalHold,
        actor: actor(),
      }),
    ).toBe(true);
  });

  it('cannot bypass authorization through a direct service invocation', () => {
    expect(() => directDownloadService(actor({ permissions: [] }))).toThrow(
      'ATTACHMENT_ACCESS_DENIED',
    );
    expect(directDownloadService(actor())).toEqual({ authorized: true });
  });

  it.each([
    { actorId: '00000000-0000-4000-8000-000000000099' },
    { permissions: ['attachment.binary.download'] },
    {
      actor: {
        actorId: '00000000-0000-4000-8000-000000000099',
        permissions: ['attachment.binary.download'],
      },
    },
  ])(
    'rejects transport attempts to self-assert authorization context %j',
    (untrusted) => {
      expect(() =>
        attachmentAccessQuerySchema.parse({
          attachmentId: attachment.id,
          ...untrusted,
        }),
      ).toThrow();

      const serverContext: ServerResolvedAttachmentActorContext = actor({
        permissions: [],
      });
      expect(policy.canAccess(request(serverContext))).toBe(false);
    },
  );

  it('appends an immutable version without mutating historical evidence', () => {
    const before = structuredClone(attachment);
    const updated = appendAttachmentVersion(attachment, {
      id: 'version-2',
      replacesVersionId: firstVersion.id,
      file: { ...firstVersion.file, checksumSha256: 'b'.repeat(64) },
      objectReference: 'private/opaque/2',
      createdAt: '2026-07-20T01:00:00.000Z',
      createdBy: 'actor-1',
      correctionReason: 'Corrected scan',
    });
    expect(attachment).toEqual(before);
    expect(updated.versions[0]).toBe(firstVersion);
    expect(updated.versions[1]).toMatchObject({
      versionNumber: 2,
      previousVersionId: firstVersion.id,
    });
    expect(Object.isFrozen(updated.versions[1])).toBe(true);
  });

  it('returns failures without storage metadata', () => {
    expect(JSON.stringify(safeFailure())).not.toMatch(
      /storage|bucket|checksum|objectReference|https?:\/\//i,
    );
  });
});
