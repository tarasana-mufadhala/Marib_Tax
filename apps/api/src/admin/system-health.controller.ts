import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { AuthnService } from '../authn/authn.service.js';
import { DomainException } from '../http/domain-exception.js';

interface TestEmailBody {
  email?: string;
}

/**
 * تشخيص الخدمات الخارجية للمكتب.
 *
 * حين لا يصل بريد لا يعرف الموظف أالعطل في الإعداد أم في العنوان أم في
 * حد الإرسال، ولا سبيل له إلا سؤال المطوّر أو قراءة سجلات الخادم. هذه
 * النقاط تجعل الجواب في اللوحة.
 */
@Controller('api/v1/admin/system')
export class SystemHealthController {
  constructor(private readonly authn: AuthnService) {}

  /** حالة مزوّد البريد كما تقولها إعدادات المشروع نفسها. */
  @Get('email')
  @RequirePermission('user.manage')
  status() {
    return this.authn.emailProviderStatus();
  }

  /**
   * إرسال تجريبي إلى بريد حساب مسجَّل.
   *
   * `user.manage` لا صلاحية أدنى: النقطة تُرسل بريداً فعلياً وتكشف سبب
   * الفشل كاملاً، ومنه ما يميّز البريد المسجَّل من غيره.
   */
  @Post('email/test')
  @HttpCode(200)
  @RequirePermission('user.manage')
  test(@Body() body: TestEmailBody) {
    const email = (body?.email ?? '').trim();
    if (email.length === 0) {
      throw DomainException.badRequest('أدخل بريداً للاختبار');
    }
    return this.authn.sendTestEmail(email);
  }
}
