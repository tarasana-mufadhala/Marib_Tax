import { Module } from '@nestjs/common';
import { FieldVisitsService } from './field-visits.service.js';
import { FieldVisitsController } from './field-visits.controller.js';
import { FIELD_VISITS_REPOSITORY } from './field-visits.repository.js';
import { FieldVisitsMemoryRepository } from './field-visits.memory-repository.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [AuthnModule],
  controllers: [FieldVisitsController],
  providers: [
    FieldVisitsService,
    {
      provide: FIELD_VISITS_REPOSITORY,
      useClass: FieldVisitsMemoryRepository,
    },
  ],
  exports: [FieldVisitsService, FIELD_VISITS_REPOSITORY],
})
export class FieldVisitsModule {}
