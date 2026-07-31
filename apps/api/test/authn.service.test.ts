import { describe, expect, it } from 'vitest';
import { UsersMemoryRepository } from '../src/users/users.memory-repository.js';
import { UsersService } from '../src/users/users.service.js';
import { SecurityMemoryRepository } from '../src/security/security.memory-repository.js';
import { SecurityService } from '../src/security/security.service.js';
import { OtpService } from '../src/authn/otp.service.js';
import { AuthnService } from '../src/authn/authn.service.js';

interface TestOtpService {
  store: Map<string, { code: string; expiresAt: Date; attempts: number }>;
}

describe('AuthnService & OtpService & SecurityService', () => {
  it('manages full auth flow: OTP request, OTP verify, registration, login, rate limiting, and password reset', async () => {
    const usersRepo = new UsersMemoryRepository();
    const usersService = new UsersService(usersRepo);

    const securityRepo = new SecurityMemoryRepository();
    const securityService = new SecurityService(securityRepo);

    const otpService = new OtpService();
    const authnService = new AuthnService(
      usersService,
      securityService,
      otpService,
    );

    const phone = '+967770000000';

    // 1. Request OTP
    const { verificationId } = await authnService.requestRegistrationOtp(phone);
    expect(verificationId).toBe(phone);

    // 2. Try to verify with wrong code
    await expect(
      authnService.verifyRegistrationOtp(phone, '000000'),
    ).rejects.toThrow();

    // 3. To find out the generated OTP code, we look up the memory store or wait.
    // Let's retrieve OTP from the mock/simulated store directly for testing
    const testOtpService = otpService as unknown as TestOtpService;
    const otpRecord = testOtpService.store.get(phone);
    expect(otpRecord).toBeDefined();
    const correctCode = otpRecord!.code;

    // 4. Verify OTP with correct code
    const { verificationToken } = await authnService.verifyRegistrationOtp(
      phone,
      correctCode,
    );
    expect(verificationToken).toBeDefined();

    // 5. Register with weak password
    await expect(
      authnService.register(phone, verificationToken, '12345'),
    ).rejects.toThrow();

    // 6. Register with strong password
    const password = 'StrongPassword123!';
    const { userProfileId } = await authnService.register(
      phone,
      verificationToken,
      password,
      'مكلف تجريبي',
    );
    expect(userProfileId).toBeDefined();

    // 7. Login with wrong password
    await expect(
      authnService.login(phone, 'WrongPassword123!'),
    ).rejects.toThrow();

    // 8. Login with correct password
    const loginResult = await authnService.login(phone, password);
    expect(loginResult.userProfileId).toBe(userProfileId);
    expect(loginResult.accessToken).toBeDefined();

    // 9. Verify token structure
    const decoded = Buffer.from(loginResult.accessToken, 'base64').toString(
      'utf-8',
    );
    const payload = JSON.parse(decoded) as Record<string, unknown>;
    expect(payload.phone).toBe(phone);
    expect(payload.role).toBe('taxpayer');

    // 10. Lockout test: 5 failed attempts locks account
    for (let i = 0; i < 4; i++) {
      await expect(authnService.login(phone, 'WrongPass')).rejects.toThrow();
    }
    // The 5th attempt triggers lockout
    await expect(authnService.login(phone, 'WrongPass')).rejects.toThrow(
      /locked/i,
    );

    // 11. Password reset flow
    const resetOtp = await authnService.requestPasswordResetOtp(phone);
    expect(resetOtp.verificationId).toBe(phone);
    const resetOtpRecord = testOtpService.store.get(phone);
    const resetCode = resetOtpRecord!.code;

    const resetSuccess = await authnService.confirmPasswordReset(
      phone,
      resetCode,
      'NewStrongPassword321$',
    );
    expect(resetSuccess.success).toBe(true);

    // Login with new password (lockout is cleared upon reset)
    const newLogin = await authnService.login(phone, 'NewStrongPassword321$');
    expect(newLogin.userProfileId).toBe(userProfileId);
  });
});
