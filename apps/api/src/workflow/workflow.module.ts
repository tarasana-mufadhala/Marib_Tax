import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service.js';
import { WORKFLOW_REPOSITORY } from './workflow.repository.js';
import { WorkflowMemoryRepository } from './workflow.memory-repository.js';

@Module({
  providers: [
    WorkflowService,
    {
      provide: WORKFLOW_REPOSITORY,
      useClass: WorkflowMemoryRepository,
    },
  ],
  exports: [WorkflowService, WORKFLOW_REPOSITORY],
})
export class WorkflowModule {}
