import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PublicEndpoint } from '../authz/authorization.decorators.js';
import { TaxpayerCredentialsService } from './taxpayer-credentials.service.js';

/**
 * طلب المكلف بيانات دخوله بعد أن أُنشئ حسابه من استيراد بيانات المكتب.
 *
 * عامة عمداً: من يطلبها لا حساب له بعد يدخل به. الحماية أن الرسالة تُرسل
 * إلى الهاتف المسجَّل في سجل المكتب لا إلى ما يُدخله الطالب، وأن الطلب
 * لا يُقبل إلا لحساب لم تُسلَّم بياناته من قبل.
 */
@Controller('api/v1/auth/credentials')
@PublicEndpoint()
export class CredentialsController {
  constructor(private readonly credentials: TaxpayerCredentialsService) {}

  @Post('request')
  @HttpCode(200)
  async request(@Body('phoneNumber') phoneNumber: string) {
    await this.credentials.requestCredentials(phoneNumber ?? '');
    return {
      success: true,
      message: 'أُرسلت بيانات الدخول إلى رقم هاتفك المسجَّل لدى المكتب',
    };
  }
}
