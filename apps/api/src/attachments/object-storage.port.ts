import type {
  AttachmentFileDescriptor,
  AttachmentUploadFileDescriptor,
} from '@marib-tax/contracts';

export interface ObjectStoragePort {
  createUploadIntent(input: {
    objectReference: string;
    expected: AttachmentUploadFileDescriptor;
    expiresInSeconds: number;
  }): Promise<{ uploadToken: string; expiresAt: string }>;
  inspectObject(
    objectReference: string,
  ): Promise<AttachmentFileDescriptor | null>;
  createDownloadIntent(input: {
    objectReference: string;
    expiresInSeconds: number;
  }): Promise<{ downloadToken: string; expiresAt: string }>;
}

export const OBJECT_STORAGE_PORT = Symbol('OBJECT_STORAGE_PORT');

export class DisabledObjectStorageAdapter implements ObjectStoragePort {
  createUploadIntent(_input: {
    objectReference: string;
    expected: AttachmentUploadFileDescriptor;
    expiresInSeconds: number;
  }): Promise<never> {
    void _input;
    return Promise.reject(new Error('OBJECT_STORAGE_DISABLED'));
  }
  inspectObject(_objectReference: string): Promise<never> {
    void _objectReference;
    return Promise.reject(new Error('OBJECT_STORAGE_DISABLED'));
  }
  createDownloadIntent(_input: {
    objectReference: string;
    expiresInSeconds: number;
  }): Promise<never> {
    void _input;
    return Promise.reject(new Error('OBJECT_STORAGE_DISABLED'));
  }
}
