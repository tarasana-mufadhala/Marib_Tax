import { Module } from '@nestjs/common';
import { TaxpayerRegistryService } from './taxpayer-registry.service.js';
import { TAXPAYER_REGISTRY_REPOSITORY } from './taxpayer-registry.repository.js';
import { TaxpayerRegistryMemoryRepository } from './taxpayer-registry.memory-repository.js';
import { AuthnModule } from '../authn/authn.module.js';

// Note: TaxpayerRegistryController is intentionally NOT registered here —
// its routes shadow TaxpayerController's literal routes (e.g. /search),
// and it documents itself as "intentionally not registered in AppModule".
@Module({
  imports: [AuthnModule],
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
