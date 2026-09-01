import { afterEach, describe, expect, it, vi } from 'vitest';
import { UsersMemoryRepository } from '../src/users/users.memory-repository.js';
import { UsersService } from '../src/users/users.service.js';
import { SecurityMemoryRepository } from '../src/security/security.memory-repository.js';
import { SecurityService } from '../src/security/security.service.js';
import { OtpService } from '../src/authn/otp.service.js';
import { AuthnService } from '../src/authn/authn.service.js';

interface TestOtpService {
  store: Map<string, { code: string; expiresAt: Date; attempts: number }>;
}

interface MockAuthUser {
  id: string;
  phone: string;
  password: string;
}

/**
 * Minimal in-memory GoTrue stub: covers the endpoints AuthnService uses.
 */
function stubGoTrue() {
  const users: MockAuthUser[] = [];

  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : {};

    if (method === 'POST' && url.endsWith('/auth/v1/admin/users')) {
      if (users.some((u) => u.phone === body.phone)) {
        return new Response(JSON.stringify({ message: 'User already registered' }), { status: 422 });
      }
      const user: MockAuthUser = {
        id: `auth-${users.length + 1}`,
        // GoTrue يخزّن الهاتف بلا علامة + — نحاكي ذلك حتى تكشف الاختبارات
        // أي اعتماد على المطابقة النصية المباشرة.
        phone: String(body.phone).replace(/^\+/, ''),
        password: body.password,
      };
      users.push(user);
      return new Response(JSON.stringify({ id: user.id, phone: user.phone }), { status: 200 });
    }

    if (method === 'GET' && url.includes('/auth/v1/admin/users?page=')) {
      const page = Number(new URL(url).searchParams.get('page') ?? '1');
      const batch = page === 1 ? users : [];
      return new Response(
        JSON.stringify({ users: batch.map((u) => ({ id: u.id, phone: u.phone })) }),
        { status: 200 },
      );
    }

    if (method === 'PUT' && url.includes('/auth/v1/admin/users/')) {
      const id = url.split('/auth/v1/admin/users/')[1];
      const user = users.find((u) => u.id === id);
      if (!user) return new Response('{}', { status: 404 });
      user.password = body.password;
      return new Response(JSON.stringify({ id: user.id }), { status: 200 });
    }

    if (method === 'POST' && url.includes('/auth/v1/token?grant_type=password')) {
      const digits = (value: string) => String(value ?? '').replace(/\D/g, '');
      const user = users.find(
        (u) => digits(u.phone) === digits(body.phone) && u.password === body.password,
      );
      if (!user) {
        return new Response(JSON.stringify({ error_code: 'invalid_credentials' }), { status: 400 });
      }
      return new Response(
        JSON.stringify({
          access_token: `header.${Buffer.from(JSON.stringify({ sub: user.id })).toString('base64')}.sig`,
          refresh_token: `refresh-${user.id}`,
          expires_in: 3600,
          user: { id: user.id, phone: user.phone },
        }),
        { status: 200 },
      );
    }

    if (method === 'POST' && url.includes('/auth/v1/token?grant_type=refresh_token')) {
      // GoTrue يدوّر رمز التجديد عند كل استعمال: الرمز القديم يبطل فوراً،
      // ولذلك يقبل هذا المحاكي الرمز الحالي وحده ثم يُصدر غيره.
      const sent = (body as { refresh_token?: string }).refresh_token ?? '';
      const user = users.find((u) => `refresh-${u.id}` === sent);
      if (!user) {
        return new Response(JSON.stringify({ error_code: 'invalid_grant' }), { status: 400 });
      }
      return new Response(
        JSON.stringify({
          access_token: `header.${Buffer.from(JSON.stringify({ sub: user.id })).toString('base64')}.renewed`,
          refresh_token: `refresh-${user.id}`,
          expires_in: 3600,
          user: { id: user.id, phone: user.phone },
        }),
        { status: 200 },
      );
    }

    throw new Error(`Unhandled mock fetch: ${method} ${url}`);
  });

  return { users };
}

const configValues: Record<string, string> = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
};
const configService = { get: (key: string) => configValues[key] } as never;

