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
import { ActivitiesBranchesService } from './activities-branches.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import {
  type StoredCommercialActivity,
  type StoredBranch,
  type StoredActivityAddress,
} from './activities-branches.repository.js';

@Controller('api/v1/activities')
export class ActivitiesBranchesController {
  constructor(
    private readonly service: ActivitiesBranchesService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  createActivity(
    @Body()
    body: {
      taxpayerId: string;
      name: string;
      statusCode: string;
    },
  ): Promise<StoredCommercialActivity> {
    const actorId = this.actors.requireActorId();
    return this.service.createActivity(body, actorId);
  }

  @Get('taxpayers/:taxpayerId')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  listActivities(
    @Param('taxpayerId', new ParseUUIDPipe()) taxpayerId: string,
  ): Promise<StoredCommercialActivity[]> {
    return this.service.listActivitiesForTaxpayer(taxpayerId);
  }

  @Get(':id')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  getActivity(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredCommercialActivity> {
    return this.service.getActivity(id);
  }

  @Post('branches')
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  createBranch(
    @Body()
    body: {
      commercialActivityId: string;
      name: string;
      statusCode: string;
    },
  ): Promise<StoredBranch> {
    const actorId = this.actors.requireActorId();
    return this.service.createBranch(body, actorId);
  }

  @Get(':activityId/branches')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  listBranches(
    @Param('activityId', new ParseUUIDPipe()) activityId: string,
  ): Promise<StoredBranch[]> {
    return this.service.listBranchesForActivity(activityId);
  }

  @Get('branches/:id')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  getBranch(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredBranch> {
    return this.service.getBranch(id);
  }

  @Post('addresses')
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  createAddress(
    @Body()
    body: {
      commercialActivityId?: string | null;
      branchId?: string | null;
      addressLine: string;
      cityCode: string;
      districtCode: string;
      geoPayload?: string | null;
    },
  ): Promise<StoredActivityAddress> {
    return this.service.createAddress(body);
  }

  @Get('branches/:branchId/address')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  getAddress(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
  ): Promise<StoredActivityAddress> {
    return this.service.getAddressForBranch(branchId);
  }
}
