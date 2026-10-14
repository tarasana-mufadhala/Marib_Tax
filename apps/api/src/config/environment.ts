import { z } from 'zod';

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().url().optional(),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    SUPABASE_JWT_SECRET: z.string().min(1).optional(),

    /** Dedicated key for the short-lived registration verification proof. */
    AUTH_VERIFICATION_TOKEN_SECRET: z.string().min(32).optional(),

    /** Comma-separated web origins allowed to call the API with credentials. */
    CORS_ALLOWED_ORIGINS: z.string().min(1).optional(),

    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_VERIFY_SERVICE_SID: z.string().min(1).optional(),

    /** Development-only fixed OTP. Never accepted in production. */
    DEV_OTP_CODE: z
      .string()
      .regex(/^\d{6}$/, 'DEV_OTP_CODE must be exactly six digits')
      .optional(),

    META_WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
    META_WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;

    const required: Array<keyof typeof env> = [
      'DATABASE_URL',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'AUTH_VERIFICATION_TOKEN_SECRET',
      'CORS_ALLOWED_ORIGINS',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_VERIFY_SERVICE_SID',
    ];

    for (const key of required) {
      if (!env[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${String(key)} is required in production`,
        });
      }
    }

    if (env.DEV_OTP_CODE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DEV_OTP_CODE'],
        message: 'DEV_OTP_CODE must not be configured in production',
      });
    }

    if (env.CORS_ALLOWED_ORIGINS) {
      const origins = env.CORS_ALLOWED_ORIGINS.split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (
        origins.length === 0 ||
        origins.some((origin) => !origin.startsWith('https://'))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ALLOWED_ORIGINS'],
          message: 'Production CORS origins must be a non-empty HTTPS list',
        });
      }
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  input: Record<string, unknown>,
): Environment {
  const sanitizedInput = { ...input };
  if (!sanitizedInput.PORT || Number.isNaN(Number(sanitizedInput.PORT))) {
    sanitizedInput.PORT = 3000;
  }

  const optionalStringKeys = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'AUTH_VERIFICATION_TOKEN_SECRET',
    'CORS_ALLOWED_ORIGINS',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_VERIFY_SERVICE_SID',
    'DEV_OTP_CODE',
    'META_WHATSAPP_PHONE_NUMBER_ID',
    'META_WHATSAPP_ACCESS_TOKEN',
  ] as const;

  for (const key of optionalStringKeys) {
    if (
      typeof sanitizedInput[key] === 'string' &&
      sanitizedInput[key].trim() === ''
    ) {
      delete sanitizedInput[key];
    }
  }

  return environmentSchema.parse(sanitizedInput);
}
