import { Module } from '@nestjs/common';
import { TaxpayerRegistryService } from './taxpayer-registry.service.js';
import { TaxpayerRegistryController } from './taxpayer-registry.controller.js';
import { TAXPAYER_REGISTRY_REPOSITORY } from './taxpayer-registry.repository.js';
import { TaxpayerRegistryMemoryRepository } from './taxpayer-registry.memory-repository.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [AuthnModule],
  controllers: [TaxpayerRegistryController],
  providers: [
    TaxpayerRegistryService,
    {
      provide: TAXPAYER_REGISTRY_REPOSITORY,
      useClass: TaxpayerRegistryMemoryRepository,
    },
  ],
  exports: [TaxpayerRegistryService, TAXPAYER_REGISTRY_REPOSITORY],
})
export class RegistryModule {}
