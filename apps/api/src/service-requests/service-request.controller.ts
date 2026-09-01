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
  createServiceRequestSchema,
  editServiceRequestSchema,
  type ServiceDefinition,
  type ServiceRequestListItem,
  type ServiceRequestResponse,
} from '@marib-tax/contracts';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import { ServiceRequestService } from './service-request.service.js';

/**
 * خدمات القسم 4.3 (FR-101..105).
 *
 * مسار منفصل عن `/api/v1/requests` الذي يخدم نموذج
 * `activity_address_change` القديم، حتى لا يُكسر عقد قائم.
 */
@Controller('api/v1/service-requests')
export class ServiceRequestController {
  constructor(
    private readonly service: ServiceRequestService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  /** كتالوج الخدمات المتاحة لهذا المكلف مع مستندات كل خدمة. */
  @Get('catalog')
  @RequirePermission('request.read')
  catalog(): Promise<ServiceDefinition[]> {
    return this.service.catalogFor(this.actors.requireActorId());
  }

  @Get()
  @RequirePermission('request.read')
  list(
    @Req() request: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ): Promise<ServiceRequestListItem[]> {
    const actor = request[VERIFIED_ACTOR];
    const isStaff = actor?.permissions.includes('request.review') ?? false;
    return this.service.list(
      isStaff ? undefined : this.actors.requireActorId(),
      limit ? Number(limit) : undefined,
    );
  }

  @Post()
  @RequirePermission('request.draft.create')
  create(@Body() body: unknown): Promise<ServiceRequestResponse> {
    const parsed = createServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException(
        'بيانات الطلب غير مطابقة لنموذج الخدمة المعتمد',
      );
    }
    return this.service.create(this.actors.requireActorId(), parsed.data);
  }

  @Get(':id')
  @RequirePermission('request.read')
  read(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ServiceRequestResponse> {
    return this.service.read(this.actors.requireActorId(), id);
  }

  /** ما ينقص الطلب من مستندات إلزامية — يعرضه التطبيق قبل الإرسال. */
  @Get(':id/missing-documents')
  @RequirePermission('request.read')
  missingDocuments(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ code: string; label: string }[]> {
    return this.service.missingDocuments(this.actors.requireActorId(), id);
  }

  @Patch(':id')
  @RequirePermission('request.draft.edit')
  edit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
  ): Promise<ServiceRequestResponse> {
    const parsed = editServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException(
        'بيانات الطلب غير مطابقة لنموذج الخدمة المعتمد',
      );
    }
    return this.service.edit(this.actors.requireActorId(), id, parsed.data);
  }

  @Post(':id/submit')
  @HttpCode(200)
  @RequirePermission('request.submit')
  submit(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ServiceRequestResponse> {
    return this.service.submit(this.actors.requireActorId(), id);
  }
}
