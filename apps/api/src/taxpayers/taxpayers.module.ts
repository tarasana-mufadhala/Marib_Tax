import { Module } from '@nestjs/common';
import { TaxpayerController } from './taxpayer.controller.js';
import { TaxpayerService } from './taxpayer.service.js';
import { TAXPAYER_REPOSITORY } from './taxpayer.repository.js';
import { TaxpayerKyselyRepository } from './taxpayer.kysely-repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [DatabaseModule, AuthnModule],
  controllers: [TaxpayerController],
  providers: [
    TaxpayerService,
    {
      provide: TAXPAYER_REPOSITORY,
      useClass: TaxpayerKyselyRepository,
    },
  ],
  exports: [TaxpayerService, TAXPAYER_REPOSITORY],
})
export class TaxpayersModule {}
