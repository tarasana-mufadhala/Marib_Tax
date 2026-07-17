import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  createActivityAddressChangeDraftSchema,
  editActivityAddressChangeDraftSchema,
  type ActivityAddressChangeRequestResponse,
} from '@marib-tax/contracts';
import {
  RequirePermission,
  RequirePredicates,
} from '../authz/authorization.decorators.js';
import { RequestDraftService } from './request-draft.service.js';

export interface CurrentActorPort {
  requireActorId(): string;
}

@Controller('api/v1/requests')
export class RequestDraftController {
  constructor(
    private readonly service: RequestDraftService,
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @RequirePermission('request.draft.create')
  @RequirePredicates('OWNERSHIP')
  create(@Body() body: unknown): Promise<ActivityAddressChangeRequestResponse> {
    const parsed = createActivityAddressChangeDraftSchema.safeParse(body);
    if (!parsed.success) throw new UnprocessableEntityException();
    return this.service.create(this.actors.requireActorId(), parsed.data);
  }

  @Get(':id')
  @RequirePermission('request.read')
  @RequirePredicates('OWNERSHIP')
  read(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ActivityAddressChangeRequestResponse> {
    return this.service.read(this.actors.requireActorId(), id);
  }

  @Patch(':id')
  @RequirePermission('request.draft.edit')
  @RequirePredicates('OWNERSHIP', 'RESOURCE_STATE')
  edit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
  ): Promise<ActivityAddressChangeRequestResponse> {
    const parsed = editActivityAddressChangeDraftSchema.safeParse(body);
    if (!parsed.success) throw new UnprocessableEntityException();
    return this.service.edit(this.actors.requireActorId(), id, parsed.data);
  }

  @Post(':id/submit')
  @HttpCode(200)
  @RequirePermission('request.submit')
  @RequirePredicates('OWNERSHIP', 'RESOURCE_STATE')
  submit(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ActivityAddressChangeRequestResponse> {
    return this.service.submit(this.actors.requireActorId(), id);
  }
}
