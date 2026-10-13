import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SecureRegistrationService } from '../src/authn/secure-registration.service.js';
import type { OtpService } from '../src/authn/otp.service.js';
import type { SecurityService } from '../src/security/security.service.js';
import type { UsersService } from '../src/users/users.service.js';

const PHONE = '+967770000001';

function build() {
  const users = {
    createUserProfile: vi.fn().mockResolvedValue({ id: 'profile-1' }),
  } as unknown as UsersService;
  const security = {
    validatePasswordStrength: vi.fn().mockReturnValue(true),
  } as unknown as SecurityService;
  const otp = {
    requestOtp: vi.fn().mockResolvedValue({ verificationId: 'otp-1' }),
    verifyOtp: vi.fn().mockResolvedValue(true),
  } as unknown as OtpService;
  const config = new ConfigService({
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
    AUTH_VERIFICATION_TOKEN_SECRET:
      '0123456789abcdef0123456789abcdef0123456789abcdef',
  });

  return {
    service: new SecureRegistrationService(users, security, otp, config),
    users,
    security,
    otp,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SecureRegistrationService', () => {
  it('rejects the legacy forgeable base64 verification token', async () => {
    const { service } = build();
    const forged = Buffer.from(`verified:${PHONE}`).toString('base64');

    await expect(
      service.register(PHONE, forged, 'Strong!Pass1', 'Test User'),
    ).rejects.toMatchObject({ response: expect.anything() });
  });

  it('issues a signed proof after OTP verification and consumes it once', async () => {
    const { service, users } = build();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 'auth-user-1' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const { verificationToken } = await service.verifyRegistrationOtp(
      PHONE,
      '123456',
    );
    expect(verificationToken.split('.')).toHaveLength(3);

    await expect(
      service.register(PHONE, verificationToken, 'Strong!Pass1', 'Test User'),
    ).resolves.toEqual({ userProfileId: 'profile-1' });
    expect(users.createUserProfile).toHaveBeenCalledWith(
      'auth-user-1',
      'Test User',
    );

    await expect(
      service.register(PHONE, verificationToken, 'Strong!Pass1', 'Test User'),
    ).rejects.toMatchObject({ response: expect.anything() });
  });

  it('binds the proof to the verified phone number', async () => {
    const { service } = build();
    const { verificationToken } = await service.verifyRegistrationOtp(
      PHONE,
      '123456',
    );

    await expect(
      service.register(
        '+967770000002',
        verificationToken,
        'Strong!Pass1',
        'Test User',
      ),
    ).rejects.toMatchObject({ response: expect.anything() });
  });
});
