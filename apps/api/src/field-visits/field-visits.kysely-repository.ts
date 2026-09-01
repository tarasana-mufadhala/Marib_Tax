import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  FieldVisitsRepository,
  StoredFieldVisit,
  StoredVisitSchedule,
  StoredVisitTeamMember,
  StoredVisitResult,
} from './field-visits.repository.js';

@Injectable()
export class FieldVisitsKyselyRepository implements FieldVisitsRepository {
  // In-memory fallback
  private readonly visits = new Map<string, StoredFieldVisit>();
  private readonly schedules = new Map<string, StoredVisitSchedule>();
  private readonly teamMembers = new Map<string, StoredVisitTeamMember>();
  private readonly results = new Map<string, StoredVisitResult>();

  constructor(private readonly dbService: DatabaseService) {}

  async findVisitById(id: string): Promise<StoredFieldVisit | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('visits.field_visits')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        publicRef: row.public_ref,
        serviceRequestId: row.service_request_id,
        balaghId: row.balagh_id,
        statusCode: row.status_code,
        actualStartedAt: row.actual_started_at,
        actualEndedAt: row.actual_ended_at,
        locationSnapshot: row.location_snapshot,
        notes: row.notes,
        cancellationReason: row.cancellation_reason,
        createdByStaffProfileId: row.created_by_staff_profile_id,
        createdByProfileId: row.created_by_profile_id,
        updatedAt: row.updated_at,
        updatedByProfileId: row.updated_by_profile_id,
        archivedAt: row.archived_at,
      };
    }
    return this.visits.get(id) ?? null;
  }

  async listVisits(limit: number): Promise<StoredFieldVisit[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('visits.field_visits')
        .selectAll()
        .where('archived_at', 'is', null)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        publicRef: row.public_ref,
        serviceRequestId: row.service_request_id,
        balaghId: row.balagh_id,
        statusCode: row.status_code,
        actualStartedAt: row.actual_started_at,
        actualEndedAt: row.actual_ended_at,
        locationSnapshot: row.location_snapshot,
        notes: row.notes,
        cancellationReason: row.cancellation_reason,
        createdByStaffProfileId: row.created_by_staff_profile_id,
        createdByProfileId: row.created_by_profile_id,
        updatedAt: row.updated_at,
        updatedByProfileId: row.updated_by_profile_id,
        archivedAt: row.archived_at,
      }));
    }
    return [...this.visits.values()].slice(0, limit);
  }

  async createVisit(visit: StoredFieldVisit): Promise<StoredFieldVisit> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('visits.field_visits')
        .values({
          id: visit.id,
          public_ref: visit.publicRef,
          service_request_id: visit.serviceRequestId,
          balagh_id: visit.balaghId,
          status_code: visit.statusCode,
          created_at: new Date(),
          actual_started_at: visit.actualStartedAt,
          actual_ended_at: visit.actualEndedAt,
          location_snapshot: visit.locationSnapshot,
          notes: visit.notes,
          cancellation_reason: visit.cancellationReason,
          created_by_staff_profile_id: visit.createdByStaffProfileId,
          created_by_profile_id: visit.createdByProfileId,
          updated_at: visit.updatedAt,
          updated_by_profile_id: visit.updatedByProfileId,
          correlation_id: null,
          archived_at: visit.archivedAt,
        })
        .execute();
      return visit;
    }
    this.visits.set(visit.id, visit);
    return visit;
  }

  async updateVisit(id: string, updates: Partial<StoredFieldVisit>): Promise<StoredFieldVisit> {
    if (this.dbService.isInitialized) {
      const dbUpdates: {
        status_code?: string;
        actual_started_at?: Date | null;
        actual_ended_at?: Date | null;
        cancellation_reason?: string | null;
        updated_at?: Date | null;
        updated_by_profile_id?: string | null;
      } = {};
      if (updates.statusCode !== undefined) dbUpdates.status_code = updates.statusCode;
      if (updates.actualStartedAt !== undefined) dbUpdates.actual_started_at = updates.actualStartedAt;
      if (updates.actualEndedAt !== undefined) dbUpdates.actual_ended_at = updates.actualEndedAt;
      if (updates.cancellationReason !== undefined)
        dbUpdates.cancellation_reason = updates.cancellationReason;
      if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;
      if (updates.updatedByProfileId !== undefined)
        dbUpdates.updated_by_profile_id = updates.updatedByProfileId;

      await this.dbService.db
        .updateTable('visits.field_visits')
        .set(dbUpdates)
        .where('id', '=', id)
        .execute();

      const updated = await this.findVisitById(id);
      if (!updated) throw new Error('Field visit not found after update.');
      return updated;
    }

    const existing = this.visits.get(id);
    if (!existing) throw new Error('Field visit not found.');
    const updated = { ...existing, ...updates };
    this.visits.set(id, updated);
    return updated;
  }

  async createSchedule(schedule: StoredVisitSchedule): Promise<StoredVisitSchedule> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('visits.visit_schedules')
        .values({
          id: schedule.id,
          field_visit_id: schedule.fieldVisitId,
          scheduled_start_at: schedule.scheduledStartAt,
          scheduled_end_at: schedule.scheduledEndAt,
          schedule_status_code: schedule.scheduleStatusCode,
          revision_number: schedule.revisionNumber,
          schedule_change_reason: schedule.scheduleChangeReason,
          created_at: new Date(),
          created_by_profile_id: null,
          updated_at: null,
          updated_by_profile_id: null,
          correlation_id: null,
        })
        .execute();
      return schedule;
    }
    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  async listSchedulesForVisit(fieldVisitId: string): Promise<StoredVisitSchedule[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('visits.visit_schedules')
        .selectAll()
        .where('field_visit_id', '=', fieldVisitId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        fieldVisitId: row.field_visit_id,
        scheduledStartAt: row.scheduled_start_at,
        scheduledEndAt: row.scheduled_end_at,
        scheduleStatusCode: row.schedule_status_code,
        revisionNumber: row.revision_number,
        scheduleChangeReason: row.schedule_change_reason,
      }));
    }
    return [...this.schedules.values()].filter((s) => s.fieldVisitId === fieldVisitId);
  }

  async addTeamMember(member: StoredVisitTeamMember): Promise<StoredVisitTeamMember> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('visits.visit_team_members')
        .values({
          id: member.id,
          field_visit_id: member.fieldVisitId,
          staff_profile_id: member.staffProfileId,
          role_on_visit: member.roleOnVisit,
          effective_from: member.effectiveFrom,
          effective_to: member.effectiveTo,
          created_at: new Date(),
          created_by_profile_id: null,
          correlation_id: null,
        })
        .execute();
      return member;
    }
    this.teamMembers.set(member.id, member);
    return member;
  }

  async listTeamMembersForVisit(fieldVisitId: string): Promise<StoredVisitTeamMember[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('visits.visit_team_members')
        .selectAll()
        .where('field_visit_id', '=', fieldVisitId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        fieldVisitId: row.field_visit_id,
        staffProfileId: row.staff_profile_id,
        roleOnVisit: row.role_on_visit,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
      }));
    }
    return [...this.teamMembers.values()].filter((m) => m.fieldVisitId === fieldVisitId);
  }

  async recordResult(result: StoredVisitResult): Promise<StoredVisitResult> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('visits.visit_results')
        .values({
          id: result.id,
          field_visit_id: result.fieldVisitId,
          result_summary: result.resultSummary,
          result_code: result.resultCode,
          recorded_at: result.recordedAt,
          recorded_by_staff_profile_id: result.recordedByStaffProfileId,
          created_at: new Date(),
          created_by_profile_id: null,
          updated_at: null,
          updated_by_profile_id: null,
          correlation_id: null,
        })
        .execute();
      return result;
    }
    this.results.set(result.fieldVisitId, result);
    return result;
  }

  async findResultByVisitId(fieldVisitId: string): Promise<StoredVisitResult | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('visits.visit_results')
        .selectAll()
        .where('field_visit_id', '=', fieldVisitId)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        fieldVisitId: row.field_visit_id,
        resultSummary: row.result_summary,
        resultCode: row.result_code,
        recordedAt: row.recorded_at,
        recordedByStaffProfileId: row.recorded_by_staff_profile_id,
      };
    }
    return this.results.get(fieldVisitId) ?? null;
  }
}
