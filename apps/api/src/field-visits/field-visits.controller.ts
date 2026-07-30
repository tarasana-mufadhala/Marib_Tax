import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  Inject,
} from '@nestjs/common';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { FieldVisitsService } from './field-visits.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import {
  type StoredFieldVisit,
  type StoredVisitResult,
} from './field-visits.repository.js';

@Controller('api/v1/visits')
export class FieldVisitsController {
  constructor(
    private readonly visitsService: FieldVisitsService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('field_visit.schedule')
  schedule(
    @Body()
    body: {
      serviceRequestId?: string | null;
      balaghId?: string | null;
      scheduledStartAt: string;
      scheduledEndAt: string;
      teamMemberStaffIds: string[];
      locationSnapshot?: string | null;
      notes?: string | null;
    },
  ): Promise<StoredFieldVisit> {
    const actorId = this.actors.requireActorId();
    return this.visitsService.scheduleVisit(
      {
        serviceRequestId: body.serviceRequestId ?? null,
        balaghId: body.balaghId ?? null,
        scheduledStartAt: new Date(body.scheduledStartAt),
        scheduledEndAt: new Date(body.scheduledEndAt),
        teamMemberStaffIds: body.teamMemberStaffIds,
        locationSnapshot: body.locationSnapshot ?? null,
        notes: body.notes ?? null,
      },
      actorId, // Using actorId as staffProfileId for local mock testing
      actorId,
    );
  }

  @Post(':id/results')
  @HttpCode(201)
  @RequirePermission('field_visit.result.record')
  recordResult(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    body: {
      resultSummary: string;
      resultCode?: string | null;
      actualStartedAt: string;
      actualEndedAt: string;
    },
  ): Promise<StoredVisitResult> {
    const actorId = this.actors.requireActorId();
    return this.visitsService.recordVisitResult(
      id,
      {
        resultSummary: body.resultSummary,
        resultCode: body.resultCode ?? null,
        actualStartedAt: new Date(body.actualStartedAt),
        actualEndedAt: new Date(body.actualEndedAt),
      },
      actorId,
      actorId,
    );
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @RequirePermission('field_visit.schedule')
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('reason') reason: string,
  ): Promise<StoredFieldVisit> {
    const actorId = this.actors.requireActorId();
    return this.visitsService.cancelVisit(id, reason, actorId);
  }

  @Get(':id')
  @HttpCode(200)
  @RequirePermission('request.review')
  getVisit(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredFieldVisit> {
    return this.visitsService.getVisit(id);
  }
}
