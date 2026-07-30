import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DECISIONS_REPOSITORY,
  type DecisionsRepository,
  type StoredDecisionRecord,
  type StoredDecisionRevision,
} from './decisions.repository.js';

@Injectable()
export class DecisionsService {
  constructor(
    @Inject(DECISIONS_REPOSITORY)
    private readonly repository: DecisionsRepository,
  ) {}

  async recordDecision(
    input: {
      serviceRequestId: string;
      outcomeCode: string; // approved, rejected
      decisionSummary: string | null;
      basisText: string | null;
    },
    actorStaffProfileId: string,
    actorProfileId: string | null = null,
  ): Promise<StoredDecisionRecord> {
    if (!['approved', 'rejected'].includes(input.outcomeCode)) {
      throw new BadRequestException(
        'Outcome code must be approved or rejected.',
      );
    }

    const existing = await this.repository.findDecisionByRequestId(
      input.serviceRequestId,
    );
    if (existing) {
      throw new ConflictException(
        'Decision record already exists for this request.',
      );
    }

    const decision: StoredDecisionRecord = {
      id: randomUUID(),
      serviceRequestId: input.serviceRequestId,
      outcomeCode: input.outcomeCode,
      decisionSummary: input.decisionSummary,
      basisText: input.basisText,
      decidedAt: new Date(),
      decidedByStaffProfileId: actorStaffProfileId,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
      correlationId: null,
    };

    return this.repository.createDecision(decision);
  }

  async reviseDecision(
    decisionRecordId: string,
    input: {
      revisedOutcomeCode: string | null;
      revisionSummary: string | null;
      reason: string;
    },
    actorStaffProfileId: string,
  ): Promise<StoredDecisionRevision> {
    const decision = await this.repository.findDecisionById(decisionRecordId);
    if (!decision) {
      throw new NotFoundException('Decision record not found.');
    }

    if (!input.reason || input.reason.trim() === '') {
      throw new BadRequestException('Revision reason is mandatory.');
    }

    const revisions =
      await this.repository.listRevisionsForDecision(decisionRecordId);
    const revisionNumber = revisions.length + 1;

    const revision: StoredDecisionRevision = {
      id: randomUUID(),
      decisionRecordId,
      revisionNumber,
      revisedOutcomeCode: input.revisedOutcomeCode,
      revisionSummary: input.revisionSummary,
      revisedAt: new Date(),
      revisedByStaffProfileId: actorStaffProfileId,
      reason: input.reason,
      correlationId: null,
      createdAt: new Date(),
    };

    return this.repository.createRevision(revision);
  }

  async getDecisionForRequest(
    serviceRequestId: string,
  ): Promise<StoredDecisionRecord> {
    const decision =
      await this.repository.findDecisionByRequestId(serviceRequestId);
    if (!decision) {
      throw new NotFoundException('Decision record not found.');
    }
    return decision;
  }
}
