import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { FieldVisitsMemoryRepository } from '../src/field-visits/field-visits.memory-repository.js';
import { FieldVisitsService } from '../src/field-visits/field-visits.service.js';

describe('FieldVisitsService', () => {
  it('manages scheduling, adding team members, recording results, and cancellations', async () => {
    const repository = new FieldVisitsMemoryRepository();
    const service = new FieldVisitsService(repository);

    const serviceRequestId = randomUUID();
    const staffId = randomUUID();

    // 1. Schedule a visit
    const start = new Date(Date.now() + 3600000);
    const end = new Date(Date.now() + 7200000);

    const visit = await service.scheduleVisit(
      {
        serviceRequestId,
        balaghId: null,
        scheduledStartAt: start,
        scheduledEndAt: end,
        teamMemberStaffIds: [staffId],
        locationSnapshot: 'مأرب - حي الروضة',
        notes: 'التحقق من العنوان الجديد للمكلف',
      },
      staffId,
    );

    expect(visit.statusCode).toBe('scheduled');
    expect(visit.serviceRequestId).toBe(serviceRequestId);
    expect(visit.balaghId).toBeNull();
    expect(visit.publicRef).toBeDefined();

    // Verify schedules
    const schedules = await repository.listSchedulesForVisit(visit.id);
    expect(schedules).toHaveLength(1);
    expect(schedules[0]?.revisionNumber).toBe(1);

    // Verify team
    const team = await repository.listTeamMembersForVisit(visit.id);
    expect(team).toHaveLength(1);
    expect(team[0]?.staffProfileId).toBe(staffId);

    // 2. Record results
    const actualStart = new Date();
    const actualEnd = new Date(Date.now() + 1800000);

    const result = await service.recordVisitResult(
      visit.id,
      {
        resultSummary:
          'تمت مطابقة العنوان الفعلي بنجاح وثبتت صحة انتقال المحل التجاري.',
        resultCode: 'VERIFIED',
        actualStartedAt: actualStart,
        actualEndedAt: actualEnd,
      },
      staffId,
    );

    expect(result.fieldVisitId).toBe(visit.id);
    expect(result.resultCode).toBe('VERIFIED');

    const updatedVisit = await service.getVisit(visit.id);
    expect(updatedVisit.statusCode).toBe('completed');
    expect(updatedVisit.actualStartedAt).toEqual(actualStart);
    expect(updatedVisit.actualEndedAt).toEqual(actualEnd);

    // 3. Cancellation test on a new visit
    const anotherVisit = await service.scheduleVisit(
      {
        serviceRequestId,
        balaghId: null,
        scheduledStartAt: start,
        scheduledEndAt: end,
        teamMemberStaffIds: [staffId],
        locationSnapshot: null,
        notes: null,
      },
      staffId,
    );

    const cancelled = await service.cancelVisit(
      anotherVisit.id,
      'تعذر الوصول بسبب الأحوال الجوية',
      staffId,
    );
    expect(cancelled.statusCode).toBe('cancelled');
    expect(cancelled.cancellationReason).toBe(
      'تعذر الوصول بسبب الأحوال الجوية',
    );
  });
});
