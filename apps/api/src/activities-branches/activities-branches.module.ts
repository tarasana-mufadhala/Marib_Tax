import { Module } from '@nestjs/common';
import { ActivitiesBranchesController } from './activities-branches.controller.js';
import { ActivitiesBranchesService } from './activities-branches.service.js';
import {
  ACTIVITY_OWNERSHIP_LOOKUP,
  ActivityOwnershipKyselyLookup,
  ActivityOwnershipService,
} from './activity-ownership.service.js';
import { ACTIVITIES_BRANCHES_REPOSITORY } from './activities-branches.repository.js';
import { ActivitiesBranchesKyselyRepository } from './activities-branches.kysely-repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [DatabaseModule, AuthnModule],
  controllers: [ActivitiesBranchesController],
  providers: [
    ActivitiesBranchesService,
    ActivityOwnershipService,
    {
      provide: ACTIVITY_OWNERSHIP_LOOKUP,
      useClass: ActivityOwnershipKyselyLookup,
    },
    {
      provide: ACTIVITIES_BRANCHES_REPOSITORY,
      useClass: ActivitiesBranchesKyselyRepository,
    },
  ],
  exports: [ActivitiesBranchesService, ACTIVITIES_BRANCHES_REPOSITORY],
})
export class ActivitiesAndBranchesModule {}
