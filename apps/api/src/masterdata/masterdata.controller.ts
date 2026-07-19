import { Controller, Get, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import type {
  CommercialActivitySummary,
  OwnedMasterdataBundle,
} from '@marib-tax/contracts';
import {
  RequirePermission,
  RequirePredicates,
} from '../authz/authorization.decorators.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import { MasterdataService } from './masterdata.service.js';

/**
 * Intentionally not registered in AppModule.
 * Owned masterdata read contracts; no production persistence adapter.
 */
@Controller('api/v1/masterdata')
export class MasterdataController {
  constructor(
    private readonly service: MasterdataService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Get('me')
  @RequirePermission('taxpayer.profile.read')
  @RequirePredicates('OWNERSHIP')
  readMe(): Promise<OwnedMasterdataBundle> {
    return this.service.readOwnedBundle(this.actors.requireActorId());
  }

  @Get('activities/:id')
  @RequirePermission('taxpayer.profile.read')
  @RequirePredicates('OWNERSHIP')
  readActivity(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CommercialActivitySummary> {
    return this.service.readOwnedActivityById(
      this.actors.requireActorId(),
      id,
    );
  }
}
