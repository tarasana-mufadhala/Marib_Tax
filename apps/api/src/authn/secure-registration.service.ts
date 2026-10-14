import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import { UsersService } from '../users/users.service.js';
import { SecurityService } from '../security/security.service.js';
import { DomainException } from '../http/domain-exception.js';
import { OtpService } from './otp.service.js';

interface GoTrueUser {
  id: string;
}

interface RegistrationProof {
  phone: string;
  purpose: 'registration';
}

const ISSUER = 'marib-tax-api';
const AUDIENCE = 'registration';
const TOKEN_TTL_SECONDS = 5 * 60;
const DEV_SECRET = 'marib-tax-development-registration-proof-key-v1';

@Injectable()
export class SecureRegistrationService {
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly proofKey: Uint8Array;
  private readonly consumedJtis = new Map<string, number>();

  constructor(
    private readonly usersService: UsersService,
    private readonly securityService: SecurityService,
    private readonly otpService: OtpService,
    private readonly config: ConfigService,
  ) {
    this.supabaseUrl = (this.config.get<string>('SUPABASE_URL') ?? '').replace(
      /\/$/,
      '',
    );
    this.serviceRoleKey =
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for registration.',
      );
    }

    const configuredSecret = this.config.get<string>(
      'AUTH_VERIFICATION_TOKEN_SECRET',
    );
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    if (isProduction && !configuredSecret) {
      throw new Error(
        'AUTH_VERIFICATION_TOKEN_SECRET is required in production.',
      );
    }
    this.proofKey = new TextEncoder().encode(configuredSecret ?? DEV_SECRET);
  }

  async requestRegistrationOtp(
    phoneNumber: string,
  ): Promise<{ verificationId: string }> {
    const phone = this.normalizePhoneNumber(phoneNumber);
    // Deliberately does not disclose whether the phone is already registered.
    // A duplicate is rejected only after OTP possession has been proved.
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

    const verificationToken = await new SignJWT({
      phone,
      purpose: 'registration',
    } satisfies RegistrationProof)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS)
      .setJti(randomUUID())
      .sign(this.proofKey);

    return { verificationToken };
  }

  async register(
    phoneNumber: string,
    verificationToken: string,
    password: string,
    displayName: string | null = null,
  ): Promise<{ userProfileId: string }> {
    const phone = this.normalizePhoneNumber(phoneNumber);
    const proof = await this.consumeProof(verificationToken, phone);

    if (!this.securityService.validatePasswordStrength(password)) {
      throw DomainException.badRequest(
        'كلمة المرور يجب ألا تقل عن 8 خانات وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص',
        'WEAK_PASSWORD',
      );
    }

    // Mark the proof consumed before the external mutation to prevent local replay.
    this.consumedJtis.set(proof.jti, proof.exp);

    const authUser = await this.createAuthUser(phone, password, displayName);
    const profile = await this.usersService.createUserProfile(
      authUser.id,
      displayName,
    );
    return { userProfileId: profile.id };
  }

  private async consumeProof(
    token: string,
    expectedPhone: string,
  ): Promise<{ jti: string; exp: number }> {
    this.pruneConsumedProofs();
    try {
      const { payload } = await jwtVerify(token, this.proofKey, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256'],
      });

      if (
        payload.phone !== expectedPhone ||
        payload.purpose !== 'registration' ||
        typeof payload.jti !== 'string' ||
        typeof payload.exp !== 'number'
      ) {
        throw new Error('registration proof claims mismatch');
      }
      if (this.consumedJtis.has(payload.jti)) {
        throw new Error('registration proof already consumed');
      }
      return { jti: payload.jti, exp: payload.exp };
    } catch {
      throw DomainException.badRequest(
        'انتهت صلاحية التحقق من الرقم. ابدأ التسجيل من جديد',
        'INVALID_VERIFICATION_TOKEN',
      );
    }
  }

  private pruneConsumedProofs(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of this.consumedJtis) {
      if (exp <= now) this.consumedJtis.delete(jti);
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    const cleaned = String(phoneNumber ?? '').replace(/[\s()-]/g, '');
    if (/^\+[1-9]\d{1,14}$/.test(cleaned)) return cleaned;
    if (/^7\d{8}$/.test(cleaned)) return `+967${cleaned}`;
    if (/^9677\d{8}$/.test(cleaned)) return `+${cleaned}`;
    if (/^009677\d{8}$/.test(cleaned)) return `+${cleaned.slice(2)}`;
    throw DomainException.badRequest(
      'أدخل رقم هاتف يمني صحيح يبدأ بـ 7 ويتكوّن من 9 أرقام',
      'INVALID_PHONE_NUMBER',
    );
  }

  private adminHeaders(): Record<string, string> {
    return {
      apikey: this.serviceRoleKey,
      Authorization: `Bearer ${this.serviceRoleKey}`,
      'Content-Type': 'application/json',
    };
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
        ...(displayName
          ? { user_metadata: { display_name: displayName } }
          : {}),
      }),
    });

    if (res.status === 422) {
      throw DomainException.conflict(
        'هذا الرقم مسجَّل مسبقاً',
        'PHONE_ALREADY_REGISTERED',
      );
    }
    if (!res.ok) {
      throw DomainException.unavailable(
        'تعذّر إنشاء الحساب لدى مزود الهوية. حاول لاحقاً.',
        'AUTH_PROVIDER_UNAVAILABLE',
      );
    }
    return (await res.json()) as GoTrueUser;
  }
}
