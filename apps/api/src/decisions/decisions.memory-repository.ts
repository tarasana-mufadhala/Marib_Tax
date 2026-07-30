import { Injectable } from '@nestjs/common';
import {
  type DecisionsRepository,
  type StoredDecisionRecord,
  type StoredDecisionRevision,
} from './decisions.repository.js';

@Injectable()
export class DecisionsMemoryRepository implements DecisionsRepository {
  private readonly decisions = new Map<string, StoredDecisionRecord>();
  private readonly revisions: StoredDecisionRevision[] = [];

  async findDecisionById(id: string): Promise<StoredDecisionRecord | null> {
    await Promise.resolve();
    return this.decisions.get(id) ?? null;
  }

  async findDecisionByRequestId(
    serviceRequestId: string,
  ): Promise<StoredDecisionRecord | null> {
    await Promise.resolve();
    return (
      [...this.decisions.values()].find(
        (d) => d.serviceRequestId === serviceRequestId,
      ) ?? null
    );
  }

  async createDecision(
    record: StoredDecisionRecord,
  ): Promise<StoredDecisionRecord> {
    await Promise.resolve();
    this.decisions.set(record.id, record);
    return record;
  }

  async createRevision(
    revision: StoredDecisionRevision,
  ): Promise<StoredDecisionRevision> {
    await Promise.resolve();
    this.revisions.push(revision);
    return revision;
  }

  async listRevisionsForDecision(
    decisionRecordId: string,
  ): Promise<StoredDecisionRevision[]> {
    await Promise.resolve();
    return this.revisions.filter(
      (r) => r.decisionRecordId === decisionRecordId,
    );
  }
}
