import { Module } from '@nestjs/common';
import { LegalEntitiesController } from './legal-entities.controller.js';
import { LegalEntitiesService } from './legal-entities.service.js';
import { LEGAL_ENTITIES_REPOSITORY } from './legal-entities.repository.js';
import { LegalEntitiesKyselyRepository } from './legal-entities.kysely-repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [DatabaseModule, AuthnModule],
  controllers: [LegalEntitiesController],
  providers: [
    LegalEntitiesService,
    {
      provide: LEGAL_ENTITIES_REPOSITORY,
      useClass: LegalEntitiesKyselyRepository,
    },
  ],
  exports: [LegalEntitiesService, LEGAL_ENTITIES_REPOSITORY],
})
export class LegalEntitiesModule {}
