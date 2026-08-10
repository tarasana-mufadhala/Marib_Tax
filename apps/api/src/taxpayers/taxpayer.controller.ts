import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  Inject,
} from '@nestjs/common';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { TaxpayerService } from './taxpayer.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import {
  type StoredTaxpayer,
  type StoredTaxpayerAccountLink,
} from './taxpayer.repository.js';

@Controller('api/v1/taxpayers')
export class TaxpayerController {
  constructor(
    private readonly service: TaxpayerService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  create(
    @Body()
    body: {
      displayName: string;
      statusCode: string;
    },
  ): Promise<StoredTaxpayer> {
    const actorId = this.actors.requireActorId();
    return this.service.createTaxpayer(body, actorId);
  }

  @Get()
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  list(@Query('limit') limit?: string): Promise<StoredTaxpayer[]> {
    return this.service.listTaxpayers(limit ? Number(limit) : undefined);
  }

  @Get('search')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  search(@Query('q') q: string): Promise<StoredTaxpayer[]> {
    return this.service.searchTaxpayers(q);
  }

  @Get(':id')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  get(@Param('id', new ParseUUIDPipe()) id: string): Promise<StoredTaxpayer> {
    return this.service.findTaxpayer(id);
  }

  @Post('links')
  @HttpCode(201)
  @RequirePermission('taxpayer.profile.update')
  link(
    @Body()
    body: {
      userProfileId: string;
      taxpayerId: string;
      relationshipType: string;
    },
  ): Promise<StoredTaxpayerAccountLink> {
    const actorId = this.actors.requireActorId();
    return this.service.linkAccount(body, actorId);
  }

  @Get('profiles/:profileId/link')
  @HttpCode(200)
  @RequirePermission('taxpayer.profile.read')
  getLink(
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
  ): Promise<StoredTaxpayerAccountLink | null> {
    return this.service.getAccountLink(profileId);
  }
}
