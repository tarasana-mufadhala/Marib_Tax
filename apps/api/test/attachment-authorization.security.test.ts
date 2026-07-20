import { describe, expect, it } from 'vitest';

type Operation =
  | 'view_metadata'
  | 'list_versions'
  | 'request_download'
  | 'create_corrected_version'
  | 'archive'
  | 'link_owner';
type Classification = 'internal' | 'sensitive' | 'highly_sensitive';

interface ActorFixture {
  authenticated: boolean;
  permissions: readonly Operation[];
  ownerContexts: readonly string[];
  clearance: readonly Classification[];
  workerTask?: Operation;
}

interface AttachmentFixture {
  id: string;
  ownerContext: string;
  classification: Classification;
  version: number;
  permanentArchive: boolean;
}

const attachment: AttachmentFixture = {
  id: 'ATT-MOCK-01',
  ownerContext: 'request:REQ-MOCK-01',
  classification: 'highly_sensitive',
  version: 2,
  permanentArchive: false,
};

function authorize(
  actor: ActorFixture | undefined,
  operation: Operation,
  target = attachment,
): boolean {
  if (!actor?.authenticated) return false;
  if (!actor.permissions.includes(operation)) return false;
  if (!actor.ownerContexts.includes(target.ownerContext)) return false;
  if (!actor.clearance.includes(target.classification)) return false;
  if (actor.workerTask && actor.workerTask !== operation) return false;
  return true;
}

function safeFailure(
  code: 'ATTACHMENT_ACCESS_DENIED' | 'ATTACHMENT_NOT_FOUND',
): { status: number; code: string; message: string } {
  return { status: 404, code, message: 'تعذر إتاحة المرفق المطلوب' };
}

function createCorrectedVersion(
  actor: ActorFixture,
  target: AttachmentFixture,
): AttachmentFixture & { previousVersionId: string } {
  if (!authorize(actor, 'create_corrected_version', target))
    throw new Error(JSON.stringify(safeFailure('ATTACHMENT_ACCESS_DENIED')));
  return {
    ...target,
    id: 'ATT-MOCK-02',
    version: target.version + 1,
    previousVersionId: target.id,
  };
}

const fullActor = (overrides: Partial<ActorFixture> = {}): ActorFixture => ({
  authenticated: true,
  permissions: [
    'view_metadata',
    'list_versions',
    'request_download',
    'create_corrected_version',
    'archive',
    'link_owner',
  ],
  ownerContexts: [attachment.ownerContext],
  clearance: ['internal', 'sensitive', 'highly_sensitive'],
  ...overrides,
});

describe('attachment authorization security scaffold', () => {
  it.each([
    ['anonymous actor', undefined],
    [
      'unrelated taxpayer',
      fullActor({ ownerContexts: ['taxpayer:TAX-MOCK-OTHER'] }),
    ],
    ['unauthorized staff', fullActor({ permissions: [] })],
    [
      'assigned staff without classification clearance',
      fullActor({ clearance: ['internal', 'sensitive'] }),
    ],
    [
      'administrator without explicit permission',
      fullActor({ permissions: ['view_metadata'] }),
    ],
  ])('denies download for %s', (_label, actor) => {
    expect(authorize(actor, 'request_download')).toBe(false);
  });

  it('separates metadata visibility from binary download permission', () => {
    const reportReader = fullActor({
      permissions: ['view_metadata', 'list_versions'],
    });
    expect(authorize(reportReader, 'view_metadata')).toBe(true);
    expect(authorize(reportReader, 'list_versions')).toBe(true);
    expect(authorize(reportReader, 'request_download')).toBe(false);
  });

  it('does not treat an owner link as authorization', () => {
    const linkedWithoutPermission = fullActor({ permissions: [] });
    expect(linkedWithoutPermission.ownerContexts).toContain(
      attachment.ownerContext,
    );
    expect(authorize(linkedWithoutPermission, 'view_metadata')).toBe(false);
  });

  it('permits explicitly authorized owner-context and highly-sensitive access', () => {
    expect(authorize(fullActor(), 'request_download')).toBe(true);
  });

  it('binds worker authority to one task', () => {
    const worker = fullActor({ workerTask: 'archive' });
    expect(authorize(worker, 'archive')).toBe(true);
    expect(authorize(worker, 'request_download')).toBe(false);
  });

  it('creates append-only correction lineage without mutating the old version', () => {
    const before = structuredClone(attachment);
    const corrected = createCorrectedVersion(fullActor(), attachment);
    expect(attachment).toEqual(before);
    expect(corrected).toMatchObject({
      version: 3,
      previousVersionId: attachment.id,
    });
    expect(corrected.id).not.toBe(attachment.id);
  });

  it('returns safe failures without sensitive storage metadata', () => {
    const response = safeFailure('ATTACHMENT_ACCESS_DENIED');
    expect(response.status).toBe(404);
    expect(JSON.stringify(response)).not.toMatch(
      /storage|bucket|checksum|https?:\/\//i,
    );
  });

  it('enforces the same decision in a direct service invocation scaffold', () => {
    const directServiceCall = (actor: ActorFixture): { linked: boolean } => {
      if (!authorize(actor, 'link_owner'))
        throw new Error(
          JSON.stringify(safeFailure('ATTACHMENT_ACCESS_DENIED')),
        );
      return { linked: true };
    };
    expect(() => directServiceCall(fullActor({ permissions: [] }))).toThrow();
    expect(directServiceCall(fullActor())).toEqual({ linked: true });
  });
});
