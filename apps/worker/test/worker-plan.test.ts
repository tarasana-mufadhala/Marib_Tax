import { describe, expect, it } from 'vitest';
import { createWorkerPlan } from '../src/worker-plan.js';

describe('worker startup plan', () => {
  it('is disabled by default and exposes no provider details', () => {
    expect(createWorkerPlan({})).toEqual({
      state: 'disabled',
      reason: 'NOT_CONFIGURED',
    });
  });

  it('fails closed when enabled without reviewed adapters', () => {
    expect(() => createWorkerPlan({ WORKER_ENABLED: 'true' })).toThrow(
      'Worker adapters are not configured.',
    );
  });

  it('does not treat provider-looking variables as enablement', () => {
    expect(
      createWorkerPlan({
        SMS_TOKEN: 'untrusted',
        SERVICE_ROLE_KEY: 'untrusted',
      }),
    ).toMatchObject({ state: 'disabled' });
  });
});
