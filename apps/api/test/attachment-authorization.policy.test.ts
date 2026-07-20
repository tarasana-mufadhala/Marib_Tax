import { describe, expect, it } from 'vitest';
import {
  AttachmentAuthorizationPolicy,
  type AttachmentAuthorizationRequest,
} from '../src/attachments/attachment-authorization.policy.js';

const owner = {
  ownerType: 'balagh' as const,
  ownerId: '00000000-0000-4000-8000-000000000001',
};
const baseRequest: AttachmentAuthorizationRequest = {
  actor: {
    actorId: '00000000-0000-4000-8000-000000000002',
    permissions: ['attachment.metadata.read'],
    roleActive: true,
    assignmentActive: true,
    authorizedOwners: [owner],
  },
  resource: {
    owner,
    classification: 'confidential',
    retentionState: 'active',
  },
  accessKind: 'metadata',
};

describe('AttachmentAuthorizationPolicy', () => {
  const policy = new AttachmentAuthorizationPolicy();

  it('allows scoped metadata access with its distinct permission', () => {
    expect(policy.canAccess(baseRequest)).toBe(true);
  });

  it('does not turn metadata permission into binary download permission', () => {
    expect(
      policy.canAccess({ ...baseRequest, accessKind: 'binary_download' }),
    ).toBe(false);
  });

  it('denies an actor outside the owner scope', () => {
    expect(
      policy.canAccess({
        ...baseRequest,
        actor: { ...baseRequest.actor, authorizedOwners: [] },
      }),
    ).toBe(false);
  });

  it('requires explicit highly-sensitive and legal-hold download grants', () => {
    const request: AttachmentAuthorizationRequest = {
      ...baseRequest,
      accessKind: 'binary_download',
      actor: {
        ...baseRequest.actor,
        permissions: ['attachment.binary.download'],
      },
      resource: {
        ...baseRequest.resource,
        classification: 'highly_sensitive',
        retentionState: 'legal_hold',
      },
    };
    expect(policy.canAccess(request)).toBe(false);
    expect(
      policy.canAccess({
        ...request,
        actor: {
          ...request.actor,
          permissions: [
            'attachment.binary.download',
            'attachment.highly_sensitive.read',
            'attachment.legal_hold.download',
          ],
        },
      }),
    ).toBe(true);
  });

  it.each([
    { roleActive: false, assignmentActive: true },
    { roleActive: true, assignmentActive: false },
  ])('denies inactive authorization context', (activity) => {
    expect(
      policy.canAccess({
        ...baseRequest,
        actor: { ...baseRequest.actor, ...activity },
      }),
    ).toBe(false);
  });
});
