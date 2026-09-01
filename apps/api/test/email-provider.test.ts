import { describe, expect, it } from 'vitest';
import { AuthnService } from '../src/authn/authn.service.js';

/**
 * تصنيف رفض GoTrue لطلب بريد.
 *
 * الفارق بين «عطل في الخدمة» و«لا حساب بهذا البريد» هو محور هذا الملف:
 * الأول يُقال للمستخدم ويُسجَّل للمكتب، والثاني يُكتم وإلا صارت النقطة أداة
 * تعداد لبُرد المستخدمين.
 */
function classify(
  service: AuthnService,
  body: unknown,
  status = 400,
): Promise<{ reason: string; message: string } | null> {
  const response = new Response(JSON.stringify(body), { status });
  return (
    Reflect.get(service, 'mailerIssue') as (
      r: Response,
    ) => Promise<{ reason: string; message: string } | null>
  ).call(service, response);
}

/** الخدمة بلا تبعيات: الدوال المُختبَرة هنا نقية لا تلمس شبكة ولا قاعدة. */
function serviceStub(): AuthnService {
  return Object.create(AuthnService.prototype) as AuthnService;
}

describe('تصنيف أخطاء مزوّد البريد', () => {
  it('يكتم «لا حساب بهذا البريد» فلا تصير النقطة أداة تعداد', async () => {
    const service = serviceStub();

    // `create_user: false` يجعل GoTrue يرد بهذا الرمز للعنوان غير المسجَّل.
    await expect(
      classify(service, { error_code: 'otp_disabled', msg: 'Signups not allowed' }, 422),
    ).resolves.toBeNull();

    await expect(
      classify(service, { error_code: 'user_not_found' }, 404),
    ).resolves.toBeNull();
  });

  it('يُظهر تجاوز حد الإرسال ويرشد إلى بديل الهاتف', async () => {
    const issue = await classify(
      serviceStub(),
      { error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' },
      429,
    );

    expect(issue).not.toBeNull();
    expect(issue?.message).toContain('حد إرسال البريد');
    expect(issue?.message).toContain('هاتفك');
    // السبب التقني يبقى للسجل لا للمستخدم.
    expect(issue?.reason).toContain('over_email_send_rate_limit');
  });

  it('يُظهر رفض المزوّد للعنوان بلا لوم المستخدم على خطأ ليس منه', async () => {
    const issue = await classify(serviceStub(), {
      error_code: 'email_address_invalid',
      msg: 'Email address is invalid',
    });

    expect(issue?.message).toContain('خدمة البريد لدى المكتب');
  });

  it('يعطي رسالة عامة لرمز غير معروف بدل كشف تفاصيل المزود', async () => {
    const issue = await classify(serviceStub(), {
      error_code: 'some_new_code',
      msg: 'internal detail',
    });

    expect(issue?.message).not.toContain('internal detail');
    expect(issue?.reason).toContain('some_new_code');
  });

  it('يعامل رداً غير مقروء عطلاً لا نجاحاً', async () => {
    const response = new Response('<html>502</html>', { status: 502 });
    const issue = await (
      Reflect.get(serviceStub(), 'mailerIssue') as (
        r: Response,
      ) => Promise<{ reason: string; message: string } | null>
    ).call(serviceStub(), response);

    expect(issue).not.toBeNull();
    expect(issue?.reason).toContain('502');
  });
});
