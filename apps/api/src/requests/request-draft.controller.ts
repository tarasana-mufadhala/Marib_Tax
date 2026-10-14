import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
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
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import { RequestDraftService } from './request-draft.service.js';
import {
  RequestsQueryService,
  type ServiceRequestListItem,
} from './requests-query.service.js';

export interface CurrentActorPort {
  requireActorId(): string;
}

@Controller('api/v1/requests')
export class RequestDraftController {
  constructor(
    private readonly service: RequestDraftService,
    private readonly queryService: RequestsQueryService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  /**
   * سرد الطلبات. المكلف لا يرى إلا طلباته؛ الموظف — ومَن يملك `request.review`
   * تحديداً — يرى الجميع. بلا هذا التقييد يستطيع أي مكلف تعداد طلبات الآخرين
   * بأسمائهم وأرقامهم الضريبية.
   */
  @Get()
  @RequirePermission('request.read')
  list(
    @Req() request: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ): Promise<ServiceRequestListItem[]> {
    const actor = request[VERIFIED_ACTOR];
    const isStaff = actor?.permissions.includes('request.review') ?? false;
    return this.queryService.listRequests(
      limit ? Number(limit) : undefined,
      isStaff ? undefined : this.actors.requireActorId(),
    );
  }

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
