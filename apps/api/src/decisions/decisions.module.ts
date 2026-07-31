import { Module } from '@nestjs/common';
import { DecisionsService } from './decisions.service.js';
import { DecisionsController } from './decisions.controller.js';
import { DECISIONS_REPOSITORY } from './decisions.repository.js';
import { DecisionsMemoryRepository } from './decisions.memory-repository.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [AuthnModule],
  controllers: [DecisionsController],
  providers: [
    DecisionsService,
    {
      provide: DECISIONS_REPOSITORY,
      useClass: DecisionsMemoryRepository,
    },
  ],
  exports: [DecisionsService, DECISIONS_REPOSITORY],
})
export class DecisionsModule {}
