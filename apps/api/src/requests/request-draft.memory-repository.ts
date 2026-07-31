import { Injectable } from '@nestjs/common';
import {
  type RequestDraftRepository,
  type StoredRequestDraft,
} from './request-draft.repository.js';

@Injectable()
export class RequestDraftMemoryRepository implements RequestDraftRepository {
  private readonly drafts = new Map<string, StoredRequestDraft>();

  async create(value: StoredRequestDraft): Promise<void> {
    await Promise.resolve();
    this.drafts.set(value.id, structuredClone(value));
  }

  async findById(id: string): Promise<StoredRequestDraft | null> {
    await Promise.resolve();
    return structuredClone(this.drafts.get(id) ?? null);
  }

  async save(value: StoredRequestDraft): Promise<void> {
    await Promise.resolve();
    this.drafts.set(value.id, structuredClone(value));
  }
}
