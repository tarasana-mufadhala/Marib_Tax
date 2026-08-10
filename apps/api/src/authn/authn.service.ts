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
    throw new BadRequestException(
      'Phone number must be in valid E.164 format.',
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
      const found = users.find((u) => u.phone === phoneNumber);
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
      throw new ConflictException('Phone number is already registered.');
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
      throw new ConflictException('Phone number is already registered.');
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
      throw new BadRequestException('Invalid or expired OTP code.');
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
      throw new BadRequestException('Invalid verification token.');
    }

    if (!this.securityService.validatePasswordStrength(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, digits, and special characters.',
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

  async requestPasswordResetOtp(
    phoneNumber: string,
  ): Promise<{ verificationId: string }> {
    const phone = this.normalizePhoneNumber(phoneNumber);
    const existing = await this.findAuthUserByPhone(phone);
    if (!existing) {
      throw new NotFoundException('Phone number not found.');
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
      throw new NotFoundException('Phone number not found.');
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
