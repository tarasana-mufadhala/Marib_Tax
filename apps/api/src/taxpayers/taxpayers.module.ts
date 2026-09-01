import { Module } from '@nestjs/common';
import { TaxpayerController } from './taxpayer.controller.js';
import { TaxpayerProfileController } from './taxpayer-profile.controller.js';
import { TaxpayerService } from './taxpayer.service.js';
import { TAXPAYER_REPOSITORY } from './taxpayer.repository.js';
import { TaxpayerKyselyRepository } from './taxpayer.kysely-repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [DatabaseModule, AuthnModule, UsersModule],
  // ملف «أنا» يسبق TaxpayerController لأن مساره /taxpayers/me يجب ألا
  // يُلتقط كـ /taxpayers/:id.
  controllers: [TaxpayerProfileController, TaxpayerController],
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
