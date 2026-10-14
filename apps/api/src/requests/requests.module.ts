import { Module } from '@nestjs/common';
import { RequestDraftService } from './request-draft.service.js';
import { RequestsQueryService } from './requests-query.service.js';
import { RequestDraftController } from './request-draft.controller.js';
import { REQUEST_DRAFT_REPOSITORY } from './request-draft.repository.js';
import { RequestDraftMemoryRepository } from './request-draft.memory-repository.js';
import { RequestDraftKyselyRepository } from './request-draft.kysely-repository.js';
import { RequestDraftRepositoryRouter } from './request-draft.repository-router.js';
import { RequestDraftPolicyEvaluator } from './request-draft.policy-evaluator.js';
import { AUTHORIZATION_POLICY_EVALUATOR } from '../authz/authorization.contracts.js';
import { AuthnModule } from '../authn/authn.module.js';

@Module({
  imports: [AuthnModule],
  controllers: [RequestDraftController],
  providers: [
    RequestDraftService,
    RequestsQueryService,
    RequestDraftMemoryRepository,
    RequestDraftKyselyRepository,
    {
      // القاعدة هي المخزن الفعلي؛ الذاكرة بديل للبيئات التي تعمل بلا قاعدة
      // (اختبارات وتشغيل محلي سريع). الاختيار يتم عند كل نداء داخل الموجّه.
      provide: REQUEST_DRAFT_REPOSITORY,
      useClass: RequestDraftRepositoryRouter,
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
