import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { DecisionsMemoryRepository } from '../src/decisions/decisions.memory-repository.js';
import { DecisionsService } from '../src/decisions/decisions.service.js';

describe('DecisionsService', () => {
  it('manages recording decisions and submitting revisions', async () => {
    const repository = new DecisionsMemoryRepository();
    const service = new DecisionsService(repository);

    const serviceRequestId = randomUUID();
    const staffId = randomUUID();

    // 1. Record decision
    const decision = await service.recordDecision(
      {
        serviceRequestId,
        outcomeCode: 'approved',
        decisionSummary: 'مستوف للشروط بالكامل ومطابق للنزول الميداني.',
        basisText: 'بناء على تقرير النزول رقم 102',
      },
      staffId,
    );

    expect(decision.outcomeCode).toBe('approved');
    expect(decision.serviceRequestId).toBe(serviceRequestId);

    // Get decision
    const retrieved = await service.getDecisionForRequest(serviceRequestId);
    expect(retrieved.id).toBe(decision.id);

    // Try to record duplicate decision
    await expect(
      service.recordDecision(
        {
          serviceRequestId,
          outcomeCode: 'rejected',
          decisionSummary: null,
          basisText: null,
        },
        staffId,
      ),
    ).rejects.toThrow();

    // 2. Revise decision
    const revision = await service.reviseDecision(
      decision.id,
      {
        revisedOutcomeCode: 'rejected',
        revisionSummary: 'تم إلغاء الموافقة لثبوت عدم صحة عنوان الفرع.',
        reason: 'تراجع المدير عن الموافقة بعد مراجعة مستجدة',
      },
      staffId,
    );

    expect(revision.decisionRecordId).toBe(decision.id);
    expect(revision.revisionNumber).toBe(1);
    expect(revision.revisedOutcomeCode).toBe('rejected');

    // Verify revisions list
    const list = await repository.listRevisionsForDecision(decision.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(revision.id);
  });
});
