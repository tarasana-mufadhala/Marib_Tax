import { describe, expect, it } from 'vitest';
import {
  appendAttachmentVersion,
  type AttachmentMetadata,
} from '../src/attachments/attachment.domain.js';
import { DisabledObjectStorageAdapter } from '../src/attachments/object-storage.port.js';

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
  owner: Object.freeze({ ownerType: 'service_request', ownerId: 'owner-1' }),
  classification: 'confidential',
  category: 'evidence',
  retentionState: 'active',
  versions: Object.freeze([firstVersion]),
});

describe('attachment version lineage', () => {
  it('appends a new immutable version without overwriting evidence', () => {
    const updated = appendAttachmentVersion(attachment, {
      id: 'version-2',
      replacesVersionId: 'version-1',
      file: { ...firstVersion.file, checksumSha256: 'b'.repeat(64) },
      objectReference: 'private/opaque/2',
      createdAt: '2026-07-20T01:00:00.000Z',
      createdBy: 'actor-1',
      correctionReason: 'Corrected scan',
    });
    expect(updated.versions).toHaveLength(2);
    expect(updated.versions[0]).toBe(firstVersion);
    expect(updated.versions[1]).toMatchObject({
      versionNumber: 2,
      previousVersionId: 'version-1',
    });
    expect(Object.isFrozen(updated.versions[1])).toBe(true);
  });

  it('rejects branching from a stale version', () => {
    expect(() =>
      appendAttachmentVersion(attachment, {
        id: 'version-2',
        replacesVersionId: 'stale-version',
        file: firstVersion.file,
        objectReference: 'private/opaque/2',
        createdAt: '2026-07-20T01:00:00.000Z',
        createdBy: 'actor-1',
        correctionReason: 'Correction',
      }),
    ).toThrow('ATTACHMENT_VERSION_CONFLICT');
  });

  it('never makes real storage calls through the disabled adapter', async () => {
    const adapter = new DisabledObjectStorageAdapter();
    await expect(adapter.inspectObject('opaque')).rejects.toThrow(
      'OBJECT_STORAGE_DISABLED',
    );
  });
});
