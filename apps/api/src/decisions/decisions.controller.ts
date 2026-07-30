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
import { DecisionsService } from './decisions.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import {
  type StoredDecisionRecord,
  type StoredDecisionRevision,
} from './decisions.repository.js';

@Controller('api/v1/decisions')
export class DecisionsController {
  constructor(
    private readonly service: DecisionsService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('request.decision.final')
  record(
    @Body()
    body: {
      serviceRequestId: string;
      outcomeCode: string;
      decisionSummary?: string | null;
      basisText?: string | null;
    },
  ): Promise<StoredDecisionRecord> {
    const actorId = this.actors.requireActorId();
    return this.service.recordDecision(
      {
        serviceRequestId: body.serviceRequestId,
        outcomeCode: body.outcomeCode,
        decisionSummary: body.decisionSummary ?? null,
        basisText: body.basisText ?? null,
      },
      actorId,
      actorId,
    );
  }

  @Post(':id/revisions')
  @HttpCode(201)
  @RequirePermission('request.decision.final')
  revise(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    body: {
      revisedOutcomeCode?: string | null;
      revisionSummary?: string | null;
      reason: string;
    },
  ): Promise<StoredDecisionRevision> {
    const actorId = this.actors.requireActorId();
    return this.service.reviseDecision(
      id,
      {
        revisedOutcomeCode: body.revisedOutcomeCode ?? null,
        revisionSummary: body.revisionSummary ?? null,
        reason: body.reason,
      },
      actorId,
    );
  }

  @Get('requests/:requestId')
  @HttpCode(200)
  @RequirePermission('request.review')
  getDecision(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
  ): Promise<StoredDecisionRecord> {
    return this.service.getDecisionForRequest(requestId);
  }
}
