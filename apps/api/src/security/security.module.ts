import { Module } from '@nestjs/common';
import { SecurityService } from './security.service.js';
import { SECURITY_REPOSITORY } from './security.repository.js';
import { SecurityMemoryRepository } from './security.memory-repository.js';
import { AUTHORIZATION_AUDIT_HOOK } from '../authz/authorization.contracts.js';

@Module({
  providers: [
    SecurityService,
    {
      provide: SECURITY_REPOSITORY,
      useClass: SecurityMemoryRepository,
    },
    {
      provide: AUTHORIZATION_AUDIT_HOOK,
      useExisting: SecurityService,
    },
  ],
  exports: [SecurityService, SECURITY_REPOSITORY, AUTHORIZATION_AUDIT_HOOK],
})
export class SecurityModule {}
