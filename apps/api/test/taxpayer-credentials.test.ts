import { describe, expect, it } from 'vitest';
import {
  generatePassword,
  normalizeYemeniPhone,
} from '../src/messaging/taxpayer-credentials.service.js';
import { MetaMessagingProvider, maskPhone } from '../src/messaging/meta-messaging.provider.js';

const configOf = (values: Record<string, string | undefined>) =>
  ({ get: (key: string) => values[key] }) as never;

describe('generatePassword — كلمة المرور المُولَّدة', () => {
  it('تستوفي شرط قوة كلمة المرور على الخادم', () => {
    for (let i = 0; i < 200; i += 1) {
      const password = generatePassword();
      expect(password.length, password).toBeGreaterThanOrEqual(12);
      expect(/[A-Z]/.test(password), `حرف كبير: ${password}`).toBe(true);
      expect(/[a-z]/.test(password), `حرف صغير: ${password}`).toBe(true);
      expect(/\d/.test(password), `رقم: ${password}`).toBe(true);
      expect(/[^A-Za-z0-9]/.test(password), `رمز خاص: ${password}`).toBe(true);
    }
  });

  it('لا تتكرر — الأصناف ليست في مواضع ثابتة', () => {
    const generated = new Set<string>();
    const firstChars = new Set<string>();
    for (let i = 0; i < 300; i += 1) {
      const password = generatePassword();
      generated.add(password);
      firstChars.add(password[0]!);
    }
    expect(generated.size).toBe(300);
    // لو لم تُخلط لكان الحرف الأول دائماً كبيراً.
    expect(firstChars.size).toBeGreaterThan(5);
  });

  it('تتجنّب الأحرف الملتبسة في القراءة', () => {
    const confusing = /[IOl01]/;
    const sample = Array.from({ length: 300 }, () => generatePassword()).join('');
    expect(confusing.test(sample)).toBe(false);
  });
});

describe('normalizeYemeniPhone', () => {
  it('يقبل الصيغ الأربع ويوحّدها', () => {
    for (const input of ['771234567', '+967771234567', '967771234567', '00967771234567']) {
      expect(normalizeYemeniPhone(input)).toBe('+967771234567');
    }
  });

  it('يتجاهل المسافات والشرطات', () => {
    expect(normalizeYemeniPhone('77 123-4567')).toBe('+967771234567');
  });

  it('يرفض غير الصالح', () => {
    for (const input of ['', '123', '112345678', '+966771234567', '7712345678']) {
      expect(normalizeYemeniPhone(input), input).toBeNull();
    }
  });
});

describe('maskPhone — لا رقم كامل في السجلات', () => {
  it('يُخفي وسط الرقم', () => {
    const masked = maskPhone('+967771234567');
    expect(masked).not.toContain('1234');
    expect(masked).toContain('****');
  });

  it('يُخفي الأرقام القصيرة كلياً', () => {
    expect(maskPhone('12345')).toBe('***');
  });
});

describe('MetaMessagingProvider — قبل وصول بيانات الاعتماد', () => {
  it('معطّل بلا إعداد', () => {
    const provider = new MetaMessagingProvider(configOf({}));
    expect(provider.enabled).toBe(false);
  });

  it('معطّل بإعداد ناقص', () => {
    const partial = new MetaMessagingProvider(
      configOf({ META_WHATSAPP_PHONE_NUMBER_ID: '123' }),
    );
    expect(partial.enabled).toBe(false);
  });

  it('مفعّل بإعداد كامل', () => {
    const provider = new MetaMessagingProvider(
      configOf({
        META_WHATSAPP_PHONE_NUMBER_ID: '123',
        META_WHATSAPP_ACCESS_TOKEN: 'token',
      }),
    );
    expect(provider.enabled).toBe(true);
  });

  it('يرفض بصدق بدل ادّعاء نجاح لم يحدث', async () => {
    const provider = new MetaMessagingProvider(configOf({}));
    const result = await provider.send({
      to: '+967771234567',
      body: 'رسالة',
      channel: 'whatsapp',
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('غير مُفعّلة');
  });
});
