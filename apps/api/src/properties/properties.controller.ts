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
import { PropertiesService } from './properties.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import {
  type StoredProperty,
  type StoredPropertyUnit,
  type StoredPropertyOwnershipRecord,
} from './properties.repository.js';

@Controller('api/v1/properties')
export class PropertiesController {
  constructor(
    private readonly service: PropertiesService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  createProperty(
    @Body()
    body: {
      statusCode: string;
      description?: string | null;
    },
  ): Promise<StoredProperty> {
    const actorId = this.actors.requireActorId();
    return this.service.createProperty(body, actorId);
  }

  @Get(':id')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  getProperty(@Param('id', new ParseUUIDPipe()) id: string): Promise<
    StoredProperty & {
      units: StoredPropertyUnit[];
      owners: StoredPropertyOwnershipRecord[];
    }
  > {
    return this.service.getPropertyWithUnitsAndOwners(id);
  }

  @Post('units')
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  createUnit(
    @Body()
    body: {
      propertyId: string;
      unitLabel: string;
      statusCode: string;
    },
  ): Promise<StoredPropertyUnit> {
    return this.service.createPropertyUnit(body);
  }

  @Post('ownership')
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  createOwnership(
    @Body()
    body: {
      propertyId: string;
      taxpayerId: string;
      partyRoleCode: string;
    },
  ): Promise<StoredPropertyOwnershipRecord> {
    const actorId = this.actors.requireActorId();
    return this.service.createOwnershipRecord(body, actorId);
  }

  @Get('taxpayers/:taxpayerId/ownership')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  listOwnerships(
    @Param('taxpayerId', new ParseUUIDPipe()) taxpayerId: string,
  ): Promise<StoredPropertyOwnershipRecord[]> {
    return this.service.listOwnershipsForTaxpayer(taxpayerId);
  }
}
