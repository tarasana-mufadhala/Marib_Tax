import { describe, expect, it } from 'vitest';
import {
  attachmentAccessQuerySchema,
  createUploadIntentSchema,
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
        category: 'supporting_evidence',
        file,
      }).file,
    ).toEqual(file);
  });

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
        category: 'evidence',
        file: unsafeFile,
      }),
    ).toThrow();
  });

  it('requires actor, owner context, and classification for access decisions', () => {
    expect(() =>
      attachmentAccessQuerySchema.parse({
        attachmentId: '00000000-0000-4000-8000-000000000001',
      }),
    ).toThrow();
  });
});
