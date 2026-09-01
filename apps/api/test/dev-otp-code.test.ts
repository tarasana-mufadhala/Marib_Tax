import { describe, expect, it, vi } from 'vitest';
import { OtpService } from '../src/authn/otp.service.js';

const DEV_CODE = '123456';

/** إعداد وهمي يُمرَّر لـ OtpService. */
function configOf(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as never;
}

const devEnabled = configOf({ DEV_OTP_CODE: DEV_CODE, NODE_ENV: 'development' });

const TWILIO = {
  TWILIO_ACCOUNT_SID: 'AC-test',
  TWILIO_AUTH_TOKEN: 'token',
  TWILIO_VERIFY_SERVICE_SID: 'VA-test',
};

const PHONE = '+967771234567';
const OTHER = '+967779998888';

describe('DEV_OTP_CODE — رمز التجربة', () => {
  it('يُقبل بعد طلب رمز نشط لنفس الرقم', async () => {
    const otp = new OtpService(devEnabled);
    await otp.requestOtp(PHONE);

    expect(await otp.verifyOtp(PHONE, DEV_CODE)).toBe(true);
  });

  it('لا يُقبل لرقم لم يُطلب له رمز — هذا ما يمنع الاستيلاء على الحسابات',
    async () => {
      const otp = new OtpService(devEnabled);
      await otp.requestOtp(PHONE);

      expect(await otp.verifyOtp(OTHER, DEV_CODE)).toBe(false);
    });

  it('لا يُقبل بعد انتهاء صلاحية الطلب', async () => {
    const otp = new OtpService(devEnabled);
    await otp.requestOtp(PHONE);

    // تقديم الساعة خمس دقائق: مدة صلاحية الرمز.
    const store = (otp as unknown as {
      store: Map<string, { expiresAt: Date }>;
    }).store;
    store.get(PHONE)!.expiresAt = new Date(Date.now() - 1000);

    expect(await otp.verifyOtp(PHONE, DEV_CODE)).toBe(false);
  });

  it('يُستهلك مرة واحدة فلا يُعاد استعماله', async () => {
    const otp = new OtpService(devEnabled);
    await otp.requestOtp(PHONE);

    expect(await otp.verifyOtp(PHONE, DEV_CODE)).toBe(true);
    expect(await otp.verifyOtp(PHONE, DEV_CODE)).toBe(false);
  });

  it('الرمز الحقيقي يبقى مقبولاً بوجود رمز التجربة', async () => {
    const otp = new OtpService(devEnabled);
    await otp.requestOtp(PHONE);
    const real = (otp as unknown as {
      store: Map<string, { code: string }>;
    }).store.get(PHONE)!.code;

    expect(await otp.verifyOtp(PHONE, real)).toBe(true);
  });
});

describe('DEV_OTP_CODE — الشروط التي تعطّله', () => {
  it('معطّل حين لا يُضبط المتغيّر — لا قيمة افتراضية', async () => {
    const otp = new OtpService(configOf({ NODE_ENV: 'development' }));
    await otp.requestOtp(PHONE);

    expect(await otp.verifyOtp(PHONE, DEV_CODE)).toBe(false);
  });

  it('معطّل في بيئة الإنتاج ولو كان مضبوطاً', async () => {
    const otp = new OtpService(
      configOf({ DEV_OTP_CODE: DEV_CODE, NODE_ENV: 'production' }),
    );
    await otp.requestOtp(PHONE);

    expect(await otp.verifyOtp(PHONE, DEV_CODE)).toBe(false);
  });

  it('معطّل حين يكون Twilio مضبوطاً — التحقق الحقيقي يسبقه', async () => {
    // Twilio يرد أن الرمز غير معتمد؛ رمز التجربة يجب ألا يُنقذه.
    vi.stubGlobal('fetch', async () =>
      new Response(JSON.stringify({ status: 'pending' }), { status: 200 }));

    const otp = new OtpService(
      configOf({ DEV_OTP_CODE: DEV_CODE, NODE_ENV: 'development', ...TWILIO }),
    );

    expect(await otp.verifyOtp(PHONE, DEV_CODE)).toBe(false);
    vi.unstubAllGlobals();
  });

  it('معطّل بلا إعداد إطلاقاً', async () => {
    const otp = new OtpService();
    await otp.requestOtp(PHONE);

    expect(await otp.verifyOtp(PHONE, DEV_CODE)).toBe(false);
  });

  it('رمز خاطئ يبقى مرفوضاً', async () => {
    const otp = new OtpService(devEnabled);
    await otp.requestOtp(PHONE);

    expect(await otp.verifyOtp(PHONE, '000000')).toBe(false);
  });
});
