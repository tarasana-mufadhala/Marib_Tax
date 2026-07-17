import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthorizationGuard } from './authz/authorization.guard.js';
import {
  ACTOR_CONTEXT_RESOLVER,
  AUTHORIZATION_AUDIT_HOOK,
  AUTHORIZATION_POLICY_EVALUATOR,
} from './authz/authorization.contracts.js';
import {
  DenyAuthorizationPolicyEvaluator,
  MissingActorContextResolver,
  NoopAuthorizationAuditHook,
} from './authz/deny-by-default.providers.js';
import { validateEnvironment } from './config/environment.js';
import { HealthController } from './health/health.controller.js';
import { ApiExceptionFilter } from './http/api-exception.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: ACTOR_CONTEXT_RESOLVER, useClass: MissingActorContextResolver },
    {
      provide: AUTHORIZATION_POLICY_EVALUATOR,
      useClass: DenyAuthorizationPolicyEvaluator,
    },
    { provide: AUTHORIZATION_AUDIT_HOOK, useClass: NoopAuthorizationAuditHook },
    { provide: APP_GUARD, useClass: AuthorizationGuard },
  ],
})
export class AppModule {}
