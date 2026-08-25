import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  Inject,
  Req,
} from '@nestjs/common';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { ActivitiesBranchesService } from './activities-branches.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { AuthenticatedRequest } from '../authn/bearer-actor-context.resolver.js';
import { ActivityOwnershipService } from './activity-ownership.service.js';
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
    private readonly ownership: ActivityOwnershipService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  async createActivity(
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      taxpayerId: string;
      name: string;
      statusCode: string;
    },
  ): Promise<StoredCommercialActivity> {
    await this.ownership.assertMayAccessTaxpayer(request, body.taxpayerId);
    const actorId = this.actors.requireActorId();
    return this.service.createActivity(body, actorId);
  }

  @Get('taxpayers/:taxpayerId')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  async listActivities(
    @Req() request: AuthenticatedRequest,
    @Param('taxpayerId', new ParseUUIDPipe()) taxpayerId: string,
  ): Promise<StoredCommercialActivity[]> {
    await this.ownership.assertMayAccessTaxpayer(request, taxpayerId);
    return this.service.listActivitiesForTaxpayer(taxpayerId);
  }

  @Get(':id')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  async getActivity(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredCommercialActivity> {
    await this.ownership.assertMayAccessActivity(request, id);
    return this.service.getActivity(id);
  }

  @Post('branches')
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  async createBranch(
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      commercialActivityId: string;
      name: string;
      statusCode: string;
    },
  ): Promise<StoredBranch> {
    await this.ownership.assertMayAccessActivity(
      request,
      body.commercialActivityId,
    );
    const actorId = this.actors.requireActorId();
    return this.service.createBranch(body, actorId);
  }

  @Get(':activityId/branches')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  async listBranches(
    @Req() request: AuthenticatedRequest,
    @Param('activityId', new ParseUUIDPipe()) activityId: string,
  ): Promise<StoredBranch[]> {
    await this.ownership.assertMayAccessActivity(request, activityId);
    return this.service.listBranchesForActivity(activityId);
  }

  @Get('branches/:id')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  async getBranch(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredBranch> {
    await this.ownership.assertMayAccessBranch(request, id);
    return this.service.getBranch(id);
  }

  @Post('addresses')
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  async createAddress(
    @Req() request: AuthenticatedRequest,
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
    if (body.commercialActivityId) {
      await this.ownership.assertMayAccessActivity(
        request,
        body.commercialActivityId,
      );
    }
    if (body.branchId) {
      await this.ownership.assertMayAccessBranch(request, body.branchId);
    }
    return this.service.createAddress(body);
  }

  @Get('branches/:branchId/address')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  async getAddress(
    @Req() request: AuthenticatedRequest,
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
  ): Promise<StoredActivityAddress> {
    await this.ownership.assertMayAccessBranch(request, branchId);
    return this.service.getAddressForBranch(branchId);
  }
}
