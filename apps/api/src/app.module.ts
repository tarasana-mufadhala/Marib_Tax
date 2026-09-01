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
import { BalaghsModule } from './balaghs/balaghs.module.js';
import { MessagingModule } from './messaging/messaging.module.js';
import { ServiceRequestsModule } from './service-requests/service-requests.module.js';
import { WorkflowModule } from './workflow/workflow.module.js';
import { FieldVisitsModule } from './field-visits/field-visits.module.js';
import { DecisionsModule } from './decisions/decisions.module.js';
import { DuesAndPaymentsModule } from './dues-payments/dues-payments.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { DatabaseModule } from './database/database.module.js';
import { TaxpayersModule } from './taxpayers/taxpayers.module.js';
import { ActivitiesAndBranchesModule } from './activities-branches/activities-branches.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { LegalEntitiesModule } from './legal-entities/legal-entities.module.js';
import { ServicesAndVersionsModule } from './services-versions/services-versions.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: ['../../.env', '.env', '.env.local'],
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
    BalaghsModule,
    MessagingModule,
    ServiceRequestsModule,
    WorkflowModule,
    FieldVisitsModule,
    DecisionsModule,
    DuesAndPaymentsModule,
    NotificationsModule,
    DatabaseModule,
    TaxpayersModule,
    ActivitiesAndBranchesModule,
    PropertiesModule,
    LegalEntitiesModule,
    ServicesAndVersionsModule,
    AdminModule,
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
