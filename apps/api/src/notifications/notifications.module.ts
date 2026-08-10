import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NOTIFICATIONS_REPOSITORY } from './notifications.repository.js';
import { NotificationsKyselyRepository } from './notifications.kysely-repository.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [AuthnModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useClass: NotificationsKyselyRepository,
    },
  ],
  exports: [NotificationsService, NOTIFICATIONS_REPOSITORY],
})
export class NotificationsModule {}
