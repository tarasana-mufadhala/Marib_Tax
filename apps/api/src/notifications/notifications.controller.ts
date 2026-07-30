import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  HttpCode,
  Inject,
} from '@nestjs/common';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { NotificationsService } from './notifications.service.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import {
  type StoredNotificationMessage,
  type StoredNotificationReadState,
} from './notifications.repository.js';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Get()
  @HttpCode(200)
  @RequirePermission('notification.read')
  list(): Promise<
    Array<{
      message: StoredNotificationMessage;
      readState: StoredNotificationReadState | null;
    }>
  > {
    const actorId = this.actors.requireActorId();
    return this.service.listNotificationsForRecipient(actorId);
  }

  @Post(':id/read')
  @HttpCode(200)
  @RequirePermission('notification.mark_read')
  markRead(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StoredNotificationReadState> {
    const actorId = this.actors.requireActorId();
    return this.service.markAsRead(id, actorId, 'in_app');
  }
}
