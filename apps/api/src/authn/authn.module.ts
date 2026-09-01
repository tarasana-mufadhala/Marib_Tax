import { Module } from '@nestjs/common';
import { AuthnService } from './authn.service.js';
import { OtpService } from './otp.service.js';
import { AuthnController } from './authn.controller.js';
import { AccountController } from './account.controller.js';
import { UsersModule } from '../users/users.module.js';
import { SecurityModule } from '../security/security.module.js';
import { RolesPermissionsModule } from '../roles-permissions/roles-permissions.module.js';
import { DatabaseModule } from '../database/database.module.js';
import {
  ACCESS_TOKEN_VERIFIER,
  ACTOR_PROFILE_REPOSITORY,
  CURRENT_ACTOR,
} from './authentication.contracts.js';
import { HybridAccessTokenVerifier } from './hybrid-jwt.verifier.js';
import { ConcreteActorProfileRepository } from './actor-profile.repository.js';
import { BearerActorContextResolver } from './bearer-actor-context.resolver.js';
import { ACTOR_CONTEXT_RESOLVER } from '../authz/authorization.contracts.js';
import { CurrentActorService } from './current-actor.service.js';

@Module({
  imports: [UsersModule, SecurityModule, RolesPermissionsModule, DatabaseModule],
  controllers: [AuthnController, AccountController],
  providers: [
    AuthnService,
    OtpService,
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useClass: HybridAccessTokenVerifier,
    },
    {
      provide: ACTOR_PROFILE_REPOSITORY,
      useClass: ConcreteActorProfileRepository,
    },
    {
      provide: ACTOR_CONTEXT_RESOLVER,
      useClass: BearerActorContextResolver,
    },
    {
      provide: CURRENT_ACTOR,
      useClass: CurrentActorService,
    },
  ],
  exports: [
    AuthnService,
    OtpService,
    ACCESS_TOKEN_VERIFIER,
    ACTOR_PROFILE_REPOSITORY,
    ACTOR_CONTEXT_RESOLVER,
    CURRENT_ACTOR,
  ],
})
export class AuthnModule {}
