import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PublicEndpoint } from '../authz/authorization.decorators.js';
import { AuthnService } from './authn.service.js';

@Controller('api/v1/auth')
@PublicEndpoint()
export class AuthnController {
  constructor(private readonly authnService: AuthnService) {}

  @Post('otp/request')
  @HttpCode(200)
  requestOtp(
    @Body('phoneNumber') phoneNumber: string,
  ): Promise<{ verificationId: string }> {
    return this.authnService.requestRegistrationOtp(phoneNumber);
  }

  @Post('otp/verify')
  @HttpCode(200)
  verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
  ): Promise<{ verificationToken: string }> {
    return this.authnService.verifyRegistrationOtp(phoneNumber, code);
  }

  @Post('register')
  @HttpCode(201)
  register(
    @Body('phoneNumber') phoneNumber: string,
    @Body('verificationToken') verificationToken: string,
    @Body('password') password: string,
    @Body('displayName') displayName: string | null = null,
  ): Promise<{ userProfileId: string }> {
    return this.authnService.register(
      phoneNumber,
      verificationToken,
      password,
      displayName,
    );
  }

  @Post('login')
  @HttpCode(200)
  login(
    @Body('phoneNumber') phoneNumber: string,
    @Body('password') password: string,
  ): Promise<{ accessToken: string; userProfileId: string }> {
    return this.authnService.login(phoneNumber, password);
  }

  @Post('password/reset/request')
  @HttpCode(200)
  requestReset(
    @Body('phoneNumber') phoneNumber: string,
  ): Promise<{ verificationId: string }> {
    return this.authnService.requestPasswordResetOtp(phoneNumber);
  }

  @Post('password/reset/confirm')
  @HttpCode(200)
  confirmReset(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ success: boolean }> {
    return this.authnService.confirmPasswordReset(
      phoneNumber,
      code,
      newPassword,
    );
  }
}