describe('AuthnService & OtpService & SecurityService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('manages full auth flow: OTP request, OTP verify, registration, login, rate limiting, and password reset', async () => {
    stubGoTrue();

    const usersRepo = new UsersMemoryRepository();
    const usersService = new UsersService(usersRepo);

    const securityRepo = new SecurityMemoryRepository();
    const securityService = new SecurityService(securityRepo);

    const otpService = new OtpService();
    const authnService = new AuthnService(
      usersService,
      securityService,
      otpService,
      configService,
    );

    const phone = '+967770000000';

    // 1. Request OTP
    const { verificationId } = await authnService.requestRegistrationOtp(phone);
    expect(verificationId).toBe(phone);

    // 2. Try to verify with wrong code
    await expect(
      authnService.verifyRegistrationOtp(phone, '000000'),
    ).rejects.toThrow();

    // 3. Retrieve the generated OTP from the mock store directly
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

    // 7. Registering the same phone again conflicts
    await expect(
      authnService.requestRegistrationOtp(phone),
    ).rejects.toThrow();

    // 8. Login with wrong password
    await expect(
      authnService.login(phone, 'WrongPassword123!'),
    ).rejects.toThrow();

    // 9. Login with correct password
    const loginResult = await authnService.login(phone, password);
    expect(loginResult.userProfileId).toBe(userProfileId);
    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.accessToken.split('.')).toHaveLength(3);

    // 10. Lockout test: failed attempts lock the account
    for (let i = 0; i < 4; i++) {
      await expect(authnService.login(phone, 'WrongPass')).rejects.toThrow();
    }
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

  it('records auth events for every login outcome (feeds REP-27)', async () => {
    stubGoTrue();

    // Captures what AuthnService writes to identity.auth_events.
    const events: Array<Record<string, unknown>> = [];
    const db = {
      isInitialized: true,
      db: {
        insertInto: (table: string) => ({
          values: (row: Record<string, unknown>) => {
            expect(table).toBe('identity.auth_events');
            events.push(row);
            return { execute: async () => undefined };
          },
        }),
      },
    } as never;

    const usersService = new UsersService(new UsersMemoryRepository());
    const securityService = new SecurityService(new SecurityMemoryRepository());
    const otpService = new OtpService();
    const authnService = new AuthnService(
      usersService,
      securityService,
      otpService,
      configService,
      db,
    );

    const phone = '+967771111111';
    const password = 'StrongPassword123!';

    const { verificationId } = await authnService.requestRegistrationOtp(phone);
    expect(verificationId).toBe(phone);
    const code = (otpService as unknown as TestOtpService).store.get(phone)!.code;
    const { verificationToken } = await authnService.verifyRegistrationOtp(phone, code);
    await authnService.register(phone, verificationToken, password, 'مكلف تجريبي');

    const typesOf = () => events.map((e) => e.event_type);

    // 1. دخول ناجح
    await authnService.login(phone, password);
    expect(typesOf()).toContain('login_success');
    const success = events.find((e) => e.event_type === 'login_success')!;
    expect(success.identifier).toBe(phone);
    expect(success.channel).toBe('password');

    // 2. محاولة فاشلة تُسجَّل برقم المحاولة
    events.length = 0;
    await expect(authnService.login(phone, 'WrongPass1!')).rejects.toThrow();
    expect(typesOf()).toEqual(['login_failed']);
    expect(String(events[0]?.detail)).toContain('1');

    // 3. المحاولة الخامسة تُسجِّل القفل أيضاً
    events.length = 0;
    for (let i = 0; i < 4; i += 1) {
      await expect(authnService.login(phone, 'WrongPass1!')).rejects.toThrow();
    }
    expect(typesOf()).toContain('login_locked');

    // 4. محاولة أثناء القفل تُسجَّل منفصلة ولا تُحسب فشلاً جديداً
    events.length = 0;
    await expect(authnService.login(phone, password)).rejects.toThrow(/locked/i);
    expect(typesOf()).toEqual(['login_blocked']);
  });

  it('يرفض الرموز الثابتة القديمة لأي رقم — لا باب خلفي للتحقق', async () => {
    stubGoTrue();
    const otpService = new OtpService();

    // كانت 677110 و874271 تُقبل لأي رقم بلا طلب نشط، فتكفي معرفتهما
    // لإنشاء حساب بأي رقم أو إعادة تعيين كلمة مرور أي مكلف.
    for (const code of ['677110', '874271']) {
      expect(
        await otpService.verifyOtp('+967712345678', code),
        `الرمز ${code} يجب أن يُرفض لرقم بلا طلب نشط`,
      ).toBe(false);
    }
  });

  it('يقبل الرمز المولَّد لصاحبه فقط ولا يقبله لرقم آخر', async () => {
    stubGoTrue();
    const otpService = new OtpService();

    const owner = '+967771234567';
    await otpService.requestOtp(owner);
    const code = (otpService as unknown as TestOtpService).store.get(owner)!.code;

    expect(await otpService.verifyOtp('+967779999999', code)).toBe(false);
    expect(await otpService.verifyOtp(owner, code)).toBe(true);
  });

  it('عطل مزود الهوية لا يُترجَم إلى «كلمة مرور خاطئة»', async () => {
    // GoTrue يرد 422 phone_provider_disabled حين يكون المزود معطّلاً؛
    // ترجمة ذلك إلى فشل مصادقة تُضلّل المستخدم وتُوقع حسابه في القفل بلا ذنب.
    vi.stubGlobal('fetch', async () =>
      new Response(
        JSON.stringify({ code: 422, error_code: 'phone_provider_disabled', msg: 'Phone logins are disabled' }),
        { status: 422 },
      ));

    const authnService = new AuthnService(
      new UsersService(new UsersMemoryRepository()),
      new SecurityService(new SecurityMemoryRepository()),
      new OtpService(),
      configService,
    );

    await expect(
      authnService.login('+967771234567', 'Passw0rd1'),
    ).rejects.toThrow(/غير مُفعّل/);
  });

  it('يجد الحساب رغم اختلاف صيغة الهاتف بين E.164 وما يخزّنه GoTrue', async () => {
    stubGoTrue();
    const usersService = new UsersService(new UsersMemoryRepository());
    const authnService = new AuthnService(
      usersService,
      new SecurityService(new SecurityMemoryRepository()),
      new OtpService(),
      configService,
    );

    const phone = '+967773334444';
    const otp = new OtpService();
    await authnService.requestRegistrationOtp(phone);
    const code = (authnService as unknown as { otpService: TestOtpService })
      .otpService.store.get(phone)!.code;
    const { verificationToken } = await authnService.verifyRegistrationOtp(phone, code);
    await authnService.register(phone, verificationToken, 'StrongPassword123!', 'مكلف');
    expect(otp).toBeDefined();

    // الرقم صار مسجَّلاً: طلب تسجيل جديد يجب أن يُرفض لا أن يمضي.
    await expect(
      authnService.requestRegistrationOtp(phone),
    ).rejects.toThrow(/مسجَّل مسبقاً/);

    // واستعادة كلمة المرور يجب أن تجده لا أن تقول «لا يوجد حساب».
    await expect(
      authnService.requestPasswordResetOtp(phone),
    ).resolves.toMatchObject({ verificationId: phone });
  });

  it('does not throw when no database is wired (auth events are best-effort)', async () => {
    stubGoTrue();

    const usersService = new UsersService(new UsersMemoryRepository());
    const securityService = new SecurityService(new SecurityMemoryRepository());
    const authnService = new AuthnService(
      usersService,
      securityService,
      new OtpService(),
      configService,
    );

    await expect(
      authnService.login('+967772222222', 'WhateverPass1!'),
    ).rejects.toThrow(/Invalid phone number or password/i);
  });

  /**
   * رمز الوصول عمره ساعة. بلا تجديد يُخرَج المكلف من التطبيق كل ساعة في
   * منتصف عمله، ولذلك تُحرس هذه المسارات: الدخول يُسلّم رمز تجديد، والتجديد
   * يُصدر جلسة، والرمز الباطل أو الحساب المعطَّل وحدهما يوجبان دخولاً جديداً.
   */
  describe('تجديد الجلسة', () => {
    async function registeredTaxpayer(): Promise<{
      authnService: AuthnService;
      usersService: UsersService;
      phone: string;
      password: string;
    }> {
      stubGoTrue();
      const usersService = new UsersService(new UsersMemoryRepository());
      const otpService = new OtpService();
      const authnService = new AuthnService(
        usersService,
        new SecurityService(new SecurityMemoryRepository()),
        otpService,
        configService,
      );

      const phone = '+967773334444';
      const password = 'StrongPassword123!';
      await authnService.requestRegistrationOtp(phone);
      const code = (otpService as unknown as TestOtpService).store.get(phone)!.code;
      const { verificationToken } = await authnService.verifyRegistrationOtp(
        phone,
        code,
      );
      await authnService.register(phone, verificationToken, password, 'مكلف');

      return { authnService, usersService, phone, password };
    }

    it('الدخول يُسلّم رمز تجديد وعمر الجلسة، لا رمز وصول وحده', async () => {
      const { authnService, phone, password } = await registeredTaxpayer();

      const session = await authnService.login(phone, password);

      expect(session.refreshToken.length).toBeGreaterThan(0);
      expect(session.expiresInSeconds).toBe(3600);
      expect(session.tokenType).toBe('Bearer');
    });

    it('رمز التجديد يُصدر رمز وصول جديداً بلا كلمة مرور', async () => {
      const { authnService, phone, password } = await registeredTaxpayer();
      const session = await authnService.login(phone, password);

      const renewed = await authnService.refreshSession(session.refreshToken);

      expect(renewed.accessToken).not.toBe(session.accessToken);
      expect(renewed.userProfileId).toBe(session.userProfileId);
      expect(renewed.refreshToken.length).toBeGreaterThan(0);
    });

    it('رمز تجديد باطل يُرفض بـ 401 لا بخطأ خادم', async () => {
      const { authnService } = await registeredTaxpayer();

      await expect(
        authnService.refreshSession('refresh-does-not-exist'),
      ).rejects.toThrow(/Session expired/i);
    });

    it('رمز تجديد فارغ يُرفض قبل أي نداء للمزوّد', async () => {
      const { authnService } = await registeredTaxpayer();

      await expect(authnService.refreshSession('   ')).rejects.toThrow(
        /Refresh token is required/i,
      );
    });

    it('حساب عُطِّل بعد إصدار الجلسة لا تُجدَّد جلسته', async () => {
      const { authnService, usersService, phone, password } =
        await registeredTaxpayer();
      const session = await authnService.login(phone, password);

      // التعطيل يقع بعد الإصدار: التجديد هو ما يُعيد فحص الصلاحية، وإلا
      // بقي الموقوف داخل حسابه ما دام يجدّد.
      await usersService.updateUserProfile(session.userProfileId, undefined, false);

      await expect(
        authnService.refreshSession(session.refreshToken),
      ).rejects.toThrow(/no longer active/i);
    });
  });
});
