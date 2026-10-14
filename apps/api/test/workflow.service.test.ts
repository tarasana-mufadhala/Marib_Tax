import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { ActorAuthorizationContext } from '../src/authz/authorization.contracts.js';
import { WorkflowMemoryRepository } from '../src/workflow/workflow.memory-repository.js';
import { WorkflowService } from '../src/workflow/workflow.service.js';
import {
  type TaxpayerRepository,
  type StoredTaxpayer,
  type StoredTaxpayerAccountLink,
} from '../src/taxpayers/taxpayer.repository.js';
import {
  type ActivitiesBranchesRepository,
  type StoredCommercialActivity,
  type StoredBranch,
  type StoredActivityAddress,
} from '../src/activities-branches/activities-branches.repository.js';

describe('WorkflowService', () => {
  it('enforces transition matrices, permissions checks, and validation parameters', async () => {
    const repository = new WorkflowMemoryRepository();
    const taxpayerRepository: TaxpayerRepository = {
      findById(id: string): Promise<StoredTaxpayer | null> {
        return Promise.resolve({
          id,
          publicRef: 'TXP-123',
          displayName: 'Test Taxpayer',
          statusCode: 'active',
          createdAt: new Date(),
          createdByProfileId: null,
        });
      },
      search(): Promise<StoredTaxpayer[]> {
        return Promise.resolve([]);
      },
      list(): Promise<StoredTaxpayer[]> {
        return Promise.resolve([]);
      },
      findActiveLinkByProfileId(): Promise<StoredTaxpayerAccountLink | null> {
        return Promise.resolve(null);
      },
      createLink(
        l: StoredTaxpayerAccountLink,
      ): Promise<StoredTaxpayerAccountLink> {
        return Promise.resolve(l);
      },
      createTaxpayer(t: StoredTaxpayer): Promise<StoredTaxpayer> {
        return Promise.resolve(t);
      },
    };
    const activitiesRepository: ActivitiesBranchesRepository = {
      findActivityById(id: string): Promise<StoredCommercialActivity | null> {
        return Promise.resolve({
          id,
          publicRef: 'ACT-123',
          taxpayerId: 'taxpayer-123',
          name: 'Test Activity',
          statusCode: 'active',
          createdAt: new Date(),
          createdByProfileId: null,
        });
      },
      findBranchById(): Promise<StoredBranch | null> {
        return Promise.resolve(null);
      },
      findActivitiesByTaxpayerId(): Promise<StoredCommercialActivity[]> {
        return Promise.resolve([]);
      },
      findBranchesByActivityId(): Promise<StoredBranch[]> {
        return Promise.resolve([]);
      },
      createActivity(
        a: StoredCommercialActivity,
      ): Promise<StoredCommercialActivity> {
        return Promise.resolve(a);
      },
      createBranch(b: StoredBranch): Promise<StoredBranch> {
        return Promise.resolve(b);
      },
      createAddress(
        addr: StoredActivityAddress,
      ): Promise<StoredActivityAddress> {
        return Promise.resolve(addr);
      },
      findAddressByBranchId(): Promise<StoredActivityAddress | null> {
        return Promise.resolve(null);
      },
    };
    const service = new WorkflowService(
      repository,
      taxpayerRepository,
      activitiesRepository,
    );

    const requestId = randomUUID();
    const ownerActorId = randomUUID();
    const taxpayerId = randomUUID();

    // Seed mock request in draft state
    repository.addRequest({
      id: requestId,
      statusCode: 'draft',
      serviceTypeId: randomUUID(),
      taxpayerId,
      ownerActorId,
      submittedAt: null,
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    });

    const taxpayerActor: ActorAuthorizationContext = {
      actorId: ownerActorId,
      permissions: ['request.submit'],
      roleActive: true,
      assignmentActive: true,
    };

    const staffActor: ActorAuthorizationContext = {
      actorId: randomUUID(),
      permissions: [
        'request.review',
        'field_visit.schedule',
        'request.decision.final',
      ],
      roleActive: true,
      assignmentActive: true,
    };

    // 1. Transition: draft -> submitted
    const submittedReq = await service.transition(
      requestId,
      'submitted',
      taxpayerActor,
    );
    expect(submittedReq.statusCode).toBe('submitted');
    expect(submittedReq.submittedAt).toBeDefined();

    // 2. Try invalid transition: submitted -> draft
    await expect(
      service.transition(requestId, 'draft', taxpayerActor),
    ).rejects.toThrow();

    // 3. Transition: submitted -> under_review
    await service.transition(requestId, 'under_review', staffActor);
    expect((await repository.findRequestById(requestId))?.statusCode).toBe(
      'under_review',
    );

    // 4. Try approved without reason (rejection or approval with reason check)
    await expect(
      service.transition(requestId, 'rejected', staffActor),
    ).rejects.toThrow(/reason is mandatory/i);

    // 5. Rejection with reason
    await service.transition(requestId, 'rejected', staffActor, {
      reason: 'عدم اكتمال بيانات الهوية',
    });
    expect((await repository.findRequestById(requestId))?.statusCode).toBe(
      'rejected',
    );

    // Verify history and audit logs
    const histories = repository.getHistories();
    expect(histories).toHaveLength(3); // draft->submitted, submitted->under_review, under_review->rejected
    expect(histories[2]?.toStatusCode).toBe('rejected');
    expect(histories[2]?.reason).toBe('عدم اكتمال بيانات الهوية');

    const logs = repository.getAuditLogs();
    expect(logs).toHaveLength(3);

    const notifications = repository.getNotifications();
    expect(notifications).toHaveLength(3); // submitted, under_review, rejected all notify
  });
});
