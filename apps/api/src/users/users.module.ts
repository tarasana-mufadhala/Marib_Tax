import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { USERS_REPOSITORY } from './users.repository.js';
import { UsersKyselyRepository } from './users.kysely-repository.js';

@Module({
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersKyselyRepository,
    },
  ],
  exports: [UsersService, USERS_REPOSITORY],
})
export class UsersModule {}
