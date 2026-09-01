import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  Inject,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  scheduleFieldVisitSchema,
  recordFieldVisitResultSchema,
  cancelFieldVisitSchema,
} from '@marib-tax/contracts';
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

  @Get()
  @HttpCode(200)
  @RequirePermission('field_visit.schedule')
  list(@Query('limit') limit?: string): Promise<StoredFieldVisit[]> {
    return this.visitsService.listVisits(limit ? Number(limit) : undefined);
  }

  @Post()
  @HttpCode(201)
  @RequirePermission('field_visit.schedule')
  schedule(
    @Body()
    body: unknown,
  ): Promise<StoredFieldVisit> {
    const parsed = scheduleFieldVisitSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException();
    }
    const actorId = this.actors.requireActorId();
    return this.visitsService.scheduleVisit(
      {
        serviceRequestId: parsed.data.serviceRequestId,
        balaghId: parsed.data.balaghId,
        scheduledStartAt: new Date(parsed.data.scheduledStartAt),
        scheduledEndAt: new Date(parsed.data.scheduledEndAt),
        teamMemberStaffIds: parsed.data.teamMemberStaffIds,
        locationSnapshot: parsed.data.locationSnapshot ?? null,
        notes: parsed.data.notes ?? null,
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
    body: unknown,
  ): Promise<StoredVisitResult> {
    const parsed = recordFieldVisitResultSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException();
    }
    const actorId = this.actors.requireActorId();
    return this.visitsService.recordVisitResult(
      id,
      {
        resultSummary: parsed.data.resultSummary,
        resultCode: parsed.data.resultCode ?? null,
        actualStartedAt: new Date(parsed.data.actualStartedAt),
        actualEndedAt: new Date(parsed.data.actualEndedAt),
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
    @Body()
    body: unknown,
  ): Promise<StoredFieldVisit> {
    const parsed = cancelFieldVisitSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException();
    }
    const actorId = this.actors.requireActorId();
    return this.visitsService.cancelVisit(id, parsed.data.reason, actorId);
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
