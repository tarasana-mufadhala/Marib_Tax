import { Module } from '@nestjs/common';
import { ServiceRequestController } from './service-request.controller.js';
import { ServiceRequestAttachmentsController } from './service-request-attachments.controller.js';
import { ServiceRequestService } from './service-request.service.js';
import { SERVICE_REQUEST_REPOSITORY } from './service-request.repository.js';
import { ServiceRequestKyselyRepository } from './service-request.kysely-repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthnModule } from '../authn/authn.module.js';
import { AdminModule } from '../admin/admin.module.js';

@Module({
  imports: [DatabaseModule, AuthnModule, AdminModule],
  controllers: [ServiceRequestController, ServiceRequestAttachmentsController],
  providers: [
    ServiceRequestService,
    {
      provide: SERVICE_REQUEST_REPOSITORY,
      useClass: ServiceRequestKyselyRepository,
    },
  ],
  exports: [ServiceRequestService, SERVICE_REQUEST_REPOSITORY],
})
export class ServiceRequestsModule {}
