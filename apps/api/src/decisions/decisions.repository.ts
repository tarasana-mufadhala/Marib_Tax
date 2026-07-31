export interface StoredDecisionRecord {
  id: string;
  serviceRequestId: string;
  outcomeCode: string; // approved, rejected
  decisionSummary: string | null;
  basisText: string | null;
  decidedAt: Date;
  decidedByStaffProfileId: string;
  createdAt: Date;
  createdByProfileId: string | null;
  correlationId: string | null;
}

export interface StoredDecisionRevision {
  id: string;
  decisionRecordId: string;
  revisionNumber: number;
  revisedOutcomeCode: string | null;
  revisionSummary: string | null;
  revisedAt: Date;
  revisedByStaffProfileId: string;
  reason: string | null;
  correlationId: string | null;
  createdAt: Date;
}

export const DECISIONS_REPOSITORY = Symbol('DECISIONS_REPOSITORY');

export interface DecisionsRepository {
  findDecisionById(id: string): Promise<StoredDecisionRecord | null>;
  findDecisionByRequestId(
    serviceRequestId: string,
  ): Promise<StoredDecisionRecord | null>;
  createDecision(record: StoredDecisionRecord): Promise<StoredDecisionRecord>;

  createRevision(
    revision: StoredDecisionRevision,
  ): Promise<StoredDecisionRevision>;
  listRevisionsForDecision(
    decisionRecordId: string,
  ): Promise<StoredDecisionRevision[]>;
}
