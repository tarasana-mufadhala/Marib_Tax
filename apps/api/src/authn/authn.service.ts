import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service.js';
import { SecurityService } from '../security/security.service.js';
import { OtpService } from './otp.service.js';

export interface UserAuthCredentials {
  authUserId: string;
  phoneNumber: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
}

@Injectable()
export class AuthnService {
  // In-memory mock credential store representing auth.users
  private readonly credentialsStore = new Map<string, UserAuthCredentials>(); // Keyed by phone number
  private readonly authUserMap = new Map<string, UserAuthCredentials>(); // Keyed by authUserId

  constructor(
    private readonly usersService: UsersService,
    private readonly securityService: SecurityService,
    private readonly otpService: OtpService,
  ) {}

  async requestRegistrationOtp(
    phoneNumber: string,
  ): Promise<{ verificationId: string }> {
    const existing = this.credentialsStore.get(phoneNumber);
    if (existing) {
      throw new ConflictException('Phone number is already registered.');
    }
    return this.otpService.requestOtp(phoneNumber);
  }

  async verifyRegistrationOtp(
    phoneNumber: string,
    code: string,
  ): Promise<{ verificationToken: string }> {
    const verified = await this.otpService.verifyOtp(phoneNumber, code);
    if (!verified) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }
    // Return a mock verification token (could be simple hash of phone)
    return {
      verificationToken: Buffer.from(`verified:${phoneNumber}`).toString(
        'base64',
      ),
    };
  }

  async register(
    phoneNumber: string,
    verificationToken: string,
    password: string,
    displayName: string | null = null,
  ): Promise<{ userProfileId: string }> {
    const decodedToken = Buffer.from(verificationToken, 'base64').toString(
      'utf-8',
    );
    if (decodedToken !== `verified:${phoneNumber}`) {
      throw new BadRequestException('Invalid verification token.');
    }

    if (!this.securityService.validatePasswordStrength(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, digits, and special characters.',
      );
    }

    const existing = this.credentialsStore.get(phoneNumber);
    if (existing) {
      throw new ConflictException('Phone number is already registered.');
    }

    const authUserId = randomUUID();
    const passwordHash = this.securityService.hashPassword(password);

    const creds: UserAuthCredentials = {
      authUserId,
      phoneNumber,
      passwordHash,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    };

    this.credentialsStore.set(phoneNumber, creds);
    this.authUserMap.set(authUserId, creds);

    // Create the backing user profile
    const profile = await this.usersService.createUserProfile(
      authUserId,
      displayName,
    );

    return { userProfileId: profile.id };
  }

  async login(
    phoneNumber: string,
    password: string,
  ): Promise<{ accessToken: string; userProfileId: string }> {
    const creds = this.credentialsStore.get(phoneNumber);
    if (!creds) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    const now = new Date();
    if (creds.lockoutUntil && creds.lockoutUntil > now) {
      const waitMinutes = Math.ceil(
        (creds.lockoutUntil.getTime() - now.getTime()) / 60000,
      );
      throw new UnauthorizedException(
        `Account temporarily locked. Please try again in ${waitMinutes} minute(s).`,
      );
    }

    const passwordValid = this.securityService.verifyPassword(
      password,
      creds.passwordHash,
    );
    if (!passwordValid) {
      creds.failedLoginAttempts += 1;
      if (creds.failedLoginAttempts >= 5) {
        creds.lockoutUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins lockout
        creds.failedLoginAttempts = 0;
        this.credentialsStore.set(phoneNumber, creds);
        throw new UnauthorizedException(
          'Account locked due to too many failed login attempts. Locked for 15 minutes.',
        );
      }
      this.credentialsStore.set(phoneNumber, creds);
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    // Reset failed login attempts on success
    creds.failedLoginAttempts = 0;
    creds.lockoutUntil = null;
    this.credentialsStore.set(phoneNumber, creds);

    // Fetch matching profile
    const profile = await this.usersService.findUserByAuthUserId(
      creds.authUserId,
    );

    // Return a mock JWT access token
    const tokenPayload = {
      sub: creds.authUserId,
      phone: creds.phoneNumber,
      role: 'taxpayer',
    };
    const accessToken = Buffer.from(JSON.stringify(tokenPayload)).toString(
      'base64',
    );

    return {
      accessToken,
      userProfileId: profile.id,
    };
  }

  async requestPasswordResetOtp(
    phoneNumber: string,
  ): Promise<{ verificationId: string }> {
    const existing = this.credentialsStore.get(phoneNumber);
    if (!existing) {
      throw new NotFoundException('Phone number not found.');
    }
    return this.otpService.requestOtp(phoneNumber);
  }

  async confirmPasswordReset(
    phoneNumber: string,
    code: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const verified = await this.otpService.verifyOtp(phoneNumber, code);
    if (!verified) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    const creds = this.credentialsStore.get(phoneNumber);
    if (!creds) {
      throw new NotFoundException('Phone number not found.');
    }

    if (!this.securityService.validatePasswordStrength(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, digits, and special characters.',
      );
    }

    creds.passwordHash = this.securityService.hashPassword(newPassword);
    creds.failedLoginAttempts = 0;
    creds.lockoutUntil = null;
    this.credentialsStore.set(phoneNumber, creds);

    return { success: true };
  }

  // Helper method for resolving mock identities in testing
  findCredentialsByAuthUserId(authUserId: string): UserAuthCredentials | null {
    return this.authUserMap.get(authUserId) ?? null;
  }
}

import { NotFoundException } from '@nestjs/common';
