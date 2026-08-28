import {
  Injectable,
  Logger,
  Optional,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { SecurityService } from '../security/security.service.js';
import { OtpService } from './otp.service.js';
import { DatabaseService } from '../database/database.service.js';
import { recordAuthEvent } from './auth-events.js';
import { DomainException } from '../http/domain-exception.js';

interface GoTrueUser {
  id: string;
  phone?: string;
}

interface LoginLockoutState {
  failedAttempts: number;
  lockoutUntil: Date | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthnService {
  private readonly logger = new Logger(AuthnService.name);
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  // Best-effort per-instance login lockout counters (ephemeral by design).
  private readonly loginLockouts = new Map<string, LoginLockoutState>();

  constructor(
    private readonly usersService: UsersService,
    private readonly securityService: SecurityService,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
    @Optional() private readonly db?: DatabaseService,
  ) {
    this.supabaseUrl = (
      this.configService.get<string>('SUPABASE_URL') ?? ''
    ).replace(/\/$/, '');
    this.serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for authentication.',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Phone normalization (Yemen default: 9-digit local numbers starting with 7)
  // ---------------------------------------------------------------------------

  private normalizePhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[\s()-]/g, '');
    if (/^\+[1-9]\d{1,14}$/.test(cleaned)) return cleaned;
    if (/^7\d{8}$/.test(cleaned)) return `+967${cleaned}`;
    if (/^9677\d{8}$/.test(cleaned)) return `+${cleaned}`;
    if (/^009677\d{8}$/.test(cleaned)) return `+${cleaned.slice(2)}`;
    throw DomainException.badRequest(
      'أدخل رقم هاتف يمني صحيح يبدأ بـ 7 ويتكوّن من 9 أرقام',
      'INVALID_PHONE_NUMBER',
    );
  }

  // ---------------------------------------------------------------------------
  // Supabase GoTrue helpers
  // ---------------------------------------------------------------------------

  private adminHeaders(): Record<string, string> {
    return {
      apikey: this.serviceRoleKey,
      Authorization: `Bearer ${this.serviceRoleKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async findAuthUserByPhone(
    phoneNumber: string,
  ): Promise<GoTrueUser | null> {
    // GoTrue has no server-side phone filter; scan admin pages (dev-scale).
    for (let page = 1; page <= 20; page += 1) {
      const res = await fetch(
        `${this.supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=50`,
        { headers: this.adminHeaders() },
      );
      if (!res.ok) {
        throw new UnauthorizedException(
          'Failed to query the authentication provider.',
        );
      }
      const data = (await res.json()) as { users?: GoTrueUser[] } | GoTrueUser[];
      const users = Array.isArray(data) ? data : (data.users ?? []);
      // GoTrue يخزّن الهاتف بلا علامة + بينما نبحث بصيغة E.164، فلا تتطابق
      // المقارنة النصية المباشرة أبداً: كانت استعادة كلمة المرور تقول
      // «لا يوجد حساب» لأرقام مسجَّلة، والتسجيل يمضي على رقم موجود ثم يفشل
      // متأخراً. نوحّد الصيغتين قبل المقارنة.
      const wanted = digitsOf(phoneNumber);
      const found = users.find((u) => digitsOf(u.phone) === wanted);
      if (found) return found;
      if (users.length < 50) return null;
    }
    return null;
  }

  private async createAuthUser(
    phoneNumber: string,
    password: string,
    displayName: string | null,
  ): Promise<GoTrueUser> {
    const res = await fetch(`${this.supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: this.adminHeaders(),
      body: JSON.stringify({
        phone: phoneNumber,
        password,
        phone_confirm: true,
        ...(displayName ? { user_metadata: { display_name: displayName } } : {}),
      }),
    });
    if (res.status === 422) {
      throw DomainException.conflict(
        'هذا الرقم مسجَّل مسبقاً',
        'PHONE_ALREADY_REGISTERED',
      );
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new BadRequestException(
        `Failed to create the authentication identity (${res.status}): ${errText.slice(0, 120)}`,
      );
    }
    return (await res.json()) as GoTrueUser;
  }

  private async updateAuthUserPassword(
    authUserId: string,
    newPassword: string,
  ): Promise<void> {
    const res = await fetch(
      `${this.supabaseUrl}/auth/v1/admin/users/${authUserId}`,
      {
        method: 'PUT',
        headers: this.adminHeaders(),
        body: JSON.stringify({ password: newPassword }),
      },
    );
    if (!res.ok) {
      throw new BadRequestException('Failed to update the password.');
    }
  }

  // ---------------------------------------------------------------------------
  // Registration flow
  // ---------------------------------------------------------------------------

  async requestRegistrationOtp(
    phoneNumber: string,
  ): Promise<{ verificationId: string }> {
    const phone = this.normalizePhoneNumber(phoneNumber);
    const existing = await this.findAuthUserByPhone(phone);
    if (existing) {
      throw DomainException.conflict(
        'هذا الرقم مسجَّل مسبقاً. استعمل «تسجيل الدخول» أو «نسيت كلمة المرور»',
        'PHONE_ALREADY_REGISTERED',
      );
    }
    return this.otpService.requestOtp(phone);
  }

  async verifyRegistrationOtp(
    phoneNumber: string,
    code: string,
  ): Promise<{ verificationToken: string }> {
    const phone = this.normalizePhoneNumber(phoneNumber);
    const verified = await this.otpService.verifyOtp(phone, code);
    if (!verified) {
      throw DomainException.badRequest(
        'رمز التحقق غير صحيح أو انتهت صلاحيته. اطلب رمزاً جديداً',
        'INVALID_OTP_CODE',
      );
    }
    return {
      verificationToken: Buffer.from(`verified:${phone}`).toString('base64'),
    };
  }

  async register(
    phoneNumber: string,
    verificationToken: string,
    password: string,
    displayName: string | null = null,
  ): Promise<{ userProfileId: string }> {
    const phone = this.normalizePhoneNumber(phoneNumber);
    const decodedToken = Buffer.from(verificationToken, 'base64').toString(
      'utf-8',
    );
    if (decodedToken !== `verified:${phone}`) {
      throw DomainException.badRequest(
        'انتهت صلاحية التحقق من الرقم. ابدأ التسجيل من جديد',
        'INVALID_VERIFICATION_TOKEN',
      );
    }

    if (!this.securityService.validatePasswordStrength(password)) {
      throw DomainException.badRequest(
        'كلمة المرور يجب ألا تقل عن 8 خانات وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص',
        'WEAK_PASSWORD',
      );
    }

    const authUser = await this.createAuthUser(phone, password, displayName);
    const profile = await this.usersService.createUserProfile(
      authUser.id,
      displayName,
    );
    return { userProfileId: profile.id };
  }

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  /**
   * دخول المكلفين برقم الهاتف. يتطلب تفعيل مزود الهاتف في Supabase.
   */
  async login(
    phoneNumber: string,
    password: string,
  ): Promise<{ accessToken: string; userProfileId: string }> {
    const phone = this.normalizePhoneNumber(phoneNumber);
    return this.passwordGrant({
      identifier: phone,
      channel: 'password',
      credentials: { phone, password },
      invalidMessage: 'Invalid phone number or password.',
    });
  }

  /**
   * دخول موظفي المكتب بالبريد الإلكتروني — المسار العامل حالياً، إذ أن
   * مزود الهاتف معطّل على المشروع (phone_provider_disabled).
   */
  async loginWithEmail(
    emailAddress: string,
    password: string,
  ): Promise<{ accessToken: string; userProfileId: string }> {
    const email = String(emailAddress ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required.');
    }
    return this.passwordGrant({
      identifier: email,
      channel: 'email',
      credentials: { email, password },
      invalidMessage: 'Invalid email address or password.',
    });
  }

  /**
   * منطق الدخول المشترك بين مساري الهاتف والبريد: القفل بعد المحاولات الفاشلة،
   * تسجيل أحداث المصادقة (مصدر REP-27)، ثم إصدار الجلسة.
   */
  /**
   * يميّز عطل إعداد المزود عن خطأ بيانات الدخول.
   *
   * GoTrue يرد 422 `phone_provider_disabled` حين يكون مزود الهاتف معطّلاً في
   * المشروع؛ ترجمة ذلك إلى «كلمة مرور خاطئة» تُضلّل المستخدم وتُوقع حسابه
   * في القفل بلا ذنب. يعيد null إن كان الفشل فشل مصادقة حقيقياً.
   */
  private async providerConfigurationIssue(
    response: Response,
  ): Promise<{ reason: string; message: string } | null> {
    let payload: { error_code?: string; msg?: string; message?: string } = {};
    try {
      payload = (await response.clone().json()) as typeof payload;
    } catch {
      return null;
    }

    const code = payload.error_code ?? '';
    const detail = payload.msg ?? payload.message ?? code;

    if (code === 'phone_provider_disabled') {
      return {
        reason: `phone_provider_disabled — ${detail}`,
        message:
          'الدخول برقم الهاتف غير مُفعّل حالياً لدى المكتب. يرجى المحاولة لاحقاً.',
      };
    }
    if (code === 'email_provider_disabled') {
      return {
        reason: `email_provider_disabled — ${detail}`,
        message:
          'الدخول بالبريد الإلكتروني غير مُفعّل حالياً. يرجى مراجعة الإدارة.',
      };
    }
    if (code === 'signup_disabled' || code === 'anonymous_provider_disabled') {
      return {
        reason: `${code} — ${detail}`,
        message: 'خدمة الحسابات غير متاحة حالياً. يرجى المحاولة لاحقاً.',
      };
    }
    return null;
  }

  private async passwordGrant(params: {
    identifier: string;
    channel: 'password' | 'email';
    credentials: Record<string, string>;
    invalidMessage: string;
  }): Promise<{ accessToken: string; userProfileId: string }> {
    const { identifier, channel, credentials, invalidMessage } = params;

    const now = new Date();
    const lockout = this.loginLockouts.get(identifier);
    if (lockout?.lockoutUntil && lockout.lockoutUntil > now) {
      const waitMinutes = Math.ceil(
        (lockout.lockoutUntil.getTime() - now.getTime()) / 60000,
      );
      recordAuthEvent(
        this.db,
        'login_blocked',
        identifier,
        `محاولة دخول أثناء القفل — متبقٍ ${waitMinutes} دقيقة`,
        channel,
      );
      throw new UnauthorizedException(
        `Account temporarily locked. Please try again in ${waitMinutes} minute(s).`,
      );
    }

    const res = await fetch(
      `${this.supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: this.serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      },
    );

    if (!res.ok) {
      // عطل في إعداد المزود ليس فشل مصادقة: لا يُحتسب محاولة فاشلة ولا
      // يُقال للمستخدم «كلمة المرور خاطئة» بينما بياناته سليمة أصلاً.
      const providerIssue = await this.providerConfigurationIssue(res);
      if (providerIssue !== null) {
        this.logger.error(
          `تعذّر الدخول لعطل في إعداد مزود الهوية: ${providerIssue.reason}`,
        );
        throw DomainException.unavailable(
          providerIssue.message,
          'AUTH_PROVIDER_UNAVAILABLE',
        );
      }

      const attempts = (lockout?.failedAttempts ?? 0) + 1;
      recordAuthEvent(
        this.db,
        'login_failed',
        identifier,
        `محاولة فاشلة رقم ${attempts}`,
        channel,
      );
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        this.loginLockouts.set(identifier, {
          failedAttempts: 0,
          lockoutUntil: new Date(now.getTime() + LOCKOUT_DURATION_MS),
        });
        recordAuthEvent(
          this.db,
          'login_locked',
          identifier,
          `قفل 15 دقيقة بعد ${MAX_FAILED_ATTEMPTS} محاولات فاشلة`,
          channel,
        );
        throw new UnauthorizedException(
          'Account locked due to too many failed login attempts. Locked for 15 minutes.',
        );
      }
      this.loginLockouts.set(identifier, {
        failedAttempts: attempts,
        lockoutUntil: null,
      });
      throw new UnauthorizedException(invalidMessage);
    }

    this.loginLockouts.delete(identifier);

    const data = (await res.json()) as {
      access_token: string;
      user: GoTrueUser;
    };

    const profile = await this.usersService.findUserByAuthUserId(data.user.id);

    // يُسجَّل بعد إصدار الجلسة فعلياً: «دخول ناجح» يعني توكن صادر، لا مجرد كلمة مرور صحيحة.
    recordAuthEvent(this.db, 'login_success', identifier, undefined, channel);

    return {
      accessToken: data.access_token,
      userProfileId: profile.id,
    };
  }

  // ---------------------------------------------------------------------------
  // Password reset flow
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // إضافة بريد إلى حساب مسجَّل بالهاتف
  // ---------------------------------------------------------------------------

  /**
   * يبدأ إضافة بريد إلى حساب قائم.
   *
   * الحساب في GoTrue يحمل هاتفاً وبريداً معاً، فإضافة البريد لا تُلغي الهاتف:
   * المكلف يبقى قادراً على الدخول بكلمة مروره ورقمه، ويكسب قناة ثانية
   * للدخول برمز وللإشعارات. من لا تصله الرسائل النصية يحتاج بديلاً لا بديلاً
   * عن رقمه.
   *
   * التحقق بيد GoTrue: يرسل رابط/رمز تأكيد إلى البريد الجديد ولا يُثبّته
   * قبل التأكيد، فلا يستطيع أحد نسبة بريد لا يملكه إلى حسابه.
   */
  async addAccountEmail(
    userProfileId: string,
    emailAddress: string,
    currentPassword: string,
  ): Promise<{ pending: boolean }> {
    const email = String(emailAddress ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw DomainException.badRequest('أدخل بريداً إلكترونياً صحيحاً');
    }

    const user = await this.usersService.findUserById(userProfileId);
    const contact = await this.fetchAuthUserById(user.authUserId);
    const currentPhone = digitsOf(contact.phone);
    const currentEmail = (contact.email ?? '').trim().toLowerCase();

    if (currentEmail === email) {
      throw DomainException.conflict('هذا البريد مضاف إلى حسابك بالفعل');
    }

    // كلمة المرور تُطلب حتى لا تكفي جلسة مسروقة لربط بريد المهاجم بالحساب
    // ثم الدخول به لاحقاً برمز.
    const verified = await this.verifyPassword(
      currentPhone.length > 0 ? { phone: currentPhone } : { email: currentEmail },
      currentPassword,
    );
    if (!verified) {
      throw DomainException.forbidden('كلمة المرور غير صحيحة');
    }

    const taken = await this.findAuthUserByEmail(email);
    if (taken && taken.id !== user.authUserId) {
      throw DomainException.conflict('هذا البريد مسجَّل لحساب آخر');
    }

    const res = await fetch(
      `${this.supabaseUrl}/auth/v1/admin/users/${user.authUserId}`,
      {
        method: 'PUT',
        headers: this.adminHeaders(),
        // `email_confirm` غير مضبوط عمداً: التأكيد يأتي من صاحب البريد.
        body: JSON.stringify({ email }),
      },
    );
    if (!res.ok) {
      const issue = await this.providerConfigurationIssue(res);
      if (issue) throw DomainException.unavailable(issue.message);
      this.logger.error(`تعذّر إضافة البريد للحساب (${res.status})`);
      throw DomainException.unavailable('تعذّر إضافة البريد، حاول لاحقاً');
    }

    recordAuthEvent(
      this.db,
      'email_added',
      email,
      'إضافة بريد إلى حساب قائم — بانتظار التأكيد',
      'email',
    );
    return { pending: true };
  }

  /** حساب GoTrue ببريده، للتأكد أن البريد غير مأخوذ. */
  private async findAuthUserByEmail(
    email: string,
  ): Promise<{ id: string } | null> {
    const res = await fetch(
      `${this.supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
      { headers: this.adminHeaders() },
    );
    if (!res.ok) return null;
    const payload = (await res.json()) as {
      users?: { id: string; email?: string }[];
    };
    const match = (payload.users ?? []).find(
      (user) => (user.email ?? '').trim().toLowerCase() === email,
    );
    return match ? { id: match.id } : null;
  }

  // ---------------------------------------------------------------------------
  // تغيير رقم الهاتف
  // ---------------------------------------------------------------------------

  /**
   * يطلب رمز تحقق للرقم الجديد.
   *
   * الرقم هو هوية الدخول، فتغييره يشترط ثلاثة أمور مجتمعة: جلسة صالحة،
   * وكلمة المرور الحالية، وإثبات حيازة الرقم الجديد برمز يصله. إسقاط أيٍّ
   * منها يجعل سرقة جلسة كافية للاستيلاء على الحساب نهائياً.
   */
  async requestPhoneChange(
    userProfileId: string,
    newPhoneNumber: string,
    currentPassword: string,
  ): Promise<{ verificationId: string }> {
    const phone = this.normalizePhoneNumber(newPhoneNumber);

    const user = await this.usersService.findUserById(userProfileId);
    const contact = await this.fetchAuthUserById(user.authUserId);
    const currentPhone = digitsOf(contact.phone);
    const email = (contact.email ?? '').trim().toLowerCase();

    if (digitsOf(phone) === currentPhone) {
      throw DomainException.badRequest('الرقم الجديد مطابق لرقمك الحالي');
    }

    const verified = await this.verifyPassword(
      currentPhone.length > 0 ? { phone: currentPhone } : { email },
      currentPassword,
    );
    if (!verified) {
      throw DomainException.forbidden('كلمة المرور غير صحيحة');
    }

    // رقم يملكه حساب آخر لا يُقبل: رقمان لحساب واحد يكسران استعادة الحساب.
    const taken = await this.findAuthUserByPhone(phone);
    if (taken && taken.id !== user.authUserId) {
      throw DomainException.conflict('هذا الرقم مسجَّل لحساب آخر');
    }

    return this.otpService.requestOtp(phone);
  }

  /** يثبّت الرقم الجديد بعد التحقق من الرمز الواصل إليه. */
  async confirmPhoneChange(
    userProfileId: string,
    newPhoneNumber: string,
    code: string,
  ): Promise<{ success: boolean }> {
    const phone = this.normalizePhoneNumber(newPhoneNumber);

    const verified = await this.otpService.verifyOtp(phone, code);
    if (!verified) {
      throw DomainException.forbidden('رمز التحقق غير صحيح أو انتهت صلاحيته');
    }

    const user = await this.usersService.findUserById(userProfileId);
    const taken = await this.findAuthUserByPhone(phone);
    if (taken && taken.id !== user.authUserId) {
      throw DomainException.conflict('هذا الرقم مسجَّل لحساب آخر');
    }

    const res = await fetch(
      `${this.supabaseUrl}/auth/v1/admin/users/${user.authUserId}`,
      {
        method: 'PUT',
        headers: this.adminHeaders(),
        body: JSON.stringify({ phone, phone_confirm: true }),
      },
    );
    if (!res.ok) {
      this.logger.error(`تعذّر تحديث رقم الهاتف (${res.status})`);
      throw DomainException.unavailable('تعذّر تحديث الرقم، حاول لاحقاً');
    }

    recordAuthEvent(
      this.db,
      'phone_changed',
      phone,
      'تغيير رقم الهاتف بعد التحقق',
    );
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // الدخول برمز يصل البريد — بديل لرقم الهاتف
  // ---------------------------------------------------------------------------

  /**
   * يرسل رمز دخول إلى بريد المستخدم.
   *
   * التسليم عبر GoTrue لا عبر خدمة بريد مستقلة: هو من يملك حسابات المستخدمين
   * وقوالب الرسائل، وإضافة قناة ثانية تصدر رموزاً كان يعني مصدرَي حقيقة
   * للرمز الواحد.
   *
   * `create_user: false` مقصود: هذه نقطة دخول لا تسجيل، فلا يجوز أن يُنشئ
   * أي بريد مجهول حساباً بمجرد طلب رمز.
   */
  async requestEmailOtp(emailAddress: string): Promise<{ sent: boolean }> {
    const email = String(emailAddress ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw DomainException.badRequest('أدخل بريداً إلكترونياً صحيحاً');
    }

    if (this.emailOtpRateLimited(email)) {
      recordAuthEvent(
        this.db,
        'otp_rate_limited',
        email,
        'تجاوز حد طلبات رمز البريد',
        'email',
      );
      throw DomainException.badRequest(
        'طلبت الرمز مرات كثيرة. انتظر دقيقة ثم أعد المحاولة.',
      );
    }

    const res = await fetch(`${this.supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: this.adminHeaders(),
      body: JSON.stringify({ email, create_user: false }),
    });

    if (!res.ok) {
      const providerIssue = await this.providerConfigurationIssue(res);
      if (providerIssue) {
        this.logger.error(`تعذّر إرسال رمز البريد: ${providerIssue.reason}`);
        throw DomainException.unavailable(providerIssue.message);
      }

      const issue = await this.mailerIssue(res);
      if (issue) {
        // عطل في الخدمة لا في المستخدم: يُقال له، ويُسجَّل للمكتب.
        this.logger.error(`تعذّر إرسال رمز البريد: ${issue.reason}`);
        throw DomainException.unavailable(issue.message);
      }

      // «لا حساب بهذا البريد» يُكتم: الفرق بين ردَّي النجاح والفشل يحوّل
      // هذه النقطة إلى أداة تعداد لبُرد المستخدمين.
      this.logger.debug('طلب رمز بريد لعنوان غير مسجَّل');
    }

    recordAuthEvent(this.db, 'otp_requested', email, undefined, 'email');
    return { sent: true };
  }

  /** يتحقق من رمز البريد ويُصدر الجلسة. */
  async verifyEmailOtp(
    emailAddress: string,
    code: string,
  ): Promise<{ accessToken: string; userProfileId: string }> {
    const email = String(emailAddress ?? '').trim().toLowerCase();
    const token = String(code ?? '').trim();
    if (token.length === 0) {
      throw DomainException.badRequest('رمز التحقق مطلوب');
    }

    const res = await fetch(`${this.supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: this.adminHeaders(),
      body: JSON.stringify({ email, token, type: 'email' }),
    });

    if (!res.ok) {
      recordAuthEvent(
        this.db,
        'login_failed',
        email,
        'رمز بريد غير صحيح أو منتهٍ',
        'email',
      );
      throw DomainException.forbidden('رمز التحقق غير صحيح أو انتهت صلاحيته');
    }

    const payload = (await res.json()) as {
      access_token?: string;
      user?: { id?: string };
    };
    const accessToken = payload.access_token ?? '';
    const authUserId = payload.user?.id ?? '';
    if (accessToken === '' || authUserId === '') {
      throw DomainException.unavailable('تعذّر إصدار الجلسة، حاول لاحقاً');
    }

    const actor = await this.usersService
      .findUserByAuthUserId(authUserId)
      .catch(() => null);
    if (!actor || !actor.isActive) {
      throw DomainException.forbidden('لا يوجد حساب فعّال بهذا البريد');
    }

    recordAuthEvent(this.db, 'login_succeeded', email, 'دخول برمز بريد', 'email');
    return { accessToken, userProfileId: actor.id };
  }

  /**
   * يصنّف رفض GoTrue لطلب بريد.
   *
   * الفارق جوهري: عطل في إعداد البريد يجب أن يُقال للمستخدم صراحةً ويُسجَّل
   * للمكتب، بينما «هذا البريد غير مسجَّل» يجب أن يبقى مكتوماً وإلا صارت
   * النقطة أداة تعداد لبُرد المستخدمين.
   *
   * يعيد null حين يكون الرفض من نوع «لا حساب بهذا البريد».
   */
  private async mailerIssue(
    response: Response,
  ): Promise<{ reason: string; message: string } | null> {
    let payload: { error_code?: string; msg?: string } = {};
    try {
      payload = (await response.clone().json()) as typeof payload;
    } catch {
      return {
        reason: `mailer_unreadable_${response.status}`,
        message: 'تعذّر إرسال الرمز، يرجى المحاولة لاحقاً',
      };
    }

    const code = payload.error_code ?? '';
    const detail = payload.msg ?? code;

    switch (code) {
      // لا حساب بهذا البريد: `create_user: false` يمنع الإنشاء فيرد GoTrue
      // بهذا الرمز. يُكتم عمداً.
      case 'otp_disabled':
      case 'user_not_found':
        return null;

      // بريد Supabase المدمج يسمح برسالتين أو ثلاث في الساعة فقط، وهو
      // للتطوير لا للإنتاج. الحل ضبط SMTP خاص بالمكتب في إعدادات المشروع.
      case 'over_email_send_rate_limit':
        return {
          reason: `over_email_send_rate_limit — ${detail}`,
          message:
            'تجاوز المكتب حد إرسال البريد المسموح حالياً. حاول بعد قليل، ' +
            'أو ادخل برقم هاتفك.',
        };

      // المزود المدمج يرفض العناوين خارج فريق المشروع.
      case 'email_address_invalid':
        return {
          reason: `email_address_invalid — ${detail}`,
          message:
            'خدمة البريد لدى المكتب لا تصل هذا العنوان حالياً. ادخل برقم ' +
            'هاتفك أو راجع المكتب.',
        };

      case 'validation_failed':
        return {
          reason: `validation_failed — ${detail}`,
          message: 'أدخل بريداً إلكترونياً صحيحاً',
        };

      default:
        return {
          reason: `${code || response.status} — ${detail}`,
          message: 'تعذّر إرسال الرمز إلى بريدك، يرجى المحاولة لاحقاً',
        };
    }
  }

  /**
   * حالة خدمة البريد كما يراها الخادم.
   *
   * تُقرأ من إعدادات GoTrue مباشرةً لا من متغيّرات بيئتنا: مصدر الحقيقة هو
   * المشروع، وإعداد عندنا يخالفه يعطي طمأنينة كاذبة.
   */
  async emailProviderStatus(): Promise<{
    enabled: boolean;
    autoConfirm: boolean;
    signupsDisabled: boolean;
    note: string;
  }> {
    const res = await fetch(`${this.supabaseUrl}/auth/v1/settings`, {
      headers: this.adminHeaders(),
    });
    if (!res.ok) {
      throw DomainException.unavailable('تعذّر الوصول إلى خدمة الحسابات');
    }

    const settings = (await res.json()) as {
      external?: { email?: boolean };
      mailer_autoconfirm?: boolean;
      disable_signup?: boolean;
    };

    const enabled = settings.external?.email === true;
    return {
      enabled,
      autoConfirm: settings.mailer_autoconfirm === true,
      signupsDisabled: settings.disable_signup === true,
      note: enabled
        ? 'مزوّد البريد مفعّل. إن كان المكتب يستعمل بريد Supabase المدمج ' +
          'فحدّه رسالتان إلى ثلاث في الساعة ولا يصل إلا عناوين فريق ' +
          'المشروع — الإنتاج يحتاج SMTP خاصاً بالمكتب في إعدادات المشروع.'
        : 'مزوّد البريد معطّل في إعدادات المشروع، فلا يصل أي رمز بريد.',
    };
  }

  /**
   * إرسال تجريبي للتحقق من وصول البريد فعلاً.
   *
   * إعداد سليم على الورق لا يعني رسالة تصل: الحد والقوالب والعنوان المرسِل
   * كلها تسقط بعده. هذه النقطة تُجري المحاولة وتُعيد سبب الفشل كما هو.
   */
  async sendTestEmail(
    emailAddress: string,
  ): Promise<{ delivered: boolean; reason: string | null }> {
    const email = String(emailAddress ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw DomainException.badRequest('أدخل بريداً إلكترونياً صحيحاً');
    }

    const res = await fetch(`${this.supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: this.adminHeaders(),
      body: JSON.stringify({ email, create_user: false }),
    });

    if (res.ok) return { delivered: true, reason: null };

    // في الاختبار يُكشف سبب «لا حساب بهذا البريد» أيضاً: المستدعي موظف
    // يشخّص الخدمة لا زائر يعدّد الحسابات.
    let payload: { error_code?: string; msg?: string } = {};
    try {
      payload = (await res.clone().json()) as typeof payload;
    } catch {
      return { delivered: false, reason: `HTTP ${res.status}` };
    }
    const code = payload.error_code ?? String(res.status);
    if (code === 'otp_disabled' || code === 'user_not_found') {
      return {
        delivered: false,
        reason: 'لا يوجد حساب بهذا البريد — جرّب بريد حساب مسجَّل',
      };
    }
    return { delivered: false, reason: `${code}: ${payload.msg ?? ''}`.trim() };
  }

  /** خمسة طلبات في الدقيقة لكل بريد، كحدّ رسائل الهاتف. */
  private emailOtpRateLimited(email: string): boolean {
    const now = Date.now();
    const recent = (this.emailOtpRequests.get(email) ?? []).filter(
      (at) => now - at < 60_000,
    );
    if (recent.length >= 5) return true;
    recent.push(now);
    this.emailOtpRequests.set(email, recent);
    return false;
  }

  private readonly emailOtpRequests = new Map<string, number[]>();

  /**
   * تغيير كلمة المرور من داخل الجلسة.
   *
   * كلمة المرور الحالية تُتحقَّق بمنح فعلي من GoTrue لا بمقارنة محلية: رمز
   * الجلسة وحده لا يكفي لتغيير كلمة المرور — من يستولي على هاتف مفتوح
   * يجب أن يُوقفه عدم معرفته بكلمة المرور القائمة.
   */
  async changePassword(
    userProfileId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const user = await this.usersService.findUserById(userProfileId);

    const authUser = await this.fetchAuthUserById(user.authUserId);
    const phone = digitsOf(authUser.phone);
    const email = (authUser.email ?? '').trim().toLowerCase();

    if (phone.length === 0 && email.length === 0) {
      throw DomainException.unprocessable(
        'لا يمكن تغيير كلمة المرور لهذا الحساب، يرجى مراجعة المكتب',
      );
    }

    if (!this.securityService.validatePasswordStrength(newPassword)) {
      throw DomainException.badRequest(
        'كلمة المرور الجديدة يجب أن تكون 8 أحرف فأكثر وتجمع بين حروف كبيرة وصغيرة وأرقام ورموز',
      );
    }
    if (newPassword === currentPassword) {
      throw DomainException.badRequest(
        'كلمة المرور الجديدة مطابقة للحالية',
      );
    }

    const verified = await this.verifyPassword(
      phone.length > 0 ? { phone } : { email },
      currentPassword,
    );
    if (!verified) {
      throw DomainException.forbidden('كلمة المرور الحالية غير صحيحة');
    }

    await this.updateAuthUserPassword(user.authUserId, newPassword);
    // الحساب صار بكلمة جديدة، فأي قفل ناتج عن محاولات سابقة لم يعد له معنى.
    this.loginLockouts.delete(phone.length > 0 ? phone : email);

    recordAuthEvent(
      this.db,
      'password_changed',
      phone.length > 0 ? phone : email,
      'تغيير كلمة المرور من داخل الجلسة',
      phone.length > 0 ? 'password' : 'email',
    );

    return { success: true };
  }

  /** هاتف صاحب الحساب وبريده، لعرضهما في شاشة «حسابي». */
  async accountContact(
    authUserId: string,
  ): Promise<{ phone: string | null; email: string | null }> {
    const user = await this.fetchAuthUserById(authUserId);
    const phone = digitsOf(user.phone);
    const email = (user.email ?? '').trim();
    return {
      phone: phone.length > 0 ? phone : null,
      email: email.length > 0 ? email : null,
    };
  }

  /** بيانات حساب GoTrue بمعرّفه — للهاتف والبريد دون كلمة المرور. */
  private async fetchAuthUserById(
    authUserId: string,
  ): Promise<{ phone?: string; email?: string }> {
    const res = await fetch(
      `${this.supabaseUrl}/auth/v1/admin/users/${authUserId}`,
      { headers: this.adminHeaders() },
    );
    if (!res.ok) {
      throw DomainException.unavailable('تعذّر الوصول إلى خدمة الحسابات');
    }
    return (await res.json()) as { phone?: string; email?: string };
  }

  /**
   * تحقّق صامت من كلمة مرور: منح مباشر بلا مرور بمنطق القفل، فمحاولة
   * المستخدم تغيير كلمة مروره لا يجوز أن تقفل حسابه القائم.
   */
  private async verifyPassword(
    identity: { phone: string } | { email: string },
    password: string,
  ): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: this.adminHeaders(),
          body: JSON.stringify({ ...identity, password }),
        },
      );
      return res.ok;
    } catch {
      throw DomainException.unavailable('تعذّر الوصول إلى خدمة الحسابات');
    }
  }

  async requestPasswordResetOtp(
    phoneNumber: string,
  ): Promise<{ verificationId: string }> {
    const phone = this.normalizePhoneNumber(phoneNumber);
    const existing = await this.findAuthUserByPhone(phone);
    if (!existing) {
      throw DomainException.notFound(
        'لا يوجد حساب مسجَّل بهذا الرقم',
        'PHONE_NOT_REGISTERED',
      );
    }
    return this.otpService.requestOtp(phone);
  }

  async confirmPasswordReset(
    phoneNumber: string,
    code: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const phone = this.normalizePhoneNumber(phoneNumber);
    const verified = await this.otpService.verifyOtp(phone, code);
    if (!verified) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    const authUser = await this.findAuthUserByPhone(phone);
    if (!authUser) {
      throw DomainException.notFound(
        'لا يوجد حساب مسجَّل بهذا الرقم',
        'PHONE_NOT_REGISTERED',
      );
    }

    if (!this.securityService.validatePasswordStrength(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, digits, and special characters.',
      );
    }

    await this.updateAuthUserPassword(authUser.id, newPassword);
    this.loginLockouts.delete(phone);

    return { success: true };
  }
}

/** أرقام الهاتف فقط، لتوحيد صيغة E.164 مع ما يخزّنه GoTrue بلا علامة +. */
function digitsOf(phone: string | undefined): string {
  return (phone ?? '').replace(/\D/g, '');
}
