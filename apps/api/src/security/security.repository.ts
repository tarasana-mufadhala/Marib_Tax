import type { PermissionCode } from '@marib-tax/contracts';

export interface StoredSecurityEvent {
  id: string;
  actorId: string | null;
  permissionCode: PermissionCode | null;
  actionCode: string;
  eventPayload: Record<string, unknown>;
  recordedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface SecurityRepository {
  recordSecurityEvent(
    event: Omit<StoredSecurityEvent, 'recordedAt'>,
  ): Promise<StoredSecurityEvent>;
}

export const SECURITY_REPOSITORY = Symbol('SECURITY_REPOSITORY');
