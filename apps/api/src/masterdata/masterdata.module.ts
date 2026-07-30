import { Module } from '@nestjs/common';
import { MasterdataService } from './masterdata.service.js';
import { MasterdataController } from './masterdata.controller.js';
import { MASTERDATA_REPOSITORY } from './masterdata.repository.js';
import { MasterdataMemoryRepository } from './masterdata.memory-repository.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [AuthnModule],
  controllers: [MasterdataController],
  providers: [
    MasterdataService,
    {
      provide: MASTERDATA_REPOSITORY,
      useClass: MasterdataMemoryRepository,
    },
  ],
  exports: [MasterdataService, MASTERDATA_REPOSITORY],
})
export class MasterdataModule {}
