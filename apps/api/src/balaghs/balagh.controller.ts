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
  createBalaghDraftSchema,
  editBalaghDraftSchema,
  type BalaghResponse,
} from '@marib-tax/contracts';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import { BalaghService } from './balagh.service.js';
import type { BalaghListItem } from './balagh.repository.js';

/**
 * بلاغات المكلف (FR-201..206 من القسم 4.4).
 *
 * الملكية تُفرَض في الخدمة على كل قراءة وتعديل، والسرد يُقيَّد بصاحبه
 * ما لم يملك المستدعي `balagh.review` (صلاحية موظف).
 */
@Controller('api/v1/balaghs')
export class BalaghController {
  constructor(
    private readonly service: BalaghService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Get()
  @RequirePermission('balagh.read')
  list(
    @Req() request: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ): Promise<BalaghListItem[]> {
    const actor = request[VERIFIED_ACTOR];
    const isStaff = actor?.permissions.includes('balagh.review') ?? false;
    return this.service.list(
      isStaff ? undefined : this.actors.requireActorId(),
      limit ? Number(limit) : undefined,
    );
  }

  @Post()
  @RequirePermission('balagh.create')
  create(@Body() body: unknown): Promise<BalaghResponse> {
    const parsed = createBalaghDraftSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException(
        'بيانات البلاغ غير مطابقة للنموذج المعتمد',
      );
    }
    return this.service.create(this.actors.requireActorId(), parsed.data);
  }

  @Get(':id')
  @RequirePermission('balagh.read')
  read(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<BalaghResponse> {
    return this.service.read(this.actors.requireActorId(), id);
  }

  @Patch(':id')
  @RequirePermission('balagh.draft.edit')
  edit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
  ): Promise<BalaghResponse> {
    const parsed = editBalaghDraftSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException(
        'بيانات البلاغ غير مطابقة للنموذج المعتمد',
      );
    }
    return this.service.edit(this.actors.requireActorId(), id, parsed.data);
  }

  @Post(':id/submit')
  @HttpCode(200)
  @RequirePermission('balagh.submit')
  submit(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<BalaghResponse> {
    return this.service.submit(this.actors.requireActorId(), id);
  }
}
