import { Module } from '@nestjs/common';
import { RequestDraftService } from './request-draft.service.js';
import { RequestDraftController } from './request-draft.controller.js';
import { REQUEST_DRAFT_REPOSITORY } from './request-draft.repository.js';
import { RequestDraftMemoryRepository } from './request-draft.memory-repository.js';
import { RequestDraftPolicyEvaluator } from './request-draft.policy-evaluator.js';
import { AUTHORIZATION_POLICY_EVALUATOR } from '../authz/authorization.contracts.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [AuthnModule],
  controllers: [RequestDraftController],
  providers: [
    RequestDraftService,
    {
      provide: REQUEST_DRAFT_REPOSITORY,
      useClass: RequestDraftMemoryRepository,
    },
    {
      provide: AUTHORIZATION_POLICY_EVALUATOR,
      useClass: RequestDraftPolicyEvaluator,
    },
  ],
  exports: [
    RequestDraftService,
    REQUEST_DRAFT_REPOSITORY,
    AUTHORIZATION_POLICY_EVALUATOR,
  ],
})
export class RequestsModule {}
