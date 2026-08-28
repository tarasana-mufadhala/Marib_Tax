import { describe, expect, it, vi } from 'vitest';
import { AuthnService } from '../src/authn/authn.service.js';

/**
 * استعادة كلمة المرور بالبريد وتأكيد البريد المضاف.
 *
 * كلاهما يمر بـ `verifyEmailToken`، والمهم أن يُرسل كلٌّ منهما `type`
 * الصحيح: خلطها يجعل رمز غرض يعمل في غيره — فرمز تأكيد بريد يصلح لتغيير
 * كلمة مرور، وهو ما لا يجوز.
 */
function serviceStub(overrides: Record<string, unknown> = {}): AuthnService {
  const service = Object.create(AuthnService.prototype) as AuthnService;
  Reflect.set(service, 'supabaseUrl', 'https://example.test');
  Reflect.set(service, 'adminHeaders', () => ({}));
  Reflect.set(service, 'logger', {
    error: () => {},
    warn: () => {},
    debug: () => {},
  });
  for (const [key, value] of Object.entries(overrides)) {
    Reflect.set(service, key, value);
  }
  return service;
}

function verifyToken(
  service: AuthnService,
  email: string,
  token: string,
  type: string,
): Promise<string> {
  return (
    Reflect.get(service, 'verifyEmailToken') as (
      e: string,
      t: string,
      ty: string,
    ) => Promise<string>
  ).call(service, email, token, type);
}

describe('التحقق من رموز البريد', () => {
  it('يرسل النوع الصحيح إلى GoTrue لكل غرض', async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      calls.push((JSON.parse(init.body) as { type: string }).type);
      return new Response(JSON.stringify({ user: { id: 'auth-1' } }), {
        status: 200,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = serviceStub();
    await verifyToken(service, 'a@b.com', '123456', 'recovery');
    await verifyToken(service, 'a@b.com', '123456', 'email_change');

    expect(calls).toEqual(['recovery', 'email_change']);
    vi.unstubAllGlobals();
  });

  it('يرفض رمزاً خاطئاً برسالة عربية واحدة لا تكشف السبب', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 401 })),
    );

    const service = serviceStub({ db: undefined });
    await expect(
      verifyToken(service, 'a@b.com', '000000', 'recovery'),
    ).rejects.toMatchObject({ status: 403 });

    vi.unstubAllGlobals();
  });

  it('يرفض رداً ناجحاً بلا معرّف حساب بدل المضي على فراغ', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })),
    );

    const service = serviceStub({ db: undefined });
    await expect(
      verifyToken(service, 'a@b.com', '123456', 'recovery'),
    ).rejects.toMatchObject({ status: 503 });

    vi.unstubAllGlobals();
  });
});

describe('استعادة كلمة المرور بالبريد', () => {
  it('ترفض بريداً غير صحيح قبل لمس الشبكة', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const service = serviceStub();
    await expect(
      service.requestEmailPasswordReset('not-an-email'),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('ترفض كلمة مرور ضعيفة قبل استهلاك الرمز', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const service = serviceStub({
      securityService: { validatePasswordStrength: () => false },
    });

    await expect(
      service.confirmEmailPasswordReset('a@b.com', '123456', 'weak'),
    ).rejects.toMatchObject({ status: 400 });
    // لم يُستهلك الرمز: التحقق يقع بعد فحص قوة كلمة المرور.
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('ترفض رمزاً فارغاً', async () => {
    const service = serviceStub();
    await expect(
      service.confirmEmailPasswordReset('a@b.com', '   ', 'Strong@123'),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('تأكيد البريد المضاف', () => {
  it('يرفض رمزاً فارغاً', async () => {
    const service = serviceStub();
    await expect(
      service.confirmAccountEmail('a@b.com', ''),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('يستعمل نوع email_change لا recovery', async () => {
    let sentType = '';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { body: string }) => {
        sentType = (JSON.parse(init.body) as { type: string }).type;
        return new Response(JSON.stringify({ user: { id: 'auth-1' } }), {
          status: 200,
        });
      }),
    );

    const service = serviceStub({ db: undefined });
    await service.confirmAccountEmail('a@b.com', '123456');

    expect(sentType).toBe('email_change');
    vi.unstubAllGlobals();
  });
});
