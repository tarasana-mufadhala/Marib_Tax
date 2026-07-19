import { Controller, Get, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import type {
  OwnedTaxpayerBundle,
  TaxpayerProfileResponse,
} from '@marib-tax/contracts';
import {
  RequirePermission,
  RequirePredicates,
} from '../authz/authorization.decorators.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import { TaxpayerRegistryService } from './taxpayer-registry.service.js';

/**
 * Intentionally not registered in AppModule.
 * Read-only owned registry contracts; no production persistence adapter.
 */
@Controller('api/v1/taxpayers')
export class TaxpayerRegistryController {
  constructor(
    private readonly service: TaxpayerRegistryService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Get('me')
  @RequirePermission('taxpayer.profile.read')
  @RequirePredicates('OWNERSHIP')
  readMe(): Promise<OwnedTaxpayerBundle> {
    return this.service.readOwnedBundle(this.actors.requireActorId());
  }

  @Get(':id')
  @RequirePermission('taxpayer.profile.read')
  @RequirePredicates('OWNERSHIP')
  readById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TaxpayerProfileResponse> {
    return this.service.readOwnedTaxpayerById(this.actors.requireActorId(), id);
  }
}
