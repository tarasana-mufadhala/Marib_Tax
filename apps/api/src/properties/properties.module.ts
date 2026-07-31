import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller.js';
import { PropertiesService } from './properties.service.js';
import { PROPERTIES_REPOSITORY } from './properties.repository.js';
import { PropertiesKyselyRepository } from './properties.kysely-repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [DatabaseModule, AuthnModule],
  controllers: [PropertiesController],
  providers: [
    PropertiesService,
    {
      provide: PROPERTIES_REPOSITORY,
      useClass: PropertiesKyselyRepository,
    },
  ],
  exports: [PropertiesService, PROPERTIES_REPOSITORY],
})
export class PropertiesModule {}
