import { Injectable, Logger, BadRequestException } from '@nestjs/common';

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

  async requestOtp(phoneNumber: string): Promise<{ verificationId: string }> {
    await Promise.resolve();
    // Basic E.164 normalization check (simple regex validation)
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      throw new BadRequestException(
        'Phone number must be in valid E.164 format.',
      );
    }

    // Rate limiting check: max 3 requests per 15 minutes per phone
    const now = new Date();
    const existing = this.store.get(phoneNumber);
    if (existing && existing.attempts >= 3 && existing.expiresAt > now) {
      throw new BadRequestException(
        'Too many OTP attempts. Please wait before requesting again.',
      );
    }

    // Generate 6-digit OTP (e.g. "123456" for ease of mock testing/verification, but let's make it random)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes expiration

    this.store.set(phoneNumber, {
      phoneNumber,
      code,
      expiresAt,
      attempts: (existing?.attempts ?? 0) + 1,
    });

    this.logger.log(
      `[SMS Verification Mock] Sending OTP "${code}" to ${phoneNumber}`,
    );

    return { verificationId: phoneNumber }; // For mocking, the verificationId is just the phone number
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    await Promise.resolve();
    const record = this.store.get(phoneNumber);
    if (!record) return false;

    if (new Date() > record.expiresAt) {
      this.store.delete(phoneNumber);
      return false;
    }

    if (record.code === code) {
      this.store.delete(phoneNumber);
      return true;
    }

    return false;
  }
}
