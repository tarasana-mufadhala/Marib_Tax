import { Module } from '@nestjs/common';
import { ServicesVersionsController } from './services-versions.controller.js';
import { ServicesVersionsService } from './services-versions.service.js';
import { SERVICES_VERSIONS_REPOSITORY } from './services-versions.repository.js';
import { ServicesVersionsKyselyRepository } from './services-versions.kysely-repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [DatabaseModule, AuthnModule],
  controllers: [ServicesVersionsController],
  providers: [
    ServicesVersionsService,
    {
      provide: SERVICES_VERSIONS_REPOSITORY,
      useClass: ServicesVersionsKyselyRepository,
    },
  ],
  exports: [ServicesVersionsService, SERVICES_VERSIONS_REPOSITORY],
})
export class ServicesAndVersionsModule {}
