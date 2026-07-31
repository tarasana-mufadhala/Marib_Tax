import { describe, expect, it } from 'vitest';
import {
  loginRequestSchema,
  otpCodeSchema,
  otpRequestSchema,
  otpVerifyRequestSchema,
  passwordResetConfirmSchema,
  passwordSchema,
  phoneSchema,
  refreshRequestSchema,
  registerRequestSchema,
  tokenPairResponseSchema,
} from '../src/auth.js';

describe('phone schema (E.164)', () => {
  it.each(['+967777123456', '+12125550100', '+442071234567'])(
    'accepts %s',
    (value) => {
      expect(phoneSchema.parse(value)).toBe(value);
    },
  );

  it.each([
    ['missing plus', '967777123456'],
    ['leading zero after plus', '+0123'],
    ['letters', '+96777abc456'],
    ['local format', '777123456'],
    ['empty', ''],
    ['too short', '+12'],
  ])('rejects %s', (_name, value) => {
    expect(() => phoneSchema.parse(value)).toThrow();
  });
});

describe('OTP code schema', () => {
  it.each(['1234', '12345', '123456'])('accepts %s', (value) => {
    expect(otpCodeSchema.parse(value)).toBe(value);
  });

  it.each([
    ['three digits', '123'],
    ['seven digits', '1234567'],
    ['letters', '12a4'],
    ['empty', ''],
  ])('rejects %s', (_name, value) => {
    expect(() => otpCodeSchema.parse(value)).toThrow();
  });
});

describe('password policy', () => {
  it('accepts a compliant password', () => {
    expect(passwordSchema.parse('Str0ng!Passw0rd')).toBe('Str0ng!Passw0rd');
  });

  it.each([
    ['shorter than 10 characters', 'S1!abcde'],
    ['no uppercase', 'str0ng!password'],
    ['no lowercase', 'STR0NG!PASSWORD'],
    ['no digit', 'Strong!Password'],
    ['no symbol', 'Str0ngPassword1'],
  ])('rejects %s', (_name, value) => {
    expect(() => passwordSchema.parse(value)).toThrow();
  });
});

describe('authentication request DTOs', () => {
  const phone = '+967777123456';

  it('accepts a valid registration payload', () => {
    const value = registerRequestSchema.parse({
      phone,
      password: 'Str0ng!Passw0rd',
      otpVerificationToken: 'verify-token',
      fullName: '  مثال المكلف  ',
    });
    expect(value.fullName).toBe('مثال المكلف');
  });

  it('rejects extra fields such as email everywhere', () => {
    expect(() =>
      registerRequestSchema.parse({
        phone,
        password: 'Str0ng!Passw0rd',
        otpVerificationToken: 'verify-token',
        fullName: 'Taxpayer',
        email: 'taxpayer@example.invalid',
      }),
    ).toThrow();
    expect(() =>
      otpRequestSchema.parse({ phone, email: 'taxpayer@example.invalid' }),
    ).toThrow();
  });

  it('rejects registration without an OTP verification token', () => {
    expect(() =>
      registerRequestSchema.parse({
        phone,
        password: 'Str0ng!Passw0rd',
        fullName: 'Taxpayer',
      }),
    ).toThrow();
  });

  it('rejects a weak registration password', () => {
    expect(() =>
      registerRequestSchema.parse({
        phone,
        password: 'weak',
        otpVerificationToken: 'verify-token',
        fullName: 'Taxpayer',
      }),
    ).toThrow();
  });

  it('accepts any non-empty password at login', () => {
    expect(loginRequestSchema.parse({ phone, password: 'weak' })).toEqual({
      phone,
      password: 'weak',
    });
    expect(() => loginRequestSchema.parse({ phone, password: '' })).toThrow();
  });

  it('validates OTP verify and password reset confirm payloads', () => {
    expect(
      otpVerifyRequestSchema.parse({ phone, code: '123456' }),
    ).toMatchObject({ phone });
    expect(() => otpVerifyRequestSchema.parse({ phone, code: '12' })).toThrow();
    expect(
      passwordResetConfirmSchema.parse({
        phone,
        code: '1234',
        newPassword: 'N3w!Password',
      }),
    ).toMatchObject({ phone });
  });

  it('requires a refresh token', () => {
    expect(() => refreshRequestSchema.parse({})).toThrow();
    expect(() => refreshRequestSchema.parse({ refreshToken: ' ' })).toThrow();
  });

  it('fixes the token pair response shape', () => {
    const value = tokenPairResponseSchema.parse({
      accessToken: 'a',
      refreshToken: 'r',
      expiresInSeconds: 900,
      tokenType: 'Bearer',
    });
    expect(value.tokenType).toBe('Bearer');
    expect(() =>
      tokenPairResponseSchema.parse({
        accessToken: 'a',
        refreshToken: 'r',
        expiresInSeconds: 900,
        tokenType: 'bearer',
      }),
    ).toThrow();
  });
});
