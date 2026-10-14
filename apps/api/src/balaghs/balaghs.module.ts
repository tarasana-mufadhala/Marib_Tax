import { Module } from '@nestjs/common';
import { BalaghController } from './balagh.controller.js';
import { BalaghService } from './balagh.service.js';
import { BALAGH_REPOSITORY } from './balagh.repository.js';
import { BalaghKyselyRepository } from './balagh.kysely-repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [DatabaseModule, AuthnModule],
  controllers: [BalaghController],
  providers: [
    BalaghService,
    {
      provide: BALAGH_REPOSITORY,
      useClass: BalaghKyselyRepository,
    },
  ],
  exports: [BalaghService, BALAGH_REPOSITORY],
})
export class BalaghsModule {}
