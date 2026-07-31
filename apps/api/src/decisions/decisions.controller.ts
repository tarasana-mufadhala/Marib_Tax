import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  Inject,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  recordDecisionSchema,
  reviseDecisionSchema,
} from '@marib-tax/contracts';
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
    body: unknown,
  ): Promise<StoredDecisionRecord> {
    const parsed = recordDecisionSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException();
    }
    const actorId = this.actors.requireActorId();
    return this.service.recordDecision(
      {
        serviceRequestId: parsed.data.serviceRequestId,
        outcomeCode: parsed.data.outcomeCode,
        decisionSummary: parsed.data.decisionSummary ?? null,
        basisText: parsed.data.basisText ?? null,
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
    body: unknown,
  ): Promise<StoredDecisionRevision> {
    const parsed = reviseDecisionSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException();
    }
    const actorId = this.actors.requireActorId();
    return this.service.reviseDecision(
      id,
      {
        revisedOutcomeCode: parsed.data.revisedOutcomeCode ?? null,
        revisionSummary: parsed.data.revisionSummary ?? null,
        reason: parsed.data.reason,
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
