export interface StoredFieldVisit {
  id: string;
  publicRef: string | null;
  serviceRequestId: string | null;
  balaghId: string | null;
  statusCode: string; // scheduled, completed, cancelled
  actualStartedAt: Date | null;
  actualEndedAt: Date | null;
  locationSnapshot: string | null;
  notes: string | null;
  cancellationReason: string | null;
  createdByStaffProfileId: string;
  createdByProfileId: string | null;
  updatedAt: Date | null;
  updatedByProfileId: string | null;
  archivedAt: Date | null;
}

export interface StoredVisitSchedule {
  id: string;
  fieldVisitId: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  scheduleStatusCode: string; // active, revised, cancelled
  revisionNumber: number;
  scheduleChangeReason: string | null;
}

export interface StoredVisitTeamMember {
  id: string;
  fieldVisitId: string;
  staffProfileId: string;
  roleOnVisit: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export interface StoredVisitResult {
  id: string;
  fieldVisitId: string;
  resultSummary: string | null;
  resultCode: string | null;
  recordedAt: Date;
  recordedByStaffProfileId: string;
}

export const FIELD_VISITS_REPOSITORY = Symbol('FIELD_VISITS_REPOSITORY');

export interface FieldVisitsRepository {
  findVisitById(id: string): Promise<StoredFieldVisit | null>;
  listVisits(limit: number): Promise<StoredFieldVisit[]>;
  createVisit(visit: StoredFieldVisit): Promise<StoredFieldVisit>;
  updateVisit(
    id: string,
    updates: Partial<StoredFieldVisit>,
  ): Promise<StoredFieldVisit>;

  createSchedule(schedule: StoredVisitSchedule): Promise<StoredVisitSchedule>;
  listSchedulesForVisit(fieldVisitId: string): Promise<StoredVisitSchedule[]>;

  addTeamMember(member: StoredVisitTeamMember): Promise<StoredVisitTeamMember>;
  listTeamMembersForVisit(
    fieldVisitId: string,
  ): Promise<StoredVisitTeamMember[]>;

  recordResult(result: StoredVisitResult): Promise<StoredVisitResult>;
  findResultByVisitId(fieldVisitId: string): Promise<StoredVisitResult | null>;
}
