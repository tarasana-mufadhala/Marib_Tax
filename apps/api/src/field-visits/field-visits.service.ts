import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  FIELD_VISITS_REPOSITORY,
  type FieldVisitsRepository,
  type StoredFieldVisit,
  type StoredVisitSchedule,
  type StoredVisitTeamMember,
  type StoredVisitResult,
} from './field-visits.repository.js';

@Injectable()
export class FieldVisitsService {
  constructor(
    @Inject(FIELD_VISITS_REPOSITORY)
    private readonly repository: FieldVisitsRepository,
  ) {}

  async scheduleVisit(
    input: {
      serviceRequestId: string | null;
      balaghId: string | null;
      scheduledStartAt: Date;
      scheduledEndAt: Date;
      teamMemberStaffIds: string[];
      locationSnapshot: string | null;
      notes: string | null;
    },
    actorStaffProfileId: string,
    actorProfileId: string | null = null,
  ): Promise<StoredFieldVisit> {
    const hasRequest = !!input.serviceRequestId;
    const hasBalagh = !!input.balaghId;

    if ((hasRequest && hasBalagh) || (!hasRequest && !hasBalagh)) {
      throw new BadRequestException(
        'Exact-one parent context (serviceRequestId XOR balaghId) is required.',
      );
    }

    if (input.scheduledEndAt <= input.scheduledStartAt) {
      throw new BadRequestException(
        'Scheduled end date must be later than start date.',
      );
    }

    const visitId = randomUUID();
    const visit: StoredFieldVisit = {
      id: visitId,
      publicRef: `VIS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      serviceRequestId: input.serviceRequestId,
      balaghId: input.balaghId,
      statusCode: 'scheduled',
      actualStartedAt: null,
      actualEndedAt: null,
      locationSnapshot: input.locationSnapshot,
      notes: input.notes,
      cancellationReason: null,
      createdByStaffProfileId: actorStaffProfileId,
      createdByProfileId: actorProfileId,
      updatedAt: null,
      updatedByProfileId: null,
      archivedAt: null,
    };

    const createdVisit = await this.repository.createVisit(visit);

    // Initial schedule revision 1
    const schedule: StoredVisitSchedule = {
      id: randomUUID(),
      fieldVisitId: visitId,
      scheduledStartAt: input.scheduledStartAt,
      scheduledEndAt: input.scheduledEndAt,
      scheduleStatusCode: 'active',
      revisionNumber: 1,
      scheduleChangeReason: null,
    };
    await this.repository.createSchedule(schedule);

    // Add team members
    for (const staffId of input.teamMemberStaffIds) {
      const member: StoredVisitTeamMember = {
        id: randomUUID(),
        fieldVisitId: visitId,
        staffProfileId: staffId,
        roleOnVisit: 'inspector',
        effectiveFrom: new Date(),
        effectiveTo: null,
      };
      await this.repository.addTeamMember(member);
    }

    return createdVisit;
  }

  async recordVisitResult(
    fieldVisitId: string,
    input: {
      resultSummary: string;
      resultCode: string | null;
      actualStartedAt: Date;
      actualEndedAt: Date;
    },
    actorStaffProfileId: string,
    actorProfileId: string | null = null,
  ): Promise<StoredVisitResult> {
    const visit = await this.repository.findVisitById(fieldVisitId);
    if (!visit) {
      throw new NotFoundException('Field visit not found.');
    }

    if (visit.statusCode !== 'scheduled') {
      throw new ConflictException(
        `Cannot record results for a visit that is currently "${visit.statusCode}".`,
      );
    }

    if (input.actualEndedAt <= input.actualStartedAt) {
      throw new BadRequestException(
        'Actual end date must be later than start date.',
      );
    }

    // Update visit status
    await this.repository.updateVisit(fieldVisitId, {
      statusCode: 'completed',
      actualStartedAt: input.actualStartedAt,
      actualEndedAt: input.actualEndedAt,
      updatedAt: new Date(),
      updatedByProfileId: actorProfileId,
    });

    // Create result
    const result: StoredVisitResult = {
      id: randomUUID(),
      fieldVisitId,
      resultSummary: input.resultSummary,
      resultCode: input.resultCode,
      recordedAt: new Date(),
      recordedByStaffProfileId: actorStaffProfileId,
    };

    return this.repository.recordResult(result);
  }

  async cancelVisit(
    fieldVisitId: string,
    reason: string,
    actorProfileId: string | null = null,
  ): Promise<StoredFieldVisit> {
    const visit = await this.repository.findVisitById(fieldVisitId);
    if (!visit) {
      throw new NotFoundException('Field visit not found.');
    }

    if (visit.statusCode === 'completed' || visit.statusCode === 'cancelled') {
      throw new ConflictException(
        `Cannot cancel a visit that is already "${visit.statusCode}".`,
      );
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Cancellation reason cannot be blank.');
    }

    return this.repository.updateVisit(fieldVisitId, {
      statusCode: 'cancelled',
      cancellationReason: reason,
      updatedAt: new Date(),
      updatedByProfileId: actorProfileId,
    });
  }

  async getVisit(id: string): Promise<StoredFieldVisit> {
    const visit = await this.repository.findVisitById(id);
    if (!visit) {
      throw new NotFoundException('Field visit not found.');
    }
    return visit;
  }

  async listVisits(limit = 50): Promise<StoredFieldVisit[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    return this.repository.listVisits(safeLimit);
  }
}
