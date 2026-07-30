import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  randomUUID,
  scryptSync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import type { PermissionCode } from '@marib-tax/contracts';
import type { AuthorizationAuditHook } from '../authz/authorization.contracts.js';
import {
  SECURITY_REPOSITORY,
  type SecurityRepository,
} from './security.repository.js';

@Injectable()
export class SecurityService implements AuthorizationAuditHook {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @Inject(SECURITY_REPOSITORY)
    private readonly repository: SecurityRepository,
  ) {}

  async recordDenied(input: {
    actorId?: string;
    permission?: PermissionCode;
    reason: string;
  }): Promise<void> {
    const actorId = input.actorId ?? 'anonymous';
    const permissionCode = input.permission ?? null;
    const reason = input.reason;

    this.logger.warn(
      `Access Denied: Actor=${actorId}, Permission=${permissionCode ?? 'None'}, Reason=${reason}`,
    );

    await this.repository.recordSecurityEvent({
      id: randomUUID(),
      actorId: input.actorId ?? null,
      permissionCode,
      actionCode: 'ACCESS_DENIED',
      eventPayload: { reason },
      ipAddress: null,
      userAgent: null,
    });
  }

  validatePasswordStrength(password: string): boolean {
    if (password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasDigit && hasSpecial;
  }

  hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, storedHash: string): boolean {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const hash = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return timingSafeEqual(hash, keyBuffer);
  }
}
