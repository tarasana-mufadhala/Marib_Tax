import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),

  /**
   * رمز تحقق ثابت للتجربة قبل ربط Twilio.
   *
   * يُقبل مع رمز الرسالة الحقيقي، وبثلاثة شروط مجتمعة: أن يكون Twilio غير
   * مضبوط، وألا تكون البيئة `production`، وأن يوجد طلب رمز نشط غير منتهٍ
   * لهذا الرقم تحديداً. غيابه يعني تعطيله — لا قيمة افتراضية.
   *
   * ضبطه في الإنتاج يُتجاهَل ويُسجَّل كخطأ (فشل مغلق).
   */
  /** مزود رسائل ميتا — بلا هذين يبقى الإرسال معطّلاً ويُبلَّغ به صراحةً. */
  META_WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  META_WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),

  DEV_OTP_CODE: z
    .string()
    .regex(/^\d{6}$/, 'DEV_OTP_CODE must be exactly six digits')
    .optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  input: Record<string, unknown>,
): Environment {
  const sanitizedInput = { ...input };
  if (!sanitizedInput.PORT || Number.isNaN(Number(sanitizedInput.PORT))) {
    sanitizedInput.PORT = 3000;
  }
  if (typeof sanitizedInput.DATABASE_URL === 'string' && sanitizedInput.DATABASE_URL.trim() === '') {
    delete sanitizedInput.DATABASE_URL;
  }
  // متغيّر فارغ في .env يعني «غير مضبوط»، لا قيمة فارغة تكسر التحقق.
  if (typeof sanitizedInput.DEV_OTP_CODE === 'string' && sanitizedInput.DEV_OTP_CODE.trim() === '') {
    delete sanitizedInput.DEV_OTP_CODE;
  }
  for (const key of ['META_WHATSAPP_PHONE_NUMBER_ID', 'META_WHATSAPP_ACCESS_TOKEN']) {
    if (typeof sanitizedInput[key] === 'string' && (sanitizedInput[key] as string).trim() === '') {
      delete sanitizedInput[key];
    }
  }
  return environmentSchema.parse(sanitizedInput);
}
