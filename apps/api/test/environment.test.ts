import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../src/config/environment.js';

describe('environment validation', () => {
  it('uses safe local defaults without secrets', () => {
    expect(validateEnvironment({})).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
    });
  });

  it('rejects an invalid port', () => {
    expect(() => validateEnvironment({ PORT: '0' })).toThrow();
  });
});
