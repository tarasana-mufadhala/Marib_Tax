import { describe, expect, it } from 'vitest';
import {
  attachmentAccessQuerySchema,
  attachmentMetadataResponseSchema,
  authorizedDownloadIntentResponseSchema,
  createUploadIntentSchema,
  registerUploadedObjectSchema,
} from '../src/attachments.js';

const file = {
  originalFilename: 'evidence.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 1024,
  checksumSha256: 'a'.repeat(64),
};

describe('attachment transport contracts', () => {
  it('accepts a constrained upload-intent request', () => {
    expect(
      createUploadIntentSchema.parse({
        owner: {
          ownerType: 'service_request',
          ownerId: '00000000-0000-4000-8000-000000000001',
        },
        classification: 'confidential',
        documentCategoryCode: 'supporting_document',
        file,
      }).file,
    ).toEqual(file);
  });

  it('permits checksum omission only while creating an upload intent', () => {
    const withoutChecksum = { ...file, checksumSha256: undefined };
    expect(
      createUploadIntentSchema.parse({
        owner: {
          ownerType: 'service_request',
          ownerId: '00000000-0000-4000-8000-000000000001',
        },
        classification: 'internal',
        documentCategoryCode: 'supporting_document',
        file: withoutChecksum,
      }).file.checksumSha256,
    ).toBeUndefined();
    expect(() =>
      registerUploadedObjectSchema.parse({
        uploadIntentId: '00000000-0000-4000-8000-000000000002',
        objectReference: 'opaque-object-reference',
        observed: withoutChecksum,
      }),
    ).toThrow();
  });

  it.each(['public', 'private', 'sensitive'])(
    'rejects non-canonical classification %s',
    (classification) => {
      expect(() =>
        createUploadIntentSchema.parse({
          owner: {
            ownerType: 'taxpayer',
            ownerId: '00000000-0000-4000-8000-000000000001',
          },
          classification,
          documentCategoryCode: 'supporting_document',
          file,
        }),
      ).toThrow();
    },
  );

  it.each([
    { ...file, originalFilename: '../secret.pdf' },
    { ...file, mimeType: 'not-a-mime' },
    { ...file, sizeBytes: 25 * 1024 * 1024 + 1 },
    { ...file, checksumSha256: 'not-sha256' },
  ])('rejects unsafe file metadata', (unsafeFile) => {
    expect(() =>
      createUploadIntentSchema.parse({
        owner: {
          ownerType: 'taxpayer',
          ownerId: '00000000-0000-4000-8000-000000000001',
        },
        classification: 'internal',
        documentCategoryCode: 'supporting_document',
        file: unsafeFile,
      }),
    ).toThrow();
  });

  it('keeps metadata and download responses free of storage internals', () => {
    const metadata = {
      id: '00000000-0000-4000-8000-000000000010',
      owner: {
        ownerType: 'balagh',
        ownerId: '00000000-0000-4000-8000-000000000011',
      },
      classification: 'confidential',
      documentCategoryCode: 'supporting_document',
      retentionState: 'active',
      latestVersion: null,
    };
    expect(attachmentMetadataResponseSchema.parse(metadata)).toEqual(metadata);
    expect(() =>
      attachmentMetadataResponseSchema.parse({
        ...metadata,
        storageObjectPath: 'private/path',
      }),
    ).toThrow();
    expect(
      authorizedDownloadIntentResponseSchema.parse({
        intentToken: 'opaque-token',
        expiresAt: '2026-07-20T03:00:00.000Z',
      }),
    ).toEqual({
      intentToken: 'opaque-token',
      expiresAt: '2026-07-20T03:00:00.000Z',
    });
  });

  it('requires actor, owner context, and classification for access decisions', () => {
    expect(() =>
      attachmentAccessQuerySchema.parse({
        attachmentId: '00000000-0000-4000-8000-000000000001',
      }),
    ).toThrow();
  });
});
