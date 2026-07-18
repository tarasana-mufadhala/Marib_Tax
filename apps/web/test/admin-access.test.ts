import { describe, expect, it } from 'vitest';
import { evaluateAdminAccess } from '../src/lib/admin-access';

describe('admin route foundation', () => {
  it.each([undefined, { role: 'admin' }, { permissions: ['admin.*'] }])(
    'fails closed for absent or caller-provided identity',
    (input) => {
      const decision = evaluateAdminAccess(input);
      expect(decision).toEqual({
        allowed: false,
        reason: 'AUTHENTICATION_NOT_CONFIGURED',
      });
      expect(Object.isFrozen(decision)).toBe(true);
    },
  );
});
