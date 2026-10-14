import {
  Injectable,
  Logger,
  BadRequestException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service.js';
import { recordAuthEvent } from './auth-events.js';

export interface OtpVerificationRecord {
  phoneNumber: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly store = new Map<string, OtpVerificationRecord>();
  private readonly requestTimestamps = new Map<string, number[]>();

  constructor(
    private readonly config?: ConfigService,
    @Optional() private readonly db?: DatabaseService,
  ) {}

  private logEvent(
    eventType: string,
    phoneNumber: string,
    detail?: string,
  ): void {
    recordAuthEvent(this.db, eventType, phoneNumber, detail);
  }

  private get isProduction(): boolean {
    return this.config?.get<string>('NODE_ENV') === 'production';
  }

  /** Development-only fixed code. Production configuration rejects it at boot. */
  private get developmentCode(): string | null {
    const code = this.config?.get<string>('DEV_OTP_CODE');
    if (!code || this.isProduction || this.isTwilioConfigured()) return null;
    return code;
  }

  private isTwilioConfigured(): boolean {
    return Boolean(
      this.config?.get<string>('TWILIO_ACCOUNT_SID') &&
        this.config?.get<string>('TWILIO_AUTH_TOKEN') &&
        this.config?.get<string>('TWILIO_VERIFY_SERVICE_SID'),
    );
  }

  async requestOtp(phoneNumber: string): Promise<{ verificationId: string }> {
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      throw new BadRequestException(
        'Phone number must be in valid E.164 format.',
      );
    }

    const now = Date.now();
    const timestamps = (this.requestTimestamps.get(phoneNumber) || []).filter(
      (t) => now - t < 60000,
    );
    if (timestamps.length >= 5) {
      this.logEvent(
        'otp_rate_limited',
        phoneNumber,
        'تجاوز حد 5 رسائل في الدقيقة',
      );
      throw new BadRequestException(
        'Rate limit exceeded. Maximum 5 OTP messages per minute.',
      );
    }
    timestamps.push(now);
    this.requestTimestamps.set(phoneNumber, timestamps);
    this.logEvent('otp_requested', phoneNumber);

    const accountSid = this.config?.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config?.get<string>('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = this.config?.get<string>(
      'TWILIO_VERIFY_SERVICE_SID',
    );

    if (accountSid && authToken && verifyServiceSid) {
      try {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const params = new URLSearchParams({
          To: phoneNumber,
          Channel: 'sms',
        });
        const res = await fetch(
          `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        );

        if (!res.ok) {
          this.logger.error(`Twilio Verify API error: ${res.status}`);
          throw new ServiceUnavailableException(
            'Failed to send OTP verification code.',
          );
        }

        const data = (await res.json()) as { sid: string };
        return { verificationId: data.sid };
      } catch (err) {
        if (err instanceof ServiceUnavailableException) throw err;
        this.logger.error('Error sending Twilio Verify OTP.');
        throw new ServiceUnavailableException(
          'Failed to request verification code.',
        );
      }
    }

    // Production must never silently downgrade to an in-memory mock provider.
    if (this.isProduction) {
      this.logger.error(
        'OTP provider is not configured in production; refusing mock fallback.',
      );
      throw new ServiceUnavailableException(
        'OTP verification service is not configured.',
      );
    }

    // Explicit local/test fallback only. Never logs the OTP value.
    const existing = this.store.get(phoneNumber);
    const mockCode =
      phoneNumber === '+967770000000'
        ? '677110'
        : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now + 5 * 60 * 1000);

    this.store.set(phoneNumber, {
      phoneNumber,
      code: mockCode,
      expiresAt,
      attempts: (existing?.attempts ?? 0) + 1,
    });

    this.logger.warn(
      '[SMS Verification Mock] OTP generated in non-production environment; value intentionally not logged.',
    );

    return { verificationId: phoneNumber };
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    const accountSid = this.config?.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config?.get<string>('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = this.config?.get<string>(
      'TWILIO_VERIFY_SERVICE_SID',
    );

    if (accountSid && authToken && verifyServiceSid) {
      try {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const params = new URLSearchParams({ To: phoneNumber, Code: code });
        const res = await fetch(
          `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        );

        if (!res.ok) {
          this.logger.error(`Twilio Verify API check error: ${res.status}`);
          return false;
        }

        const data = (await res.json()) as { status: string };
        return data.status === 'approved';
      } catch {
        this.logger.error('Error checking Twilio Verify OTP.');
        return false;
      }
    }

    if (this.isProduction) {
      this.logger.error(
        'OTP provider is not configured in production; refusing mock verification.',
      );
      throw new ServiceUnavailableException(
        'OTP verification service is not configured.',
      );
    }

    const record = this.store.get(phoneNumber);
    if (!record) {
      this.logEvent('otp_failed', phoneNumber, 'لا يوجد طلب رمز نشط');
      return false;
    }

    if (new Date() > record.expiresAt) {
      this.store.delete(phoneNumber);
      this.logEvent('otp_expired', phoneNumber);
      return false;
    }

    if (record.code === code) {
      this.store.delete(phoneNumber);
      this.logEvent('otp_verified', phoneNumber);
      return true;
    }

    const devCode = this.developmentCode;
    if (devCode !== null && code === devCode) {
      this.store.delete(phoneNumber);
      this.logger.warn('[Development OTP] DEV_OTP_CODE accepted.');
      this.logEvent('otp_verified', phoneNumber, 'رمز تجربة (DEV_OTP_CODE)');
      return true;
    }

    this.logEvent('otp_failed', phoneNumber, 'رمز غير مطابق');
    return false;
  }
}
