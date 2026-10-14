import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { RequestDraftKyselyRepository } from './request-draft.kysely-repository.js';
import { RequestDraftMemoryRepository } from './request-draft.memory-repository.js';
import {
  type RequestDraftRepository,
  type StoredRequestDraft,
} from './request-draft.repository.js';

/**
 * يختار المخزن **عند كل نداء** لا عند إنشاء الوحدة.
 *
 * `DatabaseService` يتصل في `onModuleInit`، أي بعد بناء مزوّدات الوحدة؛
 * فأي قرار وقت الإقلاع كان يثبّت مخزن الذاكرة إلى الأبد وتضيع الطلبات.
 */
@Injectable()
export class RequestDraftRepositoryRouter implements RequestDraftRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly persistent: RequestDraftKyselyRepository,
    private readonly fallback: RequestDraftMemoryRepository,
  ) {}

  private get active(): RequestDraftRepository {
    return this.db.isInitialized ? this.persistent : this.fallback;
  }

  create(draft: StoredRequestDraft): Promise<void> {
    return this.active.create(draft);
  }

  findById(id: string): Promise<StoredRequestDraft | null> {
    return this.active.findById(id);
  }

  save(draft: StoredRequestDraft): Promise<void> {
    return this.active.save(draft);
  }
}
