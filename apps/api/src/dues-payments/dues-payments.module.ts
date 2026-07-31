import { Module } from '@nestjs/common';
import { DuesPaymentsService } from './dues-payments.service.js';
import { DuesPaymentsController } from './dues-payments.controller.js';
import { DUES_PAYMENTS_REPOSITORY } from './dues-payments.repository.js';
import { DuesPaymentsMemoryRepository } from './dues-payments.memory-repository.js';
import { AuthnModule } from '../authn/authn.module.js';
import { UsersModule } from '../users/users.module.js';
import { RolesPermissionsModule } from '../roles-permissions/roles-permissions.module.js';

@Module({
  imports: [AuthnModule, UsersModule, RolesPermissionsModule],
  controllers: [DuesPaymentsController],
  providers: [
    DuesPaymentsService,
    {
      provide: DUES_PAYMENTS_REPOSITORY,
      useClass: DuesPaymentsMemoryRepository,
    },
  ],
  exports: [DuesPaymentsService, DUES_PAYMENTS_REPOSITORY],
})
export class DuesAndPaymentsModule {}
