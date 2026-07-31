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
import { ServicesVersionsService } from './services-versions.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import { type StoredServiceType } from './services-versions.repository.js';

@Controller('api/v1/services')
export class ServicesVersionsController {
  constructor(
    private readonly service: ServicesVersionsService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('request.review')
  register(
    @Body()
    body: {
      code: string;
      name: string;
      description?: string | null;
      versionLabel?: string | null;
    },
  ): Promise<StoredServiceType> {
    const actorId = this.actors.requireActorId();
    return this.service.registerServiceType(body, actorId);
  }

  @Get()
  @HttpCode(200)
  @RequirePermission('request.read')
  list(): Promise<StoredServiceType[]> {
    return this.service.listActiveServices();
  }

  @Get(':id')
  @HttpCode(200)
  @RequirePermission('request.read')
  get(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredServiceType> {
    return this.service.getServiceType(id);
  }

  @Get('code/:code')
  @HttpCode(200)
  @RequirePermission('request.read')
  getByCode(@Param('code') code: string): Promise<StoredServiceType> {
    return this.service.getServiceTypeByCode(code);
  }
}
