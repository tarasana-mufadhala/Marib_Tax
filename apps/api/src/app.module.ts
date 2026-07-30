import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthorizationGuard } from './authz/authorization.guard.js';
import {
  ACTOR_CONTEXT_RESOLVER,
  AUTHORIZATION_AUDIT_HOOK,
  AUTHORIZATION_POLICY_EVALUATOR,
} from './authz/authorization.contracts.js';
import { BearerActorContextResolver } from './authn/bearer-actor-context.resolver.js';
import { MainAuthorizationPolicyEvaluator } from './authz/main-policy.evaluator.js';
import { SecurityService } from './security/security.service.js';
import { validateEnvironment } from './config/environment.js';
import { ApiExceptionFilter } from './http/api-exception.filter.js';

// Import New Modules
import { UsersModule } from './users/users.module.js';
import { RolesPermissionsModule } from './roles-permissions/roles-permissions.module.js';
import { SecurityModule } from './security/security.module.js';
import { HealthAndOperationsModule } from './health/health.module.js';
import { AuthnModule } from './authn/authn.module.js';
import { MasterdataModule } from './masterdata/masterdata.module.js';
import { RegistryModule } from './registry/registry.module.js';
import { RequestsModule } from './requests/requests.module.js';
import { WorkflowModule } from './workflow/workflow.module.js';
import { FieldVisitsModule } from './field-visits/field-visits.module.js';
import { DecisionsModule } from './decisions/decisions.module.js';
import { DuesAndPaymentsModule } from './dues-payments/dues-payments.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    UsersModule,
    RolesPermissionsModule,
    SecurityModule,
    HealthAndOperationsModule,
    AuthnModule,
    MasterdataModule,
    RegistryModule,
    RequestsModule,
    WorkflowModule,
    FieldVisitsModule,
    DecisionsModule,
    DuesAndPaymentsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    {
      provide: ACTOR_CONTEXT_RESOLVER,
      useClass: BearerActorContextResolver,
    },
    {
      provide: AUTHORIZATION_POLICY_EVALUATOR,
      useClass: MainAuthorizationPolicyEvaluator,
    },
    {
      provide: AUTHORIZATION_AUDIT_HOOK,
      useExisting: SecurityService,
    },
    { provide: APP_GUARD, useClass: AuthorizationGuard },
  ],
})
export class AppModule {}
