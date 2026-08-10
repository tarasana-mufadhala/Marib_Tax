import { Module } from '@nestjs/common';
import { RolesPermissionsService } from './roles-permissions.service.js';
import { ROLES_PERMISSIONS_REPOSITORY } from './roles-permissions.repository.js';
import { RolesPermissionsKyselyRepository } from './roles-permissions.kysely-repository.js';

@Module({
  providers: [
    RolesPermissionsService,
    {
      provide: ROLES_PERMISSIONS_REPOSITORY,
      useClass: RolesPermissionsKyselyRepository,
    },
  ],
  exports: [RolesPermissionsService, ROLES_PERMISSIONS_REPOSITORY],
})
export class RolesPermissionsModule {}
