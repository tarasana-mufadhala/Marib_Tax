import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  Inject,
} from '@nestjs/common';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { LegalEntitiesService } from './legal-entities.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import {
  type StoredLegalEntity,
  type StoredTaxNumber,
  type StoredTaxpayerLegalEntityAssociation,
} from './legal-entities.repository.js';

@Controller('api/v1/legal-entities')
export class LegalEntitiesController {
  constructor(
    private readonly service: LegalEntitiesService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  createEntity(
    @Body()
    body: {
      legalName: string;
      classificationCode?: string | null;
    },
  ): Promise<StoredLegalEntity> {
    const actorId = this.actors.requireActorId();
    return this.service.createLegalEntity(body, actorId);
  }

  @Get(':id')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  getEntity(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredLegalEntity> {
    return this.service.getLegalEntity(id);
  }

  @Post('tax-numbers')
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  issueTaxNumber(
    @Body()
    body: {
      legalEntityId: string;
      taxpayerId?: string | null;
      taxNumberValue: string;
    },
  ): Promise<StoredTaxNumber> {
    const actorId = this.actors.requireActorId();
    return this.service.issueTaxNumber(body, actorId);
  }

  @Get('tax-numbers/:value')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  getTaxNumber(@Param('value') value: string): Promise<StoredTaxNumber> {
    return this.service.getTaxNumberByValue(value);
  }

  @Get('taxpayers/:taxpayerId/tax-number')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  getTaxpayerTaxNumber(
    @Param('taxpayerId', new ParseUUIDPipe()) taxpayerId: string,
  ): Promise<StoredTaxNumber> {
    return this.service.getTaxNumberForTaxpayer(taxpayerId);
  }

  @Post('associations')
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  associate(
    @Body()
    body: {
      taxpayerId: string;
      legalEntityId: string;
      associationTypeCode: string;
    },
  ): Promise<StoredTaxpayerLegalEntityAssociation> {
    const actorId = this.actors.requireActorId();
    return this.service.associateTaxpayer(body, actorId);
  }

  @Get('taxpayers/:taxpayerId/associations')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  listAssociations(
    @Param('taxpayerId', new ParseUUIDPipe()) taxpayerId: string,
  ): Promise<StoredTaxpayerLegalEntityAssociation[]> {
    return this.service.listAssociations(taxpayerId);
  }
}
