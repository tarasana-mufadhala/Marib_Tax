import { Injectable } from '@nestjs/common';
import {
  type FieldVisitsRepository,
  type StoredFieldVisit,
  type StoredVisitSchedule,
  type StoredVisitTeamMember,
  type StoredVisitResult,
} from './field-visits.repository.js';

@Injectable()
export class FieldVisitsMemoryRepository implements FieldVisitsRepository {
  private readonly visits = new Map<string, StoredFieldVisit>();
  private readonly schedules: StoredVisitSchedule[] = [];
  private readonly teamMembers: StoredVisitTeamMember[] = [];
  private readonly results = new Map<string, StoredVisitResult>();

  async findVisitById(id: string): Promise<StoredFieldVisit | null> {
    await Promise.resolve();
    return this.visits.get(id) ?? null;
  }

  async listVisits(limit: number): Promise<StoredFieldVisit[]> {
    await Promise.resolve();
    return [...this.visits.values()].slice(0, limit);
  }

  async createVisit(visit: StoredFieldVisit): Promise<StoredFieldVisit> {
    await Promise.resolve();
    this.visits.set(visit.id, visit);
    return visit;
  }

  async updateVisit(
    id: string,
    updates: Partial<StoredFieldVisit>,
  ): Promise<StoredFieldVisit> {
    await Promise.resolve();
    const existing = this.visits.get(id);
    if (!existing) throw new Error('Field visit not found.');
    const updated = { ...existing, ...updates };
    this.visits.set(id, updated);
    return updated;
  }

  async createSchedule(
    schedule: StoredVisitSchedule,
  ): Promise<StoredVisitSchedule> {
    await Promise.resolve();
    this.schedules.push(schedule);
    return schedule;
  }

  async listSchedulesForVisit(
    fieldVisitId: string,
  ): Promise<StoredVisitSchedule[]> {
    await Promise.resolve();
    return this.schedules.filter((s) => s.fieldVisitId === fieldVisitId);
  }

  async addTeamMember(
    member: StoredVisitTeamMember,
  ): Promise<StoredVisitTeamMember> {
    await Promise.resolve();
    this.teamMembers.push(member);
    return member;
  }

  async listTeamMembersForVisit(
    fieldVisitId: string,
  ): Promise<StoredVisitTeamMember[]> {
    await Promise.resolve();
    return this.teamMembers.filter((m) => m.fieldVisitId === fieldVisitId);
  }

  async recordResult(result: StoredVisitResult): Promise<StoredVisitResult> {
    await Promise.resolve();
    this.results.set(result.fieldVisitId, result);
    return result;
  }

  async findResultByVisitId(
    fieldVisitId: string,
  ): Promise<StoredVisitResult | null> {
    await Promise.resolve();
    return this.results.get(fieldVisitId) ?? null;
  }
}
