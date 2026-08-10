import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common';
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

  private logEvent(eventType: string, phoneNumber: string, detail?: string) {
    recordAuthEvent(this.db, eventType, phoneNumber, detail);
  }

  /**
   * رمز التجربة الثابت، أو null إن كان معطّلاً.
   *
   * ثلاثة شروط مجتمعة قبل قبوله، وأي واحد يسقط يعطّله:
   *   1. `DEV_OTP_CODE` مضبوط صراحةً — لا قيمة افتراضية.
   *   2. البيئة ليست `production` — ضبطه هناك يُتجاهَل ويُسجَّل كخطأ.
   *   3. Twilio غير مضبوط — بمجرد ربطه يصير التحقق الحقيقي هو المسار.
   *
   * ويبقى مشروطاً بوجود طلب رمز نشط غير منتهٍ لهذا الرقم (يُفحص في
   * verifyOtp)، فلا يمكن التحقق من رقم لم يُطلب له رمز أصلاً.
   */
  private get developmentCode(): string | null {
    const code = this.config?.get<string>('DEV_OTP_CODE');
    if (!code) return null;

    if (this.config?.get<string>('NODE_ENV') === 'production') {
      this.logger.error(
        'DEV_OTP_CODE مضبوط في بيئة الإنتاج — تم تجاهله. أزِله فوراً.',
      );
      return null;
    }
    if (this.isTwilioConfigured()) return null;

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
    // Basic E.164 normalization check (simple regex validation)
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      throw new BadRequestException(
        'Phone number must be in valid E.164 format.',
      );
    }

    // Rate limiting: max 5 messages per minute per phone number
    const now = Date.now();
    const timestamps = (this.requestTimestamps.get(phoneNumber) || []).filter(
      (t) => now - t < 60000,
    );
    if (timestamps.length >= 5) {
      this.logEvent('otp_rate_limited', phoneNumber, 'تجاوز حد 5 رسائل في الدقيقة');
      throw new BadRequestException(
        'Rate limit exceeded. Maximum 5 OTP messages per minute.',
      );
    }
    timestamps.push(now);
    this.requestTimestamps.set(phoneNumber, timestamps);
    this.logEvent('otp_requested', phoneNumber);

    const accountSid = this.config?.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config?.get<string>('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = this.config?.get<string>('TWILIO_VERIFY_SERVICE_SID');

    if (accountSid && authToken && verifyServiceSid) {
      this.logger.log(`[Twilio Verify] Requesting OTP code for ${phoneNumber}`);
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
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          this.logger.error(`Twilio Verify API error: ${res.status} - ${errText}`);
          throw new BadRequestException('Failed to send OTP verification code.');
        }

        const data = (await res.json()) as { sid: string };
        return { verificationId: data.sid };
      } catch (err) {
        this.logger.error(`Error sending Twilio Verify OTP:`, err);
        throw new BadRequestException('Failed to request verification code.');
      }
    }

    // Fallback Mock logic for local development and unit tests
    const existing = this.store.get(phoneNumber);
    const mockCode = phoneNumber === '+967770000000' ? '677110' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes expiration

    this.store.set(phoneNumber, {
      phoneNumber,
      code: mockCode,
      expiresAt,
      attempts: (existing?.attempts ?? 0) + 1,
    });

    this.logger.log(
      `[SMS Verification Mock] Sending OTP "${mockCode}" to ${phoneNumber}`,
    );

    return { verificationId: phoneNumber };
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    const accountSid = this.config?.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config?.get<string>('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = this.config?.get<string>('TWILIO_VERIFY_SERVICE_SID');

    if (accountSid && authToken && verifyServiceSid) {
      this.logger.log(`[Twilio Verify] Checking OTP code for ${phoneNumber}`);
      try {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const params = new URLSearchParams({
          To: phoneNumber,
          Code: code,
        });
        const res = await fetch(
          `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          this.logger.error(`Twilio Verify API check error: ${res.status} - ${errText}`);
          return false;
        }

        const data = (await res.json()) as { status: string };
        return data.status === 'approved';
      } catch (err) {
        this.logger.error(`Error checking Twilio Verify OTP:`, err);
        return false;
      }
    }

    // التحقق البديل للتطوير: يمر بنفس القواعد (طلب نشط، صلاحية، مطابقة الرقم).
    //
    // كان هنا قبول ثابت للرمزين 677110 و874271 لأي رقم كان — أي أن معرفتهما
    // تكفي لإنشاء حساب بأي رقم أو **إعادة تعيين كلمة مرور أي مكلف**، ما دام
    // Twilio غير مضبوط. أُزيل. رقم التطوير +967770000000 ما زال يولّد 677110
    // في requestOtp، فيُقبل له وحده عبر المسار الطبيعي أدناه.
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

    // رمز التجربة يُقبل هنا فقط: بعد التأكد من وجود طلب نشط لهذا الرقم
    // وأنه لم ينتهِ — فلا يصلح لرقم لم يُطلب له رمز أصلاً.
    const devCode = this.developmentCode;
    if (devCode !== null && code === devCode) {
      this.store.delete(phoneNumber);
      this.logger.warn(
        `[رمز تجربة] قُبل رمز DEV_OTP_CODE لـ ${phoneNumber} — للتطوير فقط`,
      );
      this.logEvent('otp_verified', phoneNumber, 'رمز تجربة (DEV_OTP_CODE)');
      return true;
    }

    this.logEvent('otp_failed', phoneNumber, 'رمز غير مطابق');
    return false;
  }
}
