import { z } from 'zod';

/**
 * E.164 international phone format. The phone number is the only sign-in
 * identifier; no email field exists anywhere in the authentication contracts.
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9][0-9]{7,14}$/, 'Phone must be in E.164 format.');

/** Four to six digits, delivered out-of-band only. */
export const otpCodeSchema = z
  .string()
  .regex(/^[0-9]{4,6}$/, 'OTP code must be 4 to 6 digits.');

/**
 * At least 10 characters including one lowercase letter, one uppercase
 * letter, one digit, and one symbol.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .max(128, 'Password must be at most 128 characters.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[0-9]/, 'Password must contain a digit.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol.');

export const otpRequestSchema = z
  .object({
    phone: phoneSchema,
  })
  .strict();

export const otpVerifyRequestSchema = z
  .object({
    phone: phoneSchema,
    code: otpCodeSchema,
  })
  .strict();

/**
 * Short-lived single-purpose token proving OTP verification, consumed once
 * by registration. Never the OTP itself.
 */
export const otpVerifyResponseSchema = z
  .object({
    verificationToken: z.string().trim().min(1),
  })
  .strict();

export const registerRequestSchema = z
  .object({
    phone: phoneSchema,
    password: passwordSchema,
    otpVerificationToken: z.string().trim().min(1),
    fullName: z.string().trim().min(1).max(200),
  })
  .strict();

export const loginRequestSchema = z
  .object({
    phone: phoneSchema,
    // Policy is not re-validated at login; any non-empty value is checked
    // against the stored credential.
    password: z.string().min(1),
  })
  .strict();

/** Access tokens are short-lived; refresh rotates the pair. */
export const tokenPairResponseSchema = z
  .object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresInSeconds: z.number().int().positive(),
    tokenType: z.literal('Bearer'),
  })
  .strict();

export const passwordResetRequestSchema = z
  .object({
    phone: phoneSchema,
  })
  .strict();

export const passwordResetConfirmSchema = z
  .object({
    phone: phoneSchema,
    code: otpCodeSchema,
    newPassword: passwordSchema,
  })
  .strict();

export const refreshRequestSchema = z
  .object({
    refreshToken: z.string().trim().min(1),
  })
  .strict();

export type OtpRequest = z.infer<typeof otpRequestSchema>;
export type OtpVerifyRequest = z.infer<typeof otpVerifyRequestSchema>;
export type OtpVerifyResponse = z.infer<typeof otpVerifyResponseSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type TokenPairResponse = z.infer<typeof tokenPairResponseSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
