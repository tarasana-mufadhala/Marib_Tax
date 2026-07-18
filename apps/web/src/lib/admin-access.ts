export interface AdminAccessDecision {
  readonly allowed: false;
  readonly reason: 'AUTHENTICATION_NOT_CONFIGURED';
}

/**
 * Admin access remains closed until a server-verified API session adapter is
 * implemented. Caller-provided cookies, headers, roles, or claims are ignored.
 */
export function evaluateAdminAccess(
  _untrustedInput?: unknown,
): AdminAccessDecision {
  void _untrustedInput;
  return Object.freeze({
    allowed: false,
    reason: 'AUTHENTICATION_NOT_CONFIGURED',
  });
}
