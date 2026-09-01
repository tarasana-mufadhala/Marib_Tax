import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  DecisionsRepository,
  StoredDecisionRecord,
  StoredDecisionRevision,
} from './decisions.repository.js';

@Injectable()
export class DecisionsKyselyRepository implements DecisionsRepository {
  // In-memory fallback
  private readonly decisions = new Map<string, StoredDecisionRecord>();
  private readonly revisions: StoredDecisionRevision[] = [];

  constructor(private readonly dbService: DatabaseService) {}

  async findDecisionById(id: string): Promise<StoredDecisionRecord | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('requests.request_decision_records')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        serviceRequestId: row.service_request_id,
        outcomeCode: row.outcome_code,
        decisionSummary: row.decision_summary,
        basisText: row.basis_text,
        decidedAt: row.decided_at,
        decidedByStaffProfileId: row.decided_by_staff_profile_id,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
        correlationId: row.correlation_id,
      };
    }
    return this.decisions.get(id) ?? null;
  }

  async findDecisionByRequestId(serviceRequestId: string): Promise<StoredDecisionRecord | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('requests.request_decision_records')
        .selectAll()
        .where('service_request_id', '=', serviceRequestId)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        serviceRequestId: row.service_request_id,
        outcomeCode: row.outcome_code,
        decisionSummary: row.decision_summary,
        basisText: row.basis_text,
        decidedAt: row.decided_at,
        decidedByStaffProfileId: row.decided_by_staff_profile_id,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
        correlationId: row.correlation_id,
      };
    }
    return (
      [...this.decisions.values()].find((d) => d.serviceRequestId === serviceRequestId) ?? null
    );
  }

  async createDecision(record: StoredDecisionRecord): Promise<StoredDecisionRecord> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('requests.request_decision_records')
        .values({
          id: record.id,
          service_request_id: record.serviceRequestId,
          outcome_code: record.outcomeCode,
          decision_summary: record.decisionSummary,
          basis_text: record.basisText,
          decided_at: record.decidedAt,
          decided_by_staff_profile_id: record.decidedByStaffProfileId,
          created_at: record.createdAt,
          created_by_profile_id: record.createdByProfileId,
          correlation_id: record.correlationId,
        })
        .execute();
      return record;
    }
    this.decisions.set(record.id, record);
    return record;
  }

  async createRevision(revision: StoredDecisionRevision): Promise<StoredDecisionRevision> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('requests.request_decision_revisions')
        .values({
          id: revision.id,
          decision_record_id: revision.decisionRecordId,
          revision_number: revision.revisionNumber,
          revised_outcome_code: revision.revisedOutcomeCode,
          revision_summary: revision.revisionSummary,
          revised_at: revision.revisedAt,
          revised_by_staff_profile_id: revision.revisedByStaffProfileId,
          reason: revision.reason,
          correlation_id: revision.correlationId,
          created_at: revision.createdAt,
        })
        .execute();
      return revision;
    }
    this.revisions.push(revision);
    return revision;
  }

  async listRevisionsForDecision(decisionRecordId: string): Promise<StoredDecisionRevision[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('requests.request_decision_revisions')
        .selectAll()
        .where('decision_record_id', '=', decisionRecordId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        decisionRecordId: row.decision_record_id,
        revisionNumber: row.revision_number,
        revisedOutcomeCode: row.revised_outcome_code,
        revisionSummary: row.revision_summary,
        revisedAt: row.revised_at,
        revisedByStaffProfileId: row.revised_by_staff_profile_id,
        reason: row.reason,
        correlationId: row.correlation_id,
        createdAt: row.created_at,
      }));
    }
    return this.revisions.filter((r) => r.decisionRecordId === decisionRecordId);
  }
}
