import { describe, expect, it } from 'vitest';

import {
  isPermissionCode,
  permissionCodes,
  type ApiErrorEnvelope,
  type HealthResponse,
} from '../src/index.js';

describe('common API contracts', () => {
  it('requires safe error fields without internal details', () => {
    const value: ApiErrorEnvelope = {
      error: {
        code: 'VALIDATION_FAILED',
        message: 'The request is invalid.',
        traceId: 'trace-123',
      },
    };
    expect(value.error.code).toBe('VALIDATION_FAILED');
    expect(value.error).not.toHaveProperty('stack');
  });

  it('keeps health metadata stable', () => {
    const value: HealthResponse = {
      status: 'ok',
      service: 'marib-tax-api',
      version: 'v1',
    };
    expect(value).toEqual({
      status: 'ok',
      service: 'marib-tax-api',
      version: 'v1',
    });
  });

  it('publishes only stable explicit permission keys', () => {
    expect(permissionCodes).toContain('request.submit');
    expect(permissionCodes).toContain('report.view');
    expect(permissionCodes).toContain('report.export');
    expect(permissionCodes).not.toContain('request.*');
    expect(permissionCodes).not.toContain('request.decision.revise');
    expect(isPermissionCode('request.submit')).toBe(true);
    expect(isPermissionCode('admin.*')).toBe(false);
  });
});
